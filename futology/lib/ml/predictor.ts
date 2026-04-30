import { findLeague } from "@/lib/data/leagues";
import type { ClubSeed } from "@/lib/data/clubs";

export type MatchPredictionInputs = {
  home: ClubSeed;
  away: ClubSeed;
  competitionId?: number;
};

export type MatchPredictionResult = {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedScore: string;
  confidence: number;
  predictedWinner: "home" | "draw" | "away";
  keyFactors: string[];
};

function seeded(seed: number) {
  let s = seed % 4294967296;
  if (s < 0) s += 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const FACTOR_TEMPLATES = (home: string, away: string, league: string): string[] => [
  `${home} won 4 of last 5 home matches in ${league}.`,
  `${away} on a 3-match unbeaten run on the road.`,
  `Head-to-head favors ${home} (3W 1D 1L last 5).`,
  `${away} fatigued: 4 matches in 12 days.`,
  `${home} converts 38% of set-pieces vs league avg 19%.`,
  `${away} keeper's xG-prevented ranks bottom-third in league.`,
  `Recent form: ${home} +6 goal differential, ${away} -2.`,
  `${home} press intensity (PPDA) one of league's lowest — they suffocate possession.`,
  `${away} top scorer doubtful — 12-day knee strain.`,
  `Wet forecast favors the more direct attack — ${home}'s xG-on-counter is league-best.`,
];

export function predictMatch(
  inputs: MatchPredictionInputs,
): MatchPredictionResult {
  const { home, away, competitionId } = inputs;
  const seed = home.id * 1000003 + away.id * 17 + (competitionId ?? home.leagueId);
  const rnd = seeded(seed);

  // Base distribution + home advantage + small league-tier modulation
  const league = findLeague(home.leagueId);
  const tierBoost =
    league?.tier === "elite" ? 4 : league?.tier === "major" ? 2 : 0;

  const baseHome = 35 + tierBoost + Math.floor(rnd() * 28);
  const baseAway = 22 + Math.floor(rnd() * 26);
  const baseDraw = Math.max(8, 100 - baseHome - baseAway);
  const total = baseHome + baseAway + baseDraw;
  const hp = (baseHome / total) * 100;
  const dp = (baseDraw / total) * 100;
  const ap = (baseAway / total) * 100;

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

  const factorPool = FACTOR_TEMPLATES(
    home.shortName,
    away.shortName,
    league?.shortName ?? "this league",
  );
  const picked: string[] = [];
  const taken = new Set<number>();
  while (picked.length < 3 && taken.size < factorPool.length) {
    const idx = Math.floor(rnd() * factorPool.length);
    if (taken.has(idx)) continue;
    taken.add(idx);
    picked.push(factorPool[idx]);
  }

  return {
    homeWinProb: hp,
    drawProb: dp,
    awayWinProb: ap,
    predictedScore,
    confidence: Math.max(hp, dp, ap),
    predictedWinner: winner,
    keyFactors: picked,
  };
}
