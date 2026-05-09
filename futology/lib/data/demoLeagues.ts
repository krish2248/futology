import type { PredictionLeague } from "@/lib/store/session";

const seedMembers = (count: number, seed: number) => {
  const names = [
    "Lukas",
    "Aiden",
    "Mei",
    "Sofia",
    "Khalid",
    "Priya",
    "Marco",
    "Hana",
    "Nico",
    "Adaeze",
    "Theo",
    "Yuki",
    "Camila",
    "Eitan",
    "Nora",
  ];
  let s = (seed * 31) % 4294967296;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => {
    const total = 12 + Math.floor(rnd() * 28);
    const correct = Math.floor(rnd() * total * 0.7);
    const points = correct * 1 + Math.floor(rnd() * total * 0.4) * 2;
    return {
      userId: `demo_${i}_${seed}`,
      displayName: names[(i + seed) % names.length],
      totalPoints: points,
      totalPredictions: total,
      correctPredictions: correct,
      joinedAt: new Date().toISOString(),
    };
  });
};

/**
 * Three seeded public prediction leagues (Global, EPL Picks, UCL Bracket)
 * with synthetic member rosters. Surfaced on `/predictions` → Leagues tab
 * before the user creates or joins their own.
 */
export const PUBLIC_LEAGUES_SEED: readonly PredictionLeague[] = [
  {
    id: "public_global",
    name: "Global FUTOLOGY",
    description: "Default open league. Compete against everyone.",
    inviteCode: "GLOBAL01",
    isPublic: true,
    createdBy: "system",
    members: seedMembers(12, 7),
    createdAt: new Date().toISOString(),
  },
  {
    id: "public_epl",
    name: "Premier League Picks",
    description: "EPL-only fixtures. 38 game-week season.",
    inviteCode: "EPL12345",
    isPublic: true,
    createdBy: "system",
    members: seedMembers(9, 13),
    createdAt: new Date().toISOString(),
  },
  {
    id: "public_ucl",
    name: "Champions League Bracket",
    description: "Knockout-round predictions. UCL fans only.",
    inviteCode: "UCL99",
    isPublic: true,
    createdBy: "system",
    members: seedMembers(7, 19),
    createdAt: new Date().toISOString(),
  },
] as const;
