import type { DemoMatch } from "./demoMatches";

export type MomentumPoint = {
  minute: number;
  // Rolling xG accumulated over the last 5-minute window
  homeXG: number;
  awayXG: number;
  // Net momentum: home - away (positive = home pressure)
  net: number;
};

export type MomentumSnapshot = {
  match: DemoMatch;
  series: MomentumPoint[];
  peakHome: { minute: number; value: number };
  peakAway: { minute: number; value: number };
  totalSwings: number;
};

function seeded(seed: number) {
  let s = (seed * 1103515245 + 12345) % 4294967296;
  if (s < 0) s += 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Builds the per-minute xG momentum series for the Match Momentum page.
 * Returns home/away xG increments rolled into a 5-minute window plus a
 * count of momentum swings (sign changes of the home-away delta).
 */
export function getDemoMomentum(match: DemoMatch): MomentumSnapshot {
  const finalMinute = match.status === "scheduled" ? 0 : match.minute ?? 90;
  if (finalMinute === 0) {
    return {
      match,
      series: [],
      peakHome: { minute: 0, value: 0 },
      peakAway: { minute: 0, value: 0 },
      totalSwings: 0,
    };
  }
  const rnd = seeded(match.id * 23);
  // Generate per-minute xG increments, then compute rolling 5-min sums.
  const homeMinXG: number[] = [];
  const awayMinXG: number[] = [];
  for (let m = 0; m <= finalMinute; m++) {
    homeMinXG.push(rnd() < 0.18 ? rnd() * 0.35 : 0);
    awayMinXG.push(rnd() < 0.16 ? rnd() * 0.32 : 0);
  }
  const series: MomentumPoint[] = [];
  let prevSign: 0 | 1 | -1 = 0;
  let swings = 0;
  for (let m = 0; m <= finalMinute; m++) {
    const lo = Math.max(0, m - 4);
    let h = 0;
    let a = 0;
    for (let i = lo; i <= m; i++) {
      h += homeMinXG[i];
      a += awayMinXG[i];
    }
    const net = h - a;
    series.push({ minute: m, homeXG: Number(h.toFixed(3)), awayXG: Number(a.toFixed(3)), net });
    const sign = net > 0.05 ? 1 : net < -0.05 ? -1 : 0;
    if (sign !== 0 && prevSign !== 0 && sign !== prevSign) swings += 1;
    if (sign !== 0) prevSign = sign;
  }
  const peakHome = series.reduce(
    (acc, p) => (p.homeXG > acc.value ? { minute: p.minute, value: p.homeXG } : acc),
    { minute: 0, value: 0 },
  );
  const peakAway = series.reduce(
    (acc, p) => (p.awayXG > acc.value ? { minute: p.minute, value: p.awayXG } : acc),
    { minute: 0, value: 0 },
  );
  return { match, series, peakHome, peakAway, totalSwings: swings };
}
