export type NewsCategory =
  | "transfers"
  | "match"
  | "analysis"
  | "injuries"
  | "tactics";

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: NewsCategory;
  publishedAt: string; // ISO
  relatedClubIds: number[];
  relatedPlayerIds: number[];
  relatedLeagueIds: number[];
  href?: string;
};

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  transfers: "Transfers",
  match: "Match",
  analysis: "Analysis",
  injuries: "Injuries",
  tactics: "Tactics",
};

export const NEWS_CATEGORY_COLOR: Record<NewsCategory, string> = {
  transfers: "#FFD700",
  match: "#00D563",
  analysis: "#3B82F6",
  injuries: "#FF3B3B",
  tactics: "#A1A1A1",
};

function hoursAgo(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

export const NEWS_ITEMS: readonly NewsItem[] = [
  {
    id: "n1",
    title: "Real Madrid close in on €80M deal for Højlund — Fabrizio Romano",
    summary:
      "Personal terms agreed; Manchester United holding out for €85M plus add-ons. Medical pencilled in for next week.",
    source: "Fabrizio Romano",
    category: "transfers",
    publishedAt: hoursAgo(1),
    relatedClubIds: [541, 33],
    relatedPlayerIds: [1100025],
    relatedLeagueIds: [140, 39],
  },
  {
    id: "n2",
    title: "Manchester United 1–1 Liverpool: tactical breakdown",
    summary:
      "United's 4-3-3 morphed into a 5-2-3 out of possession. Onana neutralised Salah's right-channel runs; the equaliser came from a Mainoo press recovery.",
    source: "Tifo Football",
    category: "tactics",
    publishedAt: hoursAgo(3),
    relatedClubIds: [33, 40],
    relatedPlayerIds: [1100],
    relatedLeagueIds: [39],
  },
  {
    id: "n3",
    title: "Bellingham named on Ballon d'Or shortlist",
    summary:
      "Real Madrid midfielder ranks #2 on bookmaker odds. Vinícius Jr. and Mbappé round out the top three.",
    source: "France Football",
    category: "analysis",
    publishedAt: hoursAgo(5),
    relatedClubIds: [541],
    relatedPlayerIds: [19088, 4147, 278],
    relatedLeagueIds: [140],
  },
  {
    id: "n4",
    title: "Saka ruled out for 4 weeks with hamstring",
    summary:
      "Arsenal will be without their leading creator for the upcoming UCL group-stage game and the North London Derby. Trossard expected to start.",
    source: "Athletic",
    category: "injuries",
    publishedAt: hoursAgo(8),
    relatedClubIds: [42],
    relatedPlayerIds: [152891],
    relatedLeagueIds: [39, 2],
  },
  {
    id: "n5",
    title: "Bayern run riot at Signal Iduna Park, 3-2",
    summary:
      "Harry Kane bagged a hat-trick in a chaotic Klassiker that swung four times in 95 minutes. Dortmund finish strongly but a defensive error in the 88th seals it.",
    source: "Bundesliga.com",
    category: "match",
    publishedAt: hoursAgo(12),
    relatedClubIds: [157, 165],
    relatedPlayerIds: [882, 200],
    relatedLeagueIds: [78],
  },
  {
    id: "n6",
    title: "Lamine Yamal extends Barcelona deal to 2030",
    summary:
      "Release clause set at €1bn. New deal triples his weekly wage and adds image-rights tier.",
    source: "Marca",
    category: "transfers",
    publishedAt: hoursAgo(14),
    relatedClubIds: [529],
    relatedPlayerIds: [36812],
    relatedLeagueIds: [140],
  },
  {
    id: "n7",
    title: "Why Pep is dropping Foden into the half-spaces",
    summary:
      "Recent xG/xA splits show Foden produces 22% more shot-creating actions when starting from the right half-space rather than the wing.",
    source: "The Coaches' Voice",
    category: "tactics",
    publishedAt: hoursAgo(20),
    relatedClubIds: [50],
    relatedPlayerIds: [18861],
    relatedLeagueIds: [39],
  },
  {
    id: "n8",
    title: "PSG win 4-0 in Marseille; Mbappé brace",
    summary:
      "Le Classique had only one team in it. Vitinha ran the midfield, Marquinhos kept a clean sheet against a toothless Marseille front three.",
    source: "L'Équipe",
    category: "match",
    publishedAt: hoursAgo(22),
    relatedClubIds: [85, 81],
    relatedPlayerIds: [278],
    relatedLeagueIds: [61],
  },
  {
    id: "n9",
    title: "Inter agree clauses for Lautaro Martínez extension",
    summary:
      "Argentine captain set to sign through 2029. Wage rises to €9M after tax with a buy-out clause structured around UCL qualification.",
    source: "Gazzetta dello Sport",
    category: "transfers",
    publishedAt: hoursAgo(26),
    relatedClubIds: [505],
    relatedPlayerIds: [130],
    relatedLeagueIds: [135],
  },
  {
    id: "n10",
    title: "Wirtz: 'I want to win the Champions League with Leverkusen'",
    summary:
      "In a long-form interview the German playmaker shut down summer transfer speculation. 'I'm not going anywhere yet — there's unfinished business here.'",
    source: "Kicker",
    category: "analysis",
    publishedAt: hoursAgo(30),
    relatedClubIds: [168],
    relatedPlayerIds: [1864],
    relatedLeagueIds: [78, 2],
  },
  {
    id: "n11",
    title: "Van Dijk passes Liverpool's 200-game clean-sheet milestone",
    summary:
      "Defensive metrics are still elite at 33: top-quartile in xG-prevented, aerial duels, and progressive pass volume from his own half.",
    source: "Liverpool FC",
    category: "analysis",
    publishedAt: hoursAgo(36),
    relatedClubIds: [40],
    relatedPlayerIds: [904],
    relatedLeagueIds: [39],
  },
  {
    id: "n12",
    title: "Courtois back in training, set for Bernabéu return",
    summary:
      "Belgian keeper completed three sessions with the first team. Ancelotti expects him available for the next round of UCL fixtures.",
    source: "AS",
    category: "injuries",
    publishedAt: hoursAgo(40),
    relatedClubIds: [541],
    relatedPlayerIds: [567],
    relatedLeagueIds: [140, 2],
  },
  {
    id: "n13",
    title: "Ajax 2–2 PSV: title race tightens",
    summary:
      "PSV's lead at the top of the Eredivisie drops to a single point after a late equaliser at the Johan Cruijff Arena.",
    source: "ESPN Netherlands",
    category: "match",
    publishedAt: hoursAgo(44),
    relatedClubIds: [194, 197],
    relatedPlayerIds: [],
    relatedLeagueIds: [88],
  },
  {
    id: "n14",
    title: "Why pressing has dropped league-wide this season",
    summary:
      "PPDA across the Premier League is up 9% on last season. Theory: heavier match congestion + changes to handball laws have reframed how pressure is rewarded.",
    source: "StatsBomb Insights",
    category: "tactics",
    publishedAt: hoursAgo(48),
    relatedClubIds: [],
    relatedPlayerIds: [],
    relatedLeagueIds: [39],
  },
  {
    id: "n15",
    title: "Pedri to miss El Clásico with grade-1 hamstring",
    summary:
      "Barcelona's playmaker felt tightness in training. Xavi confirms 2-week absence; Gavi expected to start in his place.",
    source: "Mundo Deportivo",
    category: "injuries",
    publishedAt: hoursAgo(54),
    relatedClubIds: [529],
    relatedPlayerIds: [9568, 8917],
    relatedLeagueIds: [140],
  },
  {
    id: "n16",
    title: "Erling Haaland on track to break league goalscoring record",
    summary:
      "Norwegian striker sits at 22 goals in 18 games — pace of 46.4 per 38, comfortably above the all-time mark.",
    source: "Opta",
    category: "analysis",
    publishedAt: hoursAgo(60),
    relatedClubIds: [50],
    relatedPlayerIds: [909],
    relatedLeagueIds: [39],
  },
  {
    id: "n17",
    title: "Atalanta complete late move for Argentine forward",
    summary:
      "€18M fee with €4M in performance add-ons. Player flies to Bergamo for medical tomorrow.",
    source: "Sky Sport Italia",
    category: "transfers",
    publishedAt: hoursAgo(72),
    relatedClubIds: [499],
    relatedPlayerIds: [],
    relatedLeagueIds: [135],
  },
  {
    id: "n18",
    title: "Atlético dig out a 1-0 win at the Wanda",
    summary:
      "Antoine Griezmann strikes the winner from a Korke counter. Atlético leapfrog Athletic in the standings to fourth.",
    source: "Marca",
    category: "match",
    publishedAt: hoursAgo(80),
    relatedClubIds: [530, 531],
    relatedPlayerIds: [],
    relatedLeagueIds: [140],
  },
] as const;

export type NewsFilter = "all" | NewsCategory;

export function filterByCategory(
  items: readonly NewsItem[],
  category: NewsFilter,
): NewsItem[] {
  if (category === "all") return [...items];
  return items.filter((i) => i.category === category);
}

export function isPersonalized(
  item: NewsItem,
  followed: { clubs: number[]; players: number[]; leagues: number[] },
): boolean {
  if (followed.clubs.some((id) => item.relatedClubIds.includes(id))) return true;
  if (followed.players.some((id) => item.relatedPlayerIds.includes(id))) return true;
  if (followed.leagues.some((id) => item.relatedLeagueIds.includes(id))) return true;
  return false;
}

export function rankPersonalized(
  items: readonly NewsItem[],
  followed: { clubs: number[]; players: number[]; leagues: number[] },
): NewsItem[] {
  return [...items].sort((a, b) => {
    const aHit = isPersonalized(a, followed) ? 0 : 1;
    const bHit = isPersonalized(b, followed) ? 0 : 1;
    if (aHit !== bHit) return aHit - bHit;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
