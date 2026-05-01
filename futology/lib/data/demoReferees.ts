export type RefereeStats = {
  id: number;
  name: string;
  league: string;
  matches: number;
  yellow: number;
  red: number;
  // Same metrics filtered to "big games" only (top-6 vs top-6)
  bigGameMatches: number;
  bigGameYellow: number;
  bigGameRed: number;
  // Home decisions vs away decisions
  homeFavorIndex: number; // 0–100, 50 = neutral, >50 favors home
};

function s(seed: number) {
  let v = (seed * 31415) % 4294967296;
  if (v < 0) v += 4294967296;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

const BANK = [
  { name: "Michael Oliver", league: "Premier League" },
  { name: "Anthony Taylor", league: "Premier League" },
  { name: "Stuart Attwell", league: "Premier League" },
  { name: "Antonio Mateu Lahoz", league: "La Liga" },
  { name: "José María Sánchez", league: "La Liga" },
  { name: "Mateu Lahoz", league: "La Liga" },
  { name: "Daniele Orsato", league: "Serie A" },
  { name: "Marco Guida", league: "Serie A" },
  { name: "Felix Brych", league: "Bundesliga" },
  { name: "Deniz Aytekin", league: "Bundesliga" },
  { name: "Clément Turpin", league: "Ligue 1" },
  { name: "Benoît Bastien", league: "Ligue 1" },
  { name: "Szymon Marciniak", league: "UCL" },
  { name: "François Letexier", league: "UCL" },
];

export const REFEREE_STATS: readonly RefereeStats[] = BANK.map((r, i) => {
  const rnd = s(i + 1);
  const matches = 18 + Math.floor(rnd() * 22);
  const yellow = Math.floor(matches * (3 + rnd() * 1.4));
  const red = Math.floor(matches * (0.05 + rnd() * 0.18));
  const bigGameMatches = Math.max(2, Math.floor(matches * (0.18 + rnd() * 0.12)));
  // Big-game card rate is biased upward: refs tend to give more cards in tense games
  const bgYellowRate = (yellow / matches) * (1.05 + rnd() * 0.4);
  const bgRedRate = (red / matches) * (1.0 + rnd() * 0.6);
  return {
    id: i + 1,
    name: r.name,
    league: r.league,
    matches,
    yellow,
    red,
    bigGameMatches,
    bigGameYellow: Math.round(bigGameMatches * bgYellowRate),
    bigGameRed: Math.round(bigGameMatches * bgRedRate),
    homeFavorIndex: Math.round(40 + rnd() * 20),
  };
});

export type RefRow = {
  id: number;
  name: string;
  league: string;
  matches: number;
  yellowsPerMatch: number;
  redsPerMatch: number;
  bgYellowsPerMatch: number;
  bgRedsPerMatch: number;
  bigGameDelta: number; // % change in cards/match in big games
  homeFavorIndex: number;
};

export function buildRefRows(): RefRow[] {
  return REFEREE_STATS.map((r) => {
    const yellowsPerMatch = r.matches > 0 ? r.yellow / r.matches : 0;
    const redsPerMatch = r.matches > 0 ? r.red / r.matches : 0;
    const bgYellowsPerMatch =
      r.bigGameMatches > 0 ? r.bigGameYellow / r.bigGameMatches : 0;
    const bgRedsPerMatch =
      r.bigGameMatches > 0 ? r.bigGameRed / r.bigGameMatches : 0;
    const baseline = yellowsPerMatch + redsPerMatch;
    const bigGame = bgYellowsPerMatch + bgRedsPerMatch;
    const bigGameDelta =
      baseline > 0 ? ((bigGame - baseline) / baseline) * 100 : 0;
    return {
      id: r.id,
      name: r.name,
      league: r.league,
      matches: r.matches,
      yellowsPerMatch,
      redsPerMatch,
      bgYellowsPerMatch,
      bgRedsPerMatch,
      bigGameDelta,
      homeFavorIndex: r.homeFavorIndex,
    };
  });
}
