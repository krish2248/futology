"""End-to-end tests for the FUTOLOGY ML microservice.

Uses FastAPI's TestClient (httpx under the hood) so no live uvicorn is
needed. Each test isolates env state by reloading the app module under
the desired env vars. The `with TestClient(app)` context manager
ensures the lifespan handler runs so `app.state.mode` is initialized.
"""

from __future__ import annotations

import importlib
import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


def _build_app(env: dict[str, str] | None = None):
    """Reload the app module under a fresh env."""
    for key in ("ML_SERVICE_TOKEN", "ML_ALLOWED_ORIGINS", "ML_MODE", "MATCH_PREDICTOR_PATH"):
        os.environ.pop(key, None)
    if env:
        os.environ.update(env)
    import app.main as main_module

    importlib.reload(main_module)
    return main_module.app


@pytest.fixture
def client() -> Iterator[TestClient]:
    app = _build_app()
    with TestClient(app) as c:
        yield c


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
    app = _build_app(env={"ML_SERVICE_TOKEN": "s3cret"})
    with TestClient(app) as secured:
        # /health is intentionally unauth — still 200.
        assert secured.get("/health").status_code == 200

        # No header -> 401.
        assert secured.post("/predict-match", json=SAMPLE_BODY).status_code == 401

        # Wrong scheme -> 401.
        assert (
            secured.post(
                "/predict-match",
                json=SAMPLE_BODY,
                headers={"Authorization": "Token s3cret"},
            ).status_code
            == 401
        )

        # Wrong token -> 401.
        assert (
            secured.post(
                "/predict-match",
                json=SAMPLE_BODY,
                headers={"Authorization": "Bearer nope"},
            ).status_code
            == 401
        )

        # Correct token -> 200.
        res = secured.post(
            "/predict-match",
            json=SAMPLE_BODY,
            headers={"Authorization": "Bearer s3cret"},
        )
        assert res.status_code == 200


def test_trained_mode_uses_model_when_artefact_present(tmp_path) -> None:
    """When `ML_MODE=trained` and the artefact loads, /health reports trained mode."""
    from pathlib import Path as _Path

    src = _Path(__file__).resolve().parent.parent / "trained_models" / "match_predictor.pkl"
    if not src.exists():
        pytest.skip(
            "No trained model on disk; run `python train.py` to generate one then re-run."
        )

    app = _build_app(env={"ML_MODE": "trained", "MATCH_PREDICTOR_PATH": str(src)})
    with TestClient(app) as trained:
        health = trained.get("/health").json()
        assert health["mode"] == "trained"

        res = trained.post("/predict-match", json=SAMPLE_BODY)
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["predictedWinner"] in {"home", "draw", "away"}
        total = body["homeWinProb"] + body["drawProb"] + body["awayWinProb"]
        assert 99.0 <= total <= 101.0


def test_trained_mode_emits_shap_factors() -> None:
    """v0.3 — key factors include SHAP contribution numbers, not heuristics."""
    from pathlib import Path as _Path

    src = _Path(__file__).resolve().parent.parent / "trained_models" / "match_predictor.pkl"
    if not src.exists():
        pytest.skip("No trained model on disk; run `python train.py` first.")

    app = _build_app(env={"ML_MODE": "trained", "MATCH_PREDICTOR_PATH": str(src)})
    with TestClient(app) as trained:
        body = trained.post("/predict-match", json=SAMPLE_BODY).json()
        factors = body["keyFactors"]
        assert 1 <= len(factors) <= 3
        # Every SHAP factor string carries a signed contribution number.
        assert any("SHAP contribution" in f for f in factors), factors


def test_trained_mode_without_artefact_fails_loudly(tmp_path) -> None:
    """ML_MODE=trained but no model file -> startup raises, no silent fallback."""
    bogus = tmp_path / "missing.pkl"
    app = _build_app(env={"ML_MODE": "trained", "MATCH_PREDICTOR_PATH": str(bogus)})
    with pytest.raises(RuntimeError, match="not found"):
        with TestClient(app):
            pass
