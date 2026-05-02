import { CLUBS, type ClubSeed } from "./clubs";

export type PressTeam = {
  team: ClubSeed;
  ppda: number; // passes per defensive action — lower = more pressing
  pressuresPer90: number;
  pressureSuccessRate: number; // %
  highTurnovers: number; // turnovers won in attacking third
  pressZone: "high" | "mid" | "low";
  // 12 (x: own goal → opp goal) × 8 (y: left → right) heatmap intensity 0–1
  heatmap: number[][];
};

function s(seed: number) {
  let v = (seed * 2654435761) % 4294967296;
  if (v < 0) v += 4294967296;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

function buildHeatmap(zone: "high" | "mid" | "low", rnd: () => number): number[][] {
  // x dimension is 12 strips along the pitch length; pressing teams have
  // intensity weighted toward the opposition end (high x indices).
  const grid: number[][] = [];
  for (let x = 0; x < 12; x++) {
    const row: number[] = [];
    for (let y = 0; y < 8; y++) {
      // distance from middle of y axis (0–4) — slightly higher intensity in central channels
      const yWeight = 1 - Math.abs(y - 3.5) / 6;
      let xWeight: number;
      if (zone === "high") xWeight = Math.pow(x / 11, 1.4);
      else if (zone === "mid") xWeight = 1 - Math.abs(x / 11 - 0.55) * 1.6;
      else xWeight = Math.pow(1 - x / 11, 1.2);
      const noise = 0.6 + rnd() * 0.5;
      row.push(Math.max(0, Math.min(1, xWeight * yWeight * noise)));
    }
    grid.push(row);
  }
  return grid;
}

const ZONE_PROFILE: Record<"high" | "mid" | "low", { ppdaRange: [number, number]; pressuresRange: [number, number] }> = {
  high: { ppdaRange: [6.5, 9.5], pressuresRange: [180, 240] },
  mid: { ppdaRange: [9.5, 13], pressuresRange: [140, 190] },
  low: { ppdaRange: [13, 18], pressuresRange: [100, 150] },
};

export function getDemoPress(): PressTeam[] {
  return CLUBS.map((c, i) => {
    const rnd = s(c.id * 19 + i);
    const r = rnd();
    const zone: "high" | "mid" | "low" = r < 0.35 ? "high" : r < 0.7 ? "mid" : "low";
    const profile = ZONE_PROFILE[zone];
    const ppda = Number(
      (profile.ppdaRange[0] + rnd() * (profile.ppdaRange[1] - profile.ppdaRange[0])).toFixed(1),
    );
    const pressures = Math.round(
      profile.pressuresRange[0] + rnd() * (profile.pressuresRange[1] - profile.pressuresRange[0]),
    );
    return {
      team: c,
      ppda,
      pressuresPer90: pressures,
      pressureSuccessRate: Number((22 + rnd() * 14).toFixed(1)),
      highTurnovers: Math.floor((zone === "high" ? 6 : zone === "mid" ? 3 : 1) + rnd() * 6),
      pressZone: zone,
      heatmap: buildHeatmap(zone, rnd),
    };
  });
}

export const ZONE_LABEL: Record<"high" | "mid" | "low", string> = {
  high: "High press",
  mid: "Mid block",
  low: "Low block",
};

export const ZONE_COLOR: Record<"high" | "mid" | "low", string> = {
  high: "#00D563",
  mid: "#3B82F6",
  low: "#A1A1A1",
};
