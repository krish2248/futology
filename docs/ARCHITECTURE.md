# Architecture

A short, opinionated tour of how FUTOLOGY is wired together. For the
canonical product spec see `PROJECT_Sick-Boy.md`; for working state see
`SESSION.md`.

## High-level shape

```
   ┌──────────────────────────────────┐
   │  Browser (Next.js 14, dark-only) │
   │   ┌──────────┐  ┌──────────────┐ │
   │   │ AuthGate │  │ TanStack QC  │ │
   │   └────┬─────┘  └──────┬───────┘ │
   │        ▼               ▼         │
   │   Zustand stores   lib/api/client│
   │        │               │         │
   └────────┼───────────────┼─────────┘
            ▼               ▼
   ┌──────────────┐  ┌────────────────────────┐
   │ localStorage │  │ in-memory demo lookups  │
   │ (session,    │  │ (lib/data/demo*.ts)     │
   │ preferences) │  │                         │
   └──────────────┘  └────────────────────────┘
```

When the cutover lands, the right-hand box becomes:

```
   ┌──────────────────────────┐
   │ Next.js route handlers    │
   │  → RapidAPI proxy         │
   │  → Supabase Postgres / RT │
   │  → FastAPI ML service     │
   └──────────────────────────┘
```

## Key modules

| Layer       | Path                          | Responsibility |
|-------------|-------------------------------|----------------|
| Routing     | `app/`                        | Next.js App Router pages and `loading.tsx` skeletons. Static-export friendly. |
| State       | `lib/store/session.ts`        | Auth shadow, follows, predictions, leagues, polls, notifications. Zustand + localStorage persist. |
| State       | `lib/store/preferences.ts`    | Notification + email preferences. Separate slice so toggles don't churn auth. |
| Data        | `lib/data/*.ts`               | Seed data — leagues, clubs, players, matches, news, predictions, sentiment, tactics, transfers. Pure functions. |
| ML          | `lib/ml/*.ts`                 | `predictMatch`, `predictTransferValue`, `runSimulation`. Pure functions, ready to swap for FastAPI calls. |
| API client  | `lib/api/client.ts`           | Single `api` object that all hooks call. Currently demo lookups; cutover replaces method bodies with `fetch`. |
| Hooks       | `hooks/useLiveScores.ts`      | TanStack Query wrappers — live scores poll every 30s, fixtures cache 5min, standings cache 5min. |
| Components  | `components/{layout,shared,cards,predictions,intelligence}` | Presentational + light interactivity. Class-based ErrorBoundary lives here. |
| Utilities   | `lib/utils/*.ts`              | `cn`, formatters, helpers. No domain logic. |

## Cutover-friendly invariants

1. **Demo branch isolation.** Every API surface has exactly one branch
   point: `if (isDemoMode)` in route handlers, or the body of each
   `api.*` method. Replacing a single body migrates one route.
2. **Stable response envelope.** Routes return `{ data, demo }` so the
   client knows whether it's looking at live or seeded data.
3. **Stable cache headers.** `lib/api/config.ts` centralises Cache-Control
   strings — bible §10. Don't inline cache headers in handlers.
4. **Pure ML.** `lib/ml/*` is side-effect-free and seeded so demo and
   real outputs share the same shape. Real outputs come from FastAPI
   over the same TypeScript types.
5. **Auth shadow.** `lib/store/session.ts#signIn` writes a cookie that
   middleware (or AuthGate after the static-export refactor) checks. The
   cookie shape stays valid through the Supabase swap.

## Static export vs. SSR

The GH Pages deploy is a **static export** (`output: 'export'`), which:

- Disallows `middleware.ts`, `route.ts` handlers, `next/image`
  optimisation, Next-Auth, and ISR.
- Forces `client-side` auth gating via `components/layout/AuthGate.tsx`.
- Forces all data to come from in-memory lookups in `lib/data/*`.

The Vercel target — when we add it — will run the same code with
`NEXT_OUTPUT` unset, so middleware and route handlers light up. Both
deploys ship from `main`; the env variable picks the build shape.

## Performance budget

- First-load JS ≤ 145 KB FLJS for any single page.
- The Tournament Simulator runs ≤ 25k Monte Carlo iterations on the main
  thread; if we ever raise the cap, port to a Web Worker.
- TanStack Query: `staleTime: 30s`, `gcTime: 5min`, single retry, no
  refocus refetch — bible §Phase 7.
