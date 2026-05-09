import type { DemoMatch } from "./demoMatches";

export type MatchEvent = {
  minute: number;
  type: "goal" | "yellow" | "red" | "sub";
  team: "home" | "away";
  player: string;
  detail?: string;
};

export type MatchStats = {
  label: string;
  home: number;
  away: number;
  unit?: "%" | "";
};

export type LineupPlayer = {
  number: number;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  // Normalised pitch coords. x: 0–100 (own goal → opp goal), y: 0–100 (left → right)
  x: number;
  y: number;
};

export type Lineup = {
  formation: string;
  starters: LineupPlayer[];
  subs: { number: number; name: string }[];
};

export type H2HEntry = {
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  competition: string;
};

export type MatchDetail = {
  match: DemoMatch;
  events: MatchEvent[];
  stats: MatchStats[];
  homeLineup: Lineup;
  awayLineup: Lineup;
  h2h: H2HEntry[];
  attendance?: number;
  referee?: string;
};

function seeded(seed: number) {
  let s = (seed * 1664525 + 1013904223) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const HOME_NAMES = [
  "Onana",
  "Dalot",
  "Maguire",
  "Martínez",
  "Shaw",
  "Casemiro",
  "Mainoo",
  "Bruno",
  "Garnacho",
  "Rashford",
  "Højlund",
];
const AWAY_NAMES = [
  "Alisson",
  "Alexander-Arnold",
  "Konaté",
  "Van Dijk",
  "Robertson",
  "Mac Allister",
  "Szoboszlai",
  "Jones",
  "Salah",
  "Núñez",
  "Díaz",
];

const SUBS = ["Sub 1", "Sub 2", "Sub 3", "Sub 4", "Sub 5", "Sub 6", "Sub 7"];

const FORMATION_4_3_3: Array<[number, number, LineupPlayer["position"]]> = [
  [10, 50, "GK"],
  [25, 12, "DEF"],
  [25, 36, "DEF"],
  [25, 64, "DEF"],
  [25, 88, "DEF"],
  [50, 25, "MID"],
  [50, 50, "MID"],
  [50, 75, "MID"],
  [80, 18, "FWD"],
  [80, 50, "FWD"],
  [80, 82, "FWD"],
];

function buildLineup(side: "home" | "away", names: readonly string[]): Lineup {
  const positions = FORMATION_4_3_3;
  const starters: LineupPlayer[] = positions.map(([px, py, pos], i) => ({
    number: i + 1,
    name: names[i] ?? `Player ${i + 1}`,
    position: pos,
    // Mirror away team to the right half visually
    x: side === "home" ? px : 100 - px,
    y: py,
  }));
  return {
    formation: "4-3-3",
    starters,
    subs: SUBS.map((n, i) => ({ number: 12 + i, name: n })),
  };
}

const REFEREES = ["M. Oliver", "A. Marciniak", "S. Marciniak", "J. Mateu Lahoz", "F. Letexier"];

/**
 * Synthesises the full match-detail payload (events, stats, lineups, H2H)
 * powering `MatchDetailSheet`. Seeded by fixture ID so the same match
 * always yields the same detail across renders.
 *
 * Cutover: each section gets replaced by a sub-fetch of the corresponding
 * API-Football endpoint (`/fixtures/events`, `/fixtures/statistics`,
 * `/fixtures/lineups`, `/fixtures/headtohead`) — the return shape is
 * already correct.
 */
export function getDemoMatchDetail(match: DemoMatch): MatchDetail {
  const rnd = seeded(match.id * 7);
  const minute = match.minute ?? 90;
  const homeGoals = match.homeScore ?? 0;
  const awayGoals = match.awayScore ?? 0;
  const events: MatchEvent[] = [];

  // Generate goal events from final scoreline
  for (let i = 0; i < homeGoals; i++) {
    events.push({
      minute: Math.max(2, Math.floor(rnd() * minute)),
      type: "goal",
      team: "home",
      player: HOME_NAMES[Math.floor(rnd() * HOME_NAMES.length)],
    });
  }
  for (let i = 0; i < awayGoals; i++) {
    events.push({
      minute: Math.max(2, Math.floor(rnd() * minute)),
      type: "goal",
      team: "away",
      player: AWAY_NAMES[Math.floor(rnd() * AWAY_NAMES.length)],
    });
  }

  // Yellow cards 0–4 spread
  const yellowCount = Math.floor(rnd() * 5);
  for (let i = 0; i < yellowCount; i++) {
    events.push({
      minute: Math.max(8, Math.floor(rnd() * minute)),
      type: "yellow",
      team: rnd() > 0.5 ? "home" : "away",
      player:
        rnd() > 0.5
          ? HOME_NAMES[Math.floor(rnd() * HOME_NAMES.length)]
          : AWAY_NAMES[Math.floor(rnd() * AWAY_NAMES.length)],
    });
  }

  events.sort((a, b) => a.minute - b.minute);

  const possessionHome = 35 + Math.floor(rnd() * 30);
  const stats: MatchStats[] = [
    { label: "Possession", home: possessionHome, away: 100 - possessionHome, unit: "%" },
    { label: "Shots", home: 8 + Math.floor(rnd() * 12), away: 6 + Math.floor(rnd() * 11) },
    { label: "Shots on target", home: 2 + Math.floor(rnd() * 6), away: 1 + Math.floor(rnd() * 5) },
    { label: "Expected goals (xG)", home: Number((rnd() * 3).toFixed(2)), away: Number((rnd() * 2.5).toFixed(2)) },
    { label: "Corners", home: 2 + Math.floor(rnd() * 7), away: 1 + Math.floor(rnd() * 6) },
    { label: "Fouls", home: 6 + Math.floor(rnd() * 8), away: 7 + Math.floor(rnd() * 8) },
    { label: "Yellow cards", home: yellowCount > 1 ? Math.floor(yellowCount / 2) : 0, away: yellowCount - (yellowCount > 1 ? Math.floor(yellowCount / 2) : 0) },
  ];

  // 5 prior H2H meetings
  const h2h: H2HEntry[] = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (i + 1) * 5);
    return {
      date: date.toISOString().slice(0, 10),
      home: i % 2 === 0 ? match.homeTeam : match.awayTeam,
      away: i % 2 === 0 ? match.awayTeam : match.homeTeam,
      homeScore: Math.floor(rnd() * 4),
      awayScore: Math.floor(rnd() * 3),
      competition: match.leagueName,
    };
  });

  return {
    match,
    events,
    stats,
    homeLineup: buildLineup("home", HOME_NAMES),
    awayLineup: buildLineup("away", AWAY_NAMES),
    h2h,
    attendance: 30000 + Math.floor(rnd() * 50000),
    referee: REFEREES[Math.floor(rnd() * REFEREES.length)],
  };
}
