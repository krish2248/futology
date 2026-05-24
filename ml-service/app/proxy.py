"""football-data.org proxy.

Sits between the browser and the football-data.org API so the API
token (`FOOTBALL_DATA_KEY`) never reaches the client bundle. Adds a
small in-memory TTL cache to stay well under the 10-req/min free-tier
limit even under bursty traffic.

Endpoints expose a thin, opinionated reshape of football-data.org's
response so the front-end consumes one shape regardless of upstream
quirks. The reshape lives here so swapping providers later (Sportradar,
StatsBomb, API-Football) is one module change.
"""

from __future__ import annotations

import os
import time
from collections.abc import Awaitable, Callable
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query, status

router = APIRouter(prefix="/proxy", tags=["proxy"])

FOOTBALL_DATA_BASE = "https://api.football-data.org/v4"

# (cache_key, value, expires_at) — small TTL cache. football-data.org's
# data updates roughly every minute; we cache 60s on hot endpoints,
# 5 min on slow-moving ones (standings, scorers).
_cache: dict[str, tuple[Any, float]] = {}


def _now() -> float:
    return time.monotonic()


def _cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if expires_at < _now():
        _cache.pop(key, None)
        return None
    return value


def _cache_set(key: str, value: Any, ttl_seconds: float) -> None:
    _cache[key] = (value, _now() + ttl_seconds)


async def _fetch(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """GET football-data.org/v4/<path>. Raises HTTPException on upstream errors."""
    token = os.environ.get("FOOTBALL_DATA_KEY")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "FOOTBALL_DATA_KEY not configured. Set it as a Hugging Face Space "
                "secret to enable the real-data proxy."
            ),
        )
    headers = {"X-Auth-Token": token, "Accept": "application/json"}
    url = f"{FOOTBALL_DATA_BASE}/{path.lstrip('/')}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            res = await client.get(url, headers=headers, params=params or {})
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Upstream network error: {exc}",
            ) from exc

    if res.status_code == 429:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="football-data.org rate limit reached (10 req/min free tier).",
        )
    if res.status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "football-data.org refused the request — competition not on free tier "
                "or invalid token."
            ),
        )
    if res.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream returned HTTP {res.status_code}: {res.text[:200]}",
        )
    return res.json()


async def _cached(
    key: str, ttl: float, fetcher: Callable[[], Awaitable[dict[str, Any]]]
) -> dict[str, Any]:
    hit = _cache_get(key)
    if hit is not None:
        return hit
    value = await fetcher()
    _cache_set(key, value, ttl)
    return value


# --- Endpoints --------------------------------------------------------


@router.get("/competitions")
async def list_competitions():
    """List of competitions the free tier covers. Cached 1 hour."""
    return await _cached("competitions", 3600.0, lambda: _fetch("competitions"))


@router.get("/standings")
async def standings(
    league: str = Query(..., description="Competition code: PL, PD, BL1, SA, FL1, CL, …"),
):
    """League table for `league`. Cached 5 minutes."""
    key = f"standings:{league}"
    data = await _cached(key, 300.0, lambda: _fetch(f"competitions/{league}/standings"))
    return _reshape_standings(data)


@router.get("/matches")
async def matches(
    status_filter: str | None = Query(
        None,
        alias="status",
        description="LIVE, FINISHED, SCHEDULED, IN_PLAY — passed through to upstream.",
    ),
    competitions: str | None = Query(
        None, description="Comma-separated competition codes, e.g. PL,PD,BL1."
    ),
    date_from: str | None = Query(None, alias="dateFrom", description="YYYY-MM-DD"),
    date_to: str | None = Query(None, alias="dateTo", description="YYYY-MM-DD"),
):
    """Fixtures with filters. Cached 60s (live data should stay fresh)."""
    params: dict[str, Any] = {}
    if status_filter:
        params["status"] = status_filter
    if competitions:
        params["competitions"] = competitions
    if date_from:
        params["dateFrom"] = date_from
    if date_to:
        params["dateTo"] = date_to
    key = "matches:" + "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    data = await _cached(key, 60.0, lambda: _fetch("matches", params))
    return _reshape_matches(data)


@router.get("/teams/{team_id}")
async def team_detail(team_id: int):
    """Team info + current squad. Cached 1 hour."""
    key = f"team:{team_id}"
    data = await _cached(key, 3600.0, lambda: _fetch(f"teams/{team_id}"))
    return _reshape_team(data)


@router.get("/teams/{team_id}/matches")
async def team_matches(
    team_id: int,
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
):
    """Recent + upcoming matches for one team. Cached 60s."""
    params: dict[str, Any] = {"limit": limit}
    if status_filter:
        params["status"] = status_filter
    key = f"team_matches:{team_id}:{status_filter}:{limit}"
    data = await _cached(key, 60.0, lambda: _fetch(f"teams/{team_id}/matches", params))
    return _reshape_matches(data)


