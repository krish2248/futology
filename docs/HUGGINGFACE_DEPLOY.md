# Deploying the ML service to Hugging Face Spaces

Free hosting for the FUTOLOGY FastAPI service. No credit card. The
free tier runs a Docker container with 16 GB RAM / 2 vCPU and
auto-sleeps after ~48 hours of no traffic — wakes back up on the next
request in ~20 seconds.

## One-time setup

### 1. Create the Space

1. Sign in at <https://huggingface.co> (account: `krishsoni1`).
2. Click your avatar (top right) → **New Space**.
3. Fill in:
   - **Owner**: `krishsoni1`
   - **Space name**: `futology` (the URL becomes `https://krishsoni1-futology.hf.space`)
   - **License**: `MIT`
   - **Space SDK**: pick **Docker**
   - **Docker template**: leave empty
   - **Visibility**: Public (so the front-end can call it from any browser without auth headaches)
4. Click **Create Space**.

### 2. Push the `ml-service` directory to the Space

Hugging Face Spaces are just git repos. After creating the Space,
Hugging Face shows the clone URL — something like:

```
https://huggingface.co/spaces/krishsoni1/futology
```

From the project root:

```bash
# add the HF Space as a second remote, pointing at the ml-service subdir
cd ml-service
git init                                 # only if not already a git repo
git remote add hf https://huggingface.co/spaces/krishsoni1/futology
# OPTIONAL — copy the Space-flavored README the metadata block needs
cp README_HF.md README.md
# Pull what HF generated (a small README seed) so the histories merge
git pull hf main --allow-unrelated-histories
git add .
git commit -m "Initial FUTOLOGY ML service"
git push hf main
```

(You'll be prompted for HF credentials. Generate a write token at
<https://huggingface.co/settings/tokens> if needed.)

> **Simpler alternative:** drag-and-drop. The HF Space UI has a
> **Files** tab → **+ Add file → Upload files**. Upload everything
> inside `ml-service/` (excluding `.venv/`, `data/`, `__pycache__/`).
> The build kicks off automatically.

### 3. Set the Space secrets

In your Space → **Settings** → **Variables and secrets** → **New secret**:

| Secret name | Value |
|---|---|
| `ML_SERVICE_TOKEN` | A long random string (e.g. `openssl rand -base64 48`). Save a copy — the front-end will use it. |
| `ML_ALLOWED_ORIGINS` | `https://krish2248.github.io,http://localhost:3000` |
| `ML_MODE` | `trained` |
| `FOOTBALL_DATA_KEY` | The freshly-rotated token from [football-data.org](https://www.football-data.org/client/register). |

### 4. Wait for the build

HF builds the Docker image. First build takes 5-7 minutes (xgboost +
sklearn are big). Subsequent rebuilds are faster because layers cache.

Watch the **Logs** tab in the Space — you should see
`Application startup complete.` once FastAPI is serving.

### 5. Smoke-test the deployed service

```bash
# Health probe — should report mode=trained
curl https://krishsoni1-futology.hf.space/health

# Real Premier League table — needs FOOTBALL_DATA_KEY
curl https://krishsoni1-futology.hf.space/proxy/standings?league=PL

# Prediction — needs ML_SERVICE_TOKEN
curl -X POST https://krishsoni1-futology.hf.space/predict-match \
  -H "Authorization: Bearer YOUR_ML_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"homeId":541,"awayId":529,"competitionId":140,
       "homeShortName":"Real Madrid","awayShortName":"Barcelona",
       "leagueShortName":"La Liga","leagueTier":"elite"}'
```

If all three return 200 + JSON, the service is live.

## Wiring it to the front-end

Once the Space URL is up, add two GitHub Actions repo secrets
(<https://github.com/krish2248/futology/settings/secrets/actions>):

- `NEXT_PUBLIC_ML_API_URL` = `https://krishsoni1-futology.hf.space`
- `NEXT_PUBLIC_ML_API_TOKEN` = the same value you put in `ML_SERVICE_TOKEN`

The deploy workflow picks both up and inlines them at build time.

## Cost guardrails

Hugging Face Spaces free tier is:

- Always free for public Spaces
- 2 vCPU / 16 GB RAM / 50 GB ephemeral storage
- Sleeps after ~48 hours of zero traffic; wakes on next request

No risk of surprise bills. If the Space sleeps mid-day, the first
visitor's prediction takes ~20s to come back instead of instant —
acceptable trade for $0.

## Updates after the initial deploy

Push to the `hf` remote and HF rebuilds automatically:

```bash
cd ml-service
git push hf main
```

For a hands-off workflow, set up a [HF Space Webhook] that watches
the GitHub repo's `ml-service/` directory and auto-syncs on push to
`main`. Optional — drop-in for v1.

[HF Space Webhook]: https://huggingface.co/docs/hub/webhooks
