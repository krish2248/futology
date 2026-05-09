<div align="center">

# FUTOLOGY ⚽

### *Every Goal. Every Emotion. Every Insight.*

A football intelligence platform — live scores, ML match predictions, playing-style clusters, live community sentiment, tactical breakdowns, transfer-value prediction, and fantasy squad optimisation. **One dark interface, one URL, one login.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-00D563?style=for-the-badge&logo=githubpages&logoColor=black)](https://krish2248.github.io/futology/)
[![Deploy](https://github.com/krish2248/futology/actions/workflows/deploy.yml/badge.svg)](https://github.com/krish2248/futology/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-FFD700.svg)](./LICENSE)

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![React Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-1A202C)

</div>

---

## 📋 Table of contents

- [What you can do](#-what-you-can-do)
- [Live demo](#-live-demo)
- [Quick start](#-quick-start)
- [Tech stack](#-tech-stack)
- [Project layout](#-project-layout)
- [Roadmap](#-roadmap)
- [Design principles](#-design-principles)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## 🎯 What you can do

### Core experience

| Surface | What it does |
|---|---|
| **🏠 Home** | Personalised live strip, snapshot stats, "For you" news ranking |
| **🏆 Scores** | Live / scheduled / finished filters, grouped by league, click any match for full detail |
| **📊 League standings** | UCL / UEL / Conference / relegation bands, form pills, position arrows — SSG'd for all 20 leagues |
| **📰 News feed** | 5 categories, "Everything / For you" scope toggle, personalisation against followed clubs/players |
| **👤 Club / Player profiles** | 6-tab club view, 8-stat player view with form chart and similar-players grid |

### 🎮 Predictions game loop

- **Make a prediction** with a 44-px score picker, ML hint chip, confetti on save
- **Auto-settle** when matches finish — 3 pts exact / 1 pt winner / 0 pts miss
- **Prediction Leagues** — create with 8-char invite codes, join public leagues, see live leaderboards
- **Community polls** with vote-once + animated bar fills, trending picks, accuracy leaders

### 🧠 Intelligence Hub (6 ML pages)

| Feature | What it shows |
|---|---|
| **Match Predictor** | Win-probability bar, predicted score, confidence pill, plain-English key factors |
| **Player Pulse** | KMeans cluster scatter (6 styles), comparison radar, similar-player suggestions |
| **Sentiment Storm** | Live sentiment timeline, dual gauges, excitement meter, fan reactions |
| **TacticBoard** | xG shot maps, pass networks, PPDA, field tilt, possession |
| **Transfer Oracle** | Predicted EUR value with 80% confidence band + SHAP-style factor breakdown |
| **Fantasy IQ** | Greedy LP-style optimiser respecting £105M budget, formation, risk tolerance |

### 🎁 Phase 6 wishlist features

Tournament Simulator (10k Monte Carlo runs) · Match Momentum (rolling xG) · Press Intensity (PPDA heatmap) · Referee Bias · Weather Impact · Injury Intelligence · Odds Movement Alerts

---

## 🚀 Live demo

**[krish2248.github.io/futology](https://krish2248.github.io/futology/)** ← every feature, no login required

The demo runs against deterministic seed data so it works without backend keys. Every push to `main` redeploys automatically via GitHub Actions.

> **Why GH Pages stays demo-only.** Pages is static — no middleware, no route handlers, no edge runtime. The Vercel target (planned) re-enables real Supabase auth and RapidAPI proxying. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

---

## ⚡ Quick start

```bash
git clone https://github.com/krish2248/futology.git
cd futology/futology
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app boots into demo mode — no env file required.

### Useful scripts

```bash
npm run dev           # Next dev server with HMR
npm run typecheck     # tsc --noEmit
npm run lint          # next lint
npm run build:export  # Static export (what GH Pages builds)
npx playwright test   # E2E suite
```

---

## 🛠 Tech stack

**Frontend** · Next.js 14 (App Router) · TypeScript strict · Tailwind 3.4 · Framer Motion · TanStack Query · Zustand · Lucide

**Data & ML (planned)** · Supabase Postgres + Auth + Realtime · API-Football (RapidAPI) · FastAPI ML microservice · XGBoost · KMeans + PCA · HuggingFace transformers · PuLP · SHAP

**Hosting** · GitHub Pages (demo, live) · Vercel + Railway (planned, real services)

---

## 📂 Project layout

```
Sick-Boy/
├── futology/                  # Next.js app (everything ships from here)
│   ├── app/                   # App Router pages — home, scores, predictions,
│   │   │                      # news, intelligence (+ 6 sub-pages), extras
│   │   │                      # (+ 7 wishlist routes), profile, login,
│   │   │                      # onboarding, clubs/[id], leagues/[id],
│   │   │                      # players/[id]
│   │   └── intelligence/      # 6 ML pages + 7 wishlist sub-pages
│   ├── components/
│   │   ├── layout/            # Navbar, MobileNav, AuthGate, NotificationBell
│   │   ├── shared/            # Card, EmptyState, ErrorBoundary, *Skeleton, ...
│   │   ├── cards/             # MatchCard, MatchDetailSheet, NewsCard, StandingsTable
│   │   ├── predictions/       # ScoresPicker, PredictionForm, leagues, community
│   │   ├── intelligence/      # PitchSVG, FantasyPitch, sentiment, radar, picker
│   │   └── providers/         # TanStack Query wrapper
│   ├── hooks/                 # useLiveScores, useDebounce, useMediaQuery,
│   │                          # useLocalStorage, useClickOutside, useEscapeKey
│   ├── lib/
│   │   ├── api/               # Demo client + cache headers (Supabase swap point)
│   │   ├── ml/                # predictMatch · predictTransferValue · runSimulation
│   │   ├── store/             # Zustand session + preferences (localStorage persist)
│   │   ├── data/              # Seeded leagues, clubs, players, matches, news, +
│   │   │                      # demo*.ts modules powering every Phase 4–6 page
│   │   ├── constants/         # App metadata, navigation, intelligence, extras
│   │   └── utils/             # cn, format, clamp, percent, pluralize, debounce, ...
│   ├── e2e/                   # Playwright spec files (9 specs)
│   ├── scripts/               # check_env.ts (pre-deploy validator)
│   └── public/                # manifest.json, icon.svg, .nojekyll, robots.txt
├── docs/                      # ARCHITECTURE · DEPLOYMENT · DEMO_DATA
├── .github/                   # workflows/deploy.yml, issue + PR templates
├── PROJECT_Sick-Boy.md        # The bible (vision, schema, ML specs, build plan)
├── SESSION.md                 # Living session log — read this first
├── CHANGELOG.md · CODE_OF_CONDUCT.md · CONTRIBUTING.md · SECURITY.md
└── LICENSE                    # MIT
```

For the deeper dive — architecture, cutover invariants, demo-data conventions — see [`docs/`](./docs).

---

## 🗺 Roadmap

| Phase | Title | Status |
|---|---|---|
| 0 | Repo & Environment Setup | ✅ Complete |
| 1 | Auth, Onboarding, Shell | ✅ Demo mode |
| 2 | Live Data Layer & Core Pages | ✅ Demo mode + deep pages |
| 3 | ML Service (FastAPI) | ⏳ Pending |
| 4 | Intelligence Hub & ML Pages | ✅ All 6 features |
| 5 | Predictions, Profile, Notifications | ✅ Demo mode (Resend pending) |
| 6 | Bonus / Wishlist Features | ✅ All 7 features |
| 7 | Polish, Performance, Deploy | 🔄 In progress |

The cutover from demo to real services is mechanical — every API surface has exactly one swap point. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md#cutover-friendly-invariants).

---

## 🎨 Design principles

1. **Dark mode only.** `#0A0A0A` background · `#00D563` accent · `#FFD700` premium · `#FF3B3B` live. No theme toggle.
2. **Mobile-first.** Test at 375px before declaring anything done.
3. **Functional over fancy.** Skeleton loaders, designed empty states, error boundaries, and keyboard parity are required, not optional.
4. **TypeScript strict.** No `any`, no `@ts-ignore`.
5. **Server-only API keys.** Only the Supabase URL + anon key ever reach the browser.
6. **Demo data is a contract.** IDs match the real API so the cutover is one-to-one. See [`docs/DEMO_DATA.md`](./docs/DEMO_DATA.md).

---

## 📖 Documentation

| Document | Purpose |
|---|---|
| [`PROJECT_Sick-Boy.md`](./PROJECT_Sick-Boy.md) | The bible — vision, features, schema, ML specs, build plan |
| [`SESSION.md`](./SESSION.md) | Living session log. Read first; updated each working session |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | High-level shape and cutover invariants |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | GH Pages workflow, future Vercel target, rollback |
| [`docs/DEMO_DATA.md`](./docs/DEMO_DATA.md) | Seed data conventions and identity invariants |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How to set up and submit changes |
| [`CHANGELOG.md`](./CHANGELOG.md) | Release history (Keep a Changelog format) |
| [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) | Contributor Covenant 2.1 |
| [`SECURITY.md`](./SECURITY.md) | Vulnerability disclosure policy |
| [`CONTRIBUTORS.md`](./CONTRIBUTORS.md) | People who have helped build this |

---

## 🤝 Contributing

This project is in active development. Contributions of any size are welcome — code, docs, design, testing, triage. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md), pick something from the [open issues](https://github.com/krish2248/futology/issues), and open a PR using the [template](./.github/pull_request_template.md).

For security-sensitive issues, please use the disclosure path in [`SECURITY.md`](./SECURITY.md) instead of a public issue.

---

<div align="center">

**Built for football fans everywhere.**

[Live demo](https://krish2248.github.io/futology/) · [Issues](https://github.com/krish2248/futology/issues) · [Roadmap](./PROJECT_Sick-Boy.md)

</div>
