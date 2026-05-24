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


TRANSFER_BODY_FORWARD = {
    "name": "K. Mbappé",
    "position": "FWD",
    "age": 26,
    "goalsPer90": 0.85,
    "assistsPer90": 0.32,
    "xGPer90": 0.78,
    "xAPer90": 0.28,
    "passAccuracy": 82,
    "minutesPlayed": 2800,
    "leagueLevel": 1,
}


TRANSFER_BODY_AGING_DEFENDER = {
    "name": "S. Ramos",
    "position": "DEF",
    "age": 38,
    "goalsPer90": 0.10,
    "assistsPer90": 0.04,
    "xGPer90": 0.12,
    "xAPer90": 0.05,
    "passAccuracy": 88,
    "minutesPlayed": 1800,
    "leagueLevel": 3,
}


def test_predict_transfer_value_503_in_stub_mode(client: TestClient) -> None:
    res = client.post("/predict-transfer-value", json=TRANSFER_BODY_FORWARD)
    assert res.status_code == 503
    assert "not loaded" in res.json()["detail"]


def test_predict_transfer_value_happy_path() -> None:
    from pathlib import Path as _Path

    src = _Path(__file__).resolve().parent.parent / "trained_models" / "transfer_value.pkl"
    if not src.exists():
        pytest.skip("No transfer artefact; run `python train_transfer.py` first.")

    app = _build_app(env={"ML_MODE": "trained", "TRANSFER_VALUE_PATH": str(src)})
    with TestClient(app) as trained:
        res = trained.post("/predict-transfer-value", json=TRANSFER_BODY_FORWARD)
        assert res.status_code == 200, res.text
        body = res.json()

        # Sane band ordering.
        assert body["lowEstimate"] <= body["predictedValueEur"] <= body["highEstimate"]
        assert body["predictedValueEur"] > 0

        # SHAP factors present and bounded.
        assert 1 <= len(body["shapFactors"]) <= 5
        for f in body["shapFactors"]:
            assert isinstance(f["label"], str) and f["label"]
            assert isinstance(f["contribution"], (int, float))


def test_predict_transfer_value_aging_defender_under_forward() -> None:
    """Sanity: a 38yo defender in a tier-3 league should be valued
    well below a 26yo elite-tier forward with high goal output."""
    from pathlib import Path as _Path

    src = _Path(__file__).resolve().parent.parent / "trained_models" / "transfer_value.pkl"
    if not src.exists():
        pytest.skip("No transfer artefact; run `python train_transfer.py` first.")

    app = _build_app(env={"ML_MODE": "trained", "TRANSFER_VALUE_PATH": str(src)})
    with TestClient(app) as trained:
        fwd = trained.post("/predict-transfer-value", json=TRANSFER_BODY_FORWARD).json()
        defn = trained.post("/predict-transfer-value", json=TRANSFER_BODY_AGING_DEFENDER).json()
        assert fwd["predictedValueEur"] > defn["predictedValueEur"]


def test_predict_transfer_value_validates_input(client: TestClient) -> None:
    bad = {**TRANSFER_BODY_FORWARD, "passAccuracy": 120}  # >100 violates le=100
    res = client.post("/predict-transfer-value", json=bad)
    assert res.status_code == 422


# --- Sentiment ----------------------------------------------------------

SENTIMENT_BODY = {
    "fixtureId": 1001,
    "homeTeam": "Real Madrid",
    "awayTeam": "Barcelona",
    "minute": 90,
    "homeScore": 2,
    "awayScore": 1,
    "leagueShortName": "La Liga",
    "nReactions": 10,
}


def test_sentiment_analyze_happy_path(client: TestClient) -> None:
    res = client.post("/sentiment-analyze", json=SENTIMENT_BODY)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["fixtureId"] == 1001
    assert body["homeTeam"] == "Real Madrid"
    assert -1 <= body["homeMood"] <= 1
    assert -1 <= body["awayMood"] <= 1
    assert 0 <= body["excitement"] <= 1
    assert len(body["timeline"]) == SENTIMENT_BODY["minute"] + 1
    assert len(body["reactions"]) == SENTIMENT_BODY["nReactions"]
    assert body["sourceMode"] == "synthetic"
    assert body["biggestSwingTeam"] in {"home", "away"}


def test_sentiment_analyze_is_deterministic(client: TestClient) -> None:
    a = client.post("/sentiment-analyze", json=SENTIMENT_BODY).json()
    b = client.post("/sentiment-analyze", json=SENTIMENT_BODY).json()
    assert a == b


def test_sentiment_validates_input(client: TestClient) -> None:
    bad = {**SENTIMENT_BODY, "minute": 200}  # > 130 violates le=130
    res = client.post("/sentiment-analyze", json=bad)
    assert res.status_code == 422


# --- Fantasy ------------------------------------------------------------


