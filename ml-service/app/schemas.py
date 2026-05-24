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
LeagueTier = Literal["elite", "major", "rising"]


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
    league_tier: LeagueTier | None = Field(
        default=None,
        description="Drives the tier-bonus modulation in the stub predictor; ignored by the trained model.",
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


# --- Player clustering (bible §9.2) ----------------------------------------

ClusterId = Literal[
    "target-striker",
    "creative-playmaker",
    "box-to-box",
    "ball-playing-defender",
    "high-press-forward",
    "deep-lying-playmaker",
]


class PlayerClusterRequest(CamelModel):
    """Per-90 stat line for a single player to classify.

    Field shape mirrors `futology/lib/data/demoPlayerStats.ts` so the
    front-end can POST a `PlayerStatLine` directly without remapping.
    The 10 features feed `StandardScaler -> KMeans(6) -> PCA(2)`.
    """

    name: str = Field(..., description="Display name, echoed back in the response.")
    goals: float = Field(..., ge=0, description="Goals per 90.")
    assists: float = Field(..., ge=0)
    x_g: float = Field(..., ge=0, alias="xG", description="Expected goals per 90.")
    x_a: float = Field(..., ge=0, alias="xA", description="Expected assists per 90.")
    key_passes: float = Field(..., ge=0)
    progressive_passes: float = Field(..., ge=0)
    progressive_carries: float = Field(..., ge=0)
    pressures: float = Field(..., ge=0)
    tackles_plus_interceptions: float = Field(..., ge=0)
    pass_accuracy: float = Field(..., ge=0, le=100, description="Pass completion %.")


class PlayerClusterResponse(CamelModel):
    name: str
    cluster_id: ClusterId
    cluster_name: str
    color: str = Field(..., examples=["#FF6B6B"])
    pca_x: float
    pca_y: float
    confidence: float = Field(..., ge=0, le=100, description="Closeness to assigned centroid (0-100).")


# --- Transfer value (bible §9.4) -------------------------------------------

Position = Literal["GK", "DEF", "MID", "FWD"]


class TransferValueRequest(CamelModel):
    """Inputs the trained transfer regressor needs.

    Subset of bible §9.4's feature list (the rest — continent, UEFA
    coefficient, contract years, caps — land when API-Football data is
    wired in v0.6). Pass `passAccuracy` 0-100 and `minutesPlayed` for
    the prior season.
    """

    name: str
    position: Position
    age: int = Field(..., ge=15, le=45)
    goals_per_90: float = Field(..., ge=0)
    assists_per_90: float = Field(..., ge=0)
    x_g_per_90: float = Field(..., ge=0, alias="xGPer90")
    x_a_per_90: float = Field(..., ge=0, alias="xAPer90")
    pass_accuracy: float = Field(..., ge=0, le=100)
    minutes_played: int = Field(..., ge=0)
    league_level: int = Field(..., ge=1, le=5, description="1 = elite, 5 = lower division.")


class TransferFactor(CamelModel):
    label: str
    contribution: float = Field(..., description="Signed EUR contribution from this feature.")


class TransferValueResponse(CamelModel):
    name: str
    predicted_value_eur: int = Field(..., ge=0)
    low_estimate: int = Field(..., ge=0, description="10th percentile of the trained quantile model.")
    high_estimate: int = Field(..., ge=0, description="90th percentile of the trained quantile model.")
    shap_factors: list[TransferFactor] = Field(..., max_length=8)


# --- Sentiment (bible §9.3) ------------------------------------------------

Emotion = Literal["celebrating", "frustrated", "anxious", "shocked", "neutral"]
Side = Literal["home", "away", "neutral"]
SocialSource = Literal["reddit", "twitter", "synthetic"]


class SentimentRequest(CamelModel):
    """Per-fixture context the analyzer needs to produce a snapshot.

    All fields except home/away names + fixture_id default to neutral.
    The seeded synthetic generator uses fixture_id as the RNG seed so
    the same fixture always emits the same snapshot — useful in demos
    and in CI.
    """

    fixture_id: int
    home_team: str
    away_team: str
    minute: int = Field(default=90, ge=0, le=130)
    home_score: int = Field(default=0, ge=0)
    away_score: int = Field(default=0, ge=0)
    league_short_name: str | None = None
    n_reactions: int = Field(default=8, ge=0, le=40)


class SentimentPoint(CamelModel):
    minute: int
    home: float = Field(..., ge=-1.0, le=1.0)
    away: float = Field(..., ge=-1.0, le=1.0)


class SentimentReaction(CamelModel):
    id: str
    minute: int
    side: Side
    emotion: Emotion
    text: str
    source: SocialSource


class SentimentResponse(CamelModel):
    fixture_id: int
    home_team: str
    away_team: str
    home_mood: float = Field(..., ge=-1.0, le=1.0)
    away_mood: float = Field(..., ge=-1.0, le=1.0)
    excitement: float = Field(..., ge=0.0, le=1.0)
    total_posts: int
    peak_minute: int
    biggest_swing_minute: int
    biggest_swing_magnitude: float = Field(..., ge=0.0)
    biggest_swing_team: Side
    timeline: list[SentimentPoint]
    reactions: list[SentimentReaction]
    source_mode: Literal["synthetic", "reddit"]


# --- Fantasy (bible §9.5) --------------------------------------------------

Formation = Literal["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"]
RiskTolerance = Literal["safe", "balanced", "bold"]


class FantasyCandidate(CamelModel):
    """One player in the candidate pool the LP picks from."""

    id: int
    name: str
    team: str = Field(..., description="Club short name. Used by the max-3-per-club constraint.")
    position: Position
    price: float = Field(..., gt=0, description="Cost in millions (e.g. 12.5).")
    predicted_points: float = Field(..., ge=0)
    form: float = Field(default=5.0, ge=0, le=10)
    injury_risk: float = Field(default=0.0, ge=0, le=1)


class FantasyOptimizeRequest(CamelModel):
    budget: float = Field(default=100.0, gt=0, description="Total squad budget in millions.")
    formation: Formation = "4-3-3"
    risk_tolerance: RiskTolerance = "balanced"
    candidates: list[FantasyCandidate] = Field(..., min_length=15)


class FantasySquadPick(CamelModel):
    id: int
    name: str
    team: str
    position: Position
    price: float
    predicted_points: float
    is_starter: bool
    is_captain: bool


class FantasyOptimizeResponse(CamelModel):
    formation: Formation
    budget: float
    total_cost: float
    remaining_budget: float
    predicted_total_points: float
    squad: list[FantasySquadPick] = Field(..., min_length=15, max_length=15)
    starting_xi_ids: list[int] = Field(..., min_length=11, max_length=11)
    bench_order_ids: list[int] = Field(..., min_length=4, max_length=4)
    captain_id: int
    differentials: list[FantasySquadPick] = Field(default_factory=list)
    solver_status: str
