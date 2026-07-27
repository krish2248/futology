# FUTOLOGY — SESSION LOG

> Living context file. Updated at end of every working session so future Claude (or future you) can pick up cold.
> Bible of truth: `PROJECT_Sick-Boy.md`. This file logs progress against it.

---

## 🎯 Project status — ACTIVE (legitimate contribution building)

**LIVE:** **https://krish2248.github.io/futology/** (GitHub Pages · auto-deploys from `main` via `.github/workflows/deploy.yml`)

The whole front-end is demoable end-to-end. Building legitimate contributions through real code improvements.

**Phase 0** ✅ shell complete
**Phase 1** ✅ demo-mode login + onboarding + Cmd+K. (Middleware was replaced by client-side `AuthGate` to support static export.) **Supabase cutover part 1 DONE (Session 28):** the live build is already Supabase-configured, and the auth loop is now closed — `SupabaseSessionBridge` mirrors the OTP session into the store so `AuthGate` recognizes real signed-in users. Follow-graph + predictions persistence are part 2.
**Phase 2** ✅ demo-mode data layer + StandingsTable + MatchDetailSheet (6 tabs) + per-league pages + per-club pages (6 tabs) + per-player pages + **news feed**. (API routes deleted; `lib/api/client.ts` calls demo data directly.) **Real-data wiring DONE (Sessions 24-26):** standings, top scorers, and fixtures/live-scores all route through `*Auto` modules that hit the HF ML-service football-data.org proxy when `NEXT_PUBLIC_ML_API_URL` is set + the league is on the free tier, and fall back to demo otherwise. **Dormant until Sonik sets the secrets** (4 HF Space + 2 GitHub repo — see Session 24).
**Phase 4** ✅ all 6 intelligence sub-pages
**Phase 5** ✅ full prediction game loop, leagues, polls, leaders, notifications
**Phase 6** ✅ all 7 wishlist features (Tournament Simulator, Match Momentum, Press Intensity, Referee Bias, Weather Impact, Injury Intelligence, Odds Movement Alerts)
**Phase 7** 🔄 IN PROGRESS — ErrorBoundary ✅, Settings ✅, dark-lock indicator ✅, **GitHub Pages deploy with auto-CI workflow** ✅, **next-pwa service worker** ✅ (configured, needs testing), **Playwright E2E smoke tests** ✅ (setup complete). Outstanding: Lighthouse audit ≥ 90, Vercel + Supabase cutover.

When the user comes back to this project, start by reading `SESSION.md` and visiting the live URL. The block just below is the cold-start playbook; full detail is in the Session 28 entry.

### Session 29 — 2026-07-28 (Supabase cutover, part 2 — follow-graph sync + predictions persistence)

**Goal:** Pick up from Session 28's next-session plan: build the follow-graph sync
and predictions persistence. Keep Zustand as the reactive source of truth, mirror
the `signInAuto` / dynamic-`import()` discipline so `@supabase/ssr` stays out of
the shared chunk, and leave consumer components untouched.

**Built:**

*Follow-graph sync*
- `futology/lib/supabase/followSync.ts` — new module with two responsibilities:
  - `rehydrateFollows(userId)` — reads all four `user_followed_*` tables from
    Supabase and hydrates the Zustand store in one atomic pass via four new
    `setFollowed*` actions on the store. Gated on `isSupabaseConfigured()` and
    a `!userId.startsWith("demo_")` check.
  - `syncFollowLeague` / `syncFollowClub` / `syncFollowPlayer` / `syncFollowTournament` —
    write-through functions called from the store's `toggle*` actions. Upsert on
    follow, delete on unfollow. Each gated on Supabase being configured.
- The `SupabaseSessionBridge` now calls `rehydrateFollows(user.id)` after every
  auth state change (initial session + `onAuthStateChange`).
- The four store `toggle*` actions were refactored from pure `set()` calls to
  compute the new state first, set it synchronously (Zustand is the reactive
  source of truth), then fire a dynamic `import()` to the sync module for the
  Supabase write-through — exactly the same dynamic-import discipline the bridge
  uses, keeping `@supabase/ssr` out of the shared chunk.
- Consumer components unchanged: `app/clubs/**`, `app/players/**`,
  `app/onboarding/page.tsx`, `app/profile/**`, `app/HomeNews.tsx`,
  `app/news/NewsView.tsx` — all still read from `useSession` and call
  `toggle*` as before.

*Predictions persistence*
- `futology/lib/supabase/predictionsSync.ts` — new module with:
  - `rehydratePredictions(userId)` — fetches predictions from Supabase and
    calls `store.setPredictions()`.
  - `syncUpsertPrediction` — upserts to the `predictions` table on the
    `user_id,fixture_id` conflict target.
  - `syncDeletePrediction` — deletes by id + user_id.
  - `syncSettlePrediction` — updates actual scores, points, and `is_settled`.
- Store's `upsertPrediction`, `deletePrediction`, and `settlePrediction` actions
  all updated with fire-and-forget dynamic imports to the sync module.
- `SupabaseSessionBridge` now also calls `rehydratePredictions` alongside
  `rehydrateFollows` on auth state changes.
- Four new store actions: `setFollowedLeagues`, `setFollowedClubs`,
  `setFollowedPlayers`, `setFollowedTournaments`, `setPredictions` — all
  set-only, used exclusively for hydration.

**Verified:** `tsc --noEmit` ✓ · `next lint` ✓ · `next build` ✓ (116 routes,
shared JS 87.5 kB — the new code is only reachable via dynamic imports so the
shared chunk is unchanged from Session 28) · Playwright **40/40** (demo-mode
behaviour unchanged — all sync functions gate on `isSupabaseConfigured()`, which
is false in the local build).

**Still pending (Sonik actions, no code):**
1. Add `https://krish2248.github.io/futology/onboarding` to Supabase redirect allowlist.
2. Set 4 HF Space secrets + 2 GitHub repo secrets for ML/football-data.

---

## ▶ START HERE TOMORROW (cold-start playbook, as of Session 29 · 2026-07-28)

**Where we are:** Supabase cutover **part 1 + part 2 are done + pushed** — the OTP
auth loop is closed (`SupabaseSessionBridge` mirrors the Supabase session), the
follow-graph sync rehydrates `user_followed_*` tables on login with write-through
on every `toggle*`, and predictions are persisted to the `predictions` table
(upsert on save, delete, settle). All green: `tsc` · `lint` · `build` (shared JS
87.5 kB) · Playwright 40/40. `main` == `origin/main`, working tree clean.

**Two Sonik actions are still pending (one-time, no code):**
1. **Supabase redirect allowlist** — add `https://krish2248.github.io/futology/onboarding`
   to Supabase → Authentication → URL Configuration → Redirect URLs. Until then the
   live magic-link sign-in is rejected on redirect. *(This is the only thing blocking
   Supabase auth from working live now.)*
2. **ML/football-data secrets** (unchanged since Session 23) — 4 HF Space secrets +
   2 GitHub repo secrets (see Session 24). Re-probe `https://krishsoni1-futology.hf.space/health`;
   if it still says `mode:"stub"`, they're still unset and standings/scorers/fixtures
   keep serving demo data.

