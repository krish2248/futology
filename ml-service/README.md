# FUTOLOGY ML service

Python microservice that powers FUTOLOGY's match prediction, player
clustering, sentiment, transfer values, and fantasy optimization. Sits
behind the Next.js front-end at [`futology/`](../futology) and is called
via `MATCH_PREDICT_URL` + bearer auth.

**Status:** v0.1 — stub `/predict-match` returns a deterministic seeded
distribution that mirrors `futology/lib/ml/predictor.ts`. The trained
XGBoost classifier (bible §9.1) lands in v0.2; the request/response
contract stays identical so the front-end swap is invisible to users.

## Quick start (Windows / PowerShell)

```powershell
cd ml-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Then:

```powershell
# health
curl http://localhost:8000/health

# stub prediction (no auth in local dev when ML_SERVICE_TOKEN is unset)
curl -X POST http://localhost:8000/predict-match `
  -H "Content-Type: application/json" `
  -d '{"homeId":541,"awayId":529,"competitionId":140,"homeShortName":"RMA","awayShortName":"BAR","leagueShortName":"La Liga"}'
```

## API

| Method | Path             | Auth         | Notes                       |
| ------ | ---------------- | ------------ | --------------------------- |
| GET    | `/health`        | none         | Liveness probe.             |
| POST   | `/predict-match` | Bearer token | Stub today, XGBoost in v0.2 |

Request and response shapes live in [`app/schemas.py`](app/schemas.py).
All JSON is camelCase to match `futology/lib/ml/predictor.ts` exactly.

## Deploy

Railway picks up the `Dockerfile` automatically. Required env vars on
Railway:

- `ML_SERVICE_TOKEN` — shared secret the front-end sends as
  `Authorization: Bearer …`. Generate with
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `ML_ALLOWED_ORIGINS` — comma-separated; e.g.
  `https://krish2248.github.io,https://futology.vercel.app`.

## Roadmap

- v0.2 — trained `XGBClassifier` for `/predict-match` (bible §9.1).
- v0.3 — KMeans player clusterer + PCA (bible §9.2).
- v0.4 — Transfer value regressor + SHAP (bible §9.4).
- v0.5 — Sentiment pipeline (Reddit + RoBERTa) (bible §9.3).
- v0.6 — PuLP fantasy optimizer (bible §9.5).
