---
title: FUTOLOGY ML
emoji: ⚽
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: ML + football-data proxy for FUTOLOGY
---

# FUTOLOGY ML

Real-time match prediction, player clustering, transfer valuation,
sentiment, and fantasy optimisation behind one FastAPI service.

Front-end: [`futology`](https://github.com/krish2248/futology) →
[`https://krish2248.github.io/futology`](https://krish2248.github.io/futology).

## Endpoints

| Path | What |
|---|---|
| `GET /health` | Liveness + which mode (`stub` / `trained`) is active |
| `POST /predict-match` | XGBoost + isotonic calibration + SHAP factors (bible §9.1) |
| `POST /predict-player-cluster` | KMeans + PCA, 6 named profiles (bible §9.2) |
| `GET /cluster-profiles` | The 6 canonical profiles (id, name, colour, description) |
| `POST /predict-transfer-value` | Quantile XGBoost triple + SHAP in EUR (bible §9.4) |
| `POST /sentiment-analyze` | Synthetic seeded sentiment snapshot (bible §9.3) |
| `POST /fantasy-optimize` | PuLP integer LP with budget / 2-5-5-3 / max-3-per-club (bible §9.5) |
| `GET /proxy/competitions` | football-data.org competitions (cached 1 hr) |
| `GET /proxy/standings?league=PL` | Current league table (cached 5 min) |
| `GET /proxy/matches` | Fixtures with status / competition / date filters (cached 60 s) |
| `GET /proxy/teams/{id}` | Team detail + current squad (cached 1 hr) |
| `GET /proxy/teams/{id}/matches` | Team's recent and upcoming matches (cached 60 s) |
| `GET /proxy/scorers?league=PL` | Top scorers in a competition (cached 5 min) |

## Required secrets

Add via the Space's **Settings → Variables and secrets**:

| Name | Required? | Purpose |
|---|---|---|
| `ML_SERVICE_TOKEN` | recommended | Bearer auth for the prediction endpoints. Leave unset only for local dev. |
| `ML_ALLOWED_ORIGINS` | recommended | Comma-separated origins allowed by CORS. Default includes localhost + GitHub Pages. |
| `ML_MODE` | optional | `trained` to enable the calibrated XGBoost predictors. Defaults to `stub`. |
| `FOOTBALL_DATA_KEY` | required for /proxy/* | Token from [football-data.org](https://www.football-data.org). Free 10 req/min. |

The trained model artefacts ship in-repo under `trained_models/` so no
training is needed at boot time. `ML_MODE=trained` flips the predictors
over; without it the service serves seeded synthetic predictions.
