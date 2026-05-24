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
from app.predictors.match_stub import predict_match as predict_match_stub
from app.schemas import HealthResponse, PredictMatchRequest, PredictMatchResponse

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
    if app.state.mode == "trained":
        path = Path(os.environ.get("MATCH_PREDICTOR_PATH", "trained_models/match_predictor.pkl"))
        if not path.is_absolute():
            path = Path(__file__).resolve().parent.parent / path
        if not path.exists():
            raise RuntimeError(
                f"ML_MODE=trained but model artefact not found at {path}. "
                "Run `python train.py` or set MATCH_PREDICTOR_PATH explicitly."
            )
        from app.predictors.match_trained import TrainedMatchPredictor

        app.state.trained = TrainedMatchPredictor.load(path)
        logger.info(
            "Loaded trained match predictor: acc=%.3f, n_train=%d",
            app.state.trained.test_accuracy,
            app.state.trained.n_train,
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