def _fantasy_pool() -> list[dict[str, object]]:
    """Synthetic 60-player pool covering positional + club-cap constraints."""
    positions = (
        ("GK", 8),  # 2 needed
        ("DEF", 18),  # 5 needed
        ("MID", 20),  # 5 needed
        ("FWD", 14),  # 3 needed
    )
    teams = ["Arsenal", "Liverpool", "Man City", "Real Madrid", "Barcelona", "Bayern"]
    out: list[dict[str, object]] = []
    pid = 1
    for pos, n in positions:
        for i in range(n):
            price = {"GK": 4.5, "DEF": 5.0, "MID": 7.0, "FWD": 8.5}[pos] + (i % 5) * 0.5
            points = {"GK": 110, "DEF": 130, "MID": 160, "FWD": 175}[pos] + (i % 7) * 4
            out.append(
                {
                    "id": pid,
                    "name": f"{pos}-{pid}",
                    "team": teams[pid % len(teams)],
                    "position": pos,
                    "price": price,
                    "predictedPoints": float(points),
                    "form": 5.0 + (i % 5) * 0.6,
                    "injuryRisk": (i % 10) * 0.05,
                }
            )
            pid += 1
    return out


def test_fantasy_optimize_respects_squad_constraints(client: TestClient) -> None:
    body = {
        "budget": 100.0,
        "formation": "4-3-3",
        "riskTolerance": "balanced",
        "candidates": _fantasy_pool(),
    }
    res = client.post("/fantasy-optimize", json=body)
    assert res.status_code == 200, res.text
    out = res.json()

    # Squad composition.
    assert len(out["squad"]) == 15
    counts = {"GK": 0, "DEF": 0, "MID": 0, "FWD": 0}
    for pick in out["squad"]:
        counts[pick["position"]] += 1
    assert counts == {"GK": 2, "DEF": 5, "MID": 5, "FWD": 3}

    # Budget cap.
    assert out["totalCost"] <= 100.0 + 1e-6
    assert out["remainingBudget"] == round(100.0 - out["totalCost"], 2)

    # Max 3 per club.
    by_team: dict[str, int] = {}
    for pick in out["squad"]:
        by_team[pick["team"]] = by_team.get(pick["team"], 0) + 1
    assert all(v <= 3 for v in by_team.values()), by_team

    # XI structure matches the formation (4-3-3 -> 1 GK, 4 DEF, 3 MID, 3 FWD).
    xi_ids = set(out["startingXiIds"])
    assert len(xi_ids) == 11
    xi_picks = [p for p in out["squad"] if p["id"] in xi_ids]
    xi_counts = {"GK": 0, "DEF": 0, "MID": 0, "FWD": 0}
    for p in xi_picks:
        xi_counts[p["position"]] += 1
    assert xi_counts == {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3}

    # Captain is in the XI.
    assert out["captainId"] in xi_ids

    # Bench = 4 non-starters.
    assert len(out["benchOrderIds"]) == 4
    assert set(out["benchOrderIds"]).isdisjoint(xi_ids)

    assert out["solverStatus"] == "Optimal"


def test_fantasy_optimize_max_3_per_club_enforced(client: TestClient) -> None:
    """Pool dominated by one team should still cap that team at 3 picks."""
    body = {
        "budget": 200.0,
        "formation": "4-4-2",
        "riskTolerance": "balanced",
        "candidates": _fantasy_pool(),  # spread across 6 teams, so cap matters
    }
    out = client.post("/fantasy-optimize", json=body).json()
    counts: dict[str, int] = {}
    for pick in out["squad"]:
        counts[pick["team"]] = counts.get(pick["team"], 0) + 1
    assert max(counts.values()) <= 3, counts


def test_fantasy_optimize_insufficient_candidates_422(client: TestClient) -> None:
    # Only 5 GKs supplied (need ≥ 2, but to fill 15-man squad we also need 5/5/3 elsewhere).
    bad_pool = [
        {
            "id": i,
            "name": f"GK-{i}",
            "team": "Arsenal",
            "position": "GK",
            "price": 5.0,
            "predictedPoints": 100.0,
            "form": 5.0,
            "injuryRisk": 0.0,
        }
        for i in range(15)
    ]
    body = {
        "budget": 100.0,
        "formation": "4-3-3",
        "riskTolerance": "balanced",
        "candidates": bad_pool,
    }
    res = client.post("/fantasy-optimize", json=body)
    assert res.status_code == 422
    assert "Not enough" in res.json()["detail"]


def test_trained_mode_without_artefact_fails_loudly(tmp_path) -> None:
    """ML_MODE=trained but no model file -> startup raises, no silent fallback."""
    bogus = tmp_path / "missing.pkl"
    app = _build_app(env={"ML_MODE": "trained", "MATCH_PREDICTOR_PATH": str(bogus)})
    with pytest.raises(RuntimeError, match="not found"), TestClient(app):
        pass
