# FUTOLOGY ⚽

> Every Goal. Every Emotion. Every Insight.

The definitive football intelligence platform — live scores, ML-powered match prediction, player playing-style clusters, live community sentiment, tactical breakdowns, transfer-value prediction and fantasy squad optimization. One unified dark interface, one URL, one login.

## Repository layout

- **[`PROJECT_Sick-Boy.md`](./PROJECT_Sick-Boy.md)** — the project bible. Vision, complete feature set, tech stack, design system, database schema, env vars, ML model specs, API routes, phased build plan, and definition of done.
- **[`SESSION.md`](./SESSION.md)** — living session log. Read first; updated at the end of every working session so you can pick up cold.
- **[`futology/`](./futology)** — the Next.js 14 application (App Router · TypeScript strict · Tailwind dark-only).

## Stack

- **Frontend** — Next.js 14, TypeScript strict, Tailwind, shadcn/ui, Framer Motion, TanStack Query, Recharts/Plotly, Zustand
- **Backend** — Next.js API routes (proxy keys server-side) + Python FastAPI ML microservice
- **ML** — XGBoost, KMeans + PCA, HuggingFace transformers, PuLP, SHAP
- **Data** — Supabase (Postgres + Auth + Realtime + Storage), Upstash Redis
- **Hosting** — Vercel (frontend) + Railway (ML service)

See the bible §3 for the full list.

## Quick start

```bash
cd futology
npm install
cp .env.example .env.local   # fill in keys per bible §7
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build phases

`PROJECT_Sick-Boy.md` §11 has the canonical phase plan. Current state lives in `SESSION.md` → "Phase Tracker".

| Phase | Title | Status |
|---|---|---|
| 0 | Repo & Environment Setup | shell ✅ · CI/Supabase deferred |
| 1 | Auth, Onboarding, Shell | layout shell ✅ · auth pending |
| 2 | Live Data Layer & Core Pages | pending |
| 3 | ML Service (FastAPI) | pending |
| 4 | Intelligence Hub & ML Pages | pending |
| 5 | Predictions, Profile, Notifications | pending |
| 6 | Bonus / Wishlist Features | pending |
| 7 | Polish, Performance, Deploy | pending |

## Design principles

1. **Dark mode only.** No theme toggle, ever. `#0A0A0A` background, `#00D563` accent, `#FFD700` premium, `#FF3B3B` live.
2. **Mobile-first.** Test at 375px before declaring anything done.
3. **Functional over fancy.** Skeleton loaders, designed empty states, real backends — no placeholders.
4. **TypeScript strict.** No `any`, no `@ts-ignore`.
5. **Server-only API keys.** Only Supabase URL + anon key reach the browser.
