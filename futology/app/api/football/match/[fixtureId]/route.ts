import { NextResponse } from "next/server";
import { getDemoMatches } from "@/lib/data/demoMatches";
import { getDemoMatchDetail } from "@/lib/data/demoMatchDetail";
import { cacheHeaders, isDemoMode, jsonResponse } from "@/lib/api/config";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { fixtureId: string } },
) {
  const id = Number(params.fixtureId);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid fixture id" }, { status: 400 });
  }

  if (!isDemoMode) {
    return NextResponse.json(
      { error: "Live match adapter not wired yet." },
      { status: 501 },
    );
  }

  const match = getDemoMatches().find((m) => m.id === id);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const detail = getDemoMatchDetail(match);
  const cache =
    match.status === "live"
      ? cacheHeaders.liveMatch
      : cacheHeaders.finishedMatch;
  return jsonResponse(detail, cache);
}
