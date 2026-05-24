"""End-to-end tests for the FUTOLOGY ML microservice.

Uses FastAPI's TestClient (httpx under the hood) so no live uvicorn is
needed. Each test is isolated by mutating `os.environ` and reimporting
the app module — that's how we exercise the bearer-token branch without
poisoning sibling tests.
"""

from __future__ import annotations

import importlib
import os

import pytest
from fastapi.testclient import TestClient


def _fresh_client(env: dict[str, str] | None = None) -> TestClient:
    """Reload the app module under a fresh env so auth state is clean."""
    for key in ("ML_SERVICE_TOKEN", "ML_ALLOWED_ORIGINS"):
        os.environ.pop(key, None)
    if env:
        os.environ.update(env)
    import app.main as main_module

    importlib.reload(main_module)
    return TestClient(main_module.app)


@pytest.fixture
def client() -> TestClient:
    return _fresh_client()


SAMPLE_BODY = {
    "homeId": 541,
    "awayId": 529,
    "competitionId": 140,
    "homeShortName": "RMA",
    "awayShortName": "BAR",
    "leagueShortName": "La Liga",
}


def test_health_no_auth(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["mode"] == "stub"
    assert "version" in body


def test_predict_match_happy_path(client: TestClient) -> None:
    res = client.post("/predict-match", json=SAMPLE_BODY)
    assert res.status_code == 200, res.text
    body = res.json()

    # All camelCase, no snake_case leakage.
    expected_keys = {
        "homeWinProb",
        "drawProb",
        "awayWinProb",
        "predictedWinner",
        "confidence",
        "predictedScore",
        "keyFactors",
    }
    assert set(body.keys()) == expected_keys

    # Probabilities sum to ~100 and live in [0, 100].
    total = body["homeWinProb"] + body["drawProb"] + body["awayWinProb"]
    assert 99.5 <= total <= 100.5
    assert body["predictedWinner"] in {"home", "draw", "away"}
    assert isinstance(body["keyFactors"], list) and 1 <= len(body["keyFactors"]) <= 5


def test_predict_match_is_deterministic(client: TestClient) -> None:
    first = client.post("/predict-match", json=SAMPLE_BODY).json()
    second = client.post("/predict-match", json=SAMPLE_BODY).json()
    assert first == second


def test_predict_match_validates_missing_fields(client: TestClient) -> None:
    res = client.post("/predict-match", json={"homeId": 541})
    # Pydantic 422 on missing required `awayId`.
    assert res.status_code == 422


def test_bearer_token_enforced_when_configured() -> None:
    secured = _fresh_client(env={"ML_SERVICE_TOKEN": "s3cret"})

    # /health is intentionally unauth — still 200.
    assert secured.get("/health").status_code == 200

    # No header → 401.
    assert secured.post("/predict-match", json=SAMPLE_BODY).status_code == 401

    # Wrong scheme → 401.
    assert (
        secured.post(
            "/predict-match",
            json=SAMPLE_BODY,
            headers={"Authorization": "Token s3cret"},
        ).status_code
        == 401
    )

    # Wrong token → 401.
    assert (
        secured.post(
            "/predict-match",
            json=SAMPLE_BODY,
            headers={"Authorization": "Bearer nope"},
        ).status_code
        == 401
    )

    # Correct token → 200.
    res = secured.post(
        "/predict-match",
        json=SAMPLE_BODY,
        headers={"Authorization": "Bearer s3cret"},
    )
    assert res.status_code == 200
