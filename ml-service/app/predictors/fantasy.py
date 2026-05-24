"""Fantasy XI optimizer (bible §9.5).

Solves an integer linear program with PuLP:

    maximize  Σ x_i * adjusted_points_i

    s.t.      Σ x_i * price_i ≤ budget
              Σ x_i = 15
              Σ x_i where pos = GK  = 2
              Σ x_i where pos = DEF = 5
              Σ x_i where pos = MID = 5
              Σ x_i where pos = FWD = 3
              Σ x_i for club c ≤ 3   (for every distinct club)
              x_i ∈ {0, 1}

Adjusted points apply a risk-tolerance bias:
  - "safe":     -2.0 * injury_risk * predicted_points
  - "balanced":  0
  - "bold":     +1.5 * (form - 5) for in-form (>5) players, 0 otherwise

Starting XI: pick the formation's positional split from the squad,
choose the highest-predicted player at each slot. Captain = the
starter with the highest predicted points. Bench order: descending
predicted points among the 4 non-starters.

Differentials: players in the squad with ownership < 8% if `ownership`
was supplied (the front-end demoFantasy carries this). For v0.6 we
mark anyone outside the top 5 predicted-points scorers as a
differential candidate.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

import pulp

from app.schemas import (
    FantasyCandidate,
    FantasyOptimizeRequest,
    FantasyOptimizeResponse,
    FantasySquadPick,
    Formation,
    Position,
)

POSITION_SQUAD_COUNTS: dict[Position, int] = {"GK": 2, "DEF": 5, "MID": 5, "FWD": 3}

# Bible-aligned starting splits per formation. GK is always 1; the
# remaining 10 outfielders split per the formation string.
FORMATION_SPLITS: dict[Formation, dict[Position, int]] = {
    "3-4-3": {"GK": 1, "DEF": 3, "MID": 4, "FWD": 3},
    "3-5-2": {"GK": 1, "DEF": 3, "MID": 5, "FWD": 2},
    "4-3-3": {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3},
    "4-4-2": {"GK": 1, "DEF": 4, "MID": 4, "FWD": 2},
    "4-5-1": {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1},
    "5-3-2": {"GK": 1, "DEF": 5, "MID": 3, "FWD": 2},
    "5-4-1": {"GK": 1, "DEF": 5, "MID": 4, "FWD": 1},
}

MAX_PER_CLUB = 3


@dataclass(frozen=True)
class _AdjustedPlayer:
    candidate: FantasyCandidate
    adjusted_points: float


def _adjust_points(candidate: FantasyCandidate, risk: str) -> float:
    base = candidate.predicted_points
    if risk == "safe":
        return base - 2.0 * candidate.injury_risk * base
    if risk == "bold":
        bonus = max(0.0, candidate.form - 5.0) * 1.5
        return base + bonus
    return base  # balanced


def optimize(req: FantasyOptimizeRequest) -> FantasyOptimizeResponse:
    adjusted = [
        _AdjustedPlayer(candidate=c, adjusted_points=_adjust_points(c, req.risk_tolerance))
        for c in req.candidates
    ]

    # Sanity check before the solver: we need enough players per position.
    by_position: dict[Position, list[_AdjustedPlayer]] = defaultdict(list)
    for p in adjusted:
        by_position[p.candidate.position].append(p)
    for pos, n in POSITION_SQUAD_COUNTS.items():
        if len(by_position[pos]) < n:
            raise ValueError(
                f"Not enough {pos} candidates: need {n}, got {len(by_position[pos])}."
            )

    problem = pulp.LpProblem("fantasy_squad", pulp.LpMaximize)
    pick = {p.candidate.id: pulp.LpVariable(f"pick_{p.candidate.id}", cat=pulp.LpBinary) for p in adjusted}

    problem += pulp.lpSum(pick[p.candidate.id] * p.adjusted_points for p in adjusted)

    # Budget.
    problem += (
        pulp.lpSum(pick[p.candidate.id] * p.candidate.price for p in adjusted) <= req.budget,
        "budget_cap",
    )
    # Squad size 15.
    problem += pulp.lpSum(pick[p.candidate.id] for p in adjusted) == 15, "squad_size"

    # Positional composition.
    for pos, n in POSITION_SQUAD_COUNTS.items():
        problem += (
            pulp.lpSum(pick[p.candidate.id] for p in adjusted if p.candidate.position == pos) == n,
            f"squad_{pos}",
        )

    # Max 3 per club.
    teams: dict[str, list[FantasyCandidate]] = defaultdict(list)
    for p in adjusted:
        teams[p.candidate.team].append(p.candidate)
    for team_name, club_players in teams.items():
        if len(club_players) <= MAX_PER_CLUB:
            continue  # constraint already trivially satisfied
        problem += (
            pulp.lpSum(pick[c.id] for c in club_players) <= MAX_PER_CLUB,
            f"max_club_{team_name.replace(' ', '_')}",
        )

    solver_status = pulp.LpStatus[problem.solve(pulp.PULP_CBC_CMD(msg=0))]

    if solver_status != "Optimal":
        raise ValueError(
            f"LP did not find an optimal squad (status={solver_status}). "
            "Tighten the candidate pool or raise the budget."
        )

    chosen_ids = {p.candidate.id for p in adjusted if pulp.value(pick[p.candidate.id]) > 0.5}
    chosen = [p for p in adjusted if p.candidate.id in chosen_ids]
    assert len(chosen) == 15, f"Solver returned {len(chosen)} picks, expected 15"

    # Starting XI: per formation, pick the highest-predicted at each position.
    split = FORMATION_SPLITS[req.formation]
    starters: list[_AdjustedPlayer] = []
    for pos, n in split.items():
        pos_pool = sorted(
            (p for p in chosen if p.candidate.position == pos),
            key=lambda p: p.adjusted_points,
            reverse=True,
        )
        starters.extend(pos_pool[:n])

    starter_ids = {p.candidate.id for p in starters}
    bench = sorted(
        (p for p in chosen if p.candidate.id not in starter_ids),
        key=lambda p: p.adjusted_points,
        reverse=True,
    )
    bench_ids = [p.candidate.id for p in bench]

    captain = max(starters, key=lambda p: p.adjusted_points)

    # Build the final squad list — order: GK, DEF, MID, FWD with starters first inside each.
    def squad_sort_key(p: _AdjustedPlayer) -> tuple[int, int, float]:
        position_rank = ["GK", "DEF", "MID", "FWD"].index(p.candidate.position)
        starter_rank = 0 if p.candidate.id in starter_ids else 1
        return (position_rank, starter_rank, -p.adjusted_points)

    squad = sorted(chosen, key=squad_sort_key)

    total_cost = round(sum(p.candidate.price for p in chosen), 2)
    predicted_total = round(sum(p.adjusted_points for p in starters) + captain.adjusted_points, 2)
    # Captain scores double — standard fantasy ruleset.

    # Differentials: bench picks whose predicted points clear the median
    # candidate (cheap "low-ownership upside" signal until we have real
    # ownership data).
    candidate_median = sorted(req.candidates, key=lambda c: c.predicted_points)[
        len(req.candidates) // 2
    ].predicted_points
    differentials = [
        _to_pick(p, starter_ids, captain.candidate.id)
        for p in bench
        if p.candidate.predicted_points > candidate_median
    ]

    return FantasyOptimizeResponse(
        formation=req.formation,
        budget=req.budget,
        total_cost=total_cost,
        remaining_budget=round(req.budget - total_cost, 2),
        predicted_total_points=predicted_total,
        squad=[_to_pick(p, starter_ids, captain.candidate.id) for p in squad],
        starting_xi_ids=[p.candidate.id for p in starters],
        bench_order_ids=bench_ids,
        captain_id=captain.candidate.id,
        differentials=differentials,
        solver_status=solver_status,
    )


def _to_pick(p: _AdjustedPlayer, starter_ids: set[int], captain_id: int) -> FantasySquadPick:
    c = p.candidate
    return FantasySquadPick(
        id=c.id,
        name=c.name,
        team=c.team,
        position=c.position,
        price=c.price,
        predicted_points=c.predicted_points,
        is_starter=c.id in starter_ids,
        is_captain=c.id == captain_id,
    )
