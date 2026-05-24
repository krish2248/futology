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


CLUSTER_BODY_STRIKER = {
    "name": "E. Haaland",
    "goals": 0.85,
    "assists": 0.18,
    "xG": 0.78,
    "xA": 0.15,
    "keyPasses": 1.0,
    "progressivePasses": 3.5,
    "progressiveCarries": 2.8,
    "pressures": 7.5,
    "tacklesPlusInterceptions": 0.9,
    "passAccuracy": 76.0,
}


CLUSTER_BODY_DEFENDER = {
    "name": "V. van Dijk",
    "goals": 0.05,
    "assists": 0.04,
    "xG": 0.07,
    "xA": 0.05,
    "keyPasses": 0.4,
    "progressivePasses": 9.2,
    "progressiveCarries": 2.9,
    "pressures": 11.0,
    "tacklesPlusInterceptions": 4.6,
    "passAccuracy": 90.5,
}


def test_cluster_profiles_route_no_auth(client: TestClient) -> None:
    res = client.get("/cluster-profiles")
    assert res.status_code == 200
    profiles = res.json()["profiles"]
    assert len(profiles) == 6
    ids = {p["id"] for p in profiles}
    assert ids == {
        "target-striker",
        "creative-playmaker",
        "box-to-box",
        "ball-playing-defender",
        "high-press-forward",
        "deep-lying-playmaker",
    }


def test_predict_player_cluster_503_in_stub_mode(client: TestClient) -> None:
    res = client.post("/predict-player-cluster", json=CLUSTER_BODY_STRIKER)
    assert res.status_code == 503
    assert "not loaded" in res.json()["detail"]


def test_predict_player_cluster_assigns_striker() -> None:
    from pathlib import Path as _Path

    src = _Path(__file__).resolve().parent.parent / "trained_models" / "player_clusterer.pkl"
    if not src.exists():
        pytest.skip("No clusterer artefact; run `python train_clusterer.py` first.")

    app = _build_app(
        env={
            "ML_MODE": "trained",
            "PLAYER_CLUSTERER_PATH": str(src),
        }
    )
    with TestClient(app) as trained:
        res = trained.post("/predict-player-cluster", json=CLUSTER_BODY_STRIKER)
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["clusterId"] == "target-striker"
        assert body["color"] == "#FF6B6B"
        assert 0 <= body["confidence"] <= 100


def test_predict_player_cluster_assigns_defender() -> None:
    from pathlib import Path as _Path

    src = _Path(__file__).resolve().parent.parent / "trained_models" / "player_clusterer.pkl"
    if not src.exists():
        pytest.skip("No clusterer artefact; run `python train_clusterer.py` first.")

    app = _build_app(env={"ML_MODE": "trained", "PLAYER_CLUSTERER_PATH": str(src)})
    with TestClient(app) as trained:
        res = trained.post("/predict-player-cluster", json=CLUSTER_BODY_DEFENDER)
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["clusterId"] == "ball-playing-defender"


def test_predict_player_cluster_validates_input(client: TestClient) -> None:
    # Negative goals violate ge=0 -> 422
    bad = {**CLUSTER_BODY_STRIKER, "goals": -0.1}
    res = client.post("/predict-player-cluster", json=bad)
    assert res.status_code == 422


def test_trained_mode_without_artefact_fails_loudly(tmp_path) -> None:
    """ML_MODE=trained but no model file -> startup raises, no silent fallback."""
    bogus = tmp_path / "missing.pkl"
    app = _build_app(env={"ML_MODE": "trained", "MATCH_PREDICTOR_PATH": str(bogus)})
    with pytest.raises(RuntimeError, match="not found"):
        with TestClient(app):
            pass
