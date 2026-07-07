import {
  ALL_FOOTBALL_DATA_CODES,
  leagueIdFromCode,
} from "@/lib/data/footballDataCodes";
import { findLeague } from "@/lib/data/leagues";
import { footballDataIdFor, resolveClub } from "@/lib/data/teamCrosswalk";
import {
  matchesByStatus,
  type DemoMatch,
  type MatchStatus,
} from "@/lib/data/demoMatches";
import { api, type FixturesParams } from "./client";

/** Shape of one match in the ML-service `/proxy/matches` reshape. */
type ProxyMatch = {
  id: number;
  utcDate: string | null;
  status: string | null;
  minute: number | null;
  competition: string | null;
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
  homeScore: number | null;
  awayScore: number | null;
};

type ProxyMatchesResponse = { matches: ProxyMatch[] };

// football-data.org match status → our three-state MatchStatus.
function toStatus(raw: string | null): MatchStatus {
  switch (raw) {
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    default:
      return "scheduled"; // SCHEDULED, TIMED, POSTPONED, SUSPENDED, …
  }
}

/**
 * Routes the fixtures lookup to the ML-service football-data.org proxy when
 * `NEXT_PUBLIC_ML_API_URL` is set, otherwise returns the seeded demo fixtures.
 *
 * - League / status / all lookups hit `GET /proxy/matches` (all free-tier
 *   competitions, −2…+7 day window).
 * - Team-filtered lookups (the club detail page) hit
 *   `GET /proxy/teams/{fdId}/matches` via the reverse cross-walk, when the club
 *   is one of the seeded teams the cross-walk knows. Unmapped clubs stay on
 *   demo data (the proxy keys teams by football-data IDs we don't have).
 *
 * Real proxy fixtures are tagged `detailAvailable: false` so the UI skips the
 * detail sheet (there's no real source for stats/lineups/events). Any proxy
 * error falls back to demo so the live build never breaks.
 */
export async function getFixturesAuto(params?: FixturesParams): Promise<DemoMatch[]> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl) {
    return api.fixtures(params);
  }

  // Per-team lookups need the reverse cross-walk. If the club isn't mapped to a
  // football-data ID, there's no real source for it — fall back to demo.
  if (params?.team) {
    const fdId = footballDataIdFor(params.team);
    if (fdId == null) return api.fixtures(params);
    return fetchProxyMatches(
      baseUrl,
      `/proxy/teams/${fdId}/matches?limit=40`,
      params,
    );
  }

  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 2);
  const to = new Date(today);
  to.setDate(to.getDate() + 7);
  const qs = new URLSearchParams({
    competitions: ALL_FOOTBALL_DATA_CODES.join(","),
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  });
  return fetchProxyMatches(baseUrl, `/proxy/matches?${qs.toString()}`, params);
}

/**
 * Fetches a proxy matches endpoint, reshapes to `DemoMatch[]`, applies the
 * league + status filters, and falls back to demo fixtures on any error.
 */
async function fetchProxyMatches(
  baseUrl: string,
  path: string,
  params?: FixturesParams,
): Promise<DemoMatch[]> {
  try {
    const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
    const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`proxy ${path} responded ${res.status}`);

    const data = (await res.json()) as ProxyMatchesResponse;
    const all = (data.matches ?? []).map(toDemoMatch);

    const byLeague = params?.league
      ? all.filter((m) => m.leagueId === params.league)
      : all;
    return matchesByStatus(byLeague, params?.status ?? "all");
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[fixturesAuto] proxy failed, using demo data:`, err);
    }
    return api.fixtures(params);
  }
}

function toDemoMatch(m: ProxyMatch): DemoMatch {
  const leagueId = (m.competition && leagueIdFromCode(m.competition)) || 0;
  const league = findLeague(leagueId);
  const home = resolveClub(m.homeTeam.id, m.homeTeam.name);
  const away = resolveClub(m.awayTeam.id, m.awayTeam.name);
  const status = toStatus(m.status);

  return {
    id: m.id,
    leagueId,
    leagueName: league?.name ?? m.competition ?? "Football",
    homeTeamId: home?.id ?? m.homeTeam.id ?? 0,
    awayTeamId: away?.id ?? m.awayTeam.id ?? 0,
    homeTeam: home?.shortName ?? m.homeTeam.name ?? "TBD",
    awayTeam: away?.shortName ?? m.awayTeam.name ?? "TBD",
    kickoff: m.utcDate ?? new Date().toISOString(),
    status,
    minute: m.minute ?? undefined,
    homeScore: m.homeScore ?? undefined,
    awayScore: m.awayScore ?? undefined,
    detailAvailable: false,
  };
}
