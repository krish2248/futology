# FUTOLOGY — Project Status

Last updated: **2026-05-24** (end of Session 22).

This is the honest accounting of what works, what's behind a one-time
user action, and what's deferred — phase by phase against the spec
in `PROJECT_Sick-Boy.md`.

## TL;DR

- **What works today, no setup**: the entire Next.js app at
  `https://krish2248.github.io/futology/`. Demo data, demo auth, ML
  predictions powered by the in-bundle stubs.
- **What works after one user-side click-through (~30 min total)**:
  - Railway deploy of `ml-service/` → real XGBoost / KMeans / quantile
    transfer / synthetic sentiment / PuLP fantasy at the bible-spec
    accuracy figures, called transparently by the front-end via the
    `Auto`-router clients.
  - Vercel deploy of `futology/` → real Supabase auth (magic-link OTP)
    + RLS-protected persistence for predictions / leagues / follows.
- **What's intentionally deferred for now**: real-data swaps for
  sentiment (Reddit + RoBERTa), per-club form features in the match
  predictor, comparable-players list from a real player universe.
  None block the Vercel/Railway go-live — they replace impl, not API.

## CI / CD

| Workflow | Trigger | Status |
|---|---|---|
| `.github/workflows/deploy.yml` | push to `main` | Deploys `futology/` to GitHub Pages via `actions/deploy-pages@v4`. Latest run: green. |
| `.github/workflows/ml-service-ci.yml` | push to `main` touching `ml-service/**` | Installs Python 3.11 deps, runs `ruff check`, runs `pytest -v`. Fails the build on any red test. Added Session 22. |

Both workflows opt into Node 24 (via `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24`)
ahead of the Sept 2026 deprecation.

## Phase audit

### Phase 0 — Repo & Environment Setup
- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Dark-only design tokens
- [x] Inter font, dark `<html>`, skip-to-content link, focus rings
- [x] `.env.example` with every key from bible §7
- [x] Git initialised, public GitHub repo
- [x] Conventional Commits, per-file commit hygiene
- [x] Husky / lint-staged — **deferred** (project is solo; `next lint`
      + `tsc --noEmit` run in CI manually).
- [x] GitHub Actions: deploy + ml-service-ci

### Phase 1 — Auth, Onboarding, Shell
- [x] `/login` 3-state magic-link flow (form → sent → ready)
- [x] `/onboarding` 3-step wizard with progress bar + confetti
- [x] Zustand session store with localStorage + cookie shadow
- [x] `AuthGate` client-side route protection (compatible with
      static export)
- [x] Top + bottom navigation hidden on auth routes
- [x] Cmd+K SearchModal (debounced, keyboard-nav, recents)
- [x] NotificationBell popover (real store reads, mark-all-read)
- [x] PWA manifest + SVG icon
- [x] **Supabase auto-router** (`lib/auth/auto.ts`) — `signInAuto`
      dispatches to `supabase.auth.signInWithOtp` when env is set,
      otherwise demo Zustand. Added Session 22.

### Phase 2 — Live Data Layer & Core Pages
- [x] `lib/api/client.ts` consumed by hooks (`useLiveScores`,
      `useFixtures`, `useMatchDetail`, `useStandings`)
- [x] TanStack Query QueryClientProvider with bible Phase 7 defaults
- [x] StandingsTable, MatchDetailSheet (6 tabs), per-league pages,
      per-club pages (6 tabs), per-player pages, news feed
- [x] `lib/supabase/{client,server,types}.ts` browser + SSR Supabase
      clients with hand-typed bible §6 schema (Session 22)
- [x] `supabase/schema.sql` — bible §6 verbatim, ready to paste into
      Supabase SQL editor (Session 22)
- [x] `docs/SUPABASE_CUTOVER.md` — full project-creation + Vercel
      deploy walkthrough (Session 22)
- [ ] **Pending user action**: create Supabase project, paste schema,
      set env vars, push to Vercel. The codebase is plumbed; nothing
      to write.
- [ ] **Pending user action**: provision RapidAPI key for the
      production data path. The static-export demo uses `lib/data/*`
      directly; the Vercel target would re-introduce
      `app/api/football/*` route handlers calling RapidAPI.

### Phase 3 — Intelligence Hub & ML Pages

| Feature | Front-end | ML service | Auto-router |
|---|---|---|---|
| Match Predictor (§9.1) | ✅ | ✅ XGBoost + isotonic calibration + SHAP, 48.8% holdout on 10,707 matches | ✅ `predictMatchAuto` |
| Player Pulse (§9.2) | ✅ | ✅ KMeans+PCA on 360 synthetic samples, silhouette 0.386, 99.2% recovery | ✅ `predictPlayerClusterAuto` |
| Sentiment Storm (§9.3) | ✅ | ✅ Seeded synthetic timeline + 5-emotion classifier (Reddit+RoBERTa swap documented) | ✅ `analyzeSentimentAuto` |
| TacticBoard (§9.6) | ✅ demo data | ⏳ StatsBomb open-data pipeline | ⏳ |
| Transfer Oracle (§9.4) | ✅ | ✅ Quantile XGBoost triple, R² 0.791, SHAP in EUR | ✅ `predictTransferValueAuto` |
| Fantasy IQ (§9.5) | ✅ | ✅ PuLP integer LP, all bible constraints | ✅ `optimizeFantasyAuto` |