@router.get("/scorers")
async def scorers(
    league: str = Query(..., description="Competition code: PL, PD, BL1, SA, FL1, …"),
    limit: int = Query(20, ge=1, le=100),
):
    """Top scorers in a competition. Cached 5 minutes."""
    key = f"scorers:{league}:{limit}"
    data = await _cached(
        key,
        300.0,
        lambda: _fetch(f"competitions/{league}/scorers", {"limit": limit}),
    )
    return _reshape_scorers(data)


# --- Reshape helpers --------------------------------------------------
# football-data.org responses are wordy. The reshapes below trim them
# down to what FUTOLOGY's UI actually renders, so the response payloads
# fit comfortably even in mobile-data bursts.


def _reshape_standings(raw: dict[str, Any]) -> dict[str, Any]:
    comp = raw.get("competition", {})
    season = raw.get("season", {})
    out_groups = []
    for group in raw.get("standings", []):
        rows = []
        for r in group.get("table", []):
            team = r.get("team") or {}
            rows.append(
                {
                    "position": r.get("position"),
                    "teamId": team.get("id"),
                    "teamName": team.get("shortName") or team.get("name"),
                    "teamCrest": team.get("crest"),
                    "playedGames": r.get("playedGames"),
                    "won": r.get("won"),
                    "draw": r.get("draw"),
                    "lost": r.get("lost"),
                    "points": r.get("points"),
                    "goalsFor": r.get("goalsFor"),
                    "goalsAgainst": r.get("goalsAgainst"),
                    "goalDifference": r.get("goalDifference"),
                    "form": r.get("form"),
                }
            )
        out_groups.append({"stage": group.get("stage"), "type": group.get("type"), "rows": rows})
    return {
        "competition": {
            "id": comp.get("id"),
            "code": comp.get("code"),
            "name": comp.get("name"),
            "emblem": comp.get("emblem"),
        },
        "season": {
            "startDate": season.get("startDate"),
            "endDate": season.get("endDate"),
            "currentMatchday": season.get("currentMatchday"),
        },
        "groups": out_groups,
    }


def _reshape_match(m: dict[str, Any]) -> dict[str, Any]:
    home = m.get("homeTeam") or {}
    away = m.get("awayTeam") or {}
    score = m.get("score") or {}
    full_time = score.get("fullTime") or {}
    return {
        "id": m.get("id"),
        "utcDate": m.get("utcDate"),
        "status": m.get("status"),
        "minute": m.get("minute"),
        "competition": (m.get("competition") or {}).get("code"),
        "homeTeam": {
            "id": home.get("id"),
            "name": home.get("shortName") or home.get("name"),
            "crest": home.get("crest"),
        },
        "awayTeam": {
            "id": away.get("id"),
            "name": away.get("shortName") or away.get("name"),
            "crest": away.get("crest"),
        },
        "homeScore": full_time.get("home"),
        "awayScore": full_time.get("away"),
        "winner": (score.get("winner") or "").lower() if score.get("winner") else None,
    }


def _reshape_matches(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "count": raw.get("resultSet", {}).get("count"),
        "matches": [_reshape_match(m) for m in raw.get("matches", [])],
    }


def _reshape_team(raw: dict[str, Any]) -> dict[str, Any]:
    squad = []
    for p in raw.get("squad") or []:
        squad.append(
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "position": p.get("position"),
                "dateOfBirth": p.get("dateOfBirth"),
                "nationality": p.get("nationality"),
            }
        )
    return {
        "id": raw.get("id"),
        "name": raw.get("name"),
        "shortName": raw.get("shortName"),
        "tla": raw.get("tla"),
        "crest": raw.get("crest"),
        "founded": raw.get("founded"),
        "venue": raw.get("venue"),
        "website": raw.get("website"),
        "competitions": [
            {"id": c.get("id"), "code": c.get("code"), "name": c.get("name")}
            for c in raw.get("runningCompetitions") or []
        ],
        "squad": squad,
        "coach": (raw.get("coach") or {}).get("name"),
    }


def _reshape_scorers(raw: dict[str, Any]) -> dict[str, Any]:
    out = []
    for s in raw.get("scorers", []):
        player = s.get("player") or {}
        team = s.get("team") or {}
        out.append(
            {
                "playerId": player.get("id"),
                "playerName": player.get("name"),
                "nationality": player.get("nationality"),
                "teamId": team.get("id"),
                "teamName": team.get("shortName") or team.get("name"),
                "teamCrest": team.get("crest"),
                "goals": s.get("goals"),
                "assists": s.get("assists"),
                "penalties": s.get("penalties"),
                "playedMatches": s.get("playedMatches"),
            }
        )
    return {
        "competition": (raw.get("competition") or {}).get("code"),
        "season": raw.get("season"),
        "scorers": out,
    }


def reset_cache() -> None:
    """Test hook — clear the in-memory cache."""
    _cache.clear()
