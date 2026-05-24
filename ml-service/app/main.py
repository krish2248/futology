"""FastAPI entry point for the FUTOLOGY ML microservice.

Phase 3 v0.1 — boots a stub `/predict-match` and a `/health` probe.
v0.2 — adds an opt-in trained predictor loaded from
`MATCH_PREDICTOR_PATH`. Toggle with `ML_MODE=trained` (or omit the env
to keep the seeded stub). The request/response shapes are identical
across modes so the front-end can't tell which one served it.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.auth import RequireBearer
from app.predictors.fantasy import optimize as fantasy_optimize
from app.predictors.match_stub import predict_match as predict_match_stub
from app.predictors.player_cluster import list_profiles
from app.predictors.sentiment import analyze as sentiment_analyze
from app.schemas import (
    FantasyOptimizeRequest,
    FantasyOptimizeResponse,
    HealthResponse,
    PlayerClusterRequest,
    PlayerClusterResponse,
    PredictMatchRequest,
    PredictMatchResponse,
    SentimentRequest,
    SentimentResponse,
    TransferValueRequest,
    TransferValueResponse,
)

logger = logging.getLogger(__name__)

Mode = Literal["stub", "trained"]


def _allowed_origins() -> list[str]:
    raw = os.environ.get("ML_ALLOWED_ORIGINS", "")
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    if parts:
        return parts
    # Sensible defaults: local Next.js dev + the live GH Pages demo.
    return [
        "http://localhost:3000",
        "http://localhost:3005",
        "https://krish2248.github.io",
    ]


def _resolve_mode() -> Mode:
    raw = (os.environ.get("ML_MODE") or "").strip().lower()
    return "trained" if raw == "trained" else "stub"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the trained predictor on startup when ML_MODE=trained.

    Heavy imports (joblib/xgboost/pandas) are inside the function so the
    stub-only deploy stays fast. Failure to load is fatal — operator
    intent (ML_MODE=trained) and reality (no model file) shouldn't
    silently drift; better to crash on startup than serve stub data
    under a trained banner.
    """
    app.state.mode = _resolve_mode()
    app.state.trained = None
    app.state.clusterer = None
    app.state.transfer = None
    if app.state.mode == "trained":
        match_path = Path(
            os.environ.get("MATCH_PREDICTOR_PATH", "trained_models/match_predictor.pkl")
        )
        if not match_path.is_absolute():
            match_path = Path(__file__).resolve().parent.parent / match_path
        if not match_path.exists():
            raise RuntimeError(
                f"ML_MODE=trained but match artefact not found at {match_path}. "
                "Run `python train.py` or set MATCH_PREDICTOR_PATH explicitly."
            )
        from app.predictors.match_trained import TrainedMatchPredictor

        app.state.trained = TrainedMatchPredictor.load(match_path)
        logger.info(
            "Loaded trained match predictor: acc=%.3f, n_train=%d",
            app.state.trained.test_accuracy,
            app.state.trained.n_train,
        )

        cluster_path = Path(
            os.environ.get("PLAYER_CLUSTERER_PATH", "trained_models/player_clusterer.pkl")
        )
        if not cluster_path.is_absolute():
            cluster_path = Path(__file__).resolve().parent.parent / cluster_path
        # Player clusterer is optional — its absence doesn't fail
        # startup (match prediction is the headline feature). Logged
        # so operators can debug missing artefacts without grepping
        # for silent fallbacks.
        if cluster_path.exists():
            from app.predictors.player_cluster import TrainedPlayerClusterer

            app.state.clusterer = TrainedPlayerClusterer.load(cluster_path)
            logger.info(
                "Loaded trained player clusterer: silhouette=%.3f, n_train=%d",
                app.state.clusterer.silhouette,
                app.state.clusterer.n_train,
            )
        else:
            logger.warning(
                "Player clusterer artefact not found at %s — /predict-player-cluster will 503.",
                cluster_path,
            )

        transfer_path = Path(
            os.environ.get("TRANSFER_VALUE_PATH", "trained_models/transfer_value.pkl")
        )
        if not transfer_path.is_absolute():
            transfer_path = Path(__file__).resolve().parent.parent / transfer_path
        if transfer_path.exists():
            from app.predictors.transfer_value import TrainedTransferRegressor

            app.state.transfer = TrainedTransferRegressor.load(transfer_path)
            logger.info(
                "Loaded trained transfer regressor: MAE=EUR %.0f, coverage=%.1f%%, n_train=%d",
                app.state.transfer.test_mae_eur,
                app.state.transfer.band_coverage * 100,
                app.state.transfer.n_train,
            )
        else:
            app.state.transfer = None
            logger.warning(
                "Transfer regressor artefact not found at %s — /predict-transfer-value will 503.",
                transfer_path,
            )
    yield


