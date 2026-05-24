# Changelog

All notable changes to FUTOLOGY are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.7.0] — 2026-05-24

Phase 7 quality bar — Lighthouse ≥ 90, green deploy, expanded E2E. Demo-mode feature freeze; next milestone is the Supabase + Vercel real-services cutover.

### Added
- **Loading skeletons & route segments** — `IntelligenceSkeleton`, `ScoresSkeleton`, `PredictionsSkeleton`; `loading.tsx` wired for `/leagues`, `/clubs`, `/profile`, `/news`, `/intelligence`, `/scores`, `/predictions`.
- **Reusable hooks layer** — `useDebounce`, `useMediaQuery`, `useLocalStorage`, `useClickOutside`, `useEscapeKey` (used by SearchModal, NotificationBell, MatchDetailSheet, TeamPicker, PlayerPicker).
- **Utility helpers** — `clamp`, `formatPercent`, `pluralize`, `formatCompactNumber`, `formatTimeAgo`, `truncate`, `debounce`, plus array helpers (`chunk`, `unique`, `groupBy`, `sampleSeeded`).
- **Architecture & deployment docs** — `docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/DEMO_DATA.md`, `CONTRIBUTORS.md`.
- **Open-source repo hygiene** — `CODE_OF_CONDUCT.md`, `SECURITY.md`, GitHub issue and PR templates.
- **Playwright E2E suite** — 40 tests across 10 spec files (homepage, intelligence, navigation, predictions, scores, auth, browse, profile, extras, smoke) with `seedAuth` helper that primes `localStorage["futology.session"]` so protected-route tests run against the real pages.
- **Pre-deploy validator** — `scripts/check_env.ts` distinguishes demo vs real-services mode before a Vercel build.

### Changed
- **Full JSDoc coverage** across hooks, stores, ML, utilities, constants, layout/shared/cards/predictions components, and every `lib/data/*` module (`leagues`, `clubs`, `players`, `tournaments`, `demoMatches`, `demoPredictions`, `demoNews`, `demoStandings`, `demoLeagues`, `demoCommunity`, `demoMatchDetail`, `demoFantasy`, `demoTactics`, `demoPlayerStats`, `demoSentiment`, `playerClusters`, `demoMomentum`, `demoReferees`, `demoWeather`, `demoPress`, `demoInjuries`, `demoOdds`).
- **Lighthouse Performance 78 → 97** (TBT 629 ms → 18 ms) by dynamic-importing `SearchModal`, `NotificationBell`, and `MatchDetailSheet` so framer-motion drops out of the critical first-load chunk.
- Migrated inline click-outside / escape / debounce listeners in 5 components onto the shared hooks.

### Fixed
- **`app/offline/page.tsx`** missing `"use client"` — broke every GitHub Pages deploy since 2026-05-09 (15+ failed runs). Static export now succeeds.
- **`app/leagues/page.tsx`** calling `useIsClient()` from a server component — hit ErrorBoundary in dev. Split into a server-component wrapper + `LeaguesView` client component.

## [0.6.0] — 2026-05-02

### Added
- Phase 6 wishlist features: Tournament Simulator, Match Momentum, Press Intensity, Referee Bias, Weather Impact, Injury Intelligence, Odds Movement Alerts
- Phase 2 deep pages: Player detail (`/players/[id]`), Club detail with 6 tabs (`/clubs/[id]`)
- News feed (`/news`) with category filter chips and personalised "For you" toggle
- Settings page (`/profile/settings`) with 5 notification toggles, email toggle, dark-locked indicator, reset-session danger zone
- Top-level `ErrorBoundary` wrapped around `<main>`
- next-pwa service worker config
- GitHub Pages deploy workflow (auto-deploy on push to `main`)
- CONTRIBUTING.md, MIT LICENSE

### Changed
- Replaced API routes with direct demo-data lookups for static export compatibility
- Replaced `middleware.ts` with client-side `AuthGate` (static export incompatible with middleware)
- Static-export refactor: `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`

## [0.5.0] — 2026-05-01

### Added
- Full predictions game loop: ScoresPicker, PredictionForm, MyPredictions with auto-settlement, Prediction Leagues with create/join/leaderboard, Community polls + trending + accuracy leaders
- Session store v2 with `predictions[]`, `predictionLeagues[]`, `pollVotes[]`, `notifications[]`
- All 6 intelligence pages: Match Predictor, Player Pulse, Sentiment Storm, TacticBoard, Transfer Oracle, Fantasy IQ

## [0.4.0] — 2026-05-01

### Added
- Live data layer: TanStack Query, demo API routes mirroring bible §10, MatchDetailSheet (5 tabs), StandingsTable with bands and form pills
- Per-league pages SSG'd for all 20 league IDs

## [0.1.0] — 2026-04-30

### Added
- Initial Next.js scaffold with dark-only Tailwind tokens, Inter font, Phase 0 + Phase 1 shell
- Demo email-OTP login, 3-step onboarding wizard, Cmd+K search modal, NotificationBell

[Unreleased]: https://github.com/krish2248/futology/compare/v0.7.0...HEAD
[0.7.0]: https://github.com/krish2248/futology/releases/tag/v0.7.0
[0.6.0]: https://github.com/krish2248/futology/releases/tag/v0.6.0
[0.5.0]: https://github.com/krish2248/futology/releases/tag/v0.5.0
[0.4.0]: https://github.com/krish2248/futology/releases/tag/v0.4.0
[0.1.0]: https://github.com/krish2248/futology/releases/tag/v0.1.0
