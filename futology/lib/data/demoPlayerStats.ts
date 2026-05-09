import { PLAYERS } from "./players";
import { type ClusterId } from "./playerClusters";

export type PlayerStatLine = {
  playerId: number;
  name: string;
  team: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  // Per-90 metrics (rough, illustrative — replaced by FBref pulls in Phase 3)
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  keyPasses: number;
  progressivePasses: number;
  progressiveCarries: number;
  pressures: number;
  tacklesPlusInterceptions: number;
  passAccuracy: number; // %
  // Derived
  cluster: ClusterId;
  // Cluster-scatter axes 0–100 (PCA simulation)
  creativity: number;
  defensiveActivity: number;
  // Hover-card top stats (label: value)
  topStats: { label: string; value: string }[];
  minutesPlayed: number;
};

function s(seed: number) {
  let v = (seed * 2654435761) % 4294967296;
  if (v < 0) v += 4294967296;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

function inferCluster(p: { position: string; name: string }, rnd: () => number): ClusterId {
  // Light heuristic biased by position so the scatter looks coherent
  if (p.position === "GK" || p.position === "DEF") {
    return rnd() < 0.5 ? "ball-playing-defender" : "deep-lying-playmaker";
  }
  if (p.position === "MID") {
    const r = rnd();
    if (r < 0.4) return "box-to-box";
    if (r < 0.7) return "creative-playmaker";
    return "deep-lying-playmaker";
  }
  // FWD
  const r = rnd();
  if (r < 0.4) return "target-striker";
  if (r < 0.75) return "high-press-forward";
  return "creative-playmaker";
}

const CLUSTER_AXES: Record<ClusterId, { creativity: [number, number]; defense: [number, number] }> = {
  "target-striker": { creativity: [50, 70], defense: [10, 30] },
  "creative-playmaker": { creativity: [70, 95], defense: [25, 45] },
  "box-to-box": { creativity: [45, 70], defense: [55, 80] },
  "ball-playing-defender": { creativity: [50, 70], defense: [70, 92] },
  "high-press-forward": { creativity: [40, 65], defense: [50, 75] },
  "deep-lying-playmaker": { creativity: [60, 85], defense: [40, 65] },
};

function inRange([lo, hi]: [number, number], rnd: () => number): number {
  return lo + rnd() * (hi - lo);
}

/**
 * Per-90 stat lines for every seeded player. Values are derived
 * deterministically from each player's ID so the cluster scatter and
 * radar charts stay stable across renders.
 *
 * Includes seeded PCA-derived `clusterX` / `clusterY` axes so the
 * scatter plot positions don't need to recompute on every mount.
 */
export const PLAYER_STATS: readonly PlayerStatLine[] = PLAYERS.map((p) => {
  const rnd = s(p.id);
  const cluster = inferCluster(p, rnd);
  const axes = CLUSTER_AXES[cluster];
  const goals =
    p.position === "FWD"
      ? Number((0.4 + rnd() * 0.7).toFixed(2))
      : p.position === "MID"
        ? Number((0.1 + rnd() * 0.4).toFixed(2))
        : Number((rnd() * 0.15).toFixed(2));
  const assists = Number((rnd() * 0.5).toFixed(2));
  const xG = Number((goals * (0.85 + rnd() * 0.3)).toFixed(2));
  const xA = Number((assists * (0.85 + rnd() * 0.3)).toFixed(2));
  const keyPasses = Number((1 + rnd() * 3).toFixed(2));
  const progressivePasses = Number((4 + rnd() * 6).toFixed(1));
  const progressiveCarries = Number((1 + rnd() * 3).toFixed(2));
  const pressures = Number((10 + rnd() * 20).toFixed(0));
  const tacklesPlusInterceptions = Number((1 + rnd() * 5).toFixed(1));
  const passAccuracy = Number((78 + rnd() * 16).toFixed(1));
  const minutesPlayed = 800 + Math.floor(rnd() * 1800);

  return {
    playerId: p.id,
    name: p.name,
    team: p.team,
    position: p.position,
    goals,
    assists,
    xG,
    xA,
    keyPasses,
    progressivePasses,
    progressiveCarries,
    pressures,
    tacklesPlusInterceptions,
    passAccuracy,
    cluster,
    creativity: Number(inRange(axes.creativity, rnd).toFixed(1)),
    defensiveActivity: Number(inRange(axes.defense, rnd).toFixed(1)),
    minutesPlayed,
    topStats: [
      { label: "Goals/90", value: goals.toFixed(2) },
      { label: "Assists/90", value: assists.toFixed(2) },
      { label: "Key passes/90", value: keyPasses.toFixed(1) },
    ],
  };
});

/** Looks up a stat line by player ID. */
export function playerStatsById(id: number): PlayerStatLine | undefined {
  return PLAYER_STATS.find((p) => p.playerId === id);
}

/**
 * Returns the `k` players closest to `target` in cluster space.
 * Used to surface "comparable players" on the Transfer Oracle and
 * "similar players" on Player Pulse. Excludes `target` itself.
 */
export function nearestPlayers(target: PlayerStatLine, k = 3): PlayerStatLine[] {
  const ranked = PLAYER_STATS.filter((p) => p.playerId !== target.playerId)
    .map((p) => ({
      p,
      d: Math.hypot(
        p.creativity - target.creativity,
        p.defensiveActivity - target.defensiveActivity,
      ),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  return ranked.map((r) => r.p);
}

// Radar comparison axes (0–100 each)
export type RadarAxes = {
  goals: number;
  assists: number;
  creativity: number;
  pressing: number;
  defending: number;
  passing: number;
};

/** Converts a stat line to the 6-axis radar shape used by the comparison chart. */
export function toRadar(p: PlayerStatLine): RadarAxes {
  return {
    goals: Math.min(100, p.goals * 100),
    assists: Math.min(100, p.assists * 130),
    creativity: p.creativity,
    pressing: Math.min(100, (p.pressures / 30) * 100),
    defending: Math.min(100, (p.tacklesPlusInterceptions / 6) * 100),
    passing: p.passAccuracy,
  };
}
