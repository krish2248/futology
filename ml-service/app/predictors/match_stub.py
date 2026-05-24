"""Seeded match-prediction stub.

Deterministic, reproducible, no ML model required. Mirrors the seeded
Lehmer-RNG approach in `futology/lib/ml/predictor.ts` so the front-end
sees identical predictions whether it calls the stub locally or this
service over HTTP. Replace with the trained XGBoost classifier (bible
§9.1) in v0.2 — keep the request/response contract identical.
"""

from __future__ import annotations

import math

from app.schemas import PredictMatchRequest, PredictMatchResponse, Winner


def _seeded(seed: int):
    """Lehmer RNG matching the one in futology/lib/ml/predictor.ts."""
    s = seed % 4_294_967_296
    if s < 0:
        s += 4_294_967_296

    def _next() -> float:
        nonlocal s
        s = (s * 1_664_525 + 1_013_904_223) % 4_294_967_296
        return s / 4_294_967_296

    return _next


def _factor_pool(home: str, away: str, league: str) -> list[str]:
    return [
        f"{home} won 4 of last 5 home matches in {league}.",
        f"{away} on a 3-match unbeaten run on the road.",
        f"Head-to-head favors {home} (3W 1D 1L last 5).",
        f"{away} fatigued: 4 matches in 12 days.",
        f"{home} converts 38% of set-pieces vs league avg 19%.",
        f"{away} keeper's xG-prevented ranks bottom-third in league.",
        f"Recent form: {home} +6 goal differential, {away} -2.",
        f"{home} press intensity (PPDA) one of league's lowest — they suffocate possession.",
        f"{away} top scorer doubtful — 12-day knee strain.",
        f"Wet forecast favors the more direct attack — {home}'s xG-on-counter is league-best.",
    ]


def predict_match(req: PredictMatchRequest) -> PredictMatchResponse:
    """Stub predictor returning a deterministic, seeded distribution.

    The numerical recipe matches `predictMatch` in the front-end's
    `lib/ml/predictor.ts` so the same (home_id, away_id, competition_id)
    triple produces identical output regardless of which side computes it.
    That lets the front-end swap from the demo stub to this service
    without users seeing prediction churn.
    """
    competition_id = req.competition_id or req.home_id  # falls back to home's league when missing
    seed = req.home_id * 1_000_003 + req.away_id * 17 + competition_id
    rnd = _seeded(seed)

    base_home = 35 + math.floor(rnd() * 28)
    base_away = 22 + math.floor(rnd() * 26)
    base_draw = max(8, 100 - base_home - base_away)
    total = base_home + base_away + base_draw
    hp = (base_home / total) * 100
    dp = (base_draw / total) * 100
    ap = (base_away / total) * 100

    winner: Winner
    if hp >= dp and hp >= ap:
        winner = "home"
    elif ap >= dp:
        winner = "away"
    else:
        winner = "draw"

    home_goals = max(0, round(rnd() * 3))
    away_goals = max(0, round(rnd() * 2.5))
    if winner == "home":
        predicted_score = f"{max(home_goals, away_goals + 1)}-{away_goals}"
    elif winner == "away":
        predicted_score = f"{home_goals}-{max(away_goals, home_goals + 1)}"
    else:
        predicted_score = f"{home_goals}-{home_goals}"

    pool = _factor_pool(
        req.home_short_name or f"Team {req.home_id}",
        req.away_short_name or f"Team {req.away_id}",
        req.league_short_name or "this league",
    )
    picked: list[str] = []
    taken: set[int] = set()
    while len(picked) < 3 and len(taken) < len(pool):
        idx = math.floor(rnd() * len(pool))
        if idx in taken:
            continue
        taken.add(idx)
        picked.append(pool[idx])

    return PredictMatchResponse(
        home_win_prob=round(hp, 2),
        draw_prob=round(dp, 2),
        away_win_prob=round(ap, 2),
        predicted_winner=winner,
        confidence=round(max(hp, dp, ap), 2),
        predicted_score=predicted_score,
        key_factors=picked,
    )