**What's left (future sessions):**
1. If the ML/football-data secrets have landed by then, run the live smoke-test
   (Session 27 item #1).
2. Vercel + Supabase cutover completion (SSR target, cookie-based middleware).
3. Real-data swaps for sentiment (Reddit+RoBERTa) and transfer (FBref).

---

## 📅 Session History

### Session 28 — 2026-07-24 (Supabase cutover, part 1 — close the auth loop)

**Goal:** Sonik chose "start the Supabase cutover" (the ML/football-data
smoke-test is still blocked — HF Space `/health` re-probed this session, still
`mode:"stub"`, so the 4 HF + 2 GitHub secrets remain unset). Picked the correct
foundational first increment.

**The gap found:** the live GH Pages build **is already Supabase-configured** —
`deploy.yml` inlines `NEXT_PUBLIC_SUPABASE_URL` + `_ANON_KEY` (Session 23), so
`isSupabaseConfigured()` is `true` live and `/login` already runs real email-OTP.
But the loop was never closed: `AuthGate` gates on `useSession(s => s.user)`, and
in OTP mode nothing populated that store slice after the magic-link redirect — so
a real signed-in user would bounce straight back to `/login`. Supabase auth was
effectively non-functional on the live site.

**Built:**
- `futology/lib/store/session.ts` — new `setAuthUser(user)` action: adopts an
  externally-authenticated user (real `auth.users` UUID as `id`, not a synthetic
  `demo_` id) + sets the session cookie. Deliberately leaves follow lists intact
  (they'll be rehydrated from Supabase in part 2; clobbering here would wipe a
  returning user's local state before that fetch lands).
- `futology/components/providers/SupabaseSessionBridge.tsx` — new client
  component. Env-gated (pure `process.env` read, no Supabase import), then
  **dynamically** `import()`s the browser client so `@supabase/ssr` stays out of
  the shared layout chunk. Reads `getSession()` on mount (the client's
  `detectSessionInUrl` exchanges the magic-link code first) and subscribes to
  `onAuthStateChange`, mirroring the user into the store via `setAuthUser`; clears
  only on explicit `SIGNED_OUT`. Renders nothing.
- `futology/components/providers/Providers.tsx` — mounts `<SupabaseSessionBridge />`
  above `AuthGate` so the store is populated before the gate reads it.
- `futology/lib/auth/auto.ts` — magic-link `emailRedirectTo` now includes
  `NEXT_PUBLIC_BASE_PATH` (`/futology` on GH Pages) — it previously pointed at
  `origin/onboarding`, a host-root 404 on the live site.
- `futology/app/login/page.tsx` — badge + intro copy are now honest when
  Supabase is configured ("Email sign-in" / magic-link copy) vs. the local demo
  build ("Demo mode"). Gated on a build-time `SUPABASE_LIVE` const.

**Verified:** `tsc --noEmit` ✓ · `next lint` ✓ (no warnings) · `next build` ✓
(shared First Load JS **87.4 kB** — bridge added nothing to the shared chunk,
proving the dynamic import worked) · Playwright **40/40** (local build has no
Supabase env → bridge no-ops → demo behaviour unchanged).

**Sonik's action to light this up (Supabase dashboard, one-time):** add the
magic-link redirect URL `https://krish2248.github.io/futology/onboarding` to
Authentication → URL Configuration → Redirect URLs. Without it Supabase rejects
the OTP redirect. (The schema + project already exist from Session 23.)

**Next session (Session 29) starts here — Supabase cutover part 2:**
1. **Follow-graph sync.** Rehydrate `user_followed_{leagues,clubs,players,
   tournaments}` from Supabase into the session store on login, and write-through
   each `toggle*` (upsert on follow, delete on unfollow) when configured — mirror
   the `signInAuto` fallback pattern; keep Zustand as the reactive source of truth
   for the UI so the ~6 consumer components don't change. Same dynamic-import
   discipline to protect the shared chunk.
2. Then predictions persistence (`predictions` table) — noting the S26 caveat that
   auto-settlement matches on demo IDs.
3. If the ML/football-data secrets have landed by then, run the still-pending live
   smoke-test (Session 27 item #1).

---

### Session 27 — 2026-07-07 (reverse cross-walk → real per-team fixtures on the club page)

**Goal:** The Session 27 plan had three items. Item #1 (smoke-test real data)
is still blocked — probed the live HF Space, `/health` still returns
`mode:"stub"`, so Sonik's 4 HF + 2 GitHub secrets remain unset and the live
site keeps serving demo data. Did the well-scoped code item (#2): the reverse
team-ID cross-walk so the club page's per-team fixtures can move to real data.

**Built:**
- `futology/lib/data/teamCrosswalk.ts` — `footballDataIdFor(afId)`: reverse of
  the existing `FD_TO_AF` table (API-Football club ID → football-data team ID),
  built once. Returns `undefined` for unmapped clubs so callers fall back to
  demo rather than hitting the proxy with an ID it can't resolve.
- `futology/lib/api/fixturesAuto.ts` — `getFixturesAuto` no longer sends
  team-filtered lookups straight to demo. When `NEXT_PUBLIC_ML_API_URL` is set
  and the club is in the cross-walk, per-team lookups now hit
  `GET /proxy/teams/{fdId}/matches?limit=40`. Extracted a shared
  `fetchProxyMatches(baseUrl, path, params)` helper that both the all-fixtures
  (`/proxy/matches`) and per-team paths reuse — same reshape (`toDemoMatch`),
  same league+status filter, same graceful demo fallback on any error. Real
  per-team fixtures stay `detailAvailable: false` (unchanged from S26).

**Verified:** `tsc --noEmit` ✓ · `next lint` ✓ (no warnings) · `next build` ✓
(116 routes) · Playwright **40/40** (demo-mode behaviour unchanged — the proxy
branch is dormant until the secrets land).

**Still Sonik's action (unchanged since Session 23):** 4 HF Space secrets +
2 GitHub repo secrets (see Session 24). Until set, standings, scorers, and all
fixtures (league + per-team) serve demo data on the live site.

**Only remaining optional polish (item #3):** a minimal real MatchDetail
(overview-only) so real fixtures can regain a basic drill-down. Deferred
pending a UX call — football-data's free tier carries no lineups/stats/events,
so a real fixture's detail sheet would have only the Overview tab populated
and 4 empty tabs, which sits awkwardly with the minimal-UI direction. Needs a
new ml-service `/proxy/matches/{id}` endpoint + reshape + a hook branch + a
decision on how to present the overview-only sheet.

**Next session (Session 28) starts here:**
1. If the secrets have landed, smoke-test the live site (`/scores`, `/` live
   strip, `/leagues/39`, a club page's fixtures now via `/proxy/teams/{id}/matches`).
2. Otherwise, either build item #3 once the overview-only UX is decided, or
   pick up the Supabase cutover (deferred since Session 22).

---

### Session 26 — 2026-06-21 (fixtures real-data wiring + team-ID cross-walk)

**Goal:** The deferred item from Sessions 24-25 — wire fixtures to the
football-data.org proxy. The blocker was the API-Football ↔ football-data
team-ID mismatch; this session builds the cross-walk and wires fixtures
behind it. (Secrets still unset, so the live site keeps serving demo data.)

**Built:**
- `futology/lib/data/teamCrosswalk.ts` — `resolveClub(fdId, name)`: football-
  data team ID → seeded `ClubSeed`, with a normalized-name fallback. Explicit
  ID map for all ~43 seeded clubs across the 7 mapped leagues.
- `futology/lib/data/footballDataCodes.ts` — added `leagueIdFromCode()` (reverse
  of the code map) + `ALL_FOOTBALL_DATA_CODES` for a batched fixtures call.
- `futology/lib/data/demoMatches.ts` — `DemoMatch` gains an optional
  `detailAvailable` flag.
- `futology/lib/api/fixturesAuto.ts` — `getFixturesAuto(params)`: hits
  `GET /proxy/matches` (all free-tier competitions, −2…+7 day window) when
  `NEXT_PUBLIC_ML_API_URL` is set, reshapes to `DemoMatch[]` (status mapping
  IN_PLAY/PAUSED→live, FINISHED→finished, else scheduled; teams via the
  cross-walk), tags them `detailAvailable: false`. Team-filtered lookups (the
  club page) stay on demo — no reverse cross-walk yet. Any proxy error falls
  back to demo.
- `futology/hooks/useLiveScores.ts` — `useFixtures` and `useLiveScores` now
  route through `getFixturesAuto`.
- `futology/components/cards/MatchCard.tsx` + `app/scores/ScoresView.tsx` —
  the detail sheet is gated on `detailAvailable`: real fixtures render as
  static cards (no drill-down), since football-data's free tier doesn't carry
  the stats/lineups/events the 5-tab MatchDetailSheet needs. Demo matches stay
  fully clickable.

**Verified:** `tsc` ✓ · `next lint` ✓ · `next build` ✓ (116 routes) ·
Playwright **40/40** (demo-mode behaviour unchanged).

**Known degradation when real data is on (acknowledged):** the predictions
auto-settlement loop matches on demo match IDs, so it won't settle against
real fixtures. Predictions remain a demo-only feature until the Supabase
cutover, so this is acceptable for now.

**Still Sonik's action (unchanged):** 4 HF Space secrets + 2 GitHub repo
secrets (see Session 24). Until set, standings, scorers, and fixtures all
serve demo data on the live site.

**Next session (Session 27) starts here:**
1. Once the secrets land, smoke-test the live site: `/scores` (real fixtures,
   no drill-down), `/` live strip, `/leagues/39` (real standings + scorers).
2. Optional polish: reverse cross-walk so the club page's per-team fixtures
   can use real data via `/proxy/teams/{id}/matches`.
3. Consider a minimal real MatchDetail (overview only) so real fixtures can
   regain a basic drill-down.

---

### Session 25 — 2026-06-21 (top-scorers real-data wiring + league page tabs)

**Goal:** Continue the Session 24 plan. Standings verification (item #1) is
still blocked — the HF Space secrets remain unset (`/health` → `mode:"stub"`,
`/proxy/scorers?league=PL` → 503), so this session did the code task that
doesn't depend on them: scorers, end-to-end.

**Built (scorers, mirroring the standings Auto-router pattern):**
- `futology/lib/data/demoScorers.ts` — `getDemoScorers(leagueId)`: a
  deterministic 12-deep top-scorers chart. Real attacking stars from
  `players.ts` who play in the league go to the top; the rest are synthetic
  entries spread across the league's clubs. Seeded by `leagueId`. Shape
  (`ScorerRow`) matches the ML-service `/proxy/scorers` reshape.
- `futology/lib/api/scorersAuto.ts` — `getScorersAuto(leagueId)`: hits
  `GET /proxy/scorers?league=<CODE>` when `NEXT_PUBLIC_ML_API_URL` is set and
  the league is on the free tier, reshapes into `ScorerRow[]`, falls back to
  demo on any proxy error.
- `futology/hooks/useLiveScores.ts` — added `useScorers(leagueId)`.
- `futology/components/cards/ScorersTable.tsx` — top-scorers chart, same look
  as `StandingsTable` (goals headline; assists/pens/apps behind breakpoints).
- `futology/app/leagues/[leagueId]/LeagueDetailView.tsx` — added a
  **Standings / Top Scorers** tab toggle; each panel has its own loading /
  error / empty states.

**Verified:** `tsc --noEmit` ✓ · `next lint` ✓ · `next build` ✓ (116 routes).

**Committed:** 5 per-file commits + this log entry, pushed to `origin/main`.

**Still Sonik's action (unchanged from Session 24):** 4 HF Space secrets +
2 GitHub repo secrets (see Session 24 entry). Until they're set, both
standings and scorers serve demo data on the live site.

**Next session (Session 26) starts here:**
1. Once the secrets land, open `/leagues/39` and confirm both tabs show real
   PL data (standings + golden-boot chart).
2. Tackle the API-Football ↔ football-data **team-ID cross-walk** so fixtures
   can move to real data without breaking the SSG club/player pages.

---

### Session 24 — 2026-06-21 (HF Space deploy fix — live — + standings real-data wiring)

**Goal:** Resume from the Session 23 checkpoint. The plan assumed the only
remaining work was Sonik's secret-setting, but the HF Space was actually
**stuck in an error state** — so the first job was diagnosing and fixing the
deploy, then doing the Session 24 code task (front-end → proxy wiring).

**Fixed the HF Space (it's now LIVE):**
- Root cause: the Space's `app_port` is **7860**, but the committed Dockerfile
  made uvicorn `EXPOSE`/serve on **8080**. HF routed traffic to 7860, nothing
  answered, the health check failed → Space errored.
- Committed the port fix (ENV PORT / EXPOSE / CMD → 7860) to the `hf` git
  remote (commit `b2dc739`) and pushed. The Space rebuilt healthy.
- `GET https://krishsoni1-futology.hf.space/health` → `200 {"status":"ok",
  "version":"0.1.0","mode":"stub"}`.

**Confirmed the Space is running on defaults — all secrets still unset:**
- `mode:"stub"` → `ML_MODE` not set
- `/proxy/standings?league=PL` → **503** "FOOTBALL_DATA_KEY not configured"
- `/predict-match` → **200 with no auth** → `ML_SERVICE_TOKEN` not set
- (`ML_ALLOWED_ORIGINS` can't be probed via curl)

**Front-end standings wiring (Session 24 plan item #2):**
- `futology/lib/data/footballDataCodes.ts` — maps API-Football league IDs to
  football-data.org competition codes for the free-tier leagues (PL, PD, SA,
  BL1, FL1, CL, DED, PPL, BSA). Leagues not in the map have no real-data
  source and fall back to demo.
- `futology/lib/api/standingsAuto.ts` — `getStandingsAuto(leagueId)`: hits
  `GET /proxy/standings?league=<CODE>` when `NEXT_PUBLIC_ML_API_URL` is set
  *and* the league is covered, reshapes the proxy rows into the existing
  `StandingRow` shape (parses the comma-separated `form` string; sets
  `prevPosition = position` since football-data carries no movement). On any
  proxy error (e.g. 503 with no key) it **falls back to demo** so the live
  GitHub Pages build never breaks. Mirrors the `predictMatchAuto` pattern.
- `futology/hooks/useLiveScores.ts` — `useStandings` now routes through
  `getStandingsAuto`. `StandingsTable` renders team names as text (no
  club-page links), so football-data's different team-ID space is safe here.

**Verified:** `tsc --noEmit` ✓ · `next lint` ✓ (no warnings/errors) ·
`next build` ✓ (full static export, all routes prerendered).

**Deferred (acknowledged):**
- **Scorers** — proxy endpoint exists, but there's no demo scorers data or UI
  to attach it to yet. Needs a `/leagues/[id]` scorers tab + demo fallback.
- **Fixtures** — blocked on API-Football ↔ football-data **team-ID
  reconciliation**: the SSG club/player pages key off API-Football IDs, so
  swapping in football-data fixtures would break club-page navigation. Needs
  an ID cross-walk before wiring.

**Still Sonik's action (one-time, HF UI + GitHub):**
1. Set the 4 HF Space secrets: `ML_SERVICE_TOKEN`, `ML_ALLOWED_ORIGINS`,
   `ML_MODE=trained`, `FOOTBALL_DATA_KEY`.
2. Set the 2 GitHub repo secrets: `NEXT_PUBLIC_ML_API_URL` =
   `https://krishsoni1-futology.hf.space`, `NEXT_PUBLIC_ML_API_TOKEN` = the
   same value as `ML_SERVICE_TOKEN`.
3. Once `NEXT_PUBLIC_ML_API_URL` is live, push any commit → GH Pages rebuilds
   and `/leagues/[id]` shows real standings for the free-tier leagues.

**Next session (Session 25) starts here:**
1. Verify standings show real data after the secrets land (open
   `/leagues/39`).
2. Build the scorers tab + demo fallback, then wire `getScorersAuto`.
3. Tackle the team-ID cross-walk so fixtures can move to real data.

---

### Session 23 — 2026-05-24 (real-data proxy + HF Space deploy config + Supabase keys wired)

**Goal:** Sonik created Supabase project `zlivysbodcgmalycetfr` and applied the schema. They sent the publishable key + project URL + HF username (`krishsoni1`) and rotated the secret keys. This session wires those into the codebase + builds the football-data.org proxy on the ML service + writes the HF Spaces deploy walkthrough so the next step is purely Sonik-side (~10 min of clicks).

**Built (5 atomic commits):**

*football-data.org proxy on the ML service*
- `ml-service/app/proxy.py` — new FastAPI router with six endpoints: `/proxy/{competitions,standings,matches,teams/{id},teams/{id}/matches,scorers}`. All cached in-memory with TTLs tuned per endpoint (60s for live data, 5 min for standings/scorers, 1 hr for competitions/squads). Token never leaves the container — read from `FOOTBALL_DATA_KEY` env var on every call.
- `pyproject.toml` — promoted `httpx` from dev to runtime so the proxy can actually make HTTP calls in production.
- Each endpoint reshapes football-data.org's verbose payload into the lean shape the FUTOLOGY UI consumes. The reshape lives in one module so swapping providers (Sportradar / StatsBomb / API-Football) later is one module change, not a UI rewrite.
- Auth-wise the proxy routes are intentionally unauthenticated (they're public data, just keeping the API token server-side) — the CORS allow-list is the gate.

*Tests for the proxy*
- `tests/test_proxy.py` — 7 tests, all green. Stubs `httpx.AsyncClient` so CI never hammers football-data.org. Verifies the reshape on standings / matches / teams / scorers, the 503 when `FOOTBALL_DATA_KEY` unset, the 429 passthrough on upstream rate limit, and the cache hit on the second identical request (counter shows only 1 upstream call across 2 GETs).
- `_clean_env` fixture pops every test-env var set by sibling tests so the proxy fixtures get a clean stub-mode lifespan regardless of run order.

*HF Spaces deploy scaffolding*
- `ml-service/README_HF.md` — Hugging Face Spaces metadata block (title / emoji / sdk / app_port) + endpoint table + required-secrets list. Copied as `README.md` on the Space side.
- `docs/HUGGINGFACE_DEPLOY.md` — full step-by-step: create the Space, push the directory via either git or drag-and-drop, set the four Space secrets (`ML_SERVICE_TOKEN`, `ML_ALLOWED_ORIGINS`, `ML_MODE=trained`, `FOOTBALL_DATA_KEY`), wait ~5 min for the Docker build, smoke-test with three curls. Includes cost guardrails section confirming the free tier covers everything we need.

*Supabase keys + ML secrets in the deploy workflow*
- `.github/workflows/deploy.yml` — `Build static export` step now exports `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time. These are the publishable values (intentionally browser-safe), so they're hardcoded inline rather than going through a repo secret — one less click for the user.
- Also wired `NEXT_PUBLIC_ML_API_URL` and `NEXT_PUBLIC_ML_API_TOKEN` via `${{ secrets.* }}`. These come from repo secrets (Sonik adds them after the HF Space is live). When empty, the front-end's auto-routers fall back to the in-bundle stubs — so the live deploy keeps working before the HF Space exists.
- `futology/.env.example` — updated with the real Supabase URL / publishable key as the documented defaults.

**Verified — full local sweep:**
- Front-end `tsc --noEmit` ✓ clean
- Front-end `next lint` ✓ no warnings or errors
- ml-service `ruff check` ✓ All checks passed
- ml-service `pytest` ✓ **39/39** in 5.43s (32 existing + 7 new proxy tests)

**What Sonik does next (one-time, ~10 min):**

1. **Deploy the ML service to Hugging Face Spaces** — follow `docs/HUGGINGFACE_DEPLOY.md`. Create the Space, push `ml-service/`, set the four Space secrets (including the freshly-rotated `FOOTBALL_DATA_KEY`). Wait for the Docker build.
2. **Smoke-test** — three curls listed in the doc. Confirms `/health`, `/proxy/standings?league=PL`, `/predict-match` all return 200.
3. **Add two GitHub Actions repo secrets** — `NEXT_PUBLIC_ML_API_URL` (the HF Space URL) and `NEXT_PUBLIC_ML_API_TOKEN` (the same value Sonik puts in the Space's `ML_SERVICE_TOKEN`). Push any commit to trigger a fresh GH Pages deploy and the front-end starts calling Railway-style — except it's Hugging Face, and free.

**Project completion status (refreshed):**
- ✅ All ML endpoints (5 trained models + 2 algorithmic) built, tested, wired
- ✅ All front-end auto-routers (match / cluster / transfer / sentiment / fantasy) call the service when configured
- ✅ football-data.org proxy on the ML service, ready for real fixtures / standings / squads / scorers
- ✅ Supabase database schema applied; auth router plumbed for OTP magic-link
- ✅ CI/CD: front-end GH Pages deploy, ML-service pytest+ruff workflow, both green
- ⏳ One Sonik action remaining: deploy the HF Space + add two repo secrets. Everything else lights up automatically after.

**Paused at end of Session 23 (2026-05-24):**

HF Space Docker build completed, Space was in "Starting" state. Sonik ran out of time before setting the 4 HF secrets + 2 GitHub repo secrets. All code is pushed. The user returns tomorrow to finish.

**Next session (Session 24) starts here:**
1. Sonik finishes Steps C + D + E above (4 HF secrets, 2 GH secrets, smoke-test).
2. We update the front-end's `lib/api/client.ts` and hooks to consume the new proxy routes (real standings, real fixtures, real top scorers) — currently the demo data layer feeds the UI; after the swap it's real live football.
3. Add a `useStandings` / `useScorers` / `useFixtures` real-data branch that flips on when `NEXT_PUBLIC_ML_API_URL` is set, mirroring the predictor auto-router pattern.

---

### Session 22 — 2026-05-24 (Phase 2 Supabase prep + ml-service CI + readiness audit)

**Goal:** Sonik asked for the entire project complete, CI/CD wired, no errors, every feature checked. Session 22 delivers the Phase 2 cutover scaffolding (so the Vercel target is one click-through away), the ml-service GitHub Actions workflow (so the back-end has CI parity with the front-end), and `PROJECT_STATUS.md` — an honest, phase-by-phase audit of what's complete vs what needs a user account.

**Built (12 atomic commits across two themes):**

*Theme A — Supabase + Vercel cutover prep*
- `npm install @supabase/supabase-js @supabase/ssr` — added to `futology/package.json`.
- `futology/lib/supabase/types.ts` — hand-typed `Database` interface mirroring bible §6 column-for-column. Documented `supabase gen types` regen step.
- `futology/lib/supabase/client.ts` — `getSupabaseBrowserClient()` + `isSupabaseConfigured()`. Returns `null` when env unset so callers can branch safely.
- `futology/lib/supabase/server.ts` — `createServerClient` for the Vercel SSR target. Dead code in static export by design; the GH Pages workflow never imports it.
- `futology/lib/auth/auto.ts` — `signInAuto(email)` / `signOutAuto()`. Routes to Supabase OTP when configured, falls back to the existing Zustand demo signIn. Same return-shape contract on both branches.
- `futology/app/login/page.tsx` — switched the form submit to `signInAuto`. Conditional UI: in Supabase OTP mode the "Continue in demo mode" CTA is hidden and the copy points the user at their inbox. Added an inline error banner for failed sends.
- `supabase/schema.sql` — bible §6 verbatim (tables + RLS + triggers + realtime publications), ready to paste into Supabase SQL editor.
- `docs/SUPABASE_CUTOVER.md` — full walkthrough: Supabase project creation, schema apply, email-OTP setup, type regen, Vercel deploy with env vars, verification steps, rollback. Covers free-tier guardrails for both Supabase and Vercel.

*Theme B — CI / readiness audit*
- `.github/workflows/ml-service-ci.yml` — GitHub Actions workflow: sets up Python 3.11, installs `[dev,runtime-model]` extras, runs `ruff check`, runs `pytest -v`. Triggered on push/PR touching `ml-service/**`. Opts into Node 24 for the JavaScript actions.
- Ruff cleanup of `ml-service/` — autofixed 15 issues, manually resolved the remaining 29 (unnecessary `int(round(…))` casts, ambiguous unicode `×`, multiple-statements-per-line, long lines, unused locals). `ruff check .` now reports `All checks passed!`.
- `docs/PROJECT_STATUS.md` — comprehensive per-phase readiness report:
  - Test surface table (typecheck, lint, build, Playwright, ruff, pytest, parity — all green)
  - Phase-by-phase checklist with explicit user-action callouts (Railway, Supabase + Vercel)
  - "Deferred (acknowledged, not blocking)" section so no part of the spec is silently missing
  - Rollback section explaining every cutover is env-flag-gated

**Verified — full audit pass:**
- Front-end `tsc --noEmit` ✓ clean
- Front-end `next lint` ✓ no warnings or errors
- Front-end `next build` (static export) ✓ **116 routes**, shared FLJS **87.5 kB** (Supabase deps add zero to the demo bundle since they're only reachable via the auto-router branch)
- Playwright Chromium ✓ **40/40** in ~50 s
- `ml-service` ruff ✓ All checks passed
- `ml-service` pytest ✓ **32/32** in 8.09 s
- TS↔Python predictor parity ✓ byte-identical across 9 fixture cases

**Project completion status:**
- ✅ All front-end Phase 0-7 features built and tested
- ✅ All Phase 3 ML models trained and committed (3.2 MB match predictor + 4 KB clusterer + 2.4 MB transfer regressor; synthetic sentiment + PuLP fantasy are computed at request time, no pickle)
- ✅ Front-end auto-routers ready for every endpoint
- ✅ Supabase cutover plumbed end-to-end (auth, schema, docs)
- ✅ CI/CD for both surfaces (frontend GH Pages deploy + ml-service pytest)
- ⏳ Three one-time user actions remain (Railway deploy, GH Actions secrets for ML API URL, Supabase + Vercel target) — none require code

**Phase 3 v0.7+ roadmap (post-cutover):**
- Reddit + RoBERTa sentiment swap (replaces `_collect_reactions`, no API change).
- FBref / Understat pulls for per-90 player stats (replaces synthetic in `train_clusterer.py` + `train_transfer.py`).
- Per-club form features in match predictor via API-Football fetch in front of `/predict-match`.

**Next session starts here:**
1. Sonik finishes Railway + Vercel deploys (walkthroughs are in `SESSION.md` Session 15 and `docs/SUPABASE_CUTOVER.md`).
2. Wire `NEXT_PUBLIC_ML_API_URL` / `NEXT_PUBLIC_ML_API_TOKEN` into `.github/workflows/deploy.yml` as repo secrets, re-deploy GH Pages.
3. Once both are live, write the v0.8.0 changelog entry — "All ML endpoints live, real auth, RLS persistence" — and tag the release.

---

### Session 21 — 2026-05-24 (front-end wiring — every ML endpoint Railway-ready)

**Goal:** Replicate the `predictMatchAuto` pattern across the four other ML endpoints so the front-end is one env-var away from calling Railway for every Intelligence feature. Session 20 finished the back-end; this session finishes the cutover plumbing.

**Built (7 atomic commits):**

*Four `Auto`-router client modules — all under `futology/lib/ml/`*
- `cluster.ts` — `predictPlayerClusterAuto(player)` POSTs to `/predict-player-cluster` when `NEXT_PUBLIC_ML_API_URL` is set, otherwise wraps the seeded `PlayerStatLine.cluster` from the demo data and rescales the seeded `(creativity, defensiveActivity)` axes into the same PCA range the FastAPI service emits. Same `ClusterId` set on both sides.
- `transferClient.ts` — `predictTransferValueAuto(player)` calls `/predict-transfer-value` or falls back to the local `predictTransferValue` stub. Maps the front-end's `PlayerStatLine` to the FastAPI service's request schema (`xGPer90`, `xAPer90`, `leagueLevel` derived heuristically from the team name) and reshapes the remote response back into `TransferValuation` — comparable-players list is sourced from the local nearest-neighbour helper since the remote service doesn't ship that yet.
- `sentimentClient.ts` — `analyzeSentimentAuto(match)` calls `/sentiment-analyze` or falls back to `getDemoSentiment(match)`. Reshapes the remote response into the existing `SentimentSnapshot` so consumers (timeline, gauges, live-feed) don't change.
- `fantasyClient.ts` — `optimizeFantasyAuto(pool, constraints)` ships the candidate pool + constraints to `/fantasy-optimize` or falls back to the greedy `optimizeFantasy`. Returns the same `OptimizedSquad | null` shape so the UI doesn't change. Joins on player `id` to hydrate ownership / form / injury fields the back-end doesn't carry.

*Three views switched from `useMemo(syncStub, …)` to `useEffect(asyncRouter, …)`*
- `TransferOracleView` — `useEffect` runs `predictTransferValueAuto`; cancellation token prevents stale set-state when the user switches players mid-fetch.
- `SentimentStormView` — same pattern for `analyzeSentimentAuto`.
- `FantasyIQView` — same pattern for `optimizeFantasyAuto`; budget / formation / risk changes refetch.
- `PlayerPulseView` — left alone. Its cluster scatter renders from pre-seeded data; the `predictPlayerClusterAuto` client is in place for the post-Phase-2 swap when players carry custom uploaded stats.

**Verified:**
- `npx tsc --noEmit` ✓ clean.
- `npx playwright test` ✓ **40/40** in 47.9s — no regressions from the sync→async refactor.

**Phase 3 Progress:**
- ✅ **Front-end Railway-ready** — every Intelligence feature reaches the FastAPI service when `NEXT_PUBLIC_ML_API_URL` is set, falls back cleanly otherwise.
- ✅ All four `Auto` routers follow the same code shape: read URL, branch to fallback or fetch, reshape on the way back.
- ⏳ Railway deploy still on Sonik. Once the URL exists, set it as a GitHub Actions repo secret and expose via `env:` in `.github/workflows/deploy.yml`.
- ⏳ Real-data swaps for sentiment (Reddit+RoBERTa) and transfer (FBref) remain — both leave the API contract intact.

**Completion estimate refresh:**

| Cut | Sessions left | Why |
|---|---|---|
| **A — demo-complete + ML live on Railway** | **~0.5 session** | Just the Railway click-through + GH Actions secrets wiring (mostly user action) |
| **B — full bible-spec, real services everywhere** | **~3-5 sessions** | Phase 2 cutover (Supabase + RapidAPI proxies, 3) + email digest + real-data swaps (1-2) |

**~95% of the bible done.** Front-end + back-end + wiring are all complete in synthetic mode; everything that's left is plumbing to real external services.

**Next session starts here:**
1. **Railway deploy** (still your action) — `mkdir`-free since everything's committed.
2. Once Railway gives you a URL, drop these into the repo:
   - GitHub Actions secrets: `NEXT_PUBLIC_ML_API_URL`, `NEXT_PUBLIC_ML_API_TOKEN`.
   - `.github/workflows/deploy.yml` exposes them under `env:` in the build step.
   - Push, watch the deploy, confirm the live `/intelligence/transfer`, `/intelligence/sentiment`, `/intelligence/fantasy`, `/intelligence/match` all call Railway.
3. Phase 2 Supabase cutover scoping — start with auth (`signIn` → `supabase.auth.signInWithOtp`) on a separate Vercel target so the GH Pages demo stays open.

---

### Session 20 — 2026-05-24 (Phase 3 v0.6 — sentiment §9.3 + fantasy §9.5, full)

**Goal:** Finish Phase 3's ML surface — both v0.6a (sentiment per bible §9.3) and v0.6b (PuLP fantasy optimizer per bible §9.5), neither cut short. Sonik asked for no shortcuts.

**Built (6 atomic commits):**

*Deps + schemas*
- `pyproject.toml` — `pulp>=2.9,<4` added to both `[train]` and `[runtime-model]`. PuLP 3.3.1 installs cleanly on the existing venv.
- `app/schemas.py` — six new models:
  - `SentimentRequest` — fixture_id (used as RNG seed), home/away teams, minute, scores, optional league + n_reactions.
  - `SentimentPoint` — minute + per-side sentiment in [-1, 1].
  - `SentimentReaction` — id + minute + side + emotion + text + source.
  - `SentimentResponse` — `homeMood`, `awayMood`, `excitement`, `totalPosts`, `peakMinute`, `biggestSwing{Minute,Magnitude,Team}`, full timeline, reactions, `sourceMode`.
  - `FantasyCandidate` — id, name, team, position, price, predictedPoints, form, injuryRisk.
  - `FantasyOptimizeRequest`/`Response` — budget, formation literal, riskTolerance literal, 15-player `squad`, 11-id `startingXiIds`, 4-id `benchOrderIds`, `captainId`, `differentials`, `solverStatus`.

*Sentiment analyzer — `app/predictors/sentiment.py`*
- Deterministic seeded synthetic timeline (mean-reverting walk + score-event jolts at goal minutes). Same `(fixture_id, minute, score)` triple always emits the same snapshot — useful for demos and for CI.
- Emotion bucket selector: (side, sentiment) → one of `celebrating / frustrated / anxious / shocked / neutral` per bible §9.3.
- 24 templated reactions across (side × emotion) combinations, parameterised on team + league names.
- `_biggest_swing` walks a 3-minute window over the timeline and reports the largest absolute change per side.
- `totalPosts` synthesised from timeline length + excitement so the post count rises with intensity (matches the bible's "save snapshot every 60s" intuition).
- Architecture: the future Reddit+RoBERTa swap is documented in the module docstring — replace `_collect_reactions` impl, flip `source_mode` to `"reddit"`. No wire change.

*PuLP fantasy optimizer — `app/predictors/fantasy.py`*
- Integer linear program: `maximize Σ x_i * adjusted_points_i` subject to all bible §9.5 constraints — budget cap, squad size 15, positional composition (2 GK / 5 DEF / 5 MID / 3 FWD), max 3 per club.
- Risk-tolerance bias: `safe` discounts injury-risky players (`-2 × injury_risk × points`), `balanced` is neutral, `bold` adds an in-form bonus (`+1.5 × max(0, form - 5)`).
- After solving, picks the formation's positional split for the starting XI (highest-adjusted at each slot), assigns captain to the highest XI scorer, orders the 4-man bench by adjusted points desc.
- `differentials` heuristic flags squad members whose predicted points clear the candidate-pool median — proxy for "low-ownership upside" until real ownership data lands.
- Uses CBC (PuLP bundled), no system solver needed; falls back gracefully on infeasibility with a 422.

*FastAPI routes — `app/main.py`*
- `POST /sentiment-analyze` — bearer-auth; always available regardless of `ML_MODE`. Synthetic snapshot today, Reddit swap in v0.7.
- `POST /fantasy-optimize` — bearer-auth; always available. Caller supplies candidate pool (the front-end has it via `lib/data/demoFantasy.ts`).

**Verified:**
- `pytest -v` ✓ **32/32** in 8.04s.
- New coverage:
  - `test_sentiment_analyze_happy_path` — schema-bound output, timeline length = `minute + 1`, exactly `nReactions` reactions, `sourceMode == "synthetic"`.
  - `test_sentiment_analyze_is_deterministic` — same payload twice → byte-identical response.
  - `test_sentiment_validates_input` — `minute: 200` → 422.
  - `test_fantasy_optimize_respects_squad_constraints` — squad of 15 split exactly 2/5/5/3, total cost ≤ budget, max 3 per club, XI matches formation, captain in XI, bench is 4 non-starters disjoint from XI.
  - `test_fantasy_optimize_max_3_per_club_enforced` — pool dominated by 6 teams still caps each at 3.
  - `test_fantasy_optimize_insufficient_candidates_422` — pool of 15 GKs (no other positions) → 422 with "Not enough" detail.

**Phase 3 Progress:**
- ✅ v0.1 stub `/predict-match`.
- ✅ v0.2 trained XGBoost match predictor (48.8% holdout, 22 features, calibrated).
- ✅ v0.3 SHAP-derived key factors for matches.
- ✅ v0.4 player clusterer (KMeans+PCA, 6 named profiles, silhouette 0.386).
- ✅ v0.5 transfer value regressor (quantile XGBoost, MAE €8.5M, R² 0.791, SHAP in EUR).
- ✅ **v0.6a sentiment analyzer (seeded synthetic, full bible §9.3 wire shape).**
- ✅ **v0.6b PuLP fantasy optimizer (full bible §9.5 constraints, real LP solver).**
- 🎉 **Phase 3 ML surface is feature-complete in synthetic-data mode.** Five trained models, two LP/synthetic predictors, all 32 tests green.
- ⏳ Real data sources (Reddit for sentiment, FBref/Understat for transfer/cluster features) are the only remaining swaps inside Phase 3 — they replace impl, not API.
- ⏳ Railway deploy still on Sonik.

**Completion estimate refresh:**

| Cut | Sessions left | Why |
|---|---|---|
| **A — demo-complete + ML live on Railway** | **~1 session** | Railway deploy (your action) + GH Actions secrets wiring |
| **B — full bible-spec, real services everywhere** | **~3-5 sessions** | Phase 2 cutover (Supabase + RapidAPI, ~3) + Resend email digest + Real-data swaps for sentiment/transfer (~1-2) |

**~94% of the bible done.** The headline ML surface is complete; what's left is wiring real external services in place of demo paths.

**Next session starts here:**
1. **Railway deploy** — still blocked on Sonik.
2. Phase 2 cutover scoping — Supabase project + schema apply + auth swap (`signIn` → `supabase.auth.signInWithOtp`). The cookie-based AuthGate stays as a shim; the persisted-Zustand follow lists migrate to `user_followed_*` tables. 2-3 sessions total.
3. Real-data swap for sentiment — `ML_SOCIAL_PROVIDER=reddit` + PRAW + RoBERTa (~500 MB model download). Heavier image; might be worth deploying as a separate Hugging Face Spaces app per bible §3 footnote.
4. Real-data swap for transfer regressor — pull FBref or Understat per-90 stats for the seeded player set, retrain `transfer_value.pkl`. Same model architecture, just real features.

---

### Session 19 — 2026-05-24 (Phase 3 v0.5 — transfer value regressor, bible §9.4)

**Goal:** Phase 3 v0.5 — XGBoost regressor on `log(market_value_eur)` with quantile heads for the [p10, p90] band and SHAP explanations in EUR. Front-end's Transfer Oracle page already mocks this shape; the swap is a single fetch when GH Pages reads `NEXT_PUBLIC_ML_API_URL`.

**Built (6 atomic commits):**

*Wire format — `app/schemas.py`*
- `TransferValueRequest` — 9 features: name, position (GK/DEF/MID/FWD literal), age (15-45), 4 per-90 stats (goals/assists/xG/xA), pass accuracy, minutes played, league level (1-5). camelCase aliases (`xGPer90`, `xAPer90`) match `futology/lib/ml/transfer.ts`.
- `TransferValueResponse` — `predictedValueEur`, `lowEstimate`, `highEstimate`, `shapFactors[]` (each `{label, contribution: EUR}`).

*Trainer — `train_transfer.py`*
- 1,000 synthetic players with position-conditioned per-90 stat distributions (forwards goal more, defenders pass better, etc.) and an explicit value function (`base + per-stat contributions + age curve + league prior`) with multiplicative log-normal noise.
- Three XGBoost regressors share the trainer pass:
  - **median** — `reg:squarederror` for the point estimate
  - **p10** — `reg:quantileerror, quantile_alpha=0.10` for the low band
  - **p90** — `reg:quantileerror, quantile_alpha=0.90` for the high band
- All three train on `log1p(value_eur)`; predictor `expm1`s on the way out.
- Holdout: **MAE €8.5M, R² 0.791**, band coverage 56.5% (the back-transform tightens the band — honest signal that quantile heads aren't perfectly calibrated). 2.4 MB pickle.

*Predictor — `app/predictors/transfer_value.py`*
- `TrainedTransferRegressor.load(path)` reads pickle + builds `shap.TreeExplainer` on the median model.
- `predict(req)` builds the row, scales it, runs all three heads, exponentiates, enforces `low ≤ median ≤ high` (quantile models train independently and can disagree in tails — band is clamped to be well-ordered, no degenerate cases shown to users).
- SHAP factors converted from log-EUR space to EUR via the marginal delta: `expm1(running_log + contrib_log) - expm1(running_log)`. Top 5 by absolute contribution, each labelled with the feature value (`"Goal-scoring (0.85/90): +€7.1M"`).

*FastAPI wiring*
- `POST /predict-transfer-value` — bearer-auth; 503 in stub mode (no synthetic fallback yet).
- `app/main.py` lifespan now loads all three optional artefacts: match (fail-loud), clusterer (warn-only), transfer (warn-only). Each independently absent → corresponding route 503s.
- `app/state.transfer` initialised to `None` so the route can check cleanly regardless of mode.

**Verified:**
- `pytest -v` ✓ **26/26** in 7.54s. New transfer tests prove:
  - Stub mode → 503 with helpful detail.
  - Happy path: 200, band well-ordered (`low ≤ median ≤ high`), 1-5 SHAP factors with non-empty labels.
  - **26yo elite-tier forward (Mbappé-shaped) valued higher than 38yo tier-3 defender (aging Ramos-shaped)** — sanity check on the trained dynamics.
  - `passAccuracy: 120` → 422 (input validation).
- Live boot in trained mode: `POST /predict-transfer-value {Mbappé-shape}` → `predictedValueEur: €110M`, `low: €79M`, `high: €110M`, factors led by "League tier (tier 1): +€13M" and "xG quality (0.78/90): +€9M".

**Phase 3 Progress:**
- ✅ v0.4 — player clusterer.
- ✅ **v0.5 — transfer value regressor with quantile bands + SHAP factors.**
- ⏳ v0.6 — sentiment pipeline (bible §9.3) and PuLP fantasy optimizer (bible §9.5).
- ⏳ Railway deploy still on Sonik.

**Completion estimate refresh:**

| Cut | Sessions left | Why |
|---|---|---|
| **A — demo-complete + ML live on Railway** | **~1 session** | Just Railway deploy (your action) + GH Actions wiring |
| **B — full bible-spec, real services everywhere** | **~4-6 sessions** | Phase 2 cutover (Supabase + RapidAPI, 3) + Phase 3 v0.6 sentiment + fantasy (2) + email digest + polish |

~**91-92% of the bible done**. Match prediction + player clustering + transfer valuation are the three core ML models; only sentiment and fantasy remain on the ML side.

**Next session starts here:**
1. **Railway deploy** — still blocked on Sonik.
2. Phase 3 v0.6a — Sentiment pipeline (bible §9.3). Two paths:
   - **Stub-real** — generate synthetic sentiment timelines like clusterer/transfer; no external API. Easy ship.
   - **Real Reddit** — needs PRAW + Reddit credentials (Sonik action). Pull match threads, run `cardiffnlp/twitter-roberta-base-sentiment-latest` (HF). Heavier.
   - Recommend stub-real first; swap to Reddit when credentials land.
3. Phase 3 v0.6b — PuLP fantasy optimizer (bible §9.5). Linear program with constraints (15 players, 2 GK / 5 DEF / 5 MID / 3 FWD, max 3 per club, budget cap). Front-end already mocks via greedy solver in `lib/ml/fantasy.ts`; swap is one POST.

---

### Session 18 — 2026-05-24 (Phase 3 v0.4 — player clusterer, bible §9.2)

**Goal:** Pick up Phase 3 v0.4 (player clusterer) since the Railway deploy is still parked. KMeans+PCA on per-90 stats, 6 named profiles, working endpoint, committed pickle.

**Built (7 atomic commits):**

*Shared cluster vocabulary*
- `app/cluster_profiles.py` — single source of truth for the 6 bible §9.2 profiles. Each profile has `id` (kebab-case, matches `futology/lib/data/playerClusters.ts`), `name`, `color`, `description`, and an `ideal` per-90 feature vector that doubles as the synthetic-data prior and the post-fit name anchor. `FEATURE_ORDER` is also defined here so trainer / predictor / schema can't drift.
- `app/schemas.py` — `PlayerClusterRequest` (10 per-90 stats, snake_case internally, camelCase on the wire to match `demoPlayerStats.ts`) + `PlayerClusterResponse` (`clusterId`, `clusterName`, `color`, `pcaX`, `pcaY`, `confidence`). Also exported `ClusterId` Literal for typing.

*Synthetic-data trainer — `train_clusterer.py`*
- 360 samples (60 per profile) sampled from `Normal(ideal, 0.18 * |ideal|)`, clipped non-negative + pass accuracy capped at 100. Real FBref pulls in v0.5 will replace this; the synthetic prior keeps the cluster names stable across re-fits so the front-end colour map stays valid.
- `StandardScaler -> KMeans(n_clusters=6, random_state=42, n_init=10) -> PCA(n_components=2)` per the bible spec.
- Greedy nearest-centroid assignment maps each KMeans label (0-5) to a bible cluster id. Closest pair claimed first so two similar profiles can't both grab the same ideal.
- Diagnostics: silhouette **0.386**, PCA explains **64.5%** of variance, synthetic-label recovery **99.2%** (sanity check, not a fitness metric). 4 KB pickle.

*Trained predictor — `app/predictors/player_cluster.py`*
- `TrainedPlayerClusterer.load(path)` reads the pickle.
- `predict(req)` builds the row in `FEATURE_ORDER`, runs `scaler.transform -> kmeans.transform`, picks the nearest centroid, projects to PCA xy.
- Confidence is `d_next / (d_self + d_next) * 100` — decisive assignments approach 100; boundary cases tend to 50. Honest signal, no hand-tuned thresholds.
- `list_profiles()` exposes the static catalogue for the `/cluster-profiles` endpoint.

*FastAPI wiring*
- `app/main.py` lifespan now loads both `MATCH_PREDICTOR_PATH` (fail-loud, headline feature) and `PLAYER_CLUSTERER_PATH` (warn-only, falls back to 503 from the route). Two new routes:
  - `GET /cluster-profiles` — unauth, returns the 6 profiles for the front-end legend. Available in stub mode too.
  - `POST /predict-player-cluster` — bearer-auth, 503 in stub mode, real prediction in trained mode.
- `.gitignore` exempts `trained_models/player_clusterer.pkl` so the artefact ships with the repo (4 KB — fits well under the GitHub soft limit).

**Verified:**
- `pytest -v` ✓ **22/22** in 5.52s. New cluster tests prove:
  - Haaland-shaped stats → `target-striker` with `#FF6B6B`.
  - Van Dijk-shaped stats → `ball-playing-defender`.
  - Negative `goals` → 422 (input validation).
  - Stub mode → 503 with a helpful detail message.
- 360 synthetic-label purity 99.2% — KMeans cleanly recovers the seeded profiles when greedy-mapped through the centroid distances.

**Phase 3 Progress:**
- ✅ v0.4 — player clusterer trained + endpoint live + tests + pickle in-repo.
- ✅ /cluster-profiles catalogue available without auth so the front-end can render the legend without round-tripping.
- ⏳ v0.4 nearest-neighbours — deferred until we have a real player universe (Phase 2 cutover or FBref pull). Endpoint returns cluster + xy + confidence today.
- ⏳ Railway deploy (still parked on Sonik).
- ⏳ v0.5 — Transfer Value Regressor (bible §9.4) is the natural next ML piece.

**Next session starts here:**
1. **Railway deploy** — blocked on Sonik. Walkthrough still in Session 15 entry.
2. Phase 3 v0.5 — Transfer Value Regressor per bible §9.4: XGBoost regressor on `log(market_value_eur)` with SHAP explanations + comparable-players list. Front-end's Transfer Oracle page mocks this in `lib/ml/transfer.ts`; the swap is a single fetch when the endpoint lands.
3. (Alternative) Front-end swap for v0.4: have Player Pulse on the front-end POST to `/predict-player-cluster` when `NEXT_PUBLIC_ML_API_URL` is set, falling back to the seeded data otherwise (matches the `predictMatchAuto` pattern from Session 15).

---

### Session 17 — 2026-05-24 (v0.3 SHAP + pickle in-repo for zero-retrain deploys)

**Goal:** Burn down Session 16's "Next session starts here" #3 (SHAP integration) and #5 (commit the pickle). #1 (Railway deploy) and #2 (GH Actions secrets wiring) remain on the user.

**Built (4 atomic commits):**

*v0.3 — SHAP-derived key factors*
- `ml-service/pyproject.toml` — `shap>=0.46,<1` added to both the `[train]` and `[runtime-model]` extras (SHAP runs at inference time so the deployed image needs it).
- `ml-service/train.py` — also persists the bare `XGBClassifier` (`base_xgb`) alongside the `CalibratedClassifierCV`. SHAP's `TreeExplainer` wants the raw XGBoost model; otherwise it'd have to peel through `FrozenEstimator` and the calibrator wrapper at every request.
- `ml-service/app/predictors/match_trained.py` — full rewrite of the factor path. On load, builds `TreeExplainer(artifact["base_xgb"])`. On predict, takes the SHAP value column for the *winning* class, sorts features by `|contribution|`, picks the top 3, formats each via a `FEATURE_LABELS` dict that maps internal column names to plain English. Falls back to the old heuristic when SHAP throws (defensive, since SHAP versions disagree on output shape).
- v0.2 artefacts without `base_xgb` raise a clear "retrain with v0.3" error on load — operator intent stays explicit.

*Trained model in-repo*
- Retrained: same 10,707 matches, same 48.8% holdout accuracy / 4.785 log-loss. New artefact carries `base_xgb`.
- `ml-service/.gitignore` — exempted `trained_models/match_predictor.pkl` specifically (3.1 MB). Other future pickles stay ignored until a release-artifact pipeline lands.
- Committed the pickle so Railway's `docker build` no longer needs to retrain. Build time goes from "minutes plus retrain" to "seconds plus model load."

**Verified:**
- `pytest -v` ✓ **17/17** in 4.56s (added `test_trained_mode_emits_shap_factors` asserting every key factor carries a `"SHAP contribution"` substring).
- Live boot in trained mode: `POST /predict-match {homeId:541, awayId:529, ...}` now returns factors like:
  - `"Elo rating differential favours BAR (SHAP contribution +0.20)."`
  - `"Head-to-head wins for the home side favours BAR (SHAP contribution +0.05)."`
  - `"Away team's shots-on-target rate argues against BAR (SHAP contribution -0.04)."`

**Phase 3 Progress:**
- ✅ v0.3 — SHAP-derived explanations live; v0.2's heuristic templates retired.
- ✅ Trained model versioned with the code; Railway can build & boot without the training stack.
- ⏳ Railway deploy still blocked on Sonik.
- ⏳ Per-club form features (the trained model still feeds neutral midtable inputs) — needs Phase 2 cutover or an API-Football proxy.
- ⏳ v0.4-0.6 — player clusterer, transfer value regressor, sentiment, fantasy optimizer.

**Completion estimate (re-checked after Session 17):**

| Cut | Remaining sessions | What |
|-----|-------------------|------|
| **A — demo-complete + ML live on Railway** | **~1 session** | Railway deploy (your action), GH Actions secrets wiring, verify live |
| **B — bible-spec full real services** | **~6-8 sessions** | Phase 2 cutover (Supabase + RapidAPI proxies, ~3 sessions) + Phase 3 v0.4-0.6 (clustering / transfer / sentiment / fantasy, ~3 sessions) + Resend email digest + polish |

We're at ~88% on the bible. Remaining work is real-services plumbing, not new features.

**Next session starts here:**
1. **Railway deploy** — still blocked on Sonik. Walkthrough in Session 15 entry. The committed `trained_models/match_predictor.pkl` means the Docker image just needs `ML_MODE=trained` and it boots into v0.3 mode.
2. Once Railway returns a URL, add `NEXT_PUBLIC_ML_API_URL` (and optionally `NEXT_PUBLIC_ML_API_TOKEN`) as GitHub Actions repo secrets, expose them in the deploy workflow's `env:` block, redeploy, and confirm the live Match Predictor calls Railway.
3. Phase 3 v0.4 — player clusterer (bible §9.2). KMeans + PCA on per-90 stats; bible already names the 6 cluster profiles and colours. Front-end's Player Pulse cluster scatter is mocked from `lib/data/playerClusters.ts`; v0.4 swaps that for `/predict-player-cluster` POSTing the player's per-90 vector.

---

### Session 16 — 2026-05-24 (v0.2 ML — parity test, real XGBoost, trained route)

**Goal:** Burn down Session 15's "Next session starts here" items #2 (kick off v0.2 — real XGBoost training) and #3 (TS/Python parity test). Item #1 (Railway env wiring) stays parked until Sonik finishes the Railway deploy from Session 15.

**Built (7 atomic commits):**

*Stub parity (#3 — the contract guard)*
- Spotted a silent divergence between `futology/lib/ml/predictor.ts` and `ml-service/app/predictors/match_stub.py`: TS applied a `tierBoost` (elite/major/rising → 4/2/0) to `baseHome`; Python didn't.
- `app/schemas.py` — added optional `leagueTier: "elite" | "major" | "rising"` to `PredictMatchRequest`.
- `app/predictors/match_stub.py` — ported the tier boost.
- `futology/lib/ml/client.ts` — looks up the home club's league via `findLeague(...)` and sends both `leagueShortName` and `leagueTier`.
- `futology/scripts/generate_predictor_fixture.ts` — new tsx script that runs the TS predictor against a fixed matrix of 9 club pairs (every elite-league derby + Eredivisie + Primeira + two reverse-order cases) and writes `ml-service/tests/fixtures/match_parity.json`.
- `ml-service/tests/test_parity.py` — parametrized pytest that feeds each fixture case through `match_stub` and asserts byte-identical output. Re-run after any intentional change to the TS predictor.

*v0.2 — real XGBoost training (#2)*
- `ml-service/pyproject.toml` — new `[train]` extra (xgboost/sklearn/pandas/numpy/joblib/requests) and `[runtime-model]` for the deployed image (no xgboost build chain, just inference).
- `ml-service/scripts/download_football_data.py` — pulls 30 CSVs from football-data.co.uk (EPL/La Liga/Serie A/Bundesliga/Ligue 1 × seasons 2019-20 → 2024-25, ~5 MB total). Idempotent.
- `ml-service/train.py` — full bible §9.1 pipeline in one file (~330 LoC):
  - Loads all CSVs, normalises columns, drops abandoned/postponed.
  - Walks matches in date order; per team maintains last-5 form deques + per-pair last-10 H2H + 400-point ELO with K=24, home-adv=60.
  - 22 pre-match features per row: form W/D/L, goals for/against avg, shots avg, shots-on-target avg, clean sheets, days-rest, ELO diff, H2H home/away/draw counts.
  - Temporal split — last 20% of matches by date held out.
  - `XGBClassifier(n_estimators=300, max_depth=6, lr=0.05, subsample=0.8, colsample_bytree=0.8)` with median-balanced sample weights, then `CalibratedClassifierCV(FrozenEstimator(base), method="isotonic", cv=5)` (sklearn 1.6 removed `cv="prefit"` — `FrozenEstimator` is the replacement).
  - Pickles `{model, feature_columns, classes, test_accuracy, n_train, …}` to `trained_models/match_predictor.pkl`.
- **First real run** — **10,707 matches**, holdout **48.8% accuracy / 4.785 log-loss**. Baseline 33% (uniform 3-class); home-win class baseline ~42%. 3.2 MB pickle.
- `ml-service/app/predictors/match_trained.py` — wraps the artefact with the same `predict_match(req)` signature as the stub. Feeds neutral midtable inputs for unknown clubs (Phase 6 / Supabase will provide real club form). Derives plain-English factors from class probabilities; SHAP factor mapping is a v0.3 follow-up.

*Route + lifespan wiring*
- `ml-service/app/main.py` — added an `asynccontextmanager`-based `lifespan` that reads `ML_MODE`; when `"trained"`, loads the pickle (or crashes loudly if missing, no silent fallback). `/health` now reports the actual mode (`"stub"` or `"trained"`). `/predict-match` routes to `app.state.trained.predict(req)` or the stub.
- `ml-service/Dockerfile` — installs `.[runtime-model]` so the deployed image can serve trained mode; copies `trained_models/` (now seeded with a `.gitkeep` so Docker build doesn't fail on a fresh clone).
- `ml-service/.gitignore` — exempts `trained_models/.gitkeep`; ignores `data/raw/` (regeneratable via the downloader).

**Verified:**
- `pytest -v` ✓ **16/16** in 3.29 s (5 main + 9 parity + 2 trained-mode coverage).
- `npx tsc --noEmit` ✓ clean front-end.
- Live boot in trained mode: `uvicorn ... --port 8766` with `ML_MODE=trained` →
  - `/health` returns `{"status":"ok","mode":"trained","version":"0.1.0"}`.
  - `POST /predict-match {homeId:541, awayId:529, ...}` returns probabilities from the calibrated XGBoost (`homeWinProb: 18.2, drawProb: 23.93, awayWinProb: 57.87, predictedWinner: "away"`).

**Phase 3 Progress:**
- ✅ v0.2 — XGBoost trainer + trained route wired behind `ML_MODE=trained`.
- ✅ Parity test guards against silent stub drift between TS and Python.
- ✅ Service exposes both modes cleanly; `/health` always reports the truth.
- ⏳ Railway deploy still blocked on Sonik (carried over from Session 15).
- ⏳ Trained model uses neutral midtable inputs for form features (no per-club form yet) — predictions are league-aware but not team-specific. Solving this is Supabase cutover work (need a `match_form_snapshots` table) or pulling from API-Football fixtures.
- ⏳ Key factors are heuristic strings — SHAP integration is v0.3.

**Next session starts here:**
1. **Railway deploy** (still blocked on user; walkthrough is in Session 15 entry above).
2. Once Railway is up, set `NEXT_PUBLIC_ML_API_URL` / `NEXT_PUBLIC_ML_API_TOKEN` as GitHub Actions secrets, expose them in `.github/workflows/deploy.yml`, redeploy GH Pages, verify the live Match Predictor calls the trained service.
3. v0.3 — SHAP integration. `TreeExplainer` on the inner XGBoost (peel through `FrozenEstimator` and `CalibratedClassifierCV` to get the base estimator), produce top-3 features per prediction, map each to a plain-English string via a template dict (similar to `_factor_pool` in the stub).
4. v0.3 polish — pull per-club form into the trained predictor. Cheapest path: add a `recent_form` cache that's populated from API-Football fixtures (Phase 2 work) and surfaced via a small `/api/football/team-form` endpoint. Until then, the predictions assume neutral inputs and the only signal is the league-tier prior.
5. Consider committing `trained_models/match_predictor.pkl` directly (3.2 MB, well under GitHub's 100 MB soft limit) so Docker builds on Railway don't need to retrain. Trade-off: ~3 MB per re-trained release in repo size.

---

### Session 15 — 2026-05-24 (front-end wiring + pytest suite for ML)

**Goal:** Burn down Session 14's "Next session starts here" items #1 and #3 — wire the front-end's Match Predictor to the new FastAPI service with a clean fallback to the local stub, and lay down a pytest suite for the ML service. Item #2 (Railway deploy) is flagged as a user action below; can't do that from here.

**Built (4 atomic commits + the test suite):**

*Front-end → ML service routing*
- `futology/lib/ml/client.ts` — new `predictMatchAuto(inputs)` async router. Reads `NEXT_PUBLIC_ML_API_URL` at call time; if set, POSTs to `/predict-match`, otherwise wraps the synchronous local `predictMatch` in a Promise. Optional `NEXT_PUBLIC_ML_API_TOKEN` adds a bearer header — exposed in-bundle since static export can't keep secrets; CORS allow-listing on the service side is the real protection until the Vercel cutover lands.
- `futology/app/intelligence/match/MatchPredictorView.tsx` — swapped the synchronous `predictMatch({...})` plus `setTimeout(220)` for `await predictMatchAuto({...})`. Loading state is now driven by real network time when the service is configured; the local fallback feels just as snappy.
- `futology/.env.example` — added `NEXT_PUBLIC_ML_API_URL` + `NEXT_PUBLIC_ML_API_TOKEN` with comments explaining the static-export-can't-keep-secrets caveat. Left the existing `ML_SERVICE_URL`/`ML_SERVICE_TOKEN` keys in place for the future Vercel cutover.

*Phase 3 pytest suite*
- `ml-service/tests/test_main.py` — 5 tests, all green:
  - `/health` returns ok + version + mode.
  - `/predict-match` happy path — camelCase keys only, probabilities sum to ~100, predicted winner ∈ {home, draw, away}, key factors 1-5 strings.
  - `/predict-match` determinism — same payload twice → byte-identical response.
  - Request validation — missing `awayId` → 422.
  - Bearer auth — `ML_SERVICE_TOKEN` set ⇒ no header / wrong scheme / wrong value all 401, correct header 200; `/health` stays public.
- `tests/__init__.py` for package discovery. Helper `_fresh_client(env)` reimports `app.main` so each test gets an isolated auth state without touching sibling tests.

**Verified:**
- `npx tsc --noEmit` ✓ clean.
- `pytest -v` ✓ **5/5** in 1.08s.
- `npx playwright test` ✓ **40/40** in 41.8s — the async refactor didn't break any spec.

**Phase 3 Progress:**
- ✅ Front-end ↔ FastAPI wiring done with safe fallback.
- ✅ ML service has a pytest baseline.
- ⏳ Railway deploy — needs Sonik to log in to Railway and point a project at the `ml-service/` Dockerfile. Once live, set `NEXT_PUBLIC_ML_API_URL=https://<railway-url>` in `futology/.env.local` (or as a GitHub Actions secret if we want the GH Pages demo to use it).
- ⏳ v0.2 — replace stub with trained `XGBClassifier` per bible §9.1.

**⚠️ User action required (Railway deploy):**

1. Sign in at https://railway.app (GitHub OAuth is easiest).
2. **New Project → Deploy from GitHub repo → krish2248/futology**. When asked for the build root, set it to `ml-service`. Railway picks up `Dockerfile` automatically.
3. In **Variables** add:
   - `ML_SERVICE_TOKEN` — generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and save the value somewhere; you'll need it for the front-end env.
   - `ML_ALLOWED_ORIGINS=https://krish2248.github.io,http://localhost:3000`
4. **Settings → Usage** → cap the project at **$5/mo** so a runaway can't surprise you.
5. Once the deploy URL is live, hit `https://<url>/health` to confirm — should return `{"status":"ok",...}`.
6. Tell future-Claude the URL + token and Session 16 wires them in.

**Next session starts here:**
1. Once Railway is live, set `NEXT_PUBLIC_ML_API_URL` / `NEXT_PUBLIC_ML_API_TOKEN` for the GH Pages build (GitHub Actions repo secrets → `.github/workflows/deploy.yml` env block), redeploy, and verify the live Match Predictor calls Railway instead of the local stub.
2. Kick off v0.2 — download football-data.co.uk CSVs (EPL/La Liga/Serie A/Bundesliga/Ligue 1, 2019-20 → 2024-25, ~9k matches), write `ml-service/train.py` to fit the `XGBClassifier` from bible §9.1, pickle to `trained_models/match_predictor.pkl`. Add `MATCH_PREDICTOR_PATH` env to load on FastAPI startup; flip `mode` in `/health` to `"trained"`. Replace `match_stub.predict_match` behind a `ML_MODE=trained` flag so the stub stays as a debug fallback.
3. Optional polish: add a `tests/test_predictor_parity.py` that asserts the Python stub and the TS stub produce the same output for a hardcoded matrix of `(home_id, away_id, competition_id)` triples — proves the cutover guarantee holds even after both sides evolve.

---

### Session 14 — 2026-05-24 (Phase 3 begins — FastAPI scaffold + stub predictor)

**Goal:** Kick off Phase 3 (FastAPI ML service per bible §3/§9). Scaffold the Python service, drop in a deterministic stub for `/predict-match` that matches the front-end's shape exactly, and verify it boots locally.

**Decision recorded at start of session:**
- ML service lives at `ml-service/` (sibling folder under `Sick-Boy/`), not a separate repo. Atomic cross-stack commits + single git history beat the bible's "separate repo" suggestion for a solo project.

**Built (7 atomic commits):**

*Project scaffold — `ml-service/`*
- `pyproject.toml` — hatchling build, Python ≥ 3.11, FastAPI + uvicorn + pydantic stub deps. XGBoost / scikit-learn / pandas / SHAP defer to v0.2 so Railway cold-starts stay fast.
- `.python-version`, `.gitignore` (Python + venv + `*.pkl` artefacts), `.env.example`, `app/__init__.py`.

*Wire formats — `app/schemas.py`*
- Pydantic v2 models with `alias_generator=to_camel` so the JSON is camelCase (matches `futology/lib/ml/predictor.ts` exactly) while Python stays snake_case. `PredictMatchRequest`, `PredictMatchResponse`, `HealthResponse`.

*Auth — `app/auth.py`*
- `require_bearer` dependency reads `ML_SERVICE_TOKEN`. When unset (local dev), auth is bypassed for friction-free curl/uvicorn iteration. When set on Railway, every protected route 401s without a matching `Authorization: Bearer …` header.

*Stub predictor — `app/predictors/match_stub.py`*
- Reimplements the Lehmer RNG + factor templates from `futology/lib/ml/predictor.ts` line-for-line in Python. Same `(home_id, away_id, competition_id)` triple → byte-identical probabilities / score / factors on both sides. That's the cutover guarantee: when v0.2 swaps the stub for `XGBClassifier`, users won't see prediction churn from the migration itself.

*FastAPI entry — `app/main.py`*
- App created at module scope, CORS allow-listed for localhost dev + `https://krish2248.github.io`, two routes: `GET /health` (unauth, returns version + mode), `POST /predict-match` (bearer-gated).

*Deploy — `Dockerfile`*
- `python:3.11-slim`, layered install (pyproject first → app code second) so code-only edits don't bust the dependency layer. `$PORT` honoured for Railway, falls back to 8080 for local `docker run`.

*Docs — `README.md` + `.env.example`*
- Quick-start for Windows PowerShell, API table, deploy notes, roadmap from v0.2 (XGBoost match) through v0.6 (PuLP fantasy).

**Verified:**
- Fresh `.venv` via `py -3.11 -m venv`, `pip install -e ".[dev]"` ✓ (fastapi 0.136.3, uvicorn 0.47.0, pydantic 2.13.4).
- `uvicorn app.main:app --port 8765` → boots clean.
- `GET /health` → `{"status":"ok","version":"0.1.0","mode":"stub"}` ✓.
- `POST /predict-match {homeId:541,awayId:529,competitionId:140,...}` → `{"homeWinProb":42.0,"drawProb":15.0,"awayWinProb":43.0,"predictedWinner":"away","confidence":43.0,"predictedScore":"3-4","keyFactors":[…3 strings…]}` ✓.
- Same payload twice → byte-identical output → **deterministic stub confirmed**.

**Phase 3 Progress:**
- ✅ ml-service scaffold + stub predictor + auth + Dockerfile in place.
- ⏳ Front-end cutover — `MatchPredictorView.tsx` still calls `predictMatch()` locally. Swap to `fetch(MATCH_PREDICT_URL)` is one diff away.
- ⏳ Railway deploy — needs Sonik to create a project and paste `ML_SERVICE_TOKEN`. Bible §7 / §11.
- ⏳ v0.2 — replace stub with trained `XGBClassifier` on football-data.co.uk CSVs (bible §9.1).

**Next session starts here:**
1. Wire the front-end: add `NEXT_PUBLIC_ML_API_URL` + `ML_SERVICE_TOKEN` to `.env.example`; have `MatchPredictorView.tsx` call the service when the URL is set, fall back to the local stub when not (so the GH Pages demo still works).
2. Deploy the service to Railway — create project, point at the `ml-service/` Dockerfile, set the two env vars. Cap the free tier at `$5` so a runaway doesn't surprise us.
3. Add a small `tests/test_main.py` (pytest + httpx) covering `/health`, `/predict-match` happy path, 401 with token enforced, request validation.
4. Once the live service is up, start v0.2 — download football-data.co.uk CSVs, write `ml-service/train.py` to fit the `XGBClassifier` from bible §9.1 (`n_estimators=300, max_depth=6, …`), pickle the model, load on FastAPI startup, swap `match_stub.predict_match` for the real predictor behind a `ML_MODE=trained` env flag.

---

### Session 13 — 2026-05-24 (v0.7.0 release, direction set: Phase 3 ML service)

**Goal:** Cut the v0.7.0 release tag now that the demo-mode build hits the full Phase 7 quality bar (typecheck ✓, 40/40 E2E ✓, Lighthouse ≥ 90 ✓, green deploy ✓). Decide on the next direction.

**Built (3 atomic commits + a tag):**

*v0.7.0 release*
- `CHANGELOG.md` — rolled the Unreleased section into `[0.7.0]` with everything from Sessions 7-12: skeletons, shared hooks layer, utility helpers, architecture/deployment/demo-data docs, OSS hygiene files, Playwright suite (10 specs, `seedAuth` helper), JSDoc sweep, the Lighthouse-driven dynamic-import optimizations, and the two fixed-in-flight RSC bugs (`/offline` missing `"use client"`, `/leagues` calling `useIsClient()` from a server component).
- `futology/package.json` — version bumped `0.1.0` → `0.7.0` (had stayed at 0.1.0 since scaffold).
- `git tag -a v0.7.0` — annotated tag pointing at the release commit on `main`.

*CI hardening*
- `.github/workflows/deploy.yml` — added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` at workflow scope to opt into Node 24 ahead of the September 2026 Node 20 sunset on GitHub Actions runners. Silences the deprecation warning we've been seeing on every run.

**Direction set for Session 14+:**
- **Picked: Phase 3 — FastAPI ML service** (per `AskUserQuestion`).
- Scope per bible §3 / §9: Python service hosting an XGBoost match predictor, SHAP-style transfer-value factors, sentiment pipeline. Decoupled from the front-end; the front-end calls it via `/api/ml/predict-match` (today's `lib/ml/predictor.ts` already returns the exact bible §9.1 envelope, so the swap is one fetch).
- Deferred (for now): Supabase + Vercel real-services cutover. Demo persistence (Zustand + localStorage) stays the way users experience predictions until that future cutover.
- Hosting target: Railway ($5 credit per bible §7 / §11). Repo can live alongside the front-end or in a sibling `ml-service/` folder — to decide next session.

**Verified:**
- `npx tsc --noEmit` ✓ clean.
- `npx playwright test` ✓ 40/40 from Session 12 still green.
- GitHub Pages auto-deploy from `01dbb06` still serving (no code change here that would re-trigger or break it).

**Phase 7 Progress:**
- ✅ **Phase 7 closed for demo mode** — every checklist item except the deferred Vercel cutover is done.
- ✅ v0.7.0 tag cut.
- ⏳ Vercel + Supabase cutover — deferred behind Phase 3.
- ▶️ Phase 3 starts next session.

**Next session starts here:**
1. Decide layout: `ml-service/` sibling folder vs separate repo. The bible suggests separate; sibling is simpler for atomic commits.
2. Scaffold the FastAPI app — `pyproject.toml` (uv or poetry), `app/main.py` with `/health` and `/predict-match`, `Dockerfile` for Railway deploy.
3. Drop in a stub predictor that returns the same envelope as `lib/ml/predictor.ts` so the front-end can switch hosts via env var without code change.
4. Wire `MATCH_PREDICT_URL` and `ML_SERVICE_TOKEN` into `app/intelligence/match/MatchPredictorView.tsx` (currently calls `predictMatch()` directly per Session 5's static-export refactor).
5. Real XGBoost training is downstream — start with the stub + deploy + auth so the rest is incremental.

---

### Session 12 — 2026-05-24 (Lighthouse ≥ 90 across the board, deploy resurrected)

**Goal:** Run the Lighthouse audit from Session 11's punch list. Hit ≥ 90 on all four categories.

**What we found first:**
- Initial Lighthouse run on the live URL: **Perf 78 / A11y 96 / BP 96 / SEO 100**. Performance was the only laggard, dominated by Total Blocking Time of 629 ms from a 691 ms task in the shared vendor chunk (framer-motion + the Navbar popovers).
- More critically: **every GitHub Pages deploy has been failing since 2026-05-09** (15+ red runs). The "live" URL was serving the Session 5 build the whole time. CI log surfaced the root cause — `app/offline/page.tsx` had an `onClick` handler with no `"use client"` directive, breaking static export. Lighthouse was measuring stale code.

**Built (4 atomic commits, 1 audit log entry):**

*Build fix — unblock deploys*
- `app/offline/page.tsx` — added `"use client"`. Static export now generates `/offline/` successfully; the deploy pipeline turned green for the first time in two weeks.

*Performance — keep framer-motion out of the first-load chunk*
- `components/layout/Navbar.tsx` — `SearchModal` and `NotificationBell` are now `dynamic(...)` imports with `ssr: false`. The bell button shows a 9×9 placeholder until hydration so layout doesn't shift. Framer-motion now ships in its own chunk loaded on first interaction.
- `app/HomeLive.tsx` — `MatchDetailSheet` is now a dynamic import too, so framer-motion stays off the home page entirely.

*Hygiene*
- `.gitignore` — added `lighthouse-reports/` so audit artifacts don't pollute the repo.

**Verified:**
- `npx tsc --noEmit` ✓ clean.
- `npx playwright test` ✓ **40 passed in 31s** — no regressions from the dynamic imports.
- `next build` ✓ — home `/` first-load JS is now 126 kB (was higher with MatchDetailSheet inline). Shared first-load JS stays at 87.5 kB. `/offline` builds again (493 B).
- GitHub Actions deploy run `26356381943` → **success**. First green deploy since `b6f192e` on 2026-05-09.

**Lighthouse — before vs after, against `https://krish2248.github.io/futology/`:**

| Category | Before | After | Δ |
|---|---|---|---|
| **Performance** | **78** | **97** | **+19** |
| Accessibility | 96 | 96 | 0 |
| Best Practices | 96 | 96 | 0 |
| SEO | 100 | 100 | 0 |

| Metric | Before | After | Δ |
|---|---|---|---|
| First Contentful Paint | 1167 ms | 1162 ms | −4 ms |
| Largest Contentful Paint | 2887 ms | 2523 ms | −364 ms |
| **Total Blocking Time** | **629 ms** | **18 ms** | **−611 ms** |
| Speed Index | 2849 ms | 2784 ms | −65 ms |

**Phase 7 Progress (continued):**
- ✅ **Lighthouse ≥ 90 across all four categories** — bible target hit (Issue #2 / #3 closable).
- ✅ GitHub Pages auto-deploy is healthy again — `01dbb06` is live.
- ⏳ Vercel + Supabase cutover still outstanding (the real-services migration).
- ⏳ `v0.7.0` release tag still to cut.

**Next session starts here:**
1. Cut `v0.7.0` — the demo-mode build is feature-complete and now passes the full Phase 7 quality bar (typecheck, E2E, Lighthouse, deploy).
2. Decide direction: Supabase + Vercel cutover (real-services migration on a separate target) vs. Phase 3 (FastAPI ML service).
3. Optional follow-ups: bump the workflow actions to Node 24 before the June 2026 deprecation; consider splitting `NotificationBell` into a sync button + lazy popover so the placeholder is visually identical.

---

### Session 11 — 2026-05-24 (broaden E2E auth seed, audit app/ for RSC misuse)

**Goal:** Burn down Session 10's "Next session starts here" items #1 and #2 — apply the new `seedAuth` helper across the remaining protected-route specs (so they test the real pages, not `/login`), and audit the rest of `app/` for the same RSC-uses-client-hook smell that bit `/leagues`.

**Built (6 atomic commits):**

*Audit — `app/**/page.tsx` for client-hook usage without `"use client"`*
- Grepped every `page.tsx` for `useIsClient | useState | useEffect | useSession | useRouter | usePathname | useMemo | useCallback | useRef`.
- Only `app/login/page.tsx` and `app/onboarding/page.tsx` use client hooks, and both already declare `"use client"`. Every other `page.tsx` is a server-component wrapper that delegates to a client view.
- Also checked `loading.tsx` / `not-found.tsx` / `error.tsx` / `layout.tsx` / `template.tsx` — none use client hooks. **`/leagues` was the only offender**, and it's already fixed.

*`seedAuth` rolled across the remaining specs — 6 files*
- `e2e/homepage.spec.ts` — `beforeEach(seedAuth)`; previously was passing on `/login` because both pages happen to have an `h1` + `main` + a few links.
- `e2e/intelligence.spec.ts` — `beforeEach(seedAuth)`; the feature-card assertion now uses `await expect(cards.nth(5)).toBeVisible()` instead of `count() >= 6`, so it waits through hydration and asserts against a `main`-scoped href.
- `e2e/navigation.spec.ts` — `beforeEach(seedAuth)` so all 5 primary-tab visits actually land on their pages.
- `e2e/predictions.spec.ts` — `beforeEach(seedAuth)`.
- `e2e/scores.spec.ts` — `beforeEach(seedAuth)`.
- `e2e/extras.spec.ts` — `beforeEach(seedAuth)`; the cards assertion now uses `await expect(cards.first()).toBeVisible()` against a `main`-scoped href.

**Verified:**
- `npx tsc --noEmit` ✓ clean.
- `npx playwright test` ✓ **40 passed in 1.1 min**. No regressions; every protected-route spec now provably hits the real page.

**Phase 7 Progress (continued):**
- ✅ Playwright suite is honest end-to-end — every protected-route assertion runs against the real page, not the redirected `/login` fallback.
- ✅ App Router audit clean — no other RSC-uses-client-hook violations.
- ⏳ Lighthouse audit ≥ 90 still outstanding.
- ⏳ Vercel + Supabase cutover still outstanding.

**Next session starts here:**
1. Run a Lighthouse audit on the live GH Pages URL (`https://krish2248.github.io/futology/`) — target ≥ 90 across Performance / Accessibility / Best Practices / SEO. Wire `@next/bundle-analyzer` if Performance is short. (Issue #2 / #3)
2. Decide: Supabase + Vercel cutover (real-services migration) vs. Phase 3 (FastAPI ML service).
3. Cut a `v0.7.0` release tag once the next batch of Phase 7 work lands.

---

### Session 10 — 2026-05-24 (hook migrations, Playwright green-suite, leagues bug fix)

**Goal:** Burn down Session 9's "Next session starts here" punch list — migrate the five components flagged in task #1 onto the shared hooks, then actually run the full Playwright suite locally and stabilise any flakes.

**Built (8 atomic commits):**

*Hook migrations — five components onto `useDebounce` / `useClickOutside` / `useEscapeKey`*
- `components/shared/SearchModal.tsx` — `useDebounce(query, 300)` replaces the inline state-pair; `useEscapeKey` handles Esc; the remaining listener now only owns arrow/Enter navigation.
- `components/layout/NotificationBell.tsx` — `useClickOutside(containerRef, close)` + `useEscapeKey(close, open)`; the manual `window.addEventListener("mousedown" | "keydown")` block is gone.
- `components/cards/MatchDetailSheet.tsx` — `useEscapeKey(onClose, open)`; the inline `useEffect` that wired the keydown listener is gone.
- `components/intelligence/TeamPicker.tsx` — same pair as NotificationBell.
- `components/intelligence/PlayerPicker.tsx` — same pair as NotificationBell.

*Playwright suite stabilised — 40/40 passing*
- `e2e/helpers/auth.ts` — new `seedAuth(page)` helper that primes `localStorage["futology.session"]` + the `futology_session` cookie via `page.addInitScript`, so AuthGate sees a hydrated demo user and doesn't redirect protected-route tests to `/login`.
- `e2e/browse.spec.ts` — `beforeEach(seedAuth)`; detail-link assertions now use `expect(locator.first()).toBeVisible()` so they wait through the post-hydration re-render instead of snapshotting the skeleton.
- `e2e/profile.spec.ts` — same pattern.
- `e2e/smoke.spec.ts` — seed auth; navigate by `href` (the nav label is "Predict", not "Predictions"); case-insensitive title regex (`/futology/i`); first-match locator on the hero `h1`.
- `e2e/auth.spec.ts` — dropped the `main, body` fallback locator that was hitting a strict-mode violation; uses `main` alone.

*Pre-existing bug exposed by the suite*
- `app/leagues/page.tsx` was calling `useIsClient()` from a server component (no `"use client"` directive) while also exporting `metadata`. Production build tolerated it, but dev runtime hit the ErrorBoundary, and the suite caught it. Split into `app/leagues/LeaguesView.tsx` (`"use client"`, owns the hook) + a thin server-component wrapper that keeps the `metadata` export — matching the `/clubs` pattern.

**Verified:**
- `npx tsc --noEmit` ✓ clean.
- `npx playwright test` ✓ **40 passed in 30s** (was 34 passed / 6 failed at the start of the session).

**Phase 7 Progress (continued):**
- ✅ Shared hooks are now used everywhere they were planned to land — no more duplicated click-outside / escape / debounce listeners.
- ✅ Playwright suite is green locally end-to-end. Auth seeding via `seedAuth` is the entry point for any future protected-route spec.
- ✅ One real runtime bug (`/leagues` ErrorBoundary in dev) found and fixed off the back of the suite.
- ⏳ Lighthouse audit ≥ 90 still outstanding.
- ⏳ Vercel + Supabase cutover still outstanding.

**Next session starts here:**
1. Apply `seedAuth` to the remaining protected-route specs (`homepage`, `intelligence`, `navigation`, `predictions`, `scores`, `extras`) — they currently pass *incidentally* on `/login`, not against the real pages.
2. Audit the rest of the App Router for the same RSC-uses-client-hook smell that bit `/leagues` (`grep -l useIsClient app/**/page.tsx` then check for missing `"use client"`).
3. Lighthouse audit on the live GH Pages URL — target ≥ 90 across all four scores. (Issue #2 / #3)
4. Decide: Supabase + Vercel cutover (real-services migration) vs. Phase 3 (FastAPI ML service).
5. Cut a `v0.7.0` release tag once the next batch of Phase 7 work lands.

---

### Session 9 — 2026-05-10 (utility helpers, hooks, deeper docs, full JSDoc coverage)

**Goal:** Continue Session 8 — broaden the utility/hooks layer, add architecture and deployment docs, finish JSDoc coverage of every demo data module and every interactive component.

**Built (40+ atomic commits):**

*New utility helpers (`lib/utils/`)*
- `clamp` — numeric clamp to inclusive `[min, max]` range.
- `formatPercent` — percentage formatter accepting both 0–1 ratios and 0–100 values.
- `pluralize` — singular/plural picker with optional count prefix.
- `formatCompactNumber` — compact formatter — `1.2K`, `2.5M`, `1.0B`.
- `formatTimeAgo` — relative-time helper ("just now", "5m ago", "2d ago").
- `truncate` — string truncation with optional ellipsis.
- `debounce` — generic debounce with `cancel()` for non-React contexts.
- Array helpers — `chunk`, `unique`, `groupBy`, `sampleSeeded`.

*New React hooks (`hooks/`)*
- `useDebounce` — debounced state mirror used by SearchModal.
- `useMediaQuery` — SSR-safe responsive boolean.
- `useLocalStorage` — persisted state with cross-tab `storage` event sync.
- `useClickOutside` — ref-based outside-pointer handler.
- `useEscapeKey` — keyboard parity for popovers and modals.

*New configuration*
- `lib/constants/app.ts` — single source of truth for product name, tagline, colours, URLs.
- `scripts/check_env.ts` — pre-deploy validator that distinguishes demo vs real-services modes.

*Architecture documentation*
- `docs/ARCHITECTURE.md` — high-level shape of the app, cutover invariants, static-export vs SSR notes.
- `docs/DEPLOYMENT.md` — GH Pages workflow, planned Vercel target, rollback path, pre-deploy checklist.
- `docs/DEMO_DATA.md` — conventions for the seeded data layer; identity invariants; cutover guide.
- `CONTRIBUTORS.md` — contributor list and acknowledgements.
- README updated to surface the new utilities and doc files.

*Final JSDoc sweep*
- Components: `PredictionCard`, `MyPredictions`, `PredictionLeagues`, `CommunityTab`, `TeamPicker`, `PlayerPicker`, `FantasyPitch`, `PlayerComparisonRadar`, `PlayerClusterChart`, `SentimentGauge`, `SentimentTimeline`, `MatchDetailSheet`, `StandingsTable`.
- Demo data: `demoMatchDetail`, `demoFantasy`, `demoTactics`, `demoPlayerStats`, `demoSentiment`, `playerClusters`, `demoMomentum`, `demoReferees`, `demoWeather`, `demoPress`, `demoInjuries`, `demoOdds`.
- Constants: `EXTRA_FEATURES`.

**Phase 7 Progress (continued):**
- ✅ JSDoc coverage now spans every module worth documenting — components, hooks, stores, ML, utils, constants, demo data layer.
- ✅ Architecture, deployment, and demo-data docs are in place under `docs/`.
- ✅ Reusable hook layer expanded — `useDebounce`, `useMediaQuery`, `useLocalStorage`, `useClickOutside`, `useEscapeKey` are all available for upcoming features.
- ✅ Pre-deploy env-check script ready to wire into the Vercel cutover.
- ⏳ Lighthouse audit ≥ 90 still outstanding.
- ⏳ Vercel + Supabase cutover still outstanding.

**NEXT SESSION STARTS HERE:**
1. Migrate the existing in-component implementations of click-outside / escape-key / debounce over to the new shared hooks (SearchModal, NotificationBell, MatchDetailSheet, TeamPicker, PlayerPicker).
2. Run the full Playwright suite locally and stabilise any flakes.
3. Run a Lighthouse audit on the live GH Pages URL — target ≥ 90 across all four scores. (Issue #2)
4. Decide on the Supabase + Vercel cutover (real-services migration) vs. Phase 3 (FastAPI ML service).
5. Cut a `v0.7.0` release tag once the next batch of Phase 7 work lands.

---

### Session 8 — 2026-05-10 (data-layer JSDoc, repo hygiene, expanded E2E)

**Goal:** Continue Session 7 — finish JSDoc coverage on the data layer, add open-source repo hygiene files (CHANGELOG / CODE_OF_CONDUCT / SECURITY / issue + PR templates), and expand the Playwright suite to cover browse pages, wishlist features, and profile.

**Built (20+ atomic commits):**

*Data-layer JSDoc*
- `LEAGUES`, `findLeague` in `leagues.ts` — note that IDs match API-Football for cutover ergonomics.
- `CLUBS`, `clubsByLeague`, `findClub`, `CLUB_QUICK_PICKS` in `clubs.ts`.
- `PLAYERS` in `players.ts`.
- `TOURNAMENTS`, `findTournament` in `tournaments.ts`.
- `getDemoMatches`, `liveMatches`, `matchesByStatus`, `matchesByLeague` in `demoMatches.ts`.
- `getDemoPredictions` in `demoPredictions.ts`.
- `NEWS_ITEMS`, `filterByCategory`, `isPersonalized`, `rankPersonalized` in `demoNews.ts`.
- `BANDS_BY_LEAGUE`, `getDemoStandings`, `getBandsForLeague` in `demoStandings.ts`.
- `PUBLIC_LEAGUES_SEED` in `demoLeagues.ts`.
- `COMMUNITY_POLLS`, `TRENDING_PICKS`, `ACCURACY_LEADERS` in `demoCommunity.ts`.
- Expanded `api.standings` and `api.search` JSDoc in `lib/api/client.ts`.

*Repo hygiene*
- `CHANGELOG.md` — Keep-a-Changelog format with v0.1.0 → v0.6.0 history and Unreleased section.
- `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1.
- `SECURITY.md` — disclosure policy with a 72-hour ack target and demo-mode caveat.
- `.github/ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`.
- `.github/pull_request_template.md` with summary / phase / test-plan checklist.

*Playwright E2E expansion*
- `browse.spec.ts` — clubs, leagues, tournaments index pages and detail-link presence.
- `extras.spec.ts` — every Phase 6 wishlist feature (8 routes).
- `profile.spec.ts` — profile, settings, notification toggles, settings link.

**Phase 7 Progress (continued):**
- ✅ Full JSDoc coverage across `lib/data/*` modules.
- ✅ Repo now has standard OSS hygiene files.
- ✅ Playwright suite now spans 9 spec files covering homepage, scores, predictions, intelligence, extras, browse, profile, auth, navigation.
- ⏳ Lighthouse audit ≥ 90 still outstanding.
- ⏳ Vercel + Supabase cutover still outstanding.

**NEXT SESSION STARTS HERE:**
1. Run the full Playwright suite locally and stabilise any flakes.
2. Run a Lighthouse audit on the live GH Pages URL — target ≥ 90 across all four scores. (Issue #2)
3. Decide on the Supabase + Vercel cutover (real-services migration) vs. Phase 3 (FastAPI ML service).
4. Test the next-pwa service worker on a deployed build.
5. Cut a `v0.7.0` release tag once next batch of Phase 7 work lands.

---

### Session 7 — 2026-05-09 (skeletons + loading states + JSDoc sweep)

**Goal:** Continue Session 6 work — finish the skeleton/loading-state coverage, document hooks/stores/components/utilities, and expand the Playwright suite.

**Built (40+ atomic commits):**

*Loading skeletons (3 new components, 7 wired loading.tsx files)*
- `IntelligenceSkeleton`, `ScoresSkeleton`, `PredictionsSkeleton` components added.
- `loading.tsx` added for `/leagues`, `/clubs`, `/profile`, `/news`, `/intelligence`, `/scores`, `/predictions` — Next.js automatically streams these while route segments load.

*JSDoc sweep across hooks, stores, ML, components*
- Hooks: `useLiveScores`, `useFixtures`, `useMatchDetail`, `useStandings`, `useIsClient`.
- Stores: `useSession`, `useNotificationPreferences`, `pointsFor` settlement helper.
- Utils: `cn`, `formatEUR`, `formatEURSigned`.
- ML: `runSimulation`, `winProb`, `seeded`, `probability` (tournamentSim), `predictTransferValue` (transfer).
- Constants: `PRIMARY_NAV`, `SECONDARY_NAV`, `INTEL_FEATURES`.
- API: `isDemoMode`, `cacheHeaders`, `jsonResponse`.
- Shared components: `Card`, `StatTile`, `LiveBadge`, `EmptyState`, `PageHeader`, `Toggle`, `ErrorBoundary`, `ApiError`, `SearchModal`.
- Layout: `Navbar`, `MobileNav`, `NotificationBell`, `Providers`.
- Cards: `MatchCard`, `NewsCard`.
- Predictions: `PredictionForm`, `WinProbabilityBar`, `ScoresPicker`.

*Playwright E2E expansion*
- `homepage.spec.ts` — hero copy, live strip, CTA presence.
- `intelligence.spec.ts` — hub, match predictor, player pulse, extras hub.
- `navigation.spec.ts` — primary tabs, clubs/leagues indices, news, 404.
- `predictions.spec.ts` — page render, tab UI, AI cards.
- `scores.spec.ts` — page render, filter chips, groupings.
- `auth.spec.ts` — login form, onboarding, submit button.

**Phase 7 Progress (continued):**
- ✅ Loading skeletons fully integrated across major routes.
- ✅ JSDoc coverage now spans hooks, stores, ML, utils, constants, layout/shared/cards/predictions components.
- ✅ Playwright suite expanded from 1 → 6 spec files.
- ⏳ Lighthouse audit ≥ 90 still outstanding.
- ⏳ Vercel + Supabase cutover still outstanding.

**NEXT SESSION STARTS HERE:**
1. Run the Playwright suite locally (`npx playwright test`) and stabilise any flakes.
2. Run a Lighthouse audit on the live GH Pages URL — target ≥ 90 across all four scores. (Issue #2)
3. Decide on the Supabase + Vercel cutover (real-services migration) vs. Phase 3 (FastAPI ML service).
4. Test the next-pwa service worker on a deployed build.

---

### Session 6 — 2026-05-02 (legitimate contribution building - FINAL STATE)

**Goal:** Build legitimate GitHub contributions through real code improvements, documentation, and features.

**Legitimate work completed (20+ commits):**
1. Fixed lint warnings in ScoresView.tsx and PredictionForm.tsx (2 commits)
2. Enhanced .env.example with setup instructions and links (1 commit)
3. Added PWA support with next-pwa service worker (PR #4 merged)
4. Set up Playwright E2E testing with smoke tests (1 commit)
5. Added ErrorBoundary to ALL major pages (Scores, Predictions, News, Intelligence, Profile, Clubs, Leagues) - Issue #5 CLOSED (3 PRs merged: #7, #8, #9)
6. Added loading skeletons (NewsSkeleton, ProfileSkeleton, ClubsSkeleton, LeaguesSkeleton) - Issue #6 in progress (4 commits)
7. Added comprehensive CONTRIBUTING.md guide (1 commit)
8. Improved TypeScript types in API client - added interfaces (1 commit)
9. Added JSDoc comments to ML predictor, format utilities, API client (3 commits)
10. Added MIT LICENSE file (1 commit)
11. Enhanced .gitignore with comprehensive patterns (1 commit)
12. Fixed TypeScript errors in useLiveScores.ts hook (1 commit)
13. Created CONTRIBUTIONS_SUMMARY.md documentation (1 commit)
14. Updated SESSION.md multiple times with progress (2 commits)

**Created issues:** #1 (PWA), #2 (E2E tests), #3 (Lighthouse), #5 (ErrorBoundaries), #6 (Skeletons)

**Merged PRs:** #4 (PWA), #7 (ErrorBoundary), #8 (Skeletons), #9 (More skeletons), #10 (ClubsSkeleton) - Total: 5 PRs merged

**Phase 7 Progress:**
- ✅ ErrorBoundary on all pages (Issue #5 CLOSED)
- ✅ next-pwa service worker configured and committed
- ✅ Playwright E2E setup complete with smoke tests
- ✅ CONTRIBUTING.md added
- ✅ LICENSE file added
- 🔄 Loading skeletons (News, Profile, Clubs done - Leagues in progress)
- ⏳ Lighthouse audit ≥ 90
- ⏳ Vercel + Supabase cutover

**NEXT SESSION STARTS HERE (Tomorrow):**
1. Continue Issue #6 - Add skeleton to Intelligence pages
2. Create LeaguesSkeleton component (already created, need to integrate)
3. Work on Issue #2 - Expand Playwright E2E tests
4. Work on Issue #3 - Lighthouse audit and optimization
5. Add JSDoc to remaining functions in hooks/ and components/
6. Test PWA service worker functionality
7. Consider starting Phase 3 (ML Service - FastAPI)

**Quick commands to resume:**
```bash
cd C:\Users\sonik\Desktop\Sick-Boy
git status  # Check everything is committed
git log --oneline -10  # See recent commits
gh issue list --state open  # See open issues
```

**Files modified/created today:**
- futology/next.config.js (PWA config)
- futology/lib/api/client.ts (TypeScript interfaces, JSDoc)
- futology/lib/ml/predictor.ts (JSDoc)
- futology/lib/utils/format.ts (JSDoc)
- futology/hooks/useLiveScores.ts (TypeScript fix)
- futology/components/shared/*Skeleton.tsx (4 skeleton components)
- futology/app/*/page.tsx (ErrorBoundary additions)
- CONTRIBUTIONS_SUMMARY.md
- CONTRIBUTING.md
- LICENSE
- .gitignore
- SESSION.md (multiple updates)

---

### Session 5 — 2026-05-02 (final batch · news + handoff)

**Goal:** Ship the deferred news feed and put FUTOLOGY into a clean pause state. User is pivoting to a different project after this batch, so this is the handoff.

**Built:**
- `lib/data/demoNews.ts` — 18 seeded news items across 5 categories (transfers / match / analysis / injuries / tactics). Each item maps to related clubs / players / leagues so the home page can personalize. Helpers: `filterByCategory`, `isPersonalized`, `rankPersonalized`.
- `components/cards/NewsCard.tsx` — category badge with per-category accent color, "For you" pill when personalized, time-ago formatting.
- `app/news/page.tsx` + `NewsView.tsx` — full news page with category filter chips and an Everything / "For you · N" scope toggle. The For-you toggle is disabled when nothing matches.
- `app/HomeNews.tsx` — client component that ranks personalized items first, then shows top 6 on the home page.
- `app/page.tsx` — replaced the "News feed will appear here" placeholder with `<HomeNews />`. Description swaps based on whether the user follows anything.

**Verified:**
- `npx tsc --noEmit` ✓ clean
- `npm run build:export` ✓ — `/news/index.html` written under `out/`
- Live at `https://krish2248.github.io/futology/news/` after this push.

**FUTOLOGY status when paused:**

| Surface | State |
|---|---|
| Live URL | https://krish2248.github.io/futology/ |
| Repo | https://github.com/krish2248/futology (public) |
| Auto-deploy | `main` push → GH Actions → Pages |
| Total commits | ~180 (one per file/change, Conventional Commits, `sonikrish2248@gmail.com`) |
| TypeScript | strict, clean |
| Build | static export, ~80 prerendered pages |
| Bundle | 87 KB shared FLJS, predictions heaviest at 170 KB |
| Phases done | 0, 1, 4, 5, 6 (in demo mode) + Phase 2 detail pages + Phase 7 polish slice + GH Pages deploy |
| Phases outstanding | Real Supabase + RapidAPI cutover (Phases 2 & 3 backends), service worker, Playwright E2E, Lighthouse audit |

**Next session starts here (when picking FUTOLOGY back up):**

1. Read this file, then visit https://krish2248.github.io/futology/ to see current state.
2. Decide direction:
   - **(a) Real-services cutover** — install `@supabase/ssr`, apply schema from bible §6, set up Vercel deployment (separate from GH Pages so the live demo stays). Add `output: 'export'` only when `NEXT_OUTPUT=export`. Replace AuthGate + lib/api/client demo branches with real fetches. The GH Pages site stays as the public demo; Vercel becomes the authenticated production target.
   - **(b) Phase 7 polish** — `next-pwa` service worker for offline cache, Playwright smoke E2E (login → predict → settle → leaderboard), Lighthouse audit ≥ 90, bundle analysis pass.
   - **(c) Phase 3 ML service** — start the Python FastAPI service per bible §3 / §9 (XGBoost training, SHAP, sentiment pipeline). Decoupled from the front-end.

3. Demo cookie design swaps cleanly to Supabase: replace `signIn` in `lib/store/session.ts` with `supabase.auth.signInWithOtp`, keep the same store shape. Replace AuthGate's `useSession.user` check with `supabase.auth.getUser()`.

---

### Session 5 — 2026-05-02 (continued)

**Goal:** Finish the remaining 3 Phase 6 wishlist features, ship the missing Phase 2 deep pages (Player + Club), and **make this live on GitHub Pages**. The user explicitly asked for the deploy mid-batch, so the static-export refactor took priority over the news feed (deferred to next session).

**Built:**

*Phase 6 final 3 wishlist features at `/intelligence/extras/*`*
- **Press Intensity** at `/intelligence/extras/press-intensity` — `lib/data/demoPress.ts` synthesizes per-team PPDA + 12×8 pressure heatmap weighted to high/mid/low blocks. UI: zone filter chips (high/mid/low), sortable list, click any team to see their heatmap on the pitch SVG. Stat tiles for league avg PPDA + most aggressive presser.
- **Injury Intelligence** at `/intelligence/extras/injuries` — `lib/data/demoInjuries.ts` builds 0–4 injuries per team across 14 positions with severity tiers (minor/moderate/major) and per-90 contribution loss. UI: team list sorted by total impact; per-team panel shows goals impact, defense impact, clean-sheet probability delta, full injury list with expected return date.
- **Odds Movement Alerts** at `/intelligence/extras/odds` — `lib/data/demoOdds.ts` generates opening + current odds per upcoming/live fixture across 5 bookmakers, with severity escalation when implied probability shifts ≥ 12 pp. UI: severity filter (all/alert/watch/info), per-row 3-column odds card highlighting which outcome the line drifted to, alert messages.

*Phase 2 deep pages*
- **Player detail** at `/players/[playerId]` — SSG'd for all 24 seeded players. Photo placeholder, position, club, follow toggle. 8 stat tiles (goals/assists/xG/xA/key passes/pressures/pass acc./minutes), pure-SVG 10-match form area chart, predicted market value mini-card, similar-players grid, side-by-side radar with self.
- Cluster scatter detail panel now links to the full player profile.
- **Club detail** at `/clubs/[clubId]` — SSG'd for all 40 seeded clubs. Header with crest placeholder + follow toggle. 6 tabs: Overview (4-stat row + live now + up next), Squad (placeholder for Phase 2 cutover), Fixtures (upcoming MatchCards), Results (finished MatchCards), Transfers (placeholder for Phase 6 cutover), Stats (win rate + per-match goal averages).
- `app/clubs/page.tsx` — proper index now: followed clubs section + popular-club grid; cards link to detail.

*Static-export refactor (the GitHub Pages prerequisites)*
- `lib/api/client.ts` — replaced fetch-based wrappers with direct demo-data lookups wrapped in `Promise.resolve()`. Same shape as before, so all hooks (`useLiveScores`, `useFixtures`, `useStandings`, `useMatchDetail`) keep working unchanged.
- `app/api/` — **deleted** (incompatible with `output: 'export'`). The 6 routes were demo-only and never had real adapters.
- `app/intelligence/[slug]/page.tsx` — **deleted** (was dead code — all 6 features already had specific routes).
- `middleware.ts` — **deleted** (incompatible with `output: 'export'`). Auth check moved to a client component.
- `components/layout/AuthGate.tsx` — replaces middleware. After hydration, redirects unauthenticated users to `/login` from any non-public route. Allowlists `/login` and `/onboarding`.
- `app/intelligence/match/MatchPredictorView.tsx` — was POSTing to `/api/ml/predict-match`; now calls `predictMatch()` directly with a 220 ms `setTimeout` so the loading state still reads.
- `next.config.js` — gated static-export config: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`, plus `basePath` + `assetPrefix` from `NEXT_PUBLIC_BASE_PATH`. Dev still runs at `/`.
- `package.json` — added `"build:export": "cross-env NEXT_OUTPUT=export next build"` and the `cross-env` dev dep.
- `public/manifest.json` — paths now relative (`start_url: "."`, `icons[0].src: "icon.svg"`) so they survive both `/` (dev) and `/futology/` (Pages).
- `public/.nojekyll` — defense-in-depth so Pages doesn't filter `_next/` files.
- `.github/workflows/deploy.yml` — checkout → setup-node 22 → `npm ci` (in `futology/`) → typecheck → `npm run build:export` with `NEXT_PUBLIC_BASE_PATH=/futology` → upload-pages-artifact → deploy-pages.

**Verified working — first deploy succeeded:**
- `npm run build:export` locally → ✓ 80+ static pages (incl. 40 club pages, 24 player pages, 20 league pages, 6 extras pages, 7 intelligence pages)
- Pages enabled via `gh api repos/krish2248/futology/pages -f build_type=workflow`
- Workflow run 25247717162 → **success**, deploy-pages step published the artifact
- Live smoke test (curl):
  - `https://krish2248.github.io/futology/` → 200
  - `/futology/login/` → 200
  - `/futology/intelligence/` → 200
  - `/futology/intelligence/extras/tournament-simulator/` → 200
  - `/futology/players/909/` → 200
  - `/futology/clubs/541/` → 200
- HTML asset paths confirmed prefixed: `href="/futology/_next/static/css/..."`, etc.

**Architectural note: GH Pages is the demo target. Vercel will be the cutover target.**

The live GH Pages site is the canonical demo — anyone can play with the prediction loop, intelligence pages and wishlist features without standing up Supabase or RapidAPI. When we cut over to real services we'll target Vercel because:
- Supabase Auth needs SSR cookies / route handlers (not static)
- RapidAPI keys need server-side proxy routes
- Background jobs (settlement cron, sentiment polling) need an Edge Runtime / serverless host

Plan for the cutover: keep `output: 'export'` gated so the GH Pages demo remains, add a Vercel deployment that builds without `NEXT_OUTPUT=export` (uses real API routes + middleware). Both deployments share the same code; the env flag picks the deployment shape.

**Next session starts here:**
1. Build the news feed at `/news` and wire it into the Home empty placeholder.
2. Finish remaining Phase 7 polish: `next-pwa` service worker, Playwright smoke (login → predict → settle → leaderboard), Lighthouse audit ≥ 90.
3. (Or) start the Supabase cutover on a separate Vercel target.

---

### Session 4 — 2026-05-02

**Goal:** Push into Phase 6 (wishlist) and start Phase 7 polish. Build the most-impactful four wishlist features (Tournament Simulator, Match Momentum, Referee Bias, Weather Impact), plus the polish slice that's safe to ship without external services (top-level error boundary, settings page).

**Built:**

*Phase 6 — wishlist features (`/intelligence/extras/*`)*
- `lib/constants/extras.ts` — central definition of wishlist features (4 ready, 3 still in the queue).
- `app/intelligence/extras/page.tsx` — Extras hub with feature cards. Linked from the main Intelligence Hub via a new "Extras" preview section.
- **Tournament Simulator** at `/intelligence/extras/tournament-simulator`:
  - `lib/ml/tournamentSim.ts` — ELO-based win probability with a 30-point home tilt, runs all 4 knockout rounds, aggregates to {QF %, SF %, Final %, Win %}.
  - 16-team UCL R16 seed bracket. Run options: 1k / 5k / 10k / 25k. Re-run with new RNG seed via the toolbar button.
  - Animated probability table with per-cell mini-bars. Top-4 favorite cards with crown for #1.
- **Match Momentum** at `/intelligence/extras/momentum`:
  - `lib/data/demoMomentum.ts` — per-minute xG increments rolled into a 5-minute window; counts swing crossings.
  - Pure-SVG dual-area chart: home above center, away below center. Goal markers vertical lines.
  - Stat tiles: peak home/away xG (with minute), total swings, window length.
- **Referee Bias** at `/intelligence/extras/referee-bias`:
  - `lib/data/demoReferees.ts` — 14 referees across 6 leagues. Per-ref cards/match plus big-game-only cards/match. Sortable.
  - Toggle for "big games only", which recomputes the table. Big-game delta column shows arrow + percentage. Home tilt index (50 = neutral, ≥54 H, ≤46 A).
- **Weather Impact** at `/intelligence/extras/weather`:
  - `lib/data/demoWeather.ts` — 5 weather buckets (clear / rain / heat / wind / cold) × 5 leagues. Each split has matches, home/draw/away rates, goals/match.
  - League filter chips (All / EPL / La Liga / Bundesliga / Serie A / Ligue 1). Per-bucket card with stacked horizontal bar and Δ-vs-baseline pp delta.

*Phase 7 — polish slice*
- `components/shared/ErrorBoundary.tsx` — class-based React error boundary with retry. Wired around `<main>` in the root layout.
- `lib/store/preferences.ts` — separate Zustand persist slice for notification toggles + email toggle. Bible §6 mirrors `profiles.notifications_enabled` etc.
- `components/shared/Toggle.tsx` — accessible switch with `role="switch"` and `aria-checked`.
- `app/profile/settings/page.tsx` + `SettingsView.tsx` — settings sections for notifications (5 toggles), email, theme (locked-dark indicator), danger zone with reset-session confirmation.
- `ProfileView.tsx` — Settings card is now a real link to `/profile/settings`.

**Verified working:**
- `npx tsc --noEmit` → clean
- `npx next build` → 31 routes total (added: extras hub + 4 features + settings)
- Smoke test on dev server (3005):
  - `/intelligence/extras` → 200 / 36 KB
  - `/intelligence/extras/tournament-simulator` → 200 / 56 KB (largest demo page; 10k Monte Carlo runs at render)
  - `/intelligence/extras/momentum` → 200 / 30 KB
  - `/intelligence/extras/referee-bias` → 200 / 35 KB
  - `/intelligence/extras/weather` → 200 / 28 KB
  - `/profile/settings` → 200 / 25 KB
- Bundle still well under budget: extras pages are 28–56 KB and stay under 145 KB FLJS.

**Architectural note: Tournament Simulator runs client-side.**

Each render runs N Monte Carlo iterations on the main thread. At 10,000 runs × 15 matches/run = 150k ELO probability evaluations, this is fast enough to feel instant (~80–120 ms on modern hardware), but if we ever crank up to 100k+ runs we should move it to a Web Worker. The function in `lib/ml/tournamentSim.ts` is pure and side-effect-free, so a worker port is mechanical: post `{ runs, seed, bracket }`, receive `SimulationOutcome`. Logged here so the Phase 7 perf pass can spot it.

**Next session starts here:**
1. Read `SESSION.md`. Phase 6 has 3 wishlist features remaining (Press Intensity, Injury Intelligence, Odds Movement Alerts) — all doable without external keys.
2. Decide between three reasonable next moves:
   - **(a) Finish Phase 7** — install `next-pwa` for the service worker, write Playwright smoke tests (login → predict → settle → leaderboard), bundle analysis pass, Lighthouse aim ≥90, write `pre_deploy_check.ts`, deploy ML stub to Railway and frontend to Vercel.
   - **(b) Begin Supabase cutover** — install `@supabase/ssr`, apply schema, swap `signIn` and `middleware.ts` first, then start migrating `predictions[]`/`predictionLeagues[]` to real tables. Each demo route's `if (isDemoMode)` branch swaps independently.
   - **(c) Finish Phase 6** — build Press Intensity Heatmap (PPDA-driven, lifts data from existing TacticBoard demo), Injury Intelligence (impact model with seeded injuries), Odds Movement Alert (flag suspicious odds shifts).

---

### Session 3 — 2026-05-01 (continued, second batch)

**Goal:** Stand up the full predictions game loop end-to-end. Make a prediction → auto-settle when the match finishes → climb the leaderboard. All in demo mode against the Zustand store; structured so the Supabase swap is one-to-one with bible §6.

**Built:**
- Extended `lib/store/session.ts` to v2 with predictions, leagues, poll votes and notifications. Includes `migrate` step so existing v1 sessions don't lose their followed lists.
- `components/predictions/ScoresPicker.tsx` — big-button score picker with 0–9 clamp.
- `components/predictions/PredictionForm.tsx` — used both inline (in the sheet's Predict tab) and reusable. ML hint chip, confetti on save, locks after kickoff.
- New 6th tab in `MatchDetailSheet`: **Predict**. Pre-fills with existing prediction.
- `components/predictions/MyPredictions.tsx` — auto-settlement effect, upcoming/settled split, edit-via-sheet, +3/+1/0 colored result indicator.
- `components/predictions/PredictionLeagues.tsx` — Create / Join modals, public-leagues seed, league detail with full leaderboard, copy-invite, leave-league.
- `components/predictions/CommunityTab.tsx` — 3 polls with vote-once and animated bar fills, trending predictions, accuracy leaders.
- `lib/data/demoLeagues.ts` — 3 seeded public leagues (Global, EPL Picks, UCL Bracket) with synthetic member rosters.
- `lib/data/demoCommunity.ts` — polls (EPL winner / UCL winner / Ballon d'Or) + 3 trending picks + 10 accuracy leaders.
- Updated `PredictionCard` (AI tab): "Use this prediction" now actually saves to the user's store, with confetti and "Saved"/"Update from ML" states.
- Updated `NotificationBell` to consume the real store notifications, with seed fallback when empty and a real `mark all read`.

**Verified working:**
- `npx tsc --noEmit` → clean
- `npx next build` → all routes still build (predictions: 12.5 KB / 167 KB FLJS, the heaviest page in the app — includes the sheet, leagues UI, polls)
- Smoke test on dev server (3004): `/predictions` → 200/50 KB. Match detail API confirms fixture #4 is `finished` with `2-1` so auto-settlement has a real input to test against.

**Architecture: settlement contract**

Auto-settlement happens in `MyPredictions` via a `useEffect` over `useFixtures()`. When a fixture transitions to `finished`, the store's `settlePrediction({ fixtureId, actualHomeScore, actualAwayScore })` runs and:
1. Computes points (3 = exact, 1 = correct winner, 0 = miss)
2. Marks the prediction settled
3. Pushes a `prediction_settled` notification
4. `queueMicrotask`s a `recomputeLeagueStats()` so leaderboards update.

Phase 5 cutover for settlement just replaces the trigger: instead of running on render, a Supabase Edge Function runs on a cron, polling finished fixtures from API-Football and updating the `predictions` and `prediction_league_members` tables. The 3/1/0 logic is identical — currently lives in `pointsFor` in `lib/store/session.ts` and can be lifted as-is.

**Next session starts here:**
1. Read `SESSION.md`. The full app is now a working demo end-to-end.
2. Decide between three reasonable next moves:
   - **(a) Begin Supabase cutover** — install `@supabase/ssr`, apply schema, swap auth + persistence one piece at a time. Start with auth (`signIn` → `signInWithOtp`), then move to predictions (Zustand → Supabase tables with RLS).
   - **(b) Build Phase 6 wishlist features** — Match Momentum (rolling xG), Referee Bias Analyzer, Weather Impact Model, Press Intensity Heatmap, Tournament Simulator, Injury Intelligence, Odds Movement Alerts.
   - **(c) Build Phase 7 polish** — proper PWA service worker via `next-pwa`, demo-mode seed bundles, Lighthouse audit pass, Playwright smoke E2E, deploy script.
3. Whatever the choice, the demo→real swap is a one-line change inside each `route.ts` and inside `signIn`/`middleware.ts` — the rest of the app is contract-stable.

---

### Session 2 — 2026-05-01

**Goal:** Establish the data layer that Phase 2/3/4 will plug into. Build it on demo data first so `/scores`, `/leagues/[id]`, match details, and the Match Predictor all work end-to-end without external keys. When real keys land, only the inside of each `route.ts` changes.

**Built:**
- TanStack Query v5 + `Providers` wrapper in root layout (staleTime 30 s, gcTime 5 min, retry 1, no refocus refetch — per bible Phase 7)
- Demo API routes mirroring bible §10:
  - `GET /api/football/live-scores?status=&league=`
  - `GET /api/football/fixtures?status=&league=&team=`
  - `GET /api/football/match/[fixtureId]` — full detail (events, stats, lineups, H2H)
  - `GET /api/football/standings?league=` — rows + bands + league meta
  - `GET /api/football/search?q=&type=`
  - `POST /api/ml/predict-match` — body `{ home_id, away_id, competition_id }`
  - All set Cache-Control per bible (`no-store` for live, `s-maxage=300` for fixtures/standings, `s-maxage=3600` for finished/team/player/search). Returns `{ data, demo: true|false }`.
- `lib/api/config.ts` — central `isDemoMode`, cache-header table, `jsonResponse` helper
- `lib/api/client.ts` — typed `api.{liveScores,fixtures,match,standings,search}` consumed by hooks
- `hooks/useLiveScores.ts` — exports `useLiveScores` (30 s poll), `useFixtures`, `useMatchDetail`, `useStandings`
- `lib/data/demoMatchDetail.ts` — synthesizes events/stats/lineups (4-3-3 with normalised pitch coords)/H2H
- `lib/data/demoStandings.ts` — deterministic 16-team standings with bands per league
- `lib/ml/predictor.ts` — seeded match-prediction function (home advantage + tier bonus + 3 plain-English factors)
- `components/cards/StandingsTable.tsx` — sortable visually with European spots / relegation color bands, position arrows, form W/D/L pills, responsive hide-on-narrow columns, legend footer
- `components/cards/MatchDetailSheet.tsx` — slide-up on mobile, side-sheet on desktop. 5 tabs:
  - **Overview** — venue, referee, attendance, goalscorers
  - **Stats** — bidirectional bars (possession, shots, xG, corners, fouls, cards) with dominant-side highlight
  - **Lineups** — accurate-proportion pitch SVG with 22 player dots in 4-3-3 + lineup lists
  - **Events** — chronological timeline with home/left, away/right alignment
  - **H2H** — last 5 meetings + win-tally pills
- `components/intelligence/TeamPicker.tsx` — searchable team selector with click-outside + ESC
- `app/intelligence/match/page.tsx` + `MatchPredictorView.tsx` — full Match Predictor: two team pickers, animated probability bar, predicted score, confidence pill, key factors. Specific route takes precedence over the dynamic `[slug]` placeholder.
- `app/leagues/[leagueId]/page.tsx` — SSG'd for all 20 league IDs, hosts the StandingsTable. `/leagues` index page now lists every league as a clickable card.
- `app/HomeLive.tsx` — pulled the home page's live-strip into a client component fed by TanStack Query so it auto-refreshes without making the whole page client.
- `components/shared/ApiError.tsx` — designed error state with retry CTA used by all data-driven views.
- `components/providers/Providers.tsx` — QueryClientProvider with the Phase 7 defaults.
- Refactored `ScoresView`, `HomePage`, `LeagueDetailView` to fetch via the API + TanStack Query; click any MatchCard or LiveStrip card → opens `MatchDetailSheet`.

**Verified working:**
- `npx tsc --noEmit` → clean
- `npx next build` → 24 routes (6 dynamic API routes, 20 SSG league pages, intel/match static, all others static), middleware 25.6 KB
- Smoke test on dev server (port 3002):
  - `GET /api/football/live-scores?status=live` → 200, returns 3 live demo matches
  - `GET /api/football/standings?league=39` → 200, full Premier League table with bands
  - `GET /api/football/search?q=barcelona` → 200, returns the club + 3 Barcelona players
  - `GET /api/football/match/1` → 200, full detail with events/stats/lineups/H2H
  - `POST /api/ml/predict-match {home_id:541, away_id:529}` → 200, "predictedScore":"3-2", confidence 46%
  - `GET /leagues/39` → 200/19 KB (StandingsTable rendered)
  - `GET /intelligence/match` → 200/21 KB (Match Predictor rendered)

**Architectural choice — intentional swap point:**

Each `route.ts` has a single `if (isDemoMode)` branch returning seeded data. Phase 2 cutover will replace just the body of that branch with a `fetch` to RapidAPI / Supabase / the FastAPI ML service — the route signature, response envelope (`{ data, demo }`) and Cache-Control header all stay the same. The hooks (`useLiveScores`, `useStandings`, `useMatchDetail`) and components don't change.

Same for `/api/ml/predict-match` — the body branch swaps to a `fetch` to the FastAPI ML service authenticated by `ML_SERVICE_TOKEN`. Until then, `lib/ml/predictor.ts` simulates the same return shape as the bible §9.1 spec (home/draw/away probs, predicted score, confidence, key factors).

**Built (continued, same calendar day):**
- All 5 remaining intelligence pages (Player Pulse, Sentiment Storm, TacticBoard, Transfer Oracle, Fantasy IQ) — see Phase Tracker above for the full per-feature breakdown.
- Pure-SVG charts everywhere (no Recharts/Plotly yet) — keeps bundle small. When the real ML service lands, the chart shapes are already exact.
- Components added: `PlayerClusterChart`, `ClusterFilter`, `PlayerComparisonRadar`, `PlayerPicker`, `SentimentTimeline`, `SentimentGauge`, `PitchSVG` (+ `PitchMarker`), `FantasyPitch`.
- Demo data added: `playerClusters.ts` (6 cluster profiles per bible §9.2), `demoPlayerStats.ts` (per-90 stats with seeded PCA-derived axes + `nearestPlayers` + `toRadar`), `demoSentiment.ts` (90-min sentiment walk + reaction sampler), `demoTactics.ts` (xG shots + pass network), `demoFantasy.ts` (FANTASY_POOL + greedy `optimizeFantasy`).
- ML helpers: `lib/ml/transfer.ts` produces a SHAP-style factor breakdown around a base value derived from position, goals, xG, assists, passing, pressing, minutes.

**Verified working (final):**
- `npx tsc --noEmit` → clean
- `npx next build` → 26 routes (6 dynamic API + 6 intelligence sub-pages + 20 SSG league pages + the standard set), ~145 KB FLJS for the heaviest intel page
- Smoke test on dev server (3003): every intel sub-page returns 200 with expected size:
  - `/intelligence/match` — 21 KB
  - `/intelligence/players` — 33 KB
  - `/intelligence/sentiment` — 35 KB
  - `/intelligence/tactics` — 32 KB
  - `/intelligence/transfer` — 20 KB
  - `/intelligence/fantasy` — 22 KB

**Next session starts here:**
1. Read `SESSION.md`. The whole front-end is demoable end-to-end.
2. Decide: cut over to real services, OR build Phase 5 (predictions settlement, prediction leagues, community polls, email notifications).
3. **If cutting over:**
   - Install `@supabase/supabase-js`, `@supabase/ssr`. Add `lib/supabase/{client,server,middleware}.ts`.
   - Apply schema from bible §6 in the Supabase SQL editor. Generate `types/database.ts`.
   - Replace `lib/store/session.ts#signIn` with `supabase.auth.signInWithOtp`. Update `middleware.ts` to call `supabase.auth.getUser()`.
   - One route at a time: replace each `if (isDemoMode)` branch with a `fetch` to RapidAPI / FastAPI ML service. The signatures and envelopes are already correct.
4. **If building Phase 5:**
   - Predictions form (make a prediction, store in `predictions` table).
   - Cron settlement (Edge Function) on finished fixtures.
   - Prediction leagues (create / join / leaderboard).
   - Community polls + Supabase Realtime subscription.
   - Resend email digest.

---

### Session 1 — 2026-04-30

**Goal:** Read the project bible. Scaffold the Next.js project. Configure dark-only design system. Build a navigable shell so the next session can start filling in real features.

**Decisions made:**
- Project lives at `C:\Users\sonik\Desktop\Sick-Boy\futology` (sub-folder, keeps the bible at the root).
- `npm` instead of `pnpm` (npm 11 already installed; avoids extra install step). Can switch later.
- Skipping `npx create-next-app` — scaffolding manually for predictable, non-interactive setup on Windows.
- Building Phase 0 + the layout shell from Phase 1 in one go so the user has a clickable, navigable UI by end of session.
- Skipping Husky/lint-staged/CI for session 1 — not in a git repo yet, and nothing to gate. Will revisit when remote is set up.

**Built this session (33 files):**

*Project scaffolding (`futology/`)*
- `package.json` — Next 14.2.18 + React 18 + Tailwind 3.4 + TS 5.6 + lucide-react + clsx/tailwind-merge
- `tsconfig.json` — strict, `@/*` path alias
- `next.config.js` — image remote hosts for API-Football, football-data, Transfermarkt
- `postcss.config.js`, `tailwind.config.ts` — full dark-only color tokens (bg, accent, premium, live, text), keyframes (live-pulse, fade-in, shimmer)
- `.gitignore`, `.eslintrc.json`, `.env.example` (every key from bible §7), `next-env.d.ts`

*Design system & layout*
- `app/globals.css` — base resets, dark scrollbar, focus rings, `.surface` / `.live-dot` / `.skeleton` / `.tabular` / `.container-page` / `.safe-bottom` utilities, `prefers-reduced-motion` honored
- `app/layout.tsx` — Inter via `next/font/google`, `<html className="dark">`, skip-to-content link, sticky Navbar, fixed MobileNav
- `lib/utils/cn.ts` — clsx + tailwind-merge
- `lib/constants/navigation.ts` — single source of truth for primary 5-tab nav + secondary nav
- `lib/constants/intelligence.ts` — 6 intel features (slug, title, tagline, description, icon)
- `components/layout/Navbar.tsx` — desktop top nav with primary + secondary links, search/bell stubs
- `components/layout/MobileNav.tsx` — bottom 5-tab nav with safe-area insets, 44px tap targets, scale-95 active feedback
- `components/shared/PageHeader.tsx` — title + description + optional action
- `components/shared/Card.tsx` — surface vs. surface-elevated, optional hover glow
- `components/shared/EmptyState.tsx` — icon + title + description + optional action (centered)
- `components/shared/LiveBadge.tsx` — full vs. dot variant, both pulse
- `components/shared/StatTile.tsx` — label / value / hint, tabular numerals

*Pages (12 total, all prerendered static)*
- `app/page.tsx` — hero + Live-Now placeholder + 3 quick-link cards + 4-stat snapshot + News placeholder
- `app/scores/page.tsx` — All/Live/Finished/Scheduled filter tabs + empty state
- `app/predictions/page.tsx` — 4 tabs (AI/Mine/Leagues/Community) + 4-stat row + ML preview card
- `app/intelligence/page.tsx` — 6-card hub + 4-stat model performance row
- `app/intelligence/[slug]/page.tsx` — single dynamic placeholder for all 6 intel sub-pages (statically generated for match/players/sentiment/tactics/transfer/fantasy)
- `app/profile/page.tsx` — guest header + sign-in CTA + 4-stat row + settings card
- `app/clubs/page.tsx`, `app/leagues/page.tsx`, `app/tournaments/page.tsx` — header + empty state
- `app/not-found.tsx` — 404 with home CTA
- `app/loading.tsx` — global skeleton (header + 4 tiles + main panel)

*Repo metadata*
- `SESSION.md` — this file (project root, alongside the bible)
- Memory files saved at `~/.claude/projects/.../memory/`: user profile, project, session workflow, UI direction

**Verified working:**
- `npm install` → 391 packages, no errors.
- `npx tsc --noEmit` → clean (no output = no errors).
- `npx next build` → ✓ compiled, all 17 routes prerendered static, first-load JS 87–94 KB.
- `npx next dev` smoke test (curl):
  - `GET /` → 200 (41 KB)
  - `GET /intelligence` → 200 (43 KB)
  - `GET /intelligence/match` → 200 (21 KB)
  - `GET /this-does-not-exist` → 404 (correctly returns the not-found page)
- Dev server cleanly stopped (PID 28184 killed).

**Blocked / deferred:**
- **Supabase project + schema (bible §6):** can't apply schema until the user creates a Supabase project. Listed in External Accounts table. Phase 1 auth flow is blocked on this.
- **Husky / lint-staged / Conventional Commits / GitHub Actions CI:** deferred — the repo isn't on GitHub yet. Will set up after the per-file commits push lands.
- **Real shadcn/ui components:** the bible names shadcn primitives (Button, Sheet, Tabs, Dialog, etc.). I've built the equivalents inline as plain Tailwind components for now (Card, EmptyState, StatTile). When we hit Phase 1 auth UI, we'll either install shadcn or keep going with our own — decide then.
- **Framer Motion / TanStack Query / Zustand / Recharts / Plotly:** not installed yet. Will install per phase as features land (auth doesn't need any of them; live scores will need TanStack Query).

**Session 1 part 2 additions (continued working):**

*Auth, onboarding, route protection*
- `lib/store/session.ts` — Zustand store with localStorage persist; sets `futology_session` cookie on sign in; `signIn`, `signOut`, `completeOnboarding`, `toggleLeague/Club/Player/Tournament`, `reset`. Designed so swapping in Supabase changes only the persistence layer.
- `hooks/useHydratedSession.ts` — `useIsClient()` to avoid SSR hydration mismatch on persisted state.
- `middleware.ts` — gate every dashboard route on `futology_session` cookie; allowlist `/login` and `/onboarding`; preserve a `?next=` redirect target.
- `app/login/page.tsx` — Framer-animated three-state flow (form → sent → ready) with email validation. Sets the demo session.
- `app/onboarding/page.tsx` — three-step wizard: leagues (20) → clubs (40+, debounced search) → players (24) + tournaments (10). Progress bar springs, step transitions slide, confetti fires on completion.

*Seed data (`lib/data/`)*
- `leagues.ts` — 20 leagues with API-Football IDs (matches bible §11 Phase 1)
- `clubs.ts` — 40+ clubs across the top 6 leagues, with `clubsByLeague`, `findClub`, and `CLUB_QUICK_PICKS`
- `players.ts` — 24 star players with positions and nationalities
- `tournaments.ts` — 10 majors (World Cup, Euros, Copa, AFCON, Asian Cup, CWC, plus domestic cups)
- `demoMatches.ts` — relative-time-based matches: 3 live, 4 finished, 11 scheduled across 6 leagues; helpers for filter & league grouping
- `demoPredictions.ts` — deterministic ML-style predictions (home/draw/away probabilities, predicted score, confidence, key factors)

*Components*
- `components/cards/MatchCard.tsx` — three implicit variants via match status; LiveStrip wrapper for horizontal scroll on Home
- `components/predictions/WinProbabilityBar.tsx` — segmented bar with dominant-side accent
- `components/predictions/PredictionCard.tsx` — ML badge, prob bar, predicted-score trio, expandable key factors, "Use this prediction" + "Save"
- `components/shared/SearchModal.tsx` — Cmd+K / `/` shortcut, debounced 300 ms, keyboard nav, 4 tabs (All/Teams/Players/Leagues), recent in localStorage
- `components/layout/NotificationBell.tsx` — popover with unread count, mark-all-read, click-outside + Esc to close
- `lib/utils/format.ts` — `formatKickoff`, `formatScore`, `formatRelativeMinute`

*Wired pages*
- `/` — hero + live strip pulling 3 live demo matches
- `/scores` — filter tabs (All/Live/Finished/Scheduled with counts), grouped by league, MatchCard everywhere
- `/predictions` — AI tab now shows 8 PredictionCards with deterministic seeded data; other tabs are designed empty states pointing at later phases
- `/profile` — real user from Zustand, sign-out wired, follow counts and previews from store

*PWA*
- `public/manifest.json`, `public/icon.svg`, `app/icon.svg` for the App Router favicon convention, `public/robots.txt`
- `metadata.manifest = "/manifest.json"` in `app/layout.tsx`

**Verified working (final smoke test):**
- `npx next build` → 20 static routes, middleware 25.6 KB. Login 4.45 KB / 143 KB FLJS, onboarding 10.3 KB / 150 KB.
- `npx tsc --noEmit` → clean.
- Dev server smoke test:
  - `GET /` (no cookie) → **307** redirect to `/login` ✓
  - `GET /login` → 200 ✓
  - `GET /onboarding` → 200 ✓
  - `GET /scores` (with `futology_session` cookie) → 200 (39 KB) ✓
  - `GET /predictions` (with cookie) → 200 (52 KB) ✓

**Next session starts here:**

1. Read `SESSION.md`. Confirm Phase 1 demo-mode is in place.
2. Ask the user for: Supabase project URL + anon key + service role, API-Football RapidAPI key, NewsAPI key, Reddit credentials.
3. **Cut over from demo to real:**
   - Install `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`.
   - Add `lib/supabase/{client,server,middleware}.ts`.
   - Apply the schema from bible §6 in the Supabase SQL editor; generate `types/database.ts` via `supabase gen types`.
   - Replace `signIn` in `lib/store/session.ts` with a call to `supabase.auth.signInWithOtp`.
   - Replace `middleware.ts` cookie check with `supabase.auth.getUser()` from `@supabase/ssr`.
   - Persist follows to `user_followed_*` tables instead of localStorage.
4. **Phase 2 — live data:**
   - `app/api/football/{live-scores,fixtures,standings,team/[teamId],match/[fixtureId],search}/route.ts` — proxy API-Football, never expose key. Cache-Control per route per bible §10.
   - `lib/api/football.ts` helpers: `getCurrentSeason`, `formatFixture`, `formatStandings`, `formatPlayer`.
   - `hooks/useLiveScores.ts` with TanStack Query and 30 s polling.
   - Swap `getDemoMatches()` calls for live data hooks.
   - Build the MatchDetailSheet (5 tabs) per bible §2.1.
   - Build StandingsTable for `/leagues/[leagueId]`.
5. Run lint + typecheck + build before declaring Phase 2 done.

---

## 🗺️ Phase Tracker

Tick boxes as we go. Sub-items live in PROJECT_Sick-Boy.md §11.

- [x] **Phase 0** — Repo & Environment Setup *(shell complete; remote/CI/Supabase deferred)*
  - [x] Next.js project scaffolded
  - [x] Dark-only Tailwind tokens configured
  - [x] `globals.css` with live-dot animation, focus rings, Inter font
  - [x] `app/layout.tsx` with Inter, providers, dark `<html>`
  - [x] `.env.example` with every key from §7
  - [x] Git initialized + 38 per-file commits (one per file, Conventional Commits)
  - [x] GitHub repo published: https://github.com/krish2248/futology (public)
  - [ ] Husky + lint-staged *(deferred — install in Phase 1)*
  - [ ] GitHub Actions CI (lint + typecheck + build) *(deferred — add in Phase 1)*
  - [ ] Supabase project created, schema applied, `types/database.ts` generated *(blocked on user — no project yet)*
- [x] **Phase 1** — Auth, Onboarding, Shell *(in demo mode — see "deferred Supabase wiring" in Tech Debt below)*
  - [x] Demo email-OTP login at `/login` with 3 states (form / sent / ready) and Framer transitions
  - [x] 3-step onboarding wizard at `/onboarding` (leagues → clubs → players + tournaments) with progress bar, debounced search, confetti on completion
  - [x] Zustand store (`lib/store/session.ts`) with localStorage persistence + cookie shadow for SSR
  - [x] `middleware.ts` route protection — redirects unauth users from `/`, `/scores`, etc. to `/login`. Allowlists `/login` and `/onboarding`.
  - [x] Navbar + MobileNav hide themselves on auth routes
  - [x] Cmd+K (or `/`) opens SearchModal — debounced 300 ms, keyboard navigable, recent searches in localStorage (max 5)
  - [x] NotificationBell popover with unread count, mark-all-read, ESC + outside-click to close
  - [x] PWA manifest + SVG icon registered in metadata
- [~] **Phase 2** — Live Data Layer & Core Pages *(real-data Auto-routers wired for standings/scorers/fixtures; dormant until Sonik sets the HF + GH secrets)*
  - [x] `/api/football/{live-scores,fixtures,standings,search,match/[id]}` route handlers with bible §10 cache headers
  - [x] TanStack Query QueryClientProvider with bible-spec defaults
  - [x] `useLiveScores` (30 s poll) · `useFixtures` · `useMatchDetail` · `useStandings`
  - [x] Scores page wired to `useFixtures`, click-to-open MatchDetailSheet
  - [x] MatchDetailSheet (Overview / Stats / Lineups / Events / H2H)
  - [x] StandingsTable with European spots / relegation bands, form pills, position arrows
  - [x] Per-league pages SSG'd for all 20 league IDs
  - [x] Real-data adapters via `*Auto` modules (standings/scorers/fixtures) → HF ML-service football-data.org proxy, demo fallback *(Sessions 24-26; dormant until secrets set)*
  - [x] Top-scorers chart (`ScorersTable`) + Standings/Top-Scorers tabs on the league page *(Session 25)*
  - [x] Club detail page (6 tabs)
  - [x] Player detail page
  - [x] News feed
  - [ ] *(deferred polish)* reverse team-ID cross-walk for club-page per-team fixtures; minimal real MatchDetail (overview) to restore a drill-down on real fixtures
- [x] **Phase 4** — Intelligence Hub & ML Pages *(all 6 features built in demo mode)*
  - [x] **Match Predictor** at `/intelligence/match` — two-team picker, animated probability bar, predicted score, confidence pill, plain-English key factors. POSTs to `/api/ml/predict-match`.
  - [x] **Player Pulse** at `/intelligence/players` — pure-SVG cluster scatter with hover/click, 6 named clusters per bible §9.2, side-by-side comparison radar, similar-players panel, full cluster profile descriptions.
  - [x] **Sentiment Storm** at `/intelligence/sentiment` — pure-SVG sentiment timeline with goal annotations, two team gauges with mood label, excitement meter, live-feed cards with slide-in animation (synthetic ticker every 8 s on live matches).
  - [x] **TacticBoard** at `/intelligence/tactics` — accurate-proportion football pitch SVG (105 m × 68 m), xG shot dots (size = xG, color = goal/saved/off/blocked), Shots ↔ Passes view toggle, pass-network nodes/edges, Sidebar with xG, PPDA, possession, field tilt, pass accuracy.
  - [x] **Transfer Oracle** at `/intelligence/transfer` — player picker, predicted EUR value with 80% confidence band, top SHAP-style factors (positive accent, negative live-red bars), 3 nearest-neighbour comparable players.
  - [x] **Fantasy IQ** at `/intelligence/fantasy` — budget slider (£80–£105M), 5 formation choices, safe/balanced/bold risk, greedy demo solver respecting bible constraints (15 players, 2 GK / 5 DEF / 5 MID / 3 FWD, max 3 per club, budget cap), formation pitch view with gold captain armband, bench list, differential picks, copy-to-clipboard squad export.
- [x] **Phase 5** — Predictions, Profile, Notifications *(in demo mode — Resend email digest is the only outstanding piece)*
  - [x] Session store extended (`lib/store/session.ts` v2) with `predictions[]`, `predictionLeagues[]`, `pollVotes[]`, `notifications[]` mirroring bible §6 schema; persist `migrate` step keeps existing users.
  - [x] `ScoresPicker` component (44 px tap targets, +/- buttons, 0–9 clamp).
  - [x] `PredictionForm` with ML hint chip, confetti on save, edit/delete after save, locked once kickoff passes.
  - [x] **Predict** tab inside `MatchDetailSheet` — pre-fills with the user's existing prediction; locks for live/finished matches.
  - [x] **My Predictions** view: stats row (total / accuracy / points / streak), upcoming (editable via the sheet), settled (result, points colored gold/green/grey, exact-vs-winner-vs-miss label).
  - [x] **Auto-settlement**: when `useFixtures` returns a `finished` match that the user has predicted, the store auto-settles (3/1/0 points) and emits a `prediction_settled` notification.
  - [x] **Prediction Leagues**: My Leagues / public leagues, Create modal (name + description + public toggle, auto-generates 8-char invite code), Join-by-code modal with success/error states, league detail with leaderboard table (rank arrows, your row highlighted, gold crown for #1), copy invite, leave league.
  - [x] **Community polls**: 3 active polls with vote-once, per-option progress bar fill animated by vote count, anonymous accuracy-leaders table, trending-predictions cards.
  - [x] **NotificationBell** now reads from the store's `notifications[]` (with seed fallback when empty); mark-all-read writes through to the store; unread badge shows real count.
  - [ ] Resend email digest *(Phase 5 cutover with API key)*
- [~] **Phase 6** — Bonus / Wishlist Features *(4 of 7 built; Press Intensity, Injury Intelligence, Odds Movement Alerts still in queue)*
  - [x] **Tournament Simulator** at `/intelligence/extras/tournament-simulator` — ELO-based Monte Carlo (1k/5k/10k/25k runs), 16-team UCL R16 bracket, advancement probabilities per round, top-4 favorites cards.
  - [x] **Match Momentum** at `/intelligence/extras/momentum` — rolling 5-min xG window, dual-area SVG chart, swing-counter and peak-minute stats.
  - [x] **Referee Bias** at `/intelligence/extras/referee-bias` — 14 refs across 6 leagues, big-game-only toggle, sortable, big-game delta arrows, home-tilt index.
  - [x] **Weather Impact** at `/intelligence/extras/weather` — 5 buckets × 5 leagues, league filter chips, stacked outcome bars, Δ-vs-baseline pp delta, goals/match.
  - [ ] Press Intensity Heatmap (lift PPDA from existing TacticBoard demo)
  - [ ] Injury Intelligence
  - [ ] Odds Movement Alert
- [~] **Phase 7** — Polish, Performance, Deploy *(error boundary + settings landed; service worker + Lighthouse + E2E + deploy outstanding)*
  - [x] Top-level `ErrorBoundary` wraps `<main>` in root layout
  - [x] `/profile/settings` page — 5 notification toggles, email toggle, dark-locked indicator, reset-session danger zone
  - [x] `lib/store/preferences.ts` — Zustand persist for notification preferences
  - [ ] PWA service worker via `next-pwa`
  - [ ] Bundle analysis pass (`@next/bundle-analyzer`)
  - [ ] Playwright smoke E2E (login → predict → settle → leaderboard)
  - [ ] Lighthouse audit ≥ 90 across the four scores
  - [ ] `scripts/check_env.ts` pre-deploy script
  - [ ] Vercel + Railway deploy
- [ ] **Phase 6** — Bonus / Wishlist Features
- [ ] **Phase 7** — Polish, Performance, Deploy

---

## 🔑 External Accounts / Keys Status

The user needs to register and provide these. None are wired up yet — the app runs in offline shell mode until they are.

| Service | Status | Free tier | Where to get it |
|---|---|---|---|
| Supabase | ❌ not created | 500 MB DB, 50K MAU | https://supabase.com |
| API-Football (RapidAPI) | ❌ not created | 100 req/day | https://rapidapi.com/api-sports/api/api-football |
| football-data.org | ❌ not created | 10 req/min | https://www.football-data.org |
| NewsAPI | ❌ not created | 100 req/day | https://newsapi.org |
| Resend | ❌ not created | 3,000 emails/mo | https://resend.com |
| Reddit | ❌ not created | 60 req/min | https://www.reddit.com/prefs/apps |
| Upstash Redis | ❌ not created | 10K req/day | https://upstash.com |
| Vercel | ❌ not created | 100 GB bandwidth | https://vercel.com |
| Railway | ❌ not created | $5 credit | https://railway.app |

**Action for next session:** the user should create at least Supabase, API-Football, NewsAPI, and Reddit before Phase 2.

---

## 🧱 Environment Snapshot

Captured at start of session 1 (2026-04-30):

- OS: Windows 11 Home, build 26200
- Node: v22.14.0
- npm: 11.1.0
- Python: 3.11.9
- git: 2.52.0.windows.1
- Project root: `C:\Users\sonik\Desktop\Sick-Boy`
- Project subfolder: `C:\Users\sonik\Desktop\Sick-Boy\futology` (Next.js app lives here)
- Git initialized: yes — main branch
- GitHub: **https://github.com/krish2248/futology** (public)
- Author identity (local config): `Sonik Krish <sonikrish2248@gmail.com>`
- Commits at end of session 1 part 2: see `git log --oneline | wc -l` (one commit per file/change, Conventional Commits)

---

## 📐 Design Principles (locked in)

1. **Dark mode only.** No theme toggle. `#0A0A0A` background, `#00D563` accent, `#FFD700` premium, `#FF3B3B` live.
2. **Mobile-first.** Test at 375px before considering anything done.
3. **Minimal & navigable.** Per user direction in session 1: keep UI simple and easy to navigate. No clutter; clear hierarchy; bottom-tab nav on mobile, top nav on desktop.
4. **Functional over fancy.** Skeleton loaders, empty states, error states are required, not optional.
5. **TypeScript strict.** No `any`, no `@ts-ignore`.

---

## 📂 Repo Layout (current vs. planned)

### Current (end of session 1)

```
Sick-Boy/
├── PROJECT_Sick-Boy.md            # the bible (spec)
├── README.md
├── SESSION.md                     # this file
└── futology/
    ├── middleware.ts              # auth gate
    ├── next.config.js · postcss.config.js · tailwind.config.ts · tsconfig.json
    ├── package.json · package-lock.json
    ├── .env.example · .eslintrc.json · .gitignore · next-env.d.ts
    ├── public/
    │   ├── icon.svg · manifest.json · robots.txt
    ├── app/
    │   ├── layout.tsx · globals.css · loading.tsx · not-found.tsx · icon.svg
    │   ├── page.tsx                       # / — hero + live strip + quick links
    │   ├── login/page.tsx                 # demo email-OTP
    │   ├── onboarding/page.tsx            # 3-step wizard with confetti
    │   ├── scores/{page,ScoresView}.tsx   # filter tabs + grouped MatchCards
    │   ├── predictions/{page,PredictionsView}.tsx
    │   ├── profile/{page,ProfileView}.tsx
    │   ├── intelligence/page.tsx + [slug]/page.tsx
    │   └── clubs · leagues · tournaments  (page.tsx empty-state shells)
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx                 # Cmd+K + bell wired
    │   │   ├── MobileNav.tsx
    │   │   └── NotificationBell.tsx       # popover, unread count, mark all read
    │   ├── cards/MatchCard.tsx            # +LiveStrip
    │   ├── predictions/
    │   │   ├── PredictionCard.tsx
    │   │   └── WinProbabilityBar.tsx
    │   └── shared/
    │       ├── Card.tsx · EmptyState.tsx · LiveBadge.tsx
    │       ├── PageHeader.tsx · StatTile.tsx
    │       └── SearchModal.tsx            # Cmd+K, debounced, keyboard-nav
    ├── hooks/
    │   └── useHydratedSession.ts          # useIsClient() helper
    └── lib/
        ├── constants/
        │   ├── intelligence.ts · navigation.ts
        ├── data/
        │   ├── leagues.ts · clubs.ts · players.ts · tournaments.ts
        │   ├── demoMatches.ts · demoPredictions.ts
        ├── store/
        │   └── session.ts                 # Zustand + localStorage + cookie
        └── utils/
            ├── cn.ts · format.ts
```

### Planned (PROJECT_Sick-Boy.md §5)
See bible §5 for the full target structure. We're building it incrementally per phase.

---

## 🐛 Known Issues / Tech Debt

- **Demo Supabase shim.** The login flow currently sets a `futology_session` cookie and stores user state in localStorage via Zustand. When the user provides Supabase keys, swap `lib/store/session.ts#signIn` to call `supabase.auth.signInWithOtp` and replace the cookie with the Supabase SSR session cookie. The middleware.ts contract (cookie present = authenticated) is intentionally swap-compatible.
- **Demo data branches in API routes.** Each handler in `app/api/**` has a single `if (isDemoMode)` branch returning seeded data. Replacing the body of that branch with a `fetch` to RapidAPI / FastAPI is the entire Phase-2/3 cutover for that route. The route signature, response envelope (`{ data, demo }`) and Cache-Control header all stay the same.
- **PredictionCard demo path on `/predictions`.** Still imports from `lib/data/demoPredictions` directly. Should be migrated to `/api/ml/predict-batch` (POST `[fixture_ids]`) once that endpoint exists.
- **NotificationBell uses 3 hard-coded notifications.** Replace with a Supabase Realtime subscription on `notifications` table in Phase 5.
- **`SearchModal` reads `lib/data/*` directly.** Could be migrated to `/api/football/search` for consistency, but the current local search is already debounced and fast — defer until there's a reason.
- **Inline Tailwind components stand in for shadcn/ui primitives.** Working fine; decision deferred — install shadcn for the Sheet/Tabs/Dialog primitives in Phase 2 if a feature needs them, otherwise stay custom.

---

## 📝 Quick-Start for Next Session

**Tell Claude (or yourself) at the start of next session:**

> Read `SESSION.md` first, then `PROJECT_Sick-Boy.md`. Resume from "Next session starts here" in the latest session entry. Do not re-do work that's already ticked off in the Phase Tracker.

**To run the dev server:**

```bash
cd "C:/Users/sonik/Desktop/Sick-Boy/futology"
npm install   # only if node_modules missing
npm run dev
```

Then open http://localhost:3000.

**To check the build:**

```bash
cd "C:/Users/sonik/Desktop/Sick-Boy/futology"
npm run build
```
