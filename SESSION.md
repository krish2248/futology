# FUTOLOGY — SESSION LOG

> Living context file. Updated at end of every working session so future Claude (or future you) can pick up cold.
> Bible of truth: `PROJECT_Sick-Boy.md`. This file logs progress against it.

---

## 🎯 Current Phase

**Phase 0 — Repo & Environment Setup** ✅ shell complete (Supabase + Husky/CI deferred until backend keys exist)
**Phase 1 — Auth, Onboarding, Shell** ✅ in demo mode — login + 3-step onboarding + Cmd+K + notifications + middleware all functional. Real Supabase wires up when keys arrive.
**Phase 2 — Live Data Layer & Core Pages** ⏳ partial — MatchCard + PredictionCard built and fed by deterministic demo data. Real API-Football wiring pending.

Next session resumes: Phase 2 properly — once Supabase + API-Football keys are provided, swap the demo data layer for real API routes and add live polling.

---

## 📅 Session History

### Session 1 — 2026-04-30 (Today)

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
- [ ] **Phase 2** — Live Data Layer & Core Pages
- [ ] **Phase 3** — ML Service (FastAPI)
- [ ] **Phase 4** — Intelligence Hub & ML Pages
- [ ] **Phase 5** — Predictions, Profile, Notifications
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
- **NotificationBell uses 3 hard-coded notifications.** Replace with a Supabase Realtime subscription on `notifications` table in Phase 5.
- **PredictionCard / MatchCard / SearchModal read from `lib/data/*` seed data.** Replace those imports with TanStack Query hooks pointed at `/api/football/*` and `/api/ml/predict-match` once Phase 2/3/4 backends exist.
- **Inline Tailwind components stand in for shadcn/ui primitives.** Working fine; decision deferred — install shadcn for the Sheet/Tabs/Dialog primitives in Phase 2 if a feature needs them, otherwise stay custom.
- **API key cache strategy** is documented in the bible but not yet enforced — there are no API routes yet. Will land with Phase 2's `/api/football/*` routes.

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
