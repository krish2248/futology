import {
  ALL_FOOTBALL_DATA_CODES,
  leagueIdFromCode,
} from "@/lib/data/footballDataCodes";
import { findLeague } from "@/lib/data/leagues";
import { resolveClub } from "@/lib/data/teamCrosswalk";
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
 * Routes the fixtures lookup to the ML-service football-data.org proxy
 * (`GET /proxy/matches`) when `NEXT_PUBLIC_ML_API_URL` is set, otherwise
 * returns the seeded demo fixtures.
 *
 * Team-filtered lookups (the club detail page) stay on demo data — the proxy
 * keys teams by football-data IDs, and the club page is built around our
 * API-Football IDs. Real per-team fixtures need the reverse cross-walk; until
 * then those callers keep their demo behaviour.
 *
 * Real proxy fixtures are tagged `detailAvailable: false` so the UI skips the
 * detail sheet (there's no real source for stats/lineups/events). Any proxy
 * error falls back to demo so the live build never breaks.
 */
export async function getFixturesAuto(params?: FixturesParams): Promise<DemoMatch[]> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl || params?.team) {
    return api.fixtures(params);
  }

  try {
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
    const url = `${baseUrl.replace(/\/+$/, "")}/proxy/matches?${qs.toString()}`;
    const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`proxy /matches responded ${res.status}`);

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
