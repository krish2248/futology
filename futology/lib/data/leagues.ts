export type LeagueSeed = {
  id: number;
  name: string;
  shortName: string;
  country: string;
  flag: string;
  tier: "elite" | "major" | "rising";
};

export const LEAGUES: readonly LeagueSeed[] = [
  { id: 39, name: "Premier League", shortName: "EPL", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "elite" },
  { id: 140, name: "La Liga", shortName: "LaLiga", country: "Spain", flag: "🇪🇸", tier: "elite" },
  { id: 135, name: "Serie A", shortName: "Serie A", country: "Italy", flag: "🇮🇹", tier: "elite" },
  { id: 78, name: "Bundesliga", shortName: "Bundesliga", country: "Germany", flag: "🇩🇪", tier: "elite" },
  { id: 61, name: "Ligue 1", shortName: "Ligue 1", country: "France", flag: "🇫🇷", tier: "elite" },
  { id: 2, name: "UEFA Champions League", shortName: "UCL", country: "Europe", flag: "⭐", tier: "elite" },
  { id: 3, name: "UEFA Europa League", shortName: "UEL", country: "Europe", flag: "🌍", tier: "major" },
  { id: 848, name: "Conference League", shortName: "UECL", country: "Europe", flag: "🌐", tier: "major" },
  { id: 253, name: "Major League Soccer", shortName: "MLS", country: "USA", flag: "🇺🇸", tier: "major" },
  { id: 262, name: "Liga MX", shortName: "Liga MX", country: "Mexico", flag: "🇲🇽", tier: "major" },
  { id: 88, name: "Eredivisie", shortName: "Eredivisie", country: "Netherlands", flag: "🇳🇱", tier: "major" },
  { id: 94, name: "Primeira Liga", shortName: "Primeira", country: "Portugal", flag: "🇵🇹", tier: "major" },
  { id: 203, name: "Süper Lig", shortName: "Süper Lig", country: "Türkiye", flag: "🇹🇷", tier: "major" },
  { id: 307, name: "Saudi Pro League", shortName: "SPL", country: "Saudi Arabia", flag: "🇸🇦", tier: "rising" },
  { id: 323, name: "Indian Super League", shortName: "ISL", country: "India", flag: "🇮🇳", tier: "rising" },
  { id: 188, name: "A-League", shortName: "A-League", country: "Australia", flag: "🇦🇺", tier: "rising" },
  { id: 98, name: "J1 League", shortName: "J-League", country: "Japan", flag: "🇯🇵", tier: "rising" },
  { id: 292, name: "K League 1", shortName: "K-League", country: "South Korea", flag: "🇰🇷", tier: "rising" },
  { id: 71, name: "Brasileirão", shortName: "Brasileirão", country: "Brazil", flag: "🇧🇷", tier: "major" },
  { id: 128, name: "Argentine Primera", shortName: "Primera", country: "Argentina", flag: "🇦🇷", tier: "major" },
] as const;

export function findLeague(id: number): LeagueSeed | undefined {
  return LEAGUES.find((l) => l.id === id);
}
