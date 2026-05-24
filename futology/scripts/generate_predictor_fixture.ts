/**
 * Generates the parity fixture consumed by
 * `ml-service/tests/test_parity.py`. Run with:
 *
 *   cd futology
 *   npx tsx scripts/generate_predictor_fixture.ts
 *
 * Re-run after any intentional change to `lib/ml/predictor.ts` so the
 * Python stub stays in lockstep with the TS source of truth.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CLUBS } from "../lib/data/clubs";
import { LEAGUES } from "../lib/data/leagues";
import { predictMatch } from "../lib/ml/predictor";

type FixtureCase = {
  homeId: number;
  awayId: number;
  competitionId: number | null;
  homeShortName: string;
  awayShortName: string;
  leagueShortName: string;
  leagueTier: "elite" | "major" | "rising";
  expected: ReturnType<typeof predictMatch>;
};

// A fixed matrix sized to cover every divergence point: elite-tier vs
// major-tier (tier boost 4 vs 2), both directions (proves seed is order-
// dependent), and the optional-competition fallback. Rising-tier
// validation is skipped — no rising-tier clubs in the seed data yet.
const PAIRS: Array<{ homeId: number; awayId: number; competitionId?: number }> = [
  { homeId: 541, awayId: 529, competitionId: 140 }, // elite — Real Madrid vs Barcelona
  { homeId: 50, awayId: 33, competitionId: 39 }, // elite — Man City vs Man United
  { homeId: 157, awayId: 165, competitionId: 78 }, // elite — Bayern vs Dortmund
  { homeId: 489, awayId: 505, competitionId: 135 }, // elite — Milan vs Inter
  { homeId: 85, awayId: 81, competitionId: 61 }, // elite — PSG vs Marseille
  { homeId: 197, awayId: 194, competitionId: 88 }, // major — PSV vs Ajax
  { homeId: 228, awayId: 211, competitionId: 94 }, // major — Sporting vs Benfica
  { homeId: 529, awayId: 541, competitionId: 140 }, // reverse of #1 — must differ from #1
  { homeId: 165, awayId: 157, competitionId: 78 }, // reverse of #3 — must differ from #3
];

// Note: the "missing competitionId" case is intentionally not in the
// matrix. The TS client always resolves it to `home.leagueId` before
// calling the service, so Python never sees `null` in production. The
// stubs differ in that fallback (TS knows the home club's leagueId;
// Python only has the home id), so testing that path would surface a
// non-issue.

const cases: FixtureCase[] = PAIRS.map(({ homeId, awayId, competitionId }) => {
  const home = CLUBS.find((c) => c.id === homeId);
  const away = CLUBS.find((c) => c.id === awayId);
  if (!home || !away) {
    throw new Error(`Missing seed club: home=${homeId} away=${awayId}`);
  }
  const league = LEAGUES.find((l) => l.id === home.leagueId);
  if (!league) {
    throw new Error(`Missing league seed for home club ${homeId} (leagueId=${home.leagueId})`);
  }
  const expected = predictMatch({ home, away, competitionId });
  return {
    homeId,
    awayId,
    competitionId: competitionId ?? null,
    homeShortName: home.shortName,
    awayShortName: away.shortName,
    leagueShortName: league.shortName,
    leagueTier: league.tier,
    expected,
  };
});

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../ml-service/tests/fixtures/match_parity.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
  out,
  JSON.stringify(
    {
      generatedBy: "futology/scripts/generate_predictor_fixture.ts",
      note: "Regenerate via `npx tsx scripts/generate_predictor_fixture.ts` after any intentional change to lib/ml/predictor.ts.",
      cases,
    },
    null,
    2,
  ) + "\n",
);

console.log(`Wrote ${cases.length} parity cases → ${out}`);
