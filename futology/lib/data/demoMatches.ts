import { CLUBS, type ClubSeed } from "./clubs";

export type MatchStatus = "scheduled" | "live" | "finished";

export type DemoMatch = {
  id: number;
  leagueId: number;
  leagueName: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  status: MatchStatus;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  venue?: string;
};

const VENUES: Record<number, string> = {
  33: "Old Trafford",
  40: "Anfield",
  50: "Etihad Stadium",
  49: "Stamford Bridge",
  42: "Emirates Stadium",
  47: "Tottenham Hotspur Stadium",
  541: "Santiago Bernabéu",
  529: "Spotify Camp Nou",
  530: "Cívitas Metropolitano",
  157: "Allianz Arena",
  165: "Signal Iduna Park",
  85: "Parc des Princes",
  496: "Allianz Stadium",
  489: "San Siro",
  505: "San Siro",
  492: "Diego Armando Maradona",
};

function pair(homeId: number, awayId: number, leagueId: number): [ClubSeed, ClubSeed, number] {
  const home = CLUBS.find((c) => c.id === homeId);
  const away = CLUBS.find((c) => c.id === awayId);
  if (!home || !away) throw new Error(`Missing club ${homeId} or ${awayId}`);
  return [home, away, leagueId];
}

function makeMatch(
  id: number,
  homeId: number,
  awayId: number,
  leagueId: number,
  leagueName: string,
  kickoff: Date,
  status: MatchStatus,
  scores?: { home: number; away: number; minute?: number },
): DemoMatch {
  const [home, away] = pair(homeId, awayId, leagueId);
  return {
    id,
    leagueId,
    leagueName,
    homeTeamId: homeId,
    awayTeamId: awayId,
    homeTeam: home.shortName,
    awayTeam: away.shortName,
    kickoff: kickoff.toISOString(),
    status,
    homeScore: scores?.home,
    awayScore: scores?.away,
    minute: scores?.minute,
    venue: VENUES[homeId] ?? `${home.shortName} Stadium`,
  };
}

function offsetDate(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours, d.getMinutes(), 0, 0);
  return d;
}

/**
 * Returns the seeded match list — 3 live, 4 finished, 11 scheduled — with
 * kickoff times computed relative to the current clock so the demo always
 * looks "today's fixtures" no matter when it's loaded.
 */
export function getDemoMatches(): DemoMatch[] {
  return [
    // LIVE — happening now
    makeMatch(1, 33, 40, 39, "Premier League", offsetDate(-1), "live", { home: 1, away: 1, minute: 67 }),
    makeMatch(2, 541, 529, 140, "La Liga", offsetDate(-0.5), "live", { home: 2, away: 0, minute: 38 }),
    makeMatch(3, 157, 165, 78, "Bundesliga", offsetDate(-1.5), "live", { home: 3, away: 2, minute: 81 }),

    // FINISHED — earlier today
    makeMatch(4, 50, 49, 39, "Premier League", offsetDate(-4), "finished", { home: 2, away: 1 }),
    makeMatch(5, 42, 47, 39, "Premier League", offsetDate(-6), "finished", { home: 3, away: 0 }),
    makeMatch(6, 530, 532, 140, "La Liga", offsetDate(-3), "finished", { home: 1, away: 1 }),
    makeMatch(7, 489, 505, 135, "Serie A", offsetDate(-5), "finished", { home: 0, away: 2 }),

    // UPCOMING — later today
    makeMatch(8, 34, 66, 39, "Premier League", offsetDate(2), "scheduled"),
    makeMatch(9, 51, 48, 39, "Premier League", offsetDate(4), "scheduled"),
    makeMatch(10, 548, 543, 140, "La Liga", offsetDate(3), "scheduled"),
    makeMatch(11, 496, 492, 135, "Serie A", offsetDate(5), "scheduled"),

    // UPCOMING — tomorrow
    makeMatch(12, 85, 91, 61, "Ligue 1", offsetDate(20), "scheduled"),
    makeMatch(13, 81, 79, 61, "Ligue 1", offsetDate(22), "scheduled"),
    makeMatch(14, 168, 173, 78, "Bundesliga", offsetDate(24), "scheduled"),
    makeMatch(15, 487, 497, 135, "Serie A", offsetDate(27), "scheduled"),

    // UPCOMING — day after
    makeMatch(16, 194, 197, 88, "Eredivisie", offsetDate(44), "scheduled"),
    makeMatch(17, 228, 212, 94, "Primeira Liga", offsetDate(46), "scheduled"),
    makeMatch(18, 33, 50, 39, "Premier League", offsetDate(48), "scheduled"),
  ];
}

/** Filters a match array down to only currently-live matches. */
export function liveMatches(matches: DemoMatch[]): DemoMatch[] {
  return matches.filter((m) => m.status === "live");
}

/** Filters by `MatchStatus`, with `"all"` short-circuiting to identity. */
export function matchesByStatus(
  matches: DemoMatch[],
  status: MatchStatus | "all",
): DemoMatch[] {
  if (status === "all") return matches;
  return matches.filter((m) => m.status === status);
}

/** Groups matches by league name, preserving array order within each group. */
export function matchesByLeague(matches: DemoMatch[]): Map<string, DemoMatch[]> {
  const map = new Map<string, DemoMatch[]>();
  for (const m of matches) {
    const list = map.get(m.leagueName) ?? [];
    list.push(m);
    map.set(m.leagueName, list);
  }
  return map;
}
