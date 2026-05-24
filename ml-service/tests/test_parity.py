"""Parity check between the TS stub (`futology/lib/ml/predictor.ts`) and
the Python stub (`app/predictors/match_stub.py`).

The fixture is generated from the TS source of truth via
`futology/scripts/generate_predictor_fixture.ts`. Regenerate that file
after any intentional change to the TS predictor, then run pytest to
confirm the Python port still matches byte-for-byte.

Why this matters: the v0.2 swap from `match_stub` to the trained
XGBoost classifier should only change predictions because the *model*
changed — never because the demo stub silently drifted away from the
TS version users have been seeing in the GH Pages demo.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from app.predictors.match_stub import predict_match
from app.schemas import PredictMatchRequest

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "match_parity.json"


def _load_cases() -> list[dict[str, Any]]:
    if not FIXTURE_PATH.exists():
        pytest.skip(
            "Parity fixture missing; regenerate via "
            "`cd futology && npx tsx scripts/generate_predictor_fixture.ts`"
        )
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))["cases"]


@pytest.mark.parametrize("case", _load_cases(), ids=lambda c: f"{c['homeId']}vs{c['awayId']}")
def test_python_stub_matches_ts_predictor(case: dict[str, Any]) -> None:
    req = PredictMatchRequest(
        home_id=case["homeId"],
        away_id=case["awayId"],
        competition_id=case["competitionId"],
        home_short_name=case["homeShortName"],
        away_short_name=case["awayShortName"],
        league_short_name=case["leagueShortName"],
        league_tier=case["leagueTier"],
    )
    got = predict_match(req).model_dump(by_alias=True)
    expected = case["expected"]

    # Compare probabilities to 0.5 pp — `round(..., 2)` on the Python
    # side and `Math.floor` on the TS side can disagree at the second
    # decimal even when the seeded recipe is identical.
    for key in ("homeWinProb", "drawProb", "awayWinProb", "confidence"):
        assert abs(got[key] - expected[key]) < 0.5, f"{key} drift: {got[key]} vs {expected[key]}"

    # Categorical outputs must match exactly.
    assert got["predictedWinner"] == expected["predictedWinner"]
    assert got["predictedScore"] == expected["predictedScore"]
    assert got["keyFactors"] == expected["keyFactors"]
