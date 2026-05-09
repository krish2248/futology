export type PlayerSeed = {
  id: number;
  name: string;
  team: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  nationality: string;
};

/**
 * 24 star players seeded for onboarding and the Player Pulse / Transfer
 * Oracle pages. IDs match API-Football player IDs so the cutover is a
 * one-to-one swap. Positions follow the standard GK/DEF/MID/FWD bucketing
 * used by the fantasy optimiser and player comparison radar.
 */
export const PLAYERS: readonly PlayerSeed[] = [
  { id: 521, name: "Lionel Messi", team: "Inter Miami", position: "FWD", nationality: "Argentina" },
  { id: 154, name: "Cristiano Ronaldo", team: "Al-Nassr", position: "FWD", nationality: "Portugal" },
  { id: 909, name: "Erling Haaland", team: "Manchester City", position: "FWD", nationality: "Norway" },
  { id: 278, name: "Kylian Mbappé", team: "Real Madrid", position: "FWD", nationality: "France" },
  { id: 19088, name: "Jude Bellingham", team: "Real Madrid", position: "MID", nationality: "England" },
  { id: 4147, name: "Vinícius Jr.", team: "Real Madrid", position: "FWD", nationality: "Brazil" },
  { id: 1100, name: "Mohamed Salah", team: "Liverpool", position: "FWD", nationality: "Egypt" },
  { id: 1485, name: "Kevin De Bruyne", team: "Manchester City", position: "MID", nationality: "Belgium" },
  { id: 152891, name: "Bukayo Saka", team: "Arsenal", position: "FWD", nationality: "England" },
  { id: 18861, name: "Phil Foden", team: "Manchester City", position: "MID", nationality: "England" },
  { id: 36812, name: "Lamine Yamal", team: "Barcelona", position: "FWD", nationality: "Spain" },
  { id: 47, name: "Robert Lewandowski", team: "Barcelona", position: "FWD", nationality: "Poland" },
  { id: 9568, name: "Pedri", team: "Barcelona", position: "MID", nationality: "Spain" },
  { id: 8917, name: "Gavi", team: "Barcelona", position: "MID", nationality: "Spain" },
  { id: 882, name: "Harry Kane", team: "Bayern München", position: "FWD", nationality: "England" },
  { id: 200, name: "Jamal Musiala", team: "Bayern München", position: "MID", nationality: "Germany" },
  { id: 1864, name: "Florian Wirtz", team: "Bayer Leverkusen", position: "MID", nationality: "Germany" },
  { id: 4663, name: "Rodrygo", team: "Real Madrid", position: "FWD", nationality: "Brazil" },
  { id: 622, name: "Federico Valverde", team: "Real Madrid", position: "MID", nationality: "Uruguay" },
  { id: 130, name: "Lautaro Martínez", team: "Inter", position: "FWD", nationality: "Argentina" },
  { id: 1100025, name: "Rasmus Højlund", team: "Manchester United", position: "FWD", nationality: "Denmark" },
  { id: 19150, name: "Declan Rice", team: "Arsenal", position: "MID", nationality: "England" },
  { id: 904, name: "Virgil van Dijk", team: "Liverpool", position: "DEF", nationality: "Netherlands" },
  { id: 567, name: "Thibaut Courtois", team: "Real Madrid", position: "GK", nationality: "Belgium" },
] as const;

export function findPlayer(id: number): PlayerSeed | undefined {
  return PLAYERS.find((p) => p.id === id);
}
