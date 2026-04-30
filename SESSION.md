# FUTOLOGY — SESSION LOG

> Living context file. Updated at end of every working session so future Claude (or future you) can pick up cold.
> Bible of truth: `PROJECT_Sick-Boy.md`. This file logs progress against it.

---

## 🎯 Current Phase

**Phase 0 — Repo & Environment Setup** ✅ shell complete (Supabase + Husky/CI deferred until backend keys exist)
**Phase 1 — Auth, Onboarding, Shell** — layout shell already in place; auth + onboarding wizard outstanding

Next session resumes: Phase 1 — wire Supabase email-OTP login + the 3-step onboarding wizard. Live-data wiring (Phase 2) follows.

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

**Next session starts here:**

1. Read `SESSION.md` (this file) end-to-end. Confirm Phase 0 is done. Confirm we're starting Phase 1.
2. Confirm with the user whether the Supabase project is created. If yes, ask for the URL + anon key + service role key. If no, lay the auth code with `.env.local` placeholders and note it's blocked.
3. Build Phase 1 in this order:
   - Install: `@supabase/supabase-js`, `@supabase/ssr`, `framer-motion`, `@tanstack/react-query`, `zustand`, `canvas-confetti`, `date-fns`.
   - `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`.
   - `middleware.ts` at project root for route protection.
   - `app/(auth)/login/page.tsx` — email OTP form, 3 states (initial / sent / verifying).
   - `app/(auth)/onboarding/page.tsx` — 3-step wizard (leagues → clubs → players + tournaments) with progress bar + confetti.
   - Wire `useUser` and `useUserPreferences` hooks.
4. Run lint + typecheck + build before declaring Phase 1 done.

---

## 🗺️ Phase Tracker

Tick boxes as we go. Sub-items live in PROJECT_Sick-Boy.md §11.

- [x] **Phase 0** — Repo & Environment Setup *(shell complete; remote/CI/Supabase deferred)*
  - [x] Next.js project scaffolded
  - [x] Dark-only Tailwind tokens configured
  - [x] `globals.css` with live-dot animation, focus rings, Inter font
  - [x] `app/layout.tsx` with Inter, providers, dark `<html>`
  - [x] `.env.example` with every key from §7
  - [ ] Git initialized + first commit *(running at end of session 1 as per-file commits)*
  - [ ] Husky + lint-staged + Conventional Commits *(deferred — needs remote)*
  - [ ] GitHub repo + Actions CI (lint + typecheck + build) *(deferred — needs remote)*
  - [ ] Supabase project created, schema applied, `types/database.ts` generated *(blocked on user — no project yet)*
- [~] **Phase 1** — Auth, Onboarding, Shell *(layout shell done; auth + onboarding pending)*
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
- Git initialized: not yet

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
├── SESSION.md                     # this file
└── futology/                      # Next.js app
    ├── .env.example
    ├── .eslintrc.json
    ├── .gitignore
    ├── next-env.d.ts
    ├── next.config.js
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx             # Inter, dark <html>, Navbar + MobileNav, skip link
    │   ├── loading.tsx
    │   ├── not-found.tsx
    │   ├── page.tsx               # /
    │   ├── clubs/page.tsx
    │   ├── intelligence/
    │   │   ├── page.tsx           # 6-card hub
    │   │   └── [slug]/page.tsx    # match | players | sentiment | tactics | transfer | fantasy
    │   ├── leagues/page.tsx
    │   ├── predictions/page.tsx
    │   ├── profile/page.tsx
    │   ├── scores/page.tsx
    │   └── tournaments/page.tsx
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   └── MobileNav.tsx
    │   └── shared/
    │       ├── Card.tsx
    │       ├── EmptyState.tsx
    │       ├── LiveBadge.tsx
    │       ├── PageHeader.tsx
    │       └── StatTile.tsx
    └── lib/
        ├── constants/
        │   ├── intelligence.ts
        │   └── navigation.ts
        └── utils/
            └── cn.ts
```

### Planned (PROJECT_Sick-Boy.md §5)
See bible §5 for the full target structure. We're building it incrementally per phase.

---

## 🐛 Known Issues / Tech Debt

- Inline Tailwind components stand in for shadcn/ui primitives. Decide in Phase 1 whether to install `shadcn` or keep building custom — both are fine; pick once and don't mix.
- Search and notification icons in the Navbar are visual only — not wired up. Phase 1 connects them to a SearchModal and Supabase Realtime.
- No Framer Motion yet. The bible expects spring physics on sheets and a slide animation on the auth page; install it when Phase 1 starts.
- API key cache strategy is documented in the bible but not yet enforced — there are no API routes. Will be enforced when `/api/football/*` routes are built in Phase 2.

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
