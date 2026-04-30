type ApiEnvelope<T> = { data: T; demo: boolean };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(message);
  }
  const body = (await res.json()) as ApiEnvelope<T>;
  return body.data;
}

import type { DemoMatch, MatchStatus } from "@/lib/data/demoMatches";
import type { MatchDetail } from "@/lib/data/demoMatchDetail";
import type {
  StandingRow,
  StandingsBands,
} from "@/lib/data/demoStandings";
import type { LeagueSeed } from "@/lib/data/leagues";
import type { SearchHit } from "@/app/api/football/search/route";

export const api = {
  liveScores: (params?: { league?: number; status?: MatchStatus | "all" }) => {
    const q = new URLSearchParams();
    if (params?.league) q.set("league", String(params.league));
    if (params?.status) q.set("status", params.status);
    return request<DemoMatch[]>(
      `/api/football/live-scores${q.toString() ? `?${q.toString()}` : ""}`,
    );
  },
  fixtures: (params?: {
    league?: number;
    team?: number;
    status?: MatchStatus | "all";
  }) => {
    const q = new URLSearchParams();
    if (params?.league) q.set("league", String(params.league));
    if (params?.team) q.set("team", String(params.team));
    if (params?.status) q.set("status", params.status);
    return request<DemoMatch[]>(
      `/api/football/fixtures${q.toString() ? `?${q.toString()}` : ""}`,
    );
  },
  standings: (leagueId: number) =>
    request<{
      league: LeagueSeed | undefined;
      bands: StandingsBands;
      rows: StandingRow[];
    }>(`/api/football/standings?league=${leagueId}`),
  match: (fixtureId: number) =>
    request<MatchDetail>(`/api/football/match/${fixtureId}`),
  search: (query: string, type: "all" | "team" | "player" | "league" = "all") =>
    request<SearchHit[]>(
      `/api/football/search?q=${encodeURIComponent(query)}&type=${type}`,
    ),
};
