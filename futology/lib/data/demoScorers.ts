import { clubsByLeague } from "./clubs";
import { PLAYERS } from "./players";

export type ScorerRow = {
  rank: number;
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  goals: number;
  assists: number;
  penalties: number;
  playedMatches: number;
};

// Plausible surnames used to fill out the synthetic portion of a league's
// scorer chart once the seeded real stars run out. Kept generic on purpose —
// this is demo fallback data, not a claim about who's actually scoring.
const SURNAMES = [
  "Andersson", "Bianchi", "Costa", "Delgado", "Eriksen", "Fernández", "Gómez",
  "Hassan", "Ivanov", "Jovanović", "Keller", "López", "Moretti", "Novak",
  "Okafor", "Petersen", "Quintero", "Ribeiro", "Schmidt", "Tavares", "Ünal",
  "Vargas", "Weber", "Yilmaz", "Zanetti",
];

const INITIALS = ["A", "B", "D", "E", "F", "G", "J", "K", "L", "M", "N", "R", "S", "T"];

function seeded(seed: number) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Builds a deterministic 12-deep top-scorers chart for a league. Real seeded
 * stars in that league (from `players.ts`) are placed at the top, then the
 * remainder is filled with synthetic entries assigned to the league's clubs.
 *
 * Seeded by `leagueId` so the chart is stable across renders — the league
 * page is SSG'd, so non-determinism here would risk a hydration mismatch.
 * The return shape matches the ML-service `/proxy/scorers` reshape so the
 * Auto-router never has to deal with two shapes.
 */
export function getDemoScorers(leagueId: number): ScorerRow[] {
  const teams = clubsByLeague(leagueId);
  if (teams.length === 0) return [];
  const rnd = seeded(leagueId * 53);

  const clubByName = new Map<string, (typeof teams)[number]>();
  for (const t of teams) {
    clubByName.set(t.name, t);
    clubByName.set(t.shortName, t);
  }

  const rows: ScorerRow[] = [];
  const usedNames = new Set<string>();
  let goals = 18 + Math.floor(rnd() * 6); // start ~18-23 for the golden boot

  // Real attacking stars who play in this league go to the top of the chart.
  const stars = PLAYERS.filter(
    (p) => (p.position === "FWD" || p.position === "MID") && clubByName.has(p.team),
  );
  for (const star of stars.slice(0, 4)) {
    const club = clubByName.get(star.team)!;
    rows.push(makeRow(rows.length + 1, star.id, star.name, club, goals, rnd));
    usedNames.add(star.name);
    goals = Math.max(4, goals - 1 - Math.floor(rnd() * 3));
  }

  // Fill the rest with synthetic scorers spread across the league's clubs.
  let synthId = 990000 + leagueId * 100;
  let guard = 0;
  while (rows.length < 12 && guard++ < 200) {
    const club = teams[Math.floor(rnd() * teams.length)];
    const name = `${INITIALS[Math.floor(rnd() * INITIALS.length)]}. ${
      SURNAMES[Math.floor(rnd() * SURNAMES.length)]
    }`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    rows.push(makeRow(rows.length + 1, synthId++, name, club, goals, rnd));
    goals = Math.max(3, goals - Math.floor(rnd() * 2) - 1);
  }

  return rows;
}

function makeRow(
  rank: number,
  playerId: number,
  playerName: string,
  club: { id: number; shortName: string },
  goals: number,
  rnd: () => number,
): ScorerRow {
  return {
    rank,
    playerId,
    playerName,
    teamId: club.id,
    teamName: club.shortName,
    goals,
    assists: Math.floor(rnd() * 8),
    penalties: Math.floor(rnd() * Math.min(5, goals)),
    playedMatches: 14 + Math.floor(rnd() * 6),
  };
}
