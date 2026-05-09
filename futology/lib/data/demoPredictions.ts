import type { DemoMatch } from "./demoMatches";
import { getDemoMatches } from "./demoMatches";

export type DemoPrediction = {
  fixtureId: number;
  match: DemoMatch;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedScore: string;
  confidence: number;
  predictedWinner: "home" | "draw" | "away";
  keyFactors: string[];
};

const FACTOR_BANK = [
  "Home team won 4 of last 5 home matches.",
  "Away team missing top scorer through suspension.",
  "Head-to-head favors home (3W 1D 1L last 5).",
  "Away side fatigued: 4 matches in 12 days.",
  "Home defense: zero clean sheets in last 6.",
  "Set-piece edge: home converts 38% vs league avg 19%.",
  "Press intensity (PPDA) tilts the home side's way.",
  "Away keeper's xG-prevented ranks bottom-third in league.",
  "Recent form: home +6 goal differential, away -2.",
  "Wet forecast favors the more direct attack.",
];

function deterministic(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Returns ML-style predictions for every non-finished demo match.
 *
 * Probabilities are seeded by fixture ID so the same match always
 * produces the same prediction across renders — important because the
 * AI tab on `/predictions` is rebuilt on every navigation.
 */
export function getDemoPredictions(): DemoPrediction[] {
  const matches = getDemoMatches().filter((m) => m.status !== "finished");
  return matches.map((match) => {
    const rnd = deterministic(match.id);
    // Skewed distribution: home advantage baseline ~46%, draw ~26%, away ~28%
    const home = 30 + Math.floor(rnd() * 35);
    const away = 25 + Math.floor(rnd() * 30);
    const draw = Math.max(8, 100 - home - away);
    const total = home + draw + away;
    const norm = (n: number) => (n / total) * 100;
    const hp = norm(home);
    const dp = norm(draw);
    const ap = norm(away);
    const winner: "home" | "draw" | "away" =
      hp >= dp && hp >= ap ? "home" : ap >= dp ? "away" : "draw";
    const homeGoals = Math.max(0, Math.round(rnd() * 3));
    const awayGoals = Math.max(0, Math.round(rnd() * 2.5));
    const predictedScore =
      winner === "home"
        ? `${Math.max(homeGoals, awayGoals + 1)}-${awayGoals}`
        : winner === "away"
          ? `${homeGoals}-${Math.max(awayGoals, homeGoals + 1)}`
          : `${homeGoals}-${homeGoals}`;
    const keyFactors = pickFactors(rnd, 3);
    return {
      fixtureId: match.id,
      match,
      homeWinProb: hp,
      drawProb: dp,
      awayWinProb: ap,
      predictedScore,
      confidence: Math.max(hp, dp, ap),
      predictedWinner: winner,
      keyFactors,
    };
  });
}

function pickFactors(rnd: () => number, count: number): string[] {
  const pool = [...FACTOR_BANK];
  const picked: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rnd() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