app = FastAPI(
    title="FUTOLOGY ML",
    version=__version__,
    description="Match prediction, player clustering, sentiment, transfer values.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", response_model=HealthResponse, tags=["meta"])
def health() -> HealthResponse:
    """Liveness probe — no auth, no DB, just confirms the process is up."""
    return HealthResponse(status="ok", version=__version__, mode=app.state.mode)


@app.post("/predict-match", response_model=PredictMatchResponse, tags=["predictions"])
def predict_match_route(req: PredictMatchRequest, _: RequireBearer) -> PredictMatchResponse:
    """Match prediction — trained model when loaded, seeded stub otherwise."""
    if app.state.mode == "trained" and app.state.trained is not None:
        return app.state.trained.predict(req)
    return predict_match_stub(req)


@app.get("/cluster-profiles", tags=["players"])
def cluster_profiles_route():
    """Static catalogue of the 6 player-cluster profiles (id, name, colour, description).

    Always available — doesn't require trained mode. Front-end uses
    this to render the Player Pulse scatter legend without round-
    tripping a prediction.
    """
    return {"profiles": list_profiles()}


@app.post(
    "/predict-player-cluster",
    response_model=PlayerClusterResponse,
    tags=["players"],
)
def predict_player_cluster_route(
    req: PlayerClusterRequest, _: RequireBearer
) -> PlayerClusterResponse:
    """Per-90 stats -> cluster + PCA coords (bible §9.2).

    Returns 503 in stub mode (no synthetic fallback yet — a real reply
    requires the fitted scaler/KMeans/PCA bundle). Run
    `python train_clusterer.py` and reboot with `ML_MODE=trained`.
    """
    from fastapi import HTTPException, status

    if app.state.clusterer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Player clusterer not loaded. Set ML_MODE=trained and ensure "
                "trained_models/player_clusterer.pkl exists."
            ),
        )
    return app.state.clusterer.predict(req)


@app.post(
    "/sentiment-analyze",
    response_model=SentimentResponse,
    tags=["sentiment"],
)
def sentiment_analyze_route(
    req: SentimentRequest, _: RequireBearer
) -> SentimentResponse:
    """Per-fixture sentiment snapshot (bible §9.3).

    v0.6a — deterministic seeded synthetic timeline + reactions. Always
    available, no pickle needed. Swap to Reddit+RoBERTa in v0.7 by
    plugging the real provider into `app.predictors.sentiment._collect_reactions`.
    """
    return sentiment_analyze(req)


@app.post(
    "/fantasy-optimize",
    response_model=FantasyOptimizeResponse,
    tags=["fantasy"],
)
def fantasy_optimize_route(
    req: FantasyOptimizeRequest, _: RequireBearer
) -> FantasyOptimizeResponse:
    """Integer linear program for the optimal 15-man squad (bible §9.5).

    Caller supplies the candidate pool (the front-end has it via
    `lib/data/demoFantasy.ts`); the LP picks 15 maximising adjusted
    predicted points subject to budget, positional composition, and
    max-3-per-club. Always available, no pickle needed.
    """
    try:
        return fantasy_optimize(req)
    except ValueError as exc:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc


@app.post(
    "/predict-transfer-value",
    response_model=TransferValueResponse,
    tags=["players"],
)
def predict_transfer_value_route(
    req: TransferValueRequest, _: RequireBearer
) -> TransferValueResponse:
    """Per-player features -> market value EUR + [p10, p90] band + SHAP (bible §9.4).

    503 in stub mode. Run `python train_transfer.py` then reboot with
    `ML_MODE=trained`. Comparable-players list lands in v0.6 once a
    real player universe is wired in.
    """
    from fastapi import HTTPException, status

    if app.state.transfer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Transfer regressor not loaded. Set ML_MODE=trained and ensure "
                "trained_models/transfer_value.pkl exists."
            ),
        )
    return app.state.transfer.predict(req)
