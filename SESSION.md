# FUTOLOGY — SESSION LOG

> Living context file. Updated at end of every working session so future Claude (or future you) can pick up cold.
> Bible of truth: `PROJECT_Sick-Boy.md`. This file logs progress against it.

---

## 🎯 Project status — ACTIVE (legitimate contribution building)

**LIVE:** **https://krish2248.github.io/futology/** (GitHub Pages · auto-deploys from `main` via `.github/workflows/deploy.yml`)

The whole front-end is demoable end-to-end. Building legitimate contributions through real code improvements.

**Phase 0** ✅ shell complete
**Phase 1** ✅ demo-mode login + onboarding + Cmd+K. (Middleware was replaced by client-side `AuthGate` to support static export.)
**Phase 2** ✅ demo-mode data layer + StandingsTable + MatchDetailSheet (6 tabs) + per-league pages + per-club pages (6 tabs) + per-player pages + **news feed**. (API routes deleted; `lib/api/client.ts` calls demo data directly. Real RapidAPI re-introduced when we cut over to Vercel + Supabase.)
**Phase 4** ✅ all 6 intelligence sub-pages
**Phase 5** ✅ full prediction game loop, leagues, polls, leaders, notifications
**Phase 6** ✅ all 7 wishlist features (Tournament Simulator, Match Momentum, Press Intensity, Referee Bias, Weather Impact, Injury Intelligence, Odds Movement Alerts)
**Phase 7** 🔄 IN PROGRESS — ErrorBoundary ✅, Settings ✅, dark-lock indicator ✅, **GitHub Pages deploy with auto-CI workflow** ✅, **next-pwa service worker** ✅ (configured, needs testing), **Playwright E2E smoke tests** ✅ (setup complete). Outstanding: Lighthouse audit ≥ 90, Vercel + Supabase cutover.

When the user comes back to this project, start by reading `SESSION.md` and visiting the live URL. The "Next session starts here" block below has the playbook.

---

## 📅 Session History

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
- [~] **Phase 2** — Live Data Layer & Core Pages *(demo branches in place; real adapters pending keys)*
  - [x] `/api/football/{live-scores,fixtures,standings,search,match/[id]}` route handlers with bible §10 cache headers
  - [x] TanStack Query QueryClientProvider with bible-spec defaults
  - [x] `useLiveScores` (30 s poll) · `useFixtures` · `useMatchDetail` · `useStandings`
  - [x] Scores page wired to `useFixtures`, click-to-open MatchDetailSheet
  - [x] MatchDetailSheet (Overview / Stats / Lineups / Events / H2H)
  - [x] StandingsTable with European spots / relegation bands, form pills, position arrows
  - [x] Per-league pages SSG'd for all 20 league IDs
  - [ ] Real RapidAPI adapters in each route (replaces `if (isDemoMode)` branch)
  - [ ] Club detail page (6 tabs)
  - [ ] Player detail page
  - [ ] News feed
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
