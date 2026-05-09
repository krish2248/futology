import { CLUBS } from "@/lib/data/clubs";
import { LEAGUES, findLeague } from "@/lib/data/leagues";
import { PLAYERS } from "@/lib/data/players";
import {
  getDemoMatches,
  liveMatches,
  matchesByStatus,
  type DemoMatch,
  type MatchStatus,
} from "@/lib/data/demoMatches";
import { getDemoMatchDetail, type MatchDetail } from "@/lib/data/demoMatchDetail";
import {
  getBandsForLeague,
  getDemoStandings,
  type StandingRow,
  type StandingsBands,
} from "@/lib/data/demoStandings";
import type { LeagueSeed } from "@/lib/data/leagues";

export type SearchKind = "league" | "club" | "player";

export interface SearchHit {
  kind: SearchKind;
  id: number;
  title: string;
  subtitle: string;
}

export interface LiveScoresParams {
  league?: number;
  status?: MatchStatus | "all";
}

export interface FixturesParams {
  league?: number;
  team?: number;
  status?: MatchStatus | "all";
}

export interface StandingsParams {
  leagueId: number;
}

export interface MatchParams {
  fixtureId: number;
}

export interface SearchParams {
  q: string;
  kind?: SearchKind;
}

// Static-export-friendly: every method is a synchronous lookup wrapped in a
// resolved promise so the call sites still feel async. When we cut over to
// real services in the Supabase phase, swap each method for a fetch.

/**
 * Wrap value in resolved promise for consistent async API.
 * @param value - Value to wrap in Promise
 * @returns Promise resolving to the value
 */
function resolved<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

export const api = {
  /**
   * Get live scores filtered by league and/or status.
   * @param params - Optional filter parameters
   * @returns Promise resolving to array of DemoMatch
   */
  liveScores: (params?: LiveScoresParams) => {
    const all = getDemoMatches();
    const status = params?.status ?? "live";
    const byStatus = status === "live" ? liveMatches(all) : matchesByStatus(all, status);
    const filtered = params?.league
      ? byStatus.filter((m) => m.leagueId === params.league)
      : byStatus;
    return resolved<DemoMatch[]>(filtered);
  },

  /**
   * Get fixtures filtered by league, team, and/or status.
   * @param params - Optional filter parameters
   * @returns Promise resolving to array of DemoMatch
   */
  fixtures: (params?: FixturesParams) => {
    const all = getDemoMatches();
    const status = params?.status ?? "all";
    const filtered = matchesByStatus(all, status);
    const withLeague = params?.league
      ? filtered.filter((m) => m.leagueId === params.league)
      : filtered;
    const withTeam = params?.team
      ? withLeague.filter(
          (m) => m.homeTeamId === params.team || m.awayTeamId === params.team,
        )
      : withLeague;
    return resolved<DemoMatch[]>(withTeam);
  },

  /**
   * Returns the league meta + qualification bands + 16-team standings table.
   * Cutover: the body becomes a `fetch` to the Supabase view that proxies
   * API-Football standings — the return shape is already correct.
   */
  standings: (leagueId: number) => {
    const league = findLeague(leagueId);
    const rows = getDemoStandings(leagueId);
    const bands = getBandsForLeague(leagueId);
    return resolved<{
      league: LeagueSeed | undefined;
      bands: StandingsBands;
      rows: StandingRow[];
    }>({ league, bands, rows });
  },

  /**
   * Get detailed match information by fixture ID.
   * @param params - Object containing fixtureId
   * @returns Promise resolving to MatchDetail or rejects if not found
   */
  match: (params: MatchParams) => {
    const match = getDemoMatches().find((m) => m.id === params.fixtureId);
    if (!match) {
      return Promise.reject(new Error(`Match ${params.fixtureId} not found`));
    }
    return resolved<MatchDetail>(getDemoMatchDetail(match));
  },

  /**
   * Local fuzzy-search across leagues, clubs, and players. Empty query
   * short-circuits to an empty array; results are capped at 24 to keep
   * the search modal scrollable without virtualisation.
   */
  search: (
    query: string,
    type: "all" | "team" | "player" | "league" = "all",
  ) => {
    const q = query.trim().toLowerCase();
    if (!q) return resolved<SearchHit[]>([]);
    const hits: SearchHit[] = [];
    const includeLeagues = type === "all" || type === "league";
    const includeClubs = type === "all" || type === "team";
    const includePlayers = type === "all" || type === "player";

    if (includeLeagues) {
      for (const l of LEAGUES) {
        if (
          l.name.toLowerCase().includes(q) ||
          l.shortName.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q)
        ) {
          hits.push({
            kind: "league",
            id: l.id,
            title: l.name,
            subtitle: l.country,
          });
        }
      }
    }
    if (includeClubs) {
      for (const c of CLUBS) {
        if (
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q)
        ) {
          hits.push({
            kind: "club",
            id: c.id,
            title: c.name,
            subtitle: c.country,
          });
        }
      }
    }
    if (includePlayers) {
      for (const p of PLAYERS) {
        if (
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q)
        ) {
          hits.push({
            kind: "player",
            id: p.id,
            title: p.name,
            subtitle: `${p.team} · ${p.position}`,
          });
        }
      }
    }
    return resolved<SearchHit[]>(hits.slice(0, 24));
  },
};
