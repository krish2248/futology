import { footballDataCode } from "@/lib/data/footballDataCodes";
import { getDemoScorers, type ScorerRow } from "@/lib/data/demoScorers";

/** Shape of one entry in the ML-service `/proxy/scorers` reshape. */
type ProxyScorer = {
  playerId: number | null;
  playerName: string | null;
  teamId: number | null;
  teamName: string | null;
  goals: number | null;
  assists: number | null;
  penalties: number | null;
  playedMatches: number | null;
};

type ProxyScorersResponse = {
  scorers: ProxyScorer[];
};

/**
 * Routes the top-scorers lookup to the ML-service football-data.org proxy
 * (`GET /proxy/scorers?league=<CODE>`) when `NEXT_PUBLIC_ML_API_URL` is set
 * and the league is covered by the free tier, otherwise returns the seeded
 * demo chart.
 *
 * Same shape on both branches. Any proxy error (e.g. the Space's
 * `FOOTBALL_DATA_KEY` isn't set, or upstream rate-limits) falls back to demo
 * so the live build never breaks. Mirrors `getStandingsAuto`.
 */
export async function getScorersAuto(leagueId: number): Promise<ScorerRow[]> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  const code = footballDataCode(leagueId);
  if (!baseUrl || !code) {
    return getDemoScorers(leagueId);
  }

  try {
    const url = `${baseUrl.replace(/\/+$/, "")}/proxy/scorers?league=${code}`;
    const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`proxy /scorers responded ${res.status}`);

    const data = (await res.json()) as ProxyScorersResponse;
    const proxyRows = data.scorers ?? [];
    if (proxyRows.length === 0) throw new Error("proxy /scorers returned no rows");

    return proxyRows.map((s, i) => ({
      rank: i + 1,
      playerId: s.playerId ?? i,
      playerName: s.playerName ?? "—",
      teamId: s.teamId ?? i,
      teamName: s.teamName ?? "—",
      goals: s.goals ?? 0,
      assists: s.assists ?? 0,
      penalties: s.penalties ?? 0,
      playedMatches: s.playedMatches ?? 0,
    }));
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[scorersAuto] proxy failed, using demo data:`, err);
    }
    return getDemoScorers(leagueId);
  }
}
