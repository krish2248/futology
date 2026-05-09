# Deployment

FUTOLOGY currently has one live target — GitHub Pages — and a planned
second target on Vercel for the real-services cutover.

## Live URL

[`https://krish2248.github.io/futology/`](https://krish2248.github.io/futology/)

## GitHub Pages — automatic

Every push to `main` triggers `.github/workflows/deploy.yml`, which:

1. Checks out the repo.
2. Installs dependencies in `futology/` via `npm ci`.
3. Type-checks with `tsc --noEmit`.
4. Runs `npm run build:export` with `NEXT_PUBLIC_BASE_PATH=/futology`.
5. Uploads the resulting `out/` artifact via `actions/upload-pages-artifact`.
6. Deploys via `actions/deploy-pages`.

Total time: ~90 seconds. The deploy URL is logged in the workflow run.

### Local reproduction

```bash
cd futology
npm ci
npm run build:export
npx serve out
```

### Why GH Pages stays demo-only

- Pages serves static files only — no middleware, no route handlers, no
  edge runtime. Real-services code paths (auth, RapidAPI proxy, ML
  service) need a server runtime.
- The base path (`/futology`) is fixed at build time. Custom domains can
  remove the prefix later.

## Vercel — planned

When the Supabase + RapidAPI cutover lands we'll add a Vercel deploy that
runs the same code without `NEXT_OUTPUT=export`. That:

- Re-enables `app/api/*/route.ts` handlers.
- Re-enables `middleware.ts` for SSR auth (or keeps `AuthGate` and uses
  Supabase's SSR helpers — TBD).
- Lets `next/image` optimise remote crests and player photos.
- Hosts cron jobs (settlement, sentiment polling) as Edge Functions or
  a separate Railway worker.

Both deploys live off `main`; the env variable picks the build shape.

## Pre-deploy checks

Before promoting changes that touch the build:

```bash
cd futology
npx tsc --noEmit              # 1. Type check
npm run lint                  # 2. ESLint
npm run build:export          # 3. Static build smoke
npx playwright test           # 4. E2E smoke (optional, slower)
```

When real-services land, also run:

```bash
npx tsx scripts/check_env.ts  # 5. Env presence check
```

## Rolling back

GH Pages keeps the last successful artifact live until the next deploy
overwrites it. To roll back, revert the offending commit on `main` —
the next deploy ships the previous content. There's no "promote a
specific artifact" UI, so revert is the supported path.

## Manual deploy

Pages workflow can be re-run from the **Actions** tab without changing
code. Useful for re-deploying after a transient `npm ci` flake.
