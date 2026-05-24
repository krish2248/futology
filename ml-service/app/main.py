"""FastAPI entry point for the FUTOLOGY ML microservice.

Phase 3 v0.1 — boots a stub `/predict-match` and a `/health` probe.
v0.2 onwards swaps the stub for the trained XGBoost classifier (bible
§9.1) without changing the request/response shapes.
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.auth import RequireBearer
from app.predictors.match_stub import predict_match
from app.schemas import HealthResponse, PredictMatchRequest, PredictMatchResponse


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


app = FastAPI(
    title="FUTOLOGY ML",
    version=__version__,
    description="Match prediction, player clustering, sentiment, transfer values.",
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
    return HealthResponse(status="ok", version=__version__, mode="stub")


@app.post("/predict-match", response_model=PredictMatchResponse, tags=["predictions"])
def predict_match_route(req: PredictMatchRequest, _: RequireBearer) -> PredictMatchResponse:
    """Stub match prediction. Replace with the trained model in v0.2."""
    return predict_match(req)
