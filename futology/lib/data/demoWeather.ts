export type WeatherBucket = "clear" | "rain" | "heat" | "wind" | "cold";

export type WeatherSplit = {
  bucket: WeatherBucket;
  matches: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  goalsPerMatch: number;
};

export type WeatherLeague = {
  leagueId: number;
  leagueName: string;
  splits: WeatherSplit[];
};

export const WEATHER_LABELS: Record<WeatherBucket, { label: string; icon: string; description: string }> = {
  clear: {
    label: "Clear",
    icon: "☀️",
    description: "0–4 mm rain, 12–28 °C, light wind",
  },
  rain: {
    label: "Rain",
    icon: "🌧️",
    description: "≥ 5 mm rain in match window",
  },
  heat: {
    label: "Heat",
    icon: "🔥",
    description: "≥ 28 °C kickoff temperature",
  },
  wind: {
    label: "Wind",
    icon: "💨",
    description: "Sustained wind ≥ 30 km/h",
  },
  cold: {
    label: "Cold",
    icon: "❄️",
    description: "≤ 5 °C kickoff temperature",
  },
};

function s(seed: number) {
  let v = (seed * 1664525) % 4294967296;
  if (v < 0) v += 4294967296;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

const BASE_HOME = 0.46; // baseline home win rate

const BUCKET_BIAS: Record<WeatherBucket, number> = {
  clear: 0.0,
  rain: -0.04, // home advantage shrinks slightly in rain
  heat: -0.06, // hot conditions favor away
  wind: -0.02,
  cold: 0.03, // cold favors home (acclimatization, boisterous crowd)
};

function buildSplits(seed: number, baseMatches: number): WeatherSplit[] {
  const rnd = s(seed);
  const buckets: WeatherBucket[] = ["clear", "rain", "heat", "wind", "cold"];
  return buckets.map((b) => {
    const share = b === "clear" ? 0.42 : b === "rain" ? 0.18 : b === "wind" ? 0.16 : b === "cold" ? 0.14 : 0.10;
    const matches = Math.max(8, Math.floor(baseMatches * share));
    const home = Math.max(0.2, Math.min(0.7, BASE_HOME + BUCKET_BIAS[b] + (rnd() - 0.5) * 0.08));
    const away = Math.max(0.18, Math.min(0.55, 0.30 + (rnd() - 0.5) * 0.06 - BUCKET_BIAS[b] * 0.5));
    const draw = Math.max(0.12, 1 - home - away);
    const total = home + draw + away;
    const norm = (n: number) => n / total;
    return {
      bucket: b,
      matches,
      homeWin: norm(home),
      draw: norm(draw),
      awayWin: norm(away),
      goalsPerMatch: Number((2.4 + (rnd() - 0.5) * 0.6 + (b === "clear" ? 0.2 : b === "rain" ? -0.15 : 0)).toFixed(2)),
    };
  });
}

export const WEATHER_LEAGUES: readonly WeatherLeague[] = [
  { leagueId: 39, leagueName: "Premier League", splits: buildSplits(7, 380) },
  { leagueId: 140, leagueName: "La Liga", splits: buildSplits(11, 380) },
  { leagueId: 78, leagueName: "Bundesliga", splits: buildSplits(13, 306) },
  { leagueId: 135, leagueName: "Serie A", splits: buildSplits(17, 380) },
  { leagueId: 61, leagueName: "Ligue 1", splits: buildSplits(19, 306) },
];

export function aggregateAll(): WeatherSplit[] {
  const buckets: WeatherBucket[] = ["clear", "rain", "heat", "wind", "cold"];
  return buckets.map((b) => {
    const totals = WEATHER_LEAGUES.flatMap((l) =>
      l.splits.filter((s) => s.bucket === b),
    );
    const matches = totals.reduce((acc, t) => acc + t.matches, 0);
    const home = totals.reduce((acc, t) => acc + t.homeWin * t.matches, 0) / Math.max(1, matches);
    const draw = totals.reduce((acc, t) => acc + t.draw * t.matches, 0) / Math.max(1, matches);
    const away = totals.reduce((acc, t) => acc + t.awayWin * t.matches, 0) / Math.max(1, matches);
    const goals = totals.reduce((acc, t) => acc + t.goalsPerMatch * t.matches, 0) / Math.max(1, matches);
    return {
      bucket: b,
      matches,
      homeWin: home,
      draw,
      awayWin: away,
      goalsPerMatch: Number(goals.toFixed(2)),
    };
  });
}
