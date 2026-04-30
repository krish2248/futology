export type ClubSeed = {
  id: number;
  name: string;
  shortName: string;
  leagueId: number;
  country: string;
  founded?: number;
};

export const CLUBS: readonly ClubSeed[] = [
  // Premier League (39)
  { id: 33, name: "Manchester United", shortName: "Man Utd", leagueId: 39, country: "England", founded: 1878 },
  { id: 40, name: "Liverpool", shortName: "Liverpool", leagueId: 39, country: "England", founded: 1892 },
  { id: 50, name: "Manchester City", shortName: "Man City", leagueId: 39, country: "England", founded: 1880 },
  { id: 49, name: "Chelsea", shortName: "Chelsea", leagueId: 39, country: "England", founded: 1905 },
  { id: 42, name: "Arsenal", shortName: "Arsenal", leagueId: 39, country: "England", founded: 1886 },
  { id: 47, name: "Tottenham Hotspur", shortName: "Spurs", leagueId: 39, country: "England", founded: 1882 },
  { id: 34, name: "Newcastle United", shortName: "Newcastle", leagueId: 39, country: "England", founded: 1892 },
  { id: 66, name: "Aston Villa", shortName: "Villa", leagueId: 39, country: "England", founded: 1874 },
  { id: 51, name: "Brighton & Hove Albion", shortName: "Brighton", leagueId: 39, country: "England", founded: 1901 },
  { id: 48, name: "West Ham United", shortName: "West Ham", leagueId: 39, country: "England", founded: 1895 },

  // La Liga (140)
  { id: 541, name: "Real Madrid", shortName: "Real Madrid", leagueId: 140, country: "Spain", founded: 1902 },
  { id: 529, name: "FC Barcelona", shortName: "Barcelona", leagueId: 140, country: "Spain", founded: 1899 },
  { id: 530, name: "Atlético Madrid", shortName: "Atlético", leagueId: 140, country: "Spain", founded: 1903 },
  { id: 548, name: "Real Sociedad", shortName: "Real Sociedad", leagueId: 140, country: "Spain", founded: 1909 },
  { id: 532, name: "Valencia", shortName: "Valencia", leagueId: 140, country: "Spain", founded: 1919 },
  { id: 531, name: "Athletic Bilbao", shortName: "Athletic", leagueId: 140, country: "Spain", founded: 1898 },
  { id: 543, name: "Real Betis", shortName: "Betis", leagueId: 140, country: "Spain", founded: 1907 },
  { id: 536, name: "Sevilla", shortName: "Sevilla", leagueId: 140, country: "Spain", founded: 1890 },

  // Serie A (135)
  { id: 489, name: "AC Milan", shortName: "Milan", leagueId: 135, country: "Italy", founded: 1899 },
  { id: 505, name: "Inter Milan", shortName: "Inter", leagueId: 135, country: "Italy", founded: 1908 },
  { id: 496, name: "Juventus", shortName: "Juve", leagueId: 135, country: "Italy", founded: 1897 },
  { id: 492, name: "Napoli", shortName: "Napoli", leagueId: 135, country: "Italy", founded: 1926 },
  { id: 497, name: "Roma", shortName: "Roma", leagueId: 135, country: "Italy", founded: 1927 },
  { id: 487, name: "Lazio", shortName: "Lazio", leagueId: 135, country: "Italy", founded: 1900 },
  { id: 499, name: "Atalanta", shortName: "Atalanta", leagueId: 135, country: "Italy", founded: 1907 },

  // Bundesliga (78)
  { id: 157, name: "Bayern München", shortName: "Bayern", leagueId: 78, country: "Germany", founded: 1900 },
  { id: 165, name: "Borussia Dortmund", shortName: "Dortmund", leagueId: 78, country: "Germany", founded: 1909 },
  { id: 168, name: "Bayer Leverkusen", shortName: "Leverkusen", leagueId: 78, country: "Germany", founded: 1904 },
  { id: 173, name: "RB Leipzig", shortName: "Leipzig", leagueId: 78, country: "Germany", founded: 2009 },
  { id: 169, name: "Eintracht Frankfurt", shortName: "Frankfurt", leagueId: 78, country: "Germany", founded: 1899 },

  // Ligue 1 (61)
  { id: 85, name: "Paris Saint-Germain", shortName: "PSG", leagueId: 61, country: "France", founded: 1970 },
  { id: 91, name: "Monaco", shortName: "Monaco", leagueId: 61, country: "France", founded: 1924 },
  { id: 81, name: "Marseille", shortName: "Marseille", leagueId: 61, country: "France", founded: 1899 },
  { id: 79, name: "Lille", shortName: "Lille", leagueId: 61, country: "France", founded: 1944 },
  { id: 80, name: "Lyon", shortName: "Lyon", leagueId: 61, country: "France", founded: 1950 },

  // Eredivisie (88)
  { id: 194, name: "Ajax", shortName: "Ajax", leagueId: 88, country: "Netherlands", founded: 1900 },
  { id: 197, name: "PSV Eindhoven", shortName: "PSV", leagueId: 88, country: "Netherlands", founded: 1913 },
  { id: 209, name: "Feyenoord", shortName: "Feyenoord", leagueId: 88, country: "Netherlands", founded: 1908 },

  // Primeira Liga (94)
  { id: 228, name: "Sporting CP", shortName: "Sporting", leagueId: 94, country: "Portugal", founded: 1906 },
  { id: 212, name: "FC Porto", shortName: "Porto", leagueId: 94, country: "Portugal", founded: 1893 },
  { id: 211, name: "Benfica", shortName: "Benfica", leagueId: 94, country: "Portugal", founded: 1904 },
] as const;

export function clubsByLeague(leagueId: number): ClubSeed[] {
  return CLUBS.filter((c) => c.leagueId === leagueId);
}

export function findClub(id: number): ClubSeed | undefined {
  return CLUBS.find((c) => c.id === id);
}

export const CLUB_QUICK_PICKS: readonly number[] = [
  33, 40, 50, 49, 42, 541, 529, 530, 489, 505, 496, 492, 157, 165, 85, 194,
] as const;
