"""Tests for the football-data.org proxy routes."""

from __future__ import annotations

import importlib
import json
from collections.abc import Iterator
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient


def _clean_env(monkeypatch) -> None:
    """Drop env vars set by other test modules so lifespan stays in stub mode.

    `test_main.py` uses `os.environ.update` (not monkeypatch) to set
    `ML_MODE` and the predictor paths, and those persist across test
    modules. Clear them before each proxy test to avoid the lifespan
    re-loading models we don't need here.
    """
    for key in (
        "ML_MODE",
        "MATCH_PREDICTOR_PATH",
        "PLAYER_CLUSTERER_PATH",
        "TRANSFER_VALUE_PATH",
        "ML_SERVICE_TOKEN",
        "ML_ALLOWED_ORIGINS",
    ):
        monkeypatch.delenv(key, raising=False)


@pytest.fixture
def client_with_key(monkeypatch) -> Iterator[TestClient]:
    """TestClient with FOOTBALL_DATA_KEY set and a fresh cache."""
    _clean_env(monkeypatch)
    monkeypatch.setenv("FOOTBALL_DATA_KEY", "test-token")
    import app.main as main_module
    from app.proxy import reset_cache

    importlib.reload(main_module)
    reset_cache()
    with TestClient(main_module.app) as c:
        yield c
    reset_cache()


@pytest.fixture
def client_no_key(monkeypatch) -> Iterator[TestClient]:
    """TestClient with FOOTBALL_DATA_KEY unset — proxy routes should 503."""
    _clean_env(monkeypatch)
    monkeypatch.delenv("FOOTBALL_DATA_KEY", raising=False)
    import app.main as main_module
    from app.proxy import reset_cache

    importlib.reload(main_module)
    reset_cache()
    with TestClient(main_module.app) as c:
        yield c
    reset_cache()


def _stub_httpx(monkeypatch, payload: dict[str, Any], status_code: int = 200) -> dict[str, int]:
    """Replace httpx.AsyncClient.get with a stub that returns `payload`.

    Returns a dict whose `["calls"]` key counts how many times the stub
    was hit — useful for the cache test below.
    """
    counter = {"calls": 0}

    class _Resp:
        def __init__(self, code: int, body: dict[str, Any]) -> None:
            self.status_code = code
            self._body = body
            self.text = json.dumps(body)

        def json(self) -> dict[str, Any]:
            return self._body

    class _AsyncClient:
        def __init__(self, *args: Any, **kwargs: Any) -> None:
            pass

        async def __aenter__(self) -> _AsyncClient:
            return self

        async def __aexit__(self, *args: Any) -> None:
            return None

        async def get(self, *args: Any, **kwargs: Any) -> _Resp:
            counter["calls"] += 1
            return _Resp(status_code, payload)

    monkeypatch.setattr(httpx, "AsyncClient", _AsyncClient)
    return counter


def test_proxy_competitions_returns_503_without_key(client_no_key: TestClient) -> None:
    res = client_no_key.get("/proxy/competitions")
    assert res.status_code == 503
    assert "FOOTBALL_DATA_KEY" in res.json()["detail"]


def test_proxy_standings_reshape(monkeypatch, client_with_key: TestClient) -> None:
    raw = {
        "competition": {"id": 2021, "code": "PL", "name": "Premier League", "emblem": "url"},
        "season": {"startDate": "2025-08-15", "endDate": "2026-05-24", "currentMatchday": 35},
        "standings": [
            {
                "stage": "REGULAR_SEASON",
                "type": "TOTAL",
                "table": [
                    {
                        "position": 1,
                        "team": {
                            "id": 64,
                            "shortName": "Liverpool",
                            "name": "Liverpool FC",
                            "crest": "u",
                        },
                        "playedGames": 30,
                        "won": 22,
                        "draw": 6,
                        "lost": 2,
                        "points": 72,
                        "goalsFor": 70,
                        "goalsAgainst": 25,
                        "goalDifference": 45,
                        "form": "WWWDW",
                    }
                ],
            }
        ],
    }
    _stub_httpx(monkeypatch, raw)
    res = client_with_key.get("/proxy/standings?league=PL")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["competition"]["code"] == "PL"
    assert body["groups"][0]["rows"][0]["teamName"] == "Liverpool"
    assert body["groups"][0]["rows"][0]["points"] == 72


