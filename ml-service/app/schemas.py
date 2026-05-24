"""Wire formats shared between FastAPI and the FUTOLOGY front-end.

Pydantic models use snake_case internally (Python convention) and emit
camelCase JSON via an alias generator so the front-end can consume them
without a translation layer. The shapes mirror `lib/ml/predictor.ts` in
the futology/ Next.js app — the swap from the demo stub to this service
is intended to be one env-var change with no client refactor.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

Winner = Literal["home", "draw", "away"]


class CamelModel(BaseModel):
    """Base that emits camelCase JSON while keeping snake_case in Python."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class PredictMatchRequest(CamelModel):
    home_id: int = Field(..., description="Club id (matches API-Football team ids).")
    away_id: int = Field(..., description="Club id (matches API-Football team ids).")
    competition_id: int | None = Field(
        default=None, description="League/cup id; falls back to home club's league."
    )
    home_short_name: str | None = Field(
        default=None,
        description="Optional short name used in key-factor templates.",
    )
    away_short_name: str | None = Field(
        default=None,
        description="Optional short name used in key-factor templates.",
    )
    league_short_name: str | None = Field(
        default=None,
        description="Optional league short name used in key-factor templates.",
    )


class PredictMatchResponse(CamelModel):
    home_win_prob: float = Field(..., ge=0, le=100)
    draw_prob: float = Field(..., ge=0, le=100)
    away_win_prob: float = Field(..., ge=0, le=100)
    predicted_winner: Winner
    confidence: float = Field(..., ge=0, le=100)
    predicted_score: str = Field(..., examples=["2-1"])
    key_factors: list[str] = Field(..., min_length=1, max_length=5)


class HealthResponse(CamelModel):
    status: Literal["ok"]
    version: str
    mode: Literal["stub", "trained"]
