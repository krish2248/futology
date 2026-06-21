import { findLeague, type LeagueSeed } from "@/lib/data/leagues";
import { footballDataCode } from "@/lib/data/footballDataCodes";
import {
  getBandsForLeague,
  type StandingRow,
  type StandingsBands,
} from "@/lib/data/demoStandings";
import { api } from "./client";

export type StandingsResult = {
  league: LeagueSeed | undefined;
  bands: StandingsBands;
  rows: StandingRow[];
};

/** Shape of one row in the ML-service `/proxy/standings` reshape. */
type ProxyStandingRow = {
  position: number | null;
  teamId: number | null;
  teamName: string | null;
  playedGames: number | null;
  won: number | null;
  draw: number | null;
  lost: number | null;
  points: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalDifference: number | null;
  form: string | null;
};

type ProxyStandingsResponse = {
  groups: Array<{ rows: ProxyStandingRow[] }>;
};

/**
 * Routes the standings lookup to the ML-service football-data.org proxy
 * (`GET /proxy/standings?league=<CODE>`) when `NEXT_PUBLIC_ML_API_URL` is
 * configured and the league is covered by the free tier, otherwise returns
 * the seeded demo standings.
 *
 * The return shape is identical on both branches, so `StandingsTable` never
 * has to care which source it got. If the proxy errors (e.g. the Space's
 * `FOOTBALL_DATA_KEY` isn't set, or the upstream rate-limits), we fall back
 * to demo data rather than failing the page — the live GitHub Pages build
 * stays usable no matter the proxy's state.
 */
export async function getStandingsAuto(leagueId: number): Promise<StandingsResult> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  const code = footballDataCode(leagueId);
  if (!baseUrl || !code) {
    return api.standings(leagueId);
  }

  try {
    const url = `${baseUrl.replace(/\/+$/, "")}/proxy/standings?league=${code}`;
    const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`proxy /standings responded ${res.status}`);

    const data = (await res.json()) as ProxyStandingsResponse;
    const proxyRows = data.groups?.[0]?.rows ?? [];
    if (proxyRows.length === 0) throw new Error("proxy /standings returned no rows");

    return {
      league: findLeague(leagueId),
      bands: getBandsForLeague(leagueId),
      rows: proxyRows.map(toStandingRow),
    };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[standingsAuto] proxy failed, using demo data:`, err);
    }
    return api.standings(leagueId);
  }
}

/** Reshapes one proxy row into the front-end `StandingRow`. */
function toStandingRow(r: ProxyStandingRow, i: number): StandingRow {
  const position = r.position ?? i + 1;
  return {
    position,
    // football-data.org doesn't carry a previous matchday position, so there's
    // no movement to show — equal positions render as a neutral dash.
    prevPosition: position,
    teamId: r.teamId ?? i,
    teamName: r.teamName ?? "—",
    played: r.playedGames ?? 0,
    won: r.won ?? 0,
    drawn: r.draw ?? 0,
    lost: r.lost ?? 0,
    goalsFor: r.goalsFor ?? 0,
    goalsAgainst: r.goalsAgainst ?? 0,
    goalDifference: r.goalDifference ?? 0,
    points: r.points ?? 0,
    form: parseForm(r.form),
  };
}

/**
 * football-data.org returns recent form as a comma-separated string like
 * `"W,L,D,W,W"` (or `null` early in a season). Parse it into the last five
 * valid results the way the demo data already shapes it.
 */
function parseForm(form: string | null): ("W" | "D" | "L")[] {
  if (!form) return [];
  return form
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is "W" | "D" | "L" => s === "W" || s === "D" || s === "L")
    .slice(-5);
}
