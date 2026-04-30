import { NextResponse } from "next/server";
import {
  getBandsForLeague,
  getDemoStandings,
} from "@/lib/data/demoStandings";
import { findLeague } from "@/lib/data/leagues";
import { cacheHeaders, isDemoMode, jsonResponse } from "@/lib/api/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = Number(searchParams.get("league") ?? "39");
  if (!Number.isFinite(leagueId)) {
    return NextResponse.json({ error: "league required" }, { status: 400 });
  }

  if (!isDemoMode) {
    return NextResponse.json(
      { error: "Live standings adapter not wired yet." },
      { status: 501 },
    );
  }

  const league = findLeague(leagueId);
  const rows = getDemoStandings(leagueId);
  const bands = getBandsForLeague(leagueId);
  return jsonResponse(
    { league, bands, rows },
    cacheHeaders.standings,
  );
}
