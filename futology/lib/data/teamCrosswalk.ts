import { CLUBS, type ClubSeed } from "./clubs";

/**
 * football-data.org team ID → API-Football team ID, for the clubs FUTOLOGY
 * has seeded (and therefore has SSG club pages for). The two providers use
 * different ID spaces, so any feature that wants to link a real fixture back
 * to a club page has to translate through this table.
 *
 * Only the seeded clubs are listed; real fixtures involving any other team
 * resolve to `undefined` and render without a club-page link. IDs verified
 * against football-data.org v4 (https://api.football-data.org/v4/teams).
 */
const FD_TO_AF: Record<number, number> = {
  // Premier League
  66: 33, // Manchester United
  64: 40, // Liverpool
  65: 50, // Manchester City
  61: 49, // Chelsea
  57: 42, // Arsenal
  73: 47, // Tottenham Hotspur
  67: 34, // Newcastle United
  58: 66, // Aston Villa
  397: 51, // Brighton & Hove Albion
  563: 48, // West Ham United
  // La Liga
  86: 541, // Real Madrid
  81: 529, // FC Barcelona
  78: 530, // Atlético Madrid
  92: 548, // Real Sociedad
  95: 532, // Valencia
  77: 531, // Athletic Bilbao
  90: 543, // Real Betis
  559: 536, // Sevilla
  // Serie A
  98: 489, // AC Milan
  108: 505, // Inter
  109: 496, // Juventus
  113: 492, // Napoli
  100: 497, // Roma
  110: 487, // Lazio
  102: 499, // Atalanta
  // Bundesliga
  5: 157, // Bayern München
  4: 165, // Borussia Dortmund
  3: 168, // Bayer Leverkusen
  721: 173, // RB Leipzig
  19: 169, // Eintracht Frankfurt
  // Ligue 1
  524: 85, // Paris Saint-Germain
  548: 91, // Monaco
  516: 81, // Marseille
  521: 79, // Lille
  523: 80, // Lyon
  // Eredivisie
  678: 194, // Ajax
  674: 197, // PSV
  675: 209, // Feyenoord
  // Primeira Liga
  498: 228, // Sporting CP
  503: 212, // FC Porto
  1903: 211, // Benfica
};

// API-Football team ID → football-data.org team ID (reverse of FD_TO_AF),
// built once. Lets a seeded club page ask the proxy for its own fixtures via
// `/proxy/teams/{fdId}/matches`.
const AF_TO_FD: Record<number, number> = (() => {
  const m: Record<number, number> = {};
  for (const [fd, af] of Object.entries(FD_TO_AF)) m[af] = Number(fd);
  return m;
})();

/**
 * Resolves a seeded club's API-Football team ID to its football-data.org team
 * ID, or `undefined` when the club isn't in the cross-walk (so callers can fall
 * back to demo fixtures rather than hitting the proxy with an unmapped ID).
 */
export function footballDataIdFor(afId: number): number | undefined {
  return AF_TO_FD[afId];
}

/** Lowercase, de-accent, drop club-type tokens & punctuation for fuzzy matching. */
function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(fc|cf|ac|sc|afc|cd|rc|ssc|us|as|ss|bv|sv|vfb|vfl|tsg)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Normalized name / shortName → ClubSeed, built once from the seed list.
const CLUB_BY_NORM: Map<string, ClubSeed> = (() => {
  const m = new Map<string, ClubSeed>();
  for (const c of CLUBS) {
    m.set(normalize(c.name), c);
    m.set(normalize(c.shortName), c);
  }
  return m;
})();

/**
 * Resolves a football-data.org team (by ID first, then by fuzzy name) to the
 * seeded `ClubSeed`, or `undefined` when FUTOLOGY doesn't carry that club.
 */
export function resolveClub(fdId: number | null, name: string | null): ClubSeed | undefined {
  if (fdId != null) {
    const afId = FD_TO_AF[fdId];
    if (afId != null) return CLUBS.find((c) => c.id === afId);
  }
  if (name) {
    const hit = CLUB_BY_NORM.get(normalize(name));
    if (hit) return hit;
  }
  return undefined;
}
