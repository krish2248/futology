# Demo data conventions

The whole front-end ships in **demo mode** today. Every feature works
end-to-end without external keys because `lib/data/*.ts` provides seeded
input that mirrors the shape we'll consume from real APIs.

This doc is the contract between demo and real data. Read this before
adding or changing seeded modules so the cutover stays mechanical.

## Identity invariants

- **League IDs** match API-Football competition IDs. `findLeague(39)`
  returns the Premier League regardless of demo or real mode.
- **Club IDs** match API-Football team IDs. Same story.
- **Player IDs** match API-Football player IDs. Same story.
- **Fixture IDs** in demo data are 1..N — not real API IDs — but they're
  stable across renders so settlement and Predict tabs work consistently.

When you swap a demo path for a real path, you do **not** rewrite IDs.
You rewrite the call site only.

## Determinism

Demo data should look the same across:

- Two renders of the same page in one session.
- Two SSG builds of the same page (so per-league standings pages don't
  hydrate-mismatch).

Achieve this by seeding any randomness with the entity ID — see
`lib/ml/predictor.ts#seeded` and `lib/data/demoStandings.ts#seeded` for
the linear-congruential PRNG pattern.

## Time-relative data

Match kickoff times and news `publishedAt` are computed relative to the
current clock so the demo always looks "today" no matter when it loads.
Pattern: `offsetDate(hours)` in `demoMatches.ts`.

## Personalisation

Demo personalisation works against the user's followed clubs / players /
leagues from the session store. Each item in `demoNews.ts` carries
`relatedClubIds`, `relatedPlayerIds`, `relatedLeagueIds` — adding new
items requires populating these so the "For you" feed has signal.

## Adding a new demo module

1. Define a `Demo*` type in the new file.
2. Export pure helper functions (filter, lookup, transform). No I/O,
   no DOM access, no global state.
3. Re-export through the API client (`lib/api/client.ts`) wrapped in a
   resolved Promise so call sites keep their async signature for the
   real cutover.
4. Add a JSDoc block at the top of the module explaining what shape it
   produces and which real API will replace it (e.g.
   "API-Football `/players?id=...`").
5. Wire a hook (`hooks/use*.ts`) that calls the API client method with
   the appropriate cache key.

## When to *not* add demo data

If a feature depends on real-time external state (live matchday odds,
push notifications from cron jobs) that has no meaningful demo shape,
don't fake it. Stub the UI behind a "Coming with live data" placeholder
and put the work behind the cutover.

## Seeded entity catalogue

| File | Count | Notes |
|------|-------|-------|
| `leagues.ts`         | 20  | Top 5 European elites, UEFA comps, MLS, plus rising leagues. |
| `clubs.ts`           | 40+ | Across the top 6 leagues. `CLUB_QUICK_PICKS` powers onboarding suggestions. |
| `players.ts`         | 24  | Elite stars. IDs match API-Football. |
| `tournaments.ts`     | 10  | World Cup, Euros, Copa, AFCON, Asian Cup, CWC, plus four domestic cups. |
| `demoMatches.ts`     | 18  | 3 live, 4 finished, 11 scheduled — relative-time computed. |
| `demoStandings.ts`   | 16/league | Deterministic, seeded by `leagueId`. |
| `demoNews.ts`        | 18  | 5 categories with personalisation hooks. |
| `demoPredictions.ts` | per match | Deterministic seeded probabilities. |
| `demoLeagues.ts`     | 3   | Public prediction leagues with synthetic rosters. |
| `demoCommunity.ts`   | 3 polls + 3 trending + 10 leaders | Surfaces the Community tab. |
| `demoMomentum.ts`    | per match | Per-minute xG for Match Momentum. |
| `demoReferees.ts`    | 14 refs × 6 leagues | For Referee Bias. |
| `demoWeather.ts`     | 5 buckets × 5 leagues | For Weather Impact. |
| `demoOdds.ts`        | per fixture × 5 books | For Odds Movement Alerts. |
| `demoInjuries.ts`    | 0–4 per team | For Injury Intelligence. |
| `demoPress.ts`       | per team | PPDA + 12×8 heatmap. |
