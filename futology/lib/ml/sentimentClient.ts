import type { DemoMatch } from "@/lib/data/demoMatches";
import { findLeague } from "@/lib/data/leagues";
import { findClub } from "@/lib/data/clubs";
import {
  getDemoSentiment,
  type SentimentReaction,
  type SentimentSnapshot,
} from "@/lib/data/demoSentiment";

type RemoteSentimentResponse = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeMood: number;
  awayMood: number;
  excitement: number;
  totalPosts: number;
  peakMinute: number;
  biggestSwingMinute: number;
  biggestSwingMagnitude: number;
  biggestSwingTeam: "home" | "away" | "neutral";
  timeline: { minute: number; home: number; away: number }[];
  reactions: {
    id: string;
    minute: number;
    side: "home" | "away" | "neutral";
    emotion: SentimentReaction["emotion"];
    text: string;
    source: "reddit" | "twitter" | "synthetic";
  }[];
  sourceMode: "synthetic" | "reddit";
};

/**
 * Routes sentiment analysis to the FastAPI ML service
 * (`POST /sentiment-analyze`) when `NEXT_PUBLIC_ML_API_URL` is
 * configured, otherwise falls back to `getDemoSentiment(match)`.
 *
 * The remote service emits seeded synthetic data today and is
 * designed to swap to a Reddit+RoBERTa pipeline (bible §9.3)
 * without an API change. The local fallback uses the same
 * `(fixture_id, minute, score)` seed shape so both sides produce
 * deterministic output for the same fixture.
 */
export async function analyzeSentimentAuto(
  match: DemoMatch,
): Promise<SentimentSnapshot> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl) {
    return getDemoSentiment(match);
  }

  const url = baseUrl.replace(/\/+$/, "") + "/sentiment-analyze";
  const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const homeName = findClub(match.homeTeamId)?.shortName ?? "Home";
  const awayName = findClub(match.awayTeamId)?.shortName ?? "Away";
  const league = findLeague(match.leagueId)?.shortName;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fixtureId: match.id,
      homeTeam: homeName,
      awayTeam: awayName,
      minute: match.minute ?? (match.status === "scheduled" ? 0 : 90),
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      leagueShortName: league,
      nReactions: 8,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `ML sentiment service responded ${res.status} ${res.statusText}.`,
    );
  }

  const remote = (await res.json()) as RemoteSentimentResponse;

  // Reshape into the existing `SentimentSnapshot` so consumers
  // (`SentimentStormView`, gauges, timeline) don't need updates.
  const swingTeam: "home" | "away" =
    remote.biggestSwingTeam === "away" ? "away" : "home";

  const reactions: SentimentReaction[] = remote.reactions.map((r) => ({
    id: r.id,
    minute: r.minute,
    side: r.side,
    emotion: r.emotion,
    text: r.text,
    source: r.source === "twitter" ? "twitter" : "reddit",
  }));

  return {
    match,
    timeline: remote.timeline,
    goalEvents: [],
    excitement: remote.excitement,
    homeMood: remote.homeMood,
    awayMood: remote.awayMood,
    totalPosts: remote.totalPosts,
    peakMinute: remote.peakMinute,
    biggestSwing: {
      minute: remote.biggestSwingMinute,
      magnitude: remote.biggestSwingMagnitude,
      team: swingTeam,
    },
    reactions,
  };
}