5 trained / algorithmic models, 4 KB-3.2 MB pickles committed to repo
so Railway boots straight from `docker build .` without a retrain step.

### Phase 4 — same coverage as §3 (numbering quirk in the bible)

### Phase 5 — Predictions, Profile, Notifications
- [x] Session store v2 with `predictions[] / predictionLeagues[] /
      pollVotes[] / notifications[]` mirroring bible §6 schema
- [x] ScoresPicker, PredictionForm, MyPredictions
- [x] **Predict** tab in MatchDetailSheet, pre-fills + locks on
      kickoff
- [x] Auto-settlement effect (3 / 1 / 0 points)
- [x] Prediction Leagues — create / join-by-code / leaderboard / leave
- [x] Community polls — 3 active, vote-once, animated bars
- [x] NotificationBell consumes real store; mark-all-read writes through
- [ ] Resend email digest — pending user action (Resend free tier
      account + `RESEND_API_KEY`). The send hook is the only piece
      not in code; the templates / triggers are designed in bible §3.

### Phase 6 — Bonus / Wishlist Features
- [x] Tournament Simulator — 10k Monte Carlo ELO, animated table
- [x] Match Momentum — rolling 5-min xG with swing detection
- [x] Press Intensity — PPDA + 12×8 heatmap
- [x] Referee Bias — 14 refs, big-game toggle, home-tilt index
- [x] Weather Impact — 5 buckets × 5 leagues with Δ-vs-baseline
- [x] Injury Intelligence — 0-4 injuries/team × 14 positions × 3 severities
- [x] Odds Movement Alerts — opening vs current across 5 bookmakers

### Phase 7 — Polish, Performance, Deploy
- [x] Top-level `ErrorBoundary` wrapped around `<main>`
- [x] `/profile/settings` with 5 notification toggles + danger zone
- [x] PWA service worker (`next-pwa`)
- [x] Playwright E2E — **40 tests, all green** across 10 specs
- [x] Lighthouse: **Perf 97 / A11y 96 / BP 96 / SEO 100** on the live
      GH Pages URL after Session 12's dynamic-import optimisation
      (TBT dropped 629 → 18 ms)
- [x] `scripts/check_env.ts` — pre-deploy validator that distinguishes
      demo vs real-services mode
- [x] GH Pages auto-deploy via `.github/workflows/deploy.yml`
- [x] v0.7.0 annotated tag cut at the Phase 7 milestone

## Test surface

| Suite | Count | Time | Status |
|---|---|---|---|
| Front-end `tsc --noEmit` | — | ~5 s | clean |
| Front-end `next lint` | — | ~3 s | clean |
| Front-end `next build` (static export) | 116 routes | ~80 s | clean, FLJS 87.5 kB |
| Playwright (Chromium) | 40 | ~30-50 s | 40 passed |
| `ml-service` ruff | — | ~1 s | clean |
| `ml-service` pytest | 32 | ~8 s | 32 passed |
| TS↔Python predictor parity | 9 cases | ~1 s | byte-identical |

## What needs user action to fully light up

These are the only remaining steps. None require writing code.

1. **Railway** — create a project, point at `ml-service/Dockerfile`,
   set `ML_SERVICE_TOKEN` + `ML_ALLOWED_ORIGINS`, cap usage at $5/mo.
   Walkthrough: `SESSION.md` Session 15 entry.
2. **GH Pages secrets** — add `NEXT_PUBLIC_ML_API_URL` and
   `NEXT_PUBLIC_ML_API_TOKEN` as GitHub Actions repo secrets, expose
   in `deploy.yml`'s `env:` block, push. The live demo immediately
   calls Railway for every Intelligence feature.
3. **Supabase + Vercel** — see `docs/SUPABASE_CUTOVER.md`. Project
   creation, schema paste, env vars, deploy. The auth router is
   already plumbed; first sign-in triggers a magic-link email.

## What's deferred (acknowledged, not blocking)

- Reddit + RoBERTa sentiment ingest. The endpoint is synthetic today;
  the documented swap touches only `app/predictors/sentiment.py
  ::_collect_reactions`, no API change.
- Per-club form features in the match predictor. The trained model
  currently feeds neutral midtable inputs; Supabase Phase 2 + an
  API-Football fetch in front of the call resolves this.
- Comparable-players list in the transfer endpoint. Returns empty
  from the service today; the front-end stitches in the local
  nearest-neighbour helper to keep the UI populated.
- FBref / Understat pulls for real per-90 player stats. Synthetic
  data + the bible-defined cluster ideals carry the demo cleanly;
  real data swaps in via `train_clusterer.py` + `train_transfer.py`
  without touching the inference path.

## Rolling back any of the above

Every cutover surface is feature-flagged off an env variable. Unsetting
the variable routes that surface back to the demo path with no code
change — see the `Auto`-router pattern in `futology/lib/ml/*.ts` and
`futology/lib/auth/auto.ts`. The GitHub Pages demo is intentionally
isolated from the production env: its workflow leaves Supabase + ML
service env empty so it stays open to the public regardless of what
happens to Vercel/Railway.
