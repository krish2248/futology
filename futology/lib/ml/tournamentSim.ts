export type SimTeam = {
  id: number;
  name: string;
  shortName: string;
  strength: number; // ELO-ish rating, 1500–2100
};

export type BracketSlot = { home: SimTeam; away: SimTeam };

export type SimResult = {
  team: SimTeam;
  reachedQF: number;
  reachedSF: number;
  reachedFinal: number;
  won: number;
  totalRuns: number;
};

// 16-team UCL knockout (Round of 16). Demo seeded matchups.
export const UCL_R16: readonly BracketSlot[] = [
  {
    home: { id: 541, name: "Real Madrid", shortName: "Real Madrid", strength: 2050 },
    away: { id: 489, name: "AC Milan", shortName: "Milan", strength: 1880 },
  },
  {
    home: { id: 50, name: "Manchester City", shortName: "Man City", strength: 2030 },
    away: { id: 168, name: "Bayer Leverkusen", shortName: "Leverkusen", strength: 1900 },
  },
  {
    home: { id: 157, name: "Bayern München", shortName: "Bayern", strength: 2000 },
    away: { id: 81, name: "Marseille", shortName: "Marseille", strength: 1830 },
  },
  {
    home: { id: 85, name: "Paris Saint-Germain", shortName: "PSG", strength: 1980 },
    away: { id: 530, name: "Atlético Madrid", shortName: "Atlético", strength: 1920 },
  },
  {
    home: { id: 529, name: "FC Barcelona", shortName: "Barcelona", strength: 1990 },
    away: { id: 165, name: "Borussia Dortmund", shortName: "Dortmund", strength: 1880 },
  },
  {
    home: { id: 40, name: "Liverpool", shortName: "Liverpool", strength: 2040 },
    away: { id: 197, name: "PSV Eindhoven", shortName: "PSV", strength: 1810 },
  },
  {
    home: { id: 42, name: "Arsenal", shortName: "Arsenal", strength: 1970 },
    away: { id: 194, name: "Ajax", shortName: "Ajax", strength: 1820 },
  },
  {
    home: { id: 505, name: "Inter Milan", shortName: "Inter", strength: 1960 },
    away: { id: 211, name: "Benfica", shortName: "Benfica", strength: 1850 },
  },
] as const;

/**
 * Linear-congruential PRNG seeded with a 32-bit integer. Returns a function
 * that yields uniform [0, 1) numbers. Deterministic so re-runs with the same
 * seed produce identical brackets — handy for testable visualizations.
 */
function seeded(seed: number) {
  let s = seed % 4294967296;
  if (s < 0) s += 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * ELO-derived win probability for the home team, with a 30-point home-pitch
 * bump. Matches the standard FIFA ELO formula: 1 / (1 + 10^((b - a) / 400)).
 */
function winProb(home: SimTeam, away: SimTeam): number {
  // Standard ELO win probability with a small home-advantage tilt.
  const HOME_BUMP = 30;
  const diff = (home.strength + HOME_BUMP) - away.strength;
  return 1 / (1 + Math.pow(10, -diff / 400));
}

function simulateRound(
  matchups: BracketSlot[],
  rnd: () => number,
): { winners: SimTeam[]; nextRound: BracketSlot[] } {
  const winners: SimTeam[] = [];
  for (const m of matchups) {
    const p = winProb(m.home, m.away);
    winners.push(rnd() < p ? m.home : m.away);
  }
  const nextRound: BracketSlot[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextRound.push({ home: winners[i], away: winners[i + 1] });
  }
  return { winners, nextRound };
}

export type SimulationOutcome = {
  results: SimResult[];
  // Per-bracket-slot, outcome counts for visualization
  edgeWinCounts: Record<number, number>;
};

/**
 * Runs `runs` Monte Carlo simulations of the bracket, tallying how often each
 * team reaches QF/SF/Final/Champion. Pure function — no I/O, no globals — so
 * it's safe to port to a Web Worker if `runs` ever exceeds ~25k.
 */
export function runSimulation(
  startBracket: readonly BracketSlot[] = UCL_R16,
  runs: number = 10_000,
  seed: number = 42,
): SimulationOutcome {
  const teams = startBracket.flatMap((s) => [s.home, s.away]);
  const stats = new Map<number, SimResult>();
  for (const t of teams) {
    stats.set(t.id, {
      team: t,
      reachedQF: 0,
      reachedSF: 0,
      reachedFinal: 0,
      won: 0,
      totalRuns: runs,
    });
  }

  const rnd = seeded(seed);
  const edgeWinCounts: Record<number, number> = {};
  for (let i = 0; i < runs; i++) {
    let bracket: BracketSlot[] = startBracket.map((s) => ({ ...s }));
    // Round of 16 → QF
    let r1 = simulateRound(bracket, rnd);
    for (const w of r1.winners) {
      const stat = stats.get(w.id);
      if (stat) stat.reachedQF += 1;
    }
    bracket = r1.nextRound;
    // QF → SF
    let r2 = simulateRound(bracket, rnd);
    for (const w of r2.winners) {
      const stat = stats.get(w.id);
      if (stat) stat.reachedSF += 1;
    }
    bracket = r2.nextRound;
    // SF → Final
    let r3 = simulateRound(bracket, rnd);
    for (const w of r3.winners) {
      const stat = stats.get(w.id);
      if (stat) stat.reachedFinal += 1;
    }
    bracket = r3.nextRound;
    // Final
    let r4 = simulateRound(bracket, rnd);
    for (const w of r4.winners) {
      const stat = stats.get(w.id);
      if (stat) stat.won += 1;
      edgeWinCounts[w.id] = (edgeWinCounts[w.id] ?? 0) + 1;
    }
  }

  const results = Array.from(stats.values()).sort((a, b) => b.won - a.won);
  return { results, edgeWinCounts };
}

/** Converts a tally count into a percentage of total runs (0–100). */
export function probability(value: number, runs: number): number {
  if (runs === 0) return 0;
  return (value / runs) * 100;
}