def test_proxy_matches_reshape(monkeypatch, client_with_key: TestClient) -> None:
    raw = {
        "resultSet": {"count": 1},
        "matches": [
            {
                "id": 12345,
                "utcDate": "2026-05-25T19:30:00Z",
                "status": "SCHEDULED",
                "minute": None,
                "competition": {"code": "PL"},
                "homeTeam": {"id": 64, "shortName": "Liverpool", "crest": "u"},
                "awayTeam": {"id": 65, "shortName": "Man City", "crest": "u"},
                "score": {"fullTime": {"home": None, "away": None}, "winner": None},
            }
        ],
    }
    _stub_httpx(monkeypatch, raw)
    res = client_with_key.get("/proxy/matches?status=SCHEDULED&competitions=PL")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["count"] == 1
    assert body["matches"][0]["homeTeam"]["name"] == "Liverpool"
    assert body["matches"][0]["status"] == "SCHEDULED"


def test_proxy_team_squad_reshape(monkeypatch, client_with_key: TestClient) -> None:
    raw = {
        "id": 64,
        "name": "Liverpool FC",
        "shortName": "Liverpool",
        "tla": "LIV",
        "crest": "u",
        "founded": 1892,
        "venue": "Anfield",
        "website": "https://liverpoolfc.com",
        "runningCompetitions": [{"id": 2021, "code": "PL", "name": "Premier League"}],
        "squad": [
            {
                "id": 1,
                "name": "M. Salah",
                "position": "Offence",
                "dateOfBirth": "1992-06-15",
                "nationality": "Egypt",
            },
        ],
        "coach": {"name": "Arne Slot"},
    }
    _stub_httpx(monkeypatch, raw)
    res = client_with_key.get("/proxy/teams/64")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["shortName"] == "Liverpool"
    assert body["coach"] == "Arne Slot"
    assert body["squad"][0]["name"] == "M. Salah"


def test_proxy_cache_avoids_duplicate_upstream_hits(
    monkeypatch, client_with_key: TestClient
) -> None:
    """Second identical request should be served from the in-process cache."""
    raw = {
        "competition": {"id": 2021, "code": "PL", "name": "PL", "emblem": "u"},
        "season": {},
        "standings": [],
    }
    counter = _stub_httpx(monkeypatch, raw)
    client_with_key.get("/proxy/standings?league=PL")
    client_with_key.get("/proxy/standings?league=PL")
    assert counter["calls"] == 1, "Second hit should be cached"


def test_proxy_rate_limit_passthrough(monkeypatch, client_with_key: TestClient) -> None:
    _stub_httpx(monkeypatch, {"error": "rate limit"}, status_code=429)
    res = client_with_key.get("/proxy/standings?league=PL")
    assert res.status_code == 429
    assert "rate limit" in res.json()["detail"].lower()


def test_proxy_scorers_reshape(monkeypatch, client_with_key: TestClient) -> None:
    raw = {
        "competition": {"code": "PL"},
        "season": {"startDate": "2025-08-15", "endDate": "2026-05-24"},
        "scorers": [
            {
                "player": {"id": 1, "name": "E. Haaland", "nationality": "Norway"},
                "team": {"id": 65, "shortName": "Man City", "crest": "u"},
                "goals": 22,
                "assists": 3,
                "penalties": 5,
                "playedMatches": 28,
            }
        ],
    }
    _stub_httpx(monkeypatch, raw)
    res = client_with_key.get("/proxy/scorers?league=PL&limit=20")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["scorers"][0]["playerName"] == "E. Haaland"
    assert body["scorers"][0]["goals"] == 22
