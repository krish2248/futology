/**
 * Maps our API-Football league IDs (the canonical ID space across the demo
 * data layer — see `leagues.ts`) to football-data.org competition codes,
 * which is what the ML-service `/proxy/*` endpoints expect.
 *
 * Only the competitions on football-data.org's free tier are listed. Any
 * league not in this map has no real-data source, so the Auto-routers fall
 * back to the seeded demo standings/scorers for it.
 *
 * Reference: https://docs.football-data.org/general/v4/lookup_tables.html
 */
export const FOOTBALL_DATA_CODE: Record<number, string> = {
  39: "PL", // Premier League
  140: "PD", // La Liga (Primera División)
  135: "SA", // Serie A
  78: "BL1", // Bundesliga
  61: "FL1", // Ligue 1
  2: "CL", // UEFA Champions League
  88: "DED", // Eredivisie
  94: "PPL", // Primeira Liga
  71: "BSA", // Brasileirão Série A
};

/**
 * Returns the football-data.org competition code for an API-Football league
 * ID, or `undefined` when the league isn't covered by the free-tier proxy.
 */
export function footballDataCode(leagueId: number): string | undefined {
  return FOOTBALL_DATA_CODE[leagueId];
}

/** Reverse of `FOOTBALL_DATA_CODE`: football-data code → API-Football ID. */
const LEAGUE_ID_BY_CODE: Record<string, number> = Object.fromEntries(
  Object.entries(FOOTBALL_DATA_CODE).map(([id, code]) => [code, Number(id)]),
);

/**
 * Returns the API-Football league ID for a football-data.org competition
 * code (e.g. `"PL"` → `39`), or `undefined` for unmapped codes. Used to tag
 * proxy fixtures with the canonical league ID the front-end understands.
 */
export function leagueIdFromCode(code: string): number | undefined {
  return LEAGUE_ID_BY_CODE[code];
}

/** Every football-data code the proxy can serve, e.g. for a batched fixtures call. */
export const ALL_FOOTBALL_DATA_CODES: string[] = Object.values(FOOTBALL_DATA_CODE);
