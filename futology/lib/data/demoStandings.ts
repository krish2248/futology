import { CLUBS } from "./clubs";
import { findLeague } from "./leagues";

export type StandingRow = {
  position: number;
  prevPosition: number;
  teamId: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
};

export type StandingsBands = {
  ucl: number; // top N spots get UCL color
  uel: number; // next M spots get UEL color
  conference: number;
  relegation: number; // bottom N spots get relegation color
};

/**
 * Per-league qualification band sizes used to colour the standings table.
 * `ucl` rows get the gold accent, `uel` and `conference` get diminishing
 * European-spot accents, and `relegation` rows get the live-red trim.
 */
export const BANDS_BY_LEAGUE: Record<number, StandingsBands> = {
  39: { ucl: 4, uel: 1, conference: 1, relegation: 3 }, // Premier League
  140: { ucl: 4, uel: 1, conference: 1, relegation: 3 }, // La Liga
  135: { ucl: 4, uel: 1, conference: 1, relegation: 3 }, // Serie A
  78: { ucl: 4, uel: 1, conference: 1, relegation: 3 }, // Bundesliga (simplified)
  61: { ucl: 3, uel: 1, conference: 1, relegation: 3 }, // Ligue 1
};

function seeded(seed: number) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Builds a deterministic 16-team standings table for the given league.
 * Seeded by `leagueId` so the same league always produces the same
 * ordering and per-team stats — the standings page is SSG'd, so any
 * non-determinism here would cause hydration mismatches.
 */
export function getDemoStandings(leagueId: number): StandingRow[] {
  const league = findLeague(leagueId);
  if (!league) return [];
  const teams = CLUBS.filter((c) => c.leagueId === leagueId);
  if (teams.length === 0) return [];
  const rnd = seeded(leagueId * 31);

  const rows: StandingRow[] = teams.map((team, i) => {
    const played = 10 + Math.floor(rnd() * 8);
    const won = Math.max(0, Math.floor(rnd() * played));
    const drawn = Math.max(0, Math.floor(rnd() * (played - won)));
    const lost = played - won - drawn;
    const goalsFor = won * 2 + drawn + Math.floor(rnd() * 10);
    const goalsAgainst = lost * 2 + drawn + Math.floor(rnd() * 8);
    const points = won * 3 + drawn;
    const form: ("W" | "D" | "L")[] = Array.from({ length: 5 }, () => {
      const r = rnd();
      return r < 0.45 ? "W" : r < 0.7 ? "D" : "L";
    });
    return {
      position: 0,
      prevPosition: 0,
      teamId: team.id,
      teamName: team.shortName,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points,
      form,
    };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor,
  );
  rows.forEach((row, i) => {
    row.position = i + 1;
    // Make prev position close to current with small jitter
    const jitter = Math.floor(rnd() * 3) - 1;
    row.prevPosition = Math.max(1, Math.min(rows.length, row.position + jitter));
  });

  return rows;
}

/** Looks up qualification bands; falls back to a sensible default for unknown leagues. */
export function getBandsForLeague(leagueId: number): StandingsBands {
  return (
    BANDS_BY_LEAGUE[leagueId] ?? {
      ucl: 4,
      uel: 1,
      conference: 1,
      relegation: 3,
    }
  );
}
