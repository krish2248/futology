import type { DemoMatch } from "./demoMatches";

export type Shot = {
  id: number;
  team: "home" | "away";
  // 0–100 along pitch (own goal → opp goal). y 0–100 (left → right).
  x: number;
  y: number;
  xG: number;
  outcome: "goal" | "saved" | "off-target" | "blocked";
  player: string;
  minute: number;
};

export type PassNetworkNode = {
  team: "home" | "away";
  number: number;
  name: string;
  x: number;
  y: number;
  passes: number;
};

export type PassNetworkEdge = {
  team: "home" | "away";
  from: number;
  to: number;
  count: number;
};

export type TacticsSnapshot = {
  match: DemoMatch;
  shots: Shot[];
  homeNodes: PassNetworkNode[];
  awayNodes: PassNetworkNode[];
  homeEdges: PassNetworkEdge[];
  awayEdges: PassNetworkEdge[];
  stats: {
    homeXG: number;
    awayXG: number;
    homePPDA: number;
    awayPPDA: number;
    homePossession: number;
    homeFieldTilt: number;
    homeFinalThirdEntries: number;
    awayFinalThirdEntries: number;
    homePassAccuracy: number;
    awayPassAccuracy: number;
  };
};

function seeded(seed: number) {
  let s = (seed * 1103515245 + 12345) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const HOME_PLAYERS = [
  "GK", "RB", "RCB", "LCB", "LB",
  "RCM", "CDM", "LCM",
  "RW", "CF", "LW",
];
const AWAY_PLAYERS = HOME_PLAYERS;

const FORMATION_4_3_3: Array<[number, number]> = [
  [10, 50], [25, 12], [25, 36], [25, 64], [25, 88],
  [50, 25], [50, 50], [50, 75],
  [80, 18], [80, 50], [80, 82],
];

function buildLineupNodes(
  team: "home" | "away",
  players: readonly string[],
  rnd: () => number,
): PassNetworkNode[] {
  return FORMATION_4_3_3.map(([x, y], i) => ({
    team,
    number: i + 1,
    name: players[i] ?? `P${i + 1}`,
    x: team === "home" ? x : 100 - x,
    y,
    passes: 8 + Math.floor(rnd() * 32),
  }));
}

function buildEdges(
  team: "home" | "away",
  rnd: () => number,
): PassNetworkEdge[] {
  const edges: PassNetworkEdge[] = [];
  const indexes = Array.from({ length: 11 }, (_, i) => i + 1);
  // Generate a reasonable amount of cross-team passes
  for (let i = 0; i < 22; i++) {
    const from = indexes[Math.floor(rnd() * indexes.length)];
    let to = indexes[Math.floor(rnd() * indexes.length)];
    while (to === from) to = indexes[Math.floor(rnd() * indexes.length)];
    edges.push({ team, from, to, count: 2 + Math.floor(rnd() * 8) });
  }
  return edges;
}

function buildShots(match: DemoMatch, rnd: () => number): Shot[] {
  const homeGoals = match.homeScore ?? 0;
  const awayGoals = match.awayScore ?? 0;
  const homeShotCount = 6 + Math.floor(rnd() * 10);
  const awayShotCount = 5 + Math.floor(rnd() * 9);
  const shots: Shot[] = [];
  let id = 1;

  function makeShots(team: "home" | "away", total: number, goals: number) {
    for (let i = 0; i < total; i++) {
      // Place inside opposition half, biased toward box for higher xG
      const bias = rnd();
      const xRaw = 60 + bias * 35; // 60–95 along the attacking length
      const yRaw = 30 + rnd() * 40; // central-ish
      const xG = Math.max(0.02, Math.min(0.95, (bias * 0.6) + (rnd() * 0.2)));
      const isGoal = i < goals;
      const isOnTarget = isGoal || rnd() > 0.4;
      const outcome: Shot["outcome"] = isGoal
        ? "goal"
        : isOnTarget
          ? "saved"
          : rnd() > 0.5
            ? "off-target"
            : "blocked";
      shots.push({
        id: id++,
        team,
        x: team === "home" ? xRaw : 100 - xRaw,
        y: yRaw,
        xG: Number(xG.toFixed(2)),
        outcome,
        player:
          team === "home"
            ? HOME_PLAYERS[Math.floor(rnd() * HOME_PLAYERS.length)]
            : AWAY_PLAYERS[Math.floor(rnd() * AWAY_PLAYERS.length)],
        minute: 5 + Math.floor(rnd() * 85),
      });
    }
  }

  makeShots("home", homeShotCount, homeGoals);
  makeShots("away", awayShotCount, awayGoals);
  shots.sort((a, b) => a.minute - b.minute);
  return shots;
}

/**
 * Builds a tactics snapshot for the TacticBoard page — xG shot dots,
 * pass-network nodes/edges, and side-bar metrics (xG, PPDA, possession,
 * field tilt, pass accuracy). Seeded by fixture ID so the diagram is
 * stable across renders.
 *
 * Cutover: replaced by a fetch to a StatsBomb-derived endpoint via the
 * FastAPI ML service (bible §9.5). Same return shape.
 */
export function getDemoTactics(match: DemoMatch): TacticsSnapshot {
  const rnd = seeded(match.id * 17 + 3);
  const shots = buildShots(match, rnd);
  const homeNodes = buildLineupNodes("home", HOME_PLAYERS, rnd);
  const awayNodes = buildLineupNodes("away", AWAY_PLAYERS, rnd);
  const homeEdges = buildEdges("home", rnd);
  const awayEdges = buildEdges("away", rnd);

  const homeXG = Number(
    shots.filter((s) => s.team === "home").reduce((acc, s) => acc + s.xG, 0).toFixed(2),
  );
  const awayXG = Number(
    shots.filter((s) => s.team === "away").reduce((acc, s) => acc + s.xG, 0).toFixed(2),
  );
  const homePossession = 35 + Math.floor(rnd() * 30);

  return {
    match,
    shots,
    homeNodes,
    awayNodes,
    homeEdges,
    awayEdges,
    stats: {
      homeXG,
      awayXG,
      homePPDA: Number((6 + rnd() * 12).toFixed(1)),
      awayPPDA: Number((6 + rnd() * 12).toFixed(1)),
      homePossession,
      homeFieldTilt: Number((40 + rnd() * 25).toFixed(0)),
      homeFinalThirdEntries: 12 + Math.floor(rnd() * 24),
      awayFinalThirdEntries: 10 + Math.floor(rnd() * 22),
      homePassAccuracy: Number((78 + rnd() * 14).toFixed(1)),
      awayPassAccuracy: Number((76 + rnd() * 14).toFixed(1)),
    },
  };
}
