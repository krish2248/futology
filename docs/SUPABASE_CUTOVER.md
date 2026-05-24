# Supabase + Vercel cutover

This is the playbook for replacing the demo auth and persistence layer
with real Supabase auth, RLS-protected tables, and a Vercel deployment
target — while keeping the GitHub Pages demo at
`https://krish2248.github.io/futology/` open to everyone.

> **Status:** the codebase is plumbed to flip at runtime. With both
> `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set,
> `lib/auth/auto.ts` routes sign-in to Supabase OTP. With them unset,
> the existing Zustand demo path runs unchanged.

## Architecture

| Surface | Target | Auth |
|---|---|---|
| `https://krish2248.github.io/futology/` (GH Pages) | Static export, no env vars | Demo Zustand session — open to all |
| `https://futology.vercel.app/` (Vercel — to create) | Next.js SSR with `output` un-set | Supabase OTP + RLS |

The same code lives in `main` for both. The fork point is the build
env: GH Pages workflow leaves Supabase env empty; Vercel project sets
both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## One-time setup (you)

### 1. Create the Supabase project

1. Sign in at <https://supabase.com> with the GitHub OAuth that owns
   `krish2248/futology`.
2. **New project** → name `futology-prod`, region nearest you, strong
   DB password (save it).
3. Wait ~2 minutes for the project to provision.

### 2. Apply the schema

1. In Supabase → **SQL Editor** → **New query**.
2. Paste the contents of `supabase/schema.sql` (this repo's root).
3. Run it as a single batch. It creates every table + RLS policy +
   trigger + realtime publication from bible §6.

Verify in **Table Editor** that the 14 tables are present:

```
profiles · user_followed_leagues · user_followed_clubs · user_followed_players · user_followed_tournaments
predictions · prediction_leagues · prediction_league_members · community_polls · poll_votes
ml_match_predictions · ml_transfer_values · match_sentiment_snapshots · notifications
```

### 3. Enable email OTP

1. **Authentication** → **Providers** → **Email**.
2. Disable "Confirm email" (we use magic links, not signup confirmation).
3. **Authentication** → **URL Configuration**:
   - Site URL: `https://futology.vercel.app` (or whatever Vercel issues).
   - Add the GH Pages URL to the allowlist too if you want to test demo
     login redirects: `https://krish2248.github.io/futology`.
4. **Email Templates** → "Magic Link": leave default for now. The link
   redirects back to `/onboarding` after click (see
   `lib/auth/auto.ts#signInAuto`).

### 4. Generate fresh types (optional but recommended)

`futology/lib/supabase/types.ts` is hand-typed from bible §6 today.
Once the schema is live in your project, regenerate to catch any
column-default mismatches:

```bash
npx supabase login
npx supabase gen types typescript \
  --project-id "<your-project-id>" \
  --schema public \
  > futology/lib/supabase/types.ts
```

Commit the diff. The hand-typed file is intentionally tight enough that
the regen should be ~0 lines of change in the happy path.

### 5. Deploy to Vercel

1. <https://vercel.com> → **New Project** → import `krish2248/futology`.
2. Root directory: `futology`.
3. Framework: Next.js (autodetect).
4. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Supabase **Project Settings → API → URL**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same page, **anon public** key
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, **service_role** key (server-only)
   - `NEXT_PUBLIC_ML_API_URL` — Railway URL once that's live (Session 15)
   - `NEXT_PUBLIC_ML_API_TOKEN` — Railway bearer token
   - `NEXT_PUBLIC_APP_URL` — your Vercel domain
   - **Do NOT set** `NEXT_OUTPUT=export` here — Vercel needs the
     server runtime for SSR auth cookies.
5. Deploy. Watch the build log for any "Module not found" — the
   server-side Supabase client uses `next/headers` which only exists
   in SSR builds.

### 6. Verify live

After Vercel deploys:

1. Visit `https://<your-vercel-url>/login`.
2. Enter your email → submit.
3. Check inbox for the magic link. Click it.
4. You land on `/onboarding`. Pick leagues / clubs / players.
5. Now visit `https://<your-vercel-url>/profile` — your follows should
   round-trip to Postgres (you'll see new rows in
   `user_followed_clubs` etc. via the Supabase Table Editor).

## What still needs wiring after step 6

The auth router is done. The rest of the demo data layer still goes
to Zustand; piece-by-piece migration to Supabase follows in subsequent
sessions:

- [ ] `predictions[]` Zustand slice → `predictions` table inserts on
      save + edge-function settlement on `is_settled = true`
- [ ] `predictionLeagues[]` → `prediction_leagues` + members joins
- [ ] `notifications[]` → `notifications` table + realtime subscription
      in `NotificationBell`
- [ ] `pollVotes[]` → `poll_votes` table

Each migration is a single Zustand action swap. See
`lib/store/session.ts` for the current shape.

## Rolling back

If something goes wrong post-deploy:

- **Bad Supabase deploy**: clear the Vercel env vars and the
  `isSupabaseConfigured()` check immediately routes back to the demo
  Zustand path. No code change needed.
- **Bad schema migration**: Supabase's **Database → Migrations** UI
  has point-in-time restore on the paid tier. On free tier, the
  schema lives in this file — drop and re-apply.
- **Demo regressions**: the GH Pages workflow doesn't read Supabase
  env, so the public demo stays put regardless of what happens to the
  Vercel target.

## Cost guardrails

- Supabase free tier: 500 MB DB, 50K MAU, 5 GB egress/mo. Plenty for
  the project at FUTOLOGY's scale.
- Vercel free tier: 100 GB bandwidth, no per-build cost. Fine.
- The only paid surface is Railway (ML service, ~$5/mo).
