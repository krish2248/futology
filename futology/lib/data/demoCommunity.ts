export type PollOption = {
  id: string;
  label: string;
  flag?: string;
  baseVotes: number;
};

export type CommunityPoll = {
  id: string;
  question: string;
  scope: string;
  expiresAt: string; // ISO
  options: PollOption[];
};

export type TrendingPick = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  topScoreline: string;
  count: number;
  totalVotes: number;
};

export type AccuracyLeader = {
  rank: number;
  username: string;
  predictions: number;
  correct: number;
  accuracy: number; // 0–100
  points: number;
};

const futureISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/**
 * Three active community polls (EPL winner / UCL winner / Ballon d'Or).
 * Vote counts ride along on each option so the bar fills look populated
 * before any real votes come in.
 */
export const COMMUNITY_POLLS: readonly CommunityPoll[] = [
  {
    id: "poll_epl_winner",
    question: "Who will win the Premier League this season?",
    scope: "Premier League · 2025–26",
    expiresAt: futureISO(60),
    options: [
      { id: "team_50", label: "Manchester City", flag: "🩵", baseVotes: 412 },
      { id: "team_42", label: "Arsenal", flag: "🔴", baseVotes: 358 },
      { id: "team_40", label: "Liverpool", flag: "🔴", baseVotes: 297 },
      { id: "team_49", label: "Chelsea", flag: "🟦", baseVotes: 88 },
      { id: "team_other", label: "Someone else", flag: "❓", baseVotes: 41 },
    ],
  },
  {
    id: "poll_ucl_winner",
    question: "UCL final — who lifts the trophy?",
    scope: "Champions League · knockout rounds",
    expiresAt: futureISO(45),
    options: [
      { id: "team_541", label: "Real Madrid", flag: "👑", baseVotes: 521 },
      { id: "team_157", label: "Bayern München", flag: "🔴", baseVotes: 287 },
      { id: "team_50", label: "Manchester City", flag: "🩵", baseVotes: 254 },
      { id: "team_85", label: "PSG", flag: "🇫🇷", baseVotes: 198 },
      { id: "team_529", label: "Barcelona", flag: "🟦", baseVotes: 180 },
    ],
  },
  {
    id: "poll_ballon_dor",
    question: "Ballon d'Or 2026 favourite right now?",
    scope: "Annual award",
    expiresAt: futureISO(120),
    options: [
      { id: "ply_19088", label: "Jude Bellingham", baseVotes: 244 },
      { id: "ply_4147", label: "Vinícius Jr.", baseVotes: 286 },
      { id: "ply_278", label: "Kylian Mbappé", baseVotes: 318 },
      { id: "ply_36812", label: "Lamine Yamal", baseVotes: 162 },
      { id: "ply_909", label: "Erling Haaland", baseVotes: 201 },
    ],
  },
] as const;

/** Three "trending" picks shown on the Community tab — what other users are predicting. */
export const TRENDING_PICKS: readonly TrendingPick[] = [
  {
    fixtureId: 8,
    homeTeam: "Newcastle",
    awayTeam: "Villa",
    topScoreline: "2-1",
    count: 184,
    totalVotes: 612,
  },
  {
    fixtureId: 12,
    homeTeam: "PSG",
    awayTeam: "Monaco",
    topScoreline: "3-1",
    count: 217,
    totalVotes: 540,
  },
  {
    fixtureId: 18,
    homeTeam: "Man Utd",
    awayTeam: "Man City",
    topScoreline: "1-2",
    count: 392,
    totalVotes: 1280,
  },
];

/** Top 10 anonymised accuracy-leader rows — names are pseudonyms by design. */
export const ACCURACY_LEADERS: readonly AccuracyLeader[] = [
  { rank: 1, username: "data_dean", predictions: 142, correct: 78, accuracy: 55, points: 312 },
  { rank: 2, username: "tactical_anya", predictions: 128, correct: 70, accuracy: 55, points: 286 },
  { rank: 3, username: "shotmap_sam", predictions: 119, correct: 62, accuracy: 52, points: 254 },
  { rank: 4, username: "xg_emily", predictions: 134, correct: 67, accuracy: 50, points: 248 },
  { rank: 5, username: "ppda_marco", predictions: 110, correct: 55, accuracy: 50, points: 224 },
  { rank: 6, username: "set_piece_kim", predictions: 96, correct: 47, accuracy: 49, points: 210 },
  { rank: 7, username: "midfield_general", predictions: 121, correct: 56, accuracy: 46, points: 196 },
  { rank: 8, username: "deep_lying_nora", predictions: 88, correct: 40, accuracy: 45, points: 178 },
  { rank: 9, username: "high_press_priya", predictions: 102, correct: 46, accuracy: 45, points: 174 },
  { rank: 10, username: "form_table_yuki", predictions: 75, correct: 33, accuracy: 44, points: 152 },
] as const;
