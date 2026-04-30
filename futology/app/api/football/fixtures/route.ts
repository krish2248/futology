import { NextResponse } from "next/server";
import {
  getDemoMatches,
  matchesByStatus,
  type MatchStatus,
} from "@/lib/data/demoMatches";
import { cacheHeaders, isDemoMode, jsonResponse } from "@/lib/api/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = searchParams.get("league");
  const team = searchParams.get("team");
  const status = (searchParams.get("status") ?? "all") as
    | MatchStatus
    | "all";

  if (isDemoMode) {
    let result = matchesByStatus(getDemoMatches(), status);
    if (league)
      result = result.filter((m) => String(m.leagueId) === league);
    if (team)
      result = result.filter(
        (m) => String(m.homeTeamId) === team || String(m.awayTeamId) === team,
      );
    return jsonResponse(result, cacheHeaders.fixtures);
  }

  return NextResponse.json(
    { error: "Live data adapter not yet wired. Set DEMO_MODE=true." },
    { status: 501 },
  );
}
