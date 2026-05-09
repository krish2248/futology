export type TournamentSeed = {
  id: number;
  name: string;
  shortName: string;
  region: string;
  flag: string;
};

/**
 * 10 international and major domestic-cup tournaments offered during
 * onboarding. IDs match API-Football competition IDs.
 */
export const TOURNAMENTS: readonly TournamentSeed[] = [
  { id: 1, name: "FIFA World Cup", shortName: "World Cup", region: "International", flag: "🌍" },
  { id: 4, name: "UEFA European Championship", shortName: "Euros", region: "Europe", flag: "🇪🇺" },
  { id: 9, name: "Copa America", shortName: "Copa", region: "South America", flag: "🌎" },
  { id: 6, name: "Africa Cup of Nations", shortName: "AFCON", region: "Africa", flag: "🌍" },
  { id: 17, name: "AFC Asian Cup", shortName: "Asian Cup", region: "Asia", flag: "🌏" },
  { id: 15, name: "FIFA Club World Cup", shortName: "CWC", region: "International", flag: "🏆" },
  { id: 45, name: "FA Cup", shortName: "FA Cup", region: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 143, name: "Copa del Rey", shortName: "Copa", region: "Spain", flag: "🇪🇸" },
  { id: 81, name: "DFB-Pokal", shortName: "DFB-Pokal", region: "Germany", flag: "🇩🇪" },
  { id: 16, name: "Coupe de France", shortName: "Coupe", region: "France", flag: "🇫🇷" },
] as const;

/** Looks up a tournament by ID. Returns undefined for unknown IDs. */
export function findTournament(id: number): TournamentSeed | undefined {
  return TOURNAMENTS.find((t) => t.id === id);
}
