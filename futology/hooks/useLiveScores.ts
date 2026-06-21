"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { getStandingsAuto } from "@/lib/api/standingsAuto";
import { getScorersAuto } from "@/lib/api/scorersAuto";
import type { MatchStatus } from "@/lib/data/demoMatches";

const LIVE_POLL_MS = 30_000;
const FIXTURES_STALE_MS = 5 * 60_000;

/**
 * Polls the live-scores endpoint every 30 seconds while mounted.
 *
 * Background polling is disabled to avoid burning RapidAPI quota when
 * the tab is not visible. Stale time is 0 so a remount always refetches.
 */
export function useLiveScores() {
  return useQuery({
    queryKey: ["football", "live-scores"],
    queryFn: () => api.liveScores({ status: "live" }),
    refetchInterval: LIVE_POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

/**
 * Fetches fixtures filtered by league, team, and/or status.
 * Cached for 5 minutes since fixture lists rarely change.
 */
export function useFixtures(params?: {
  league?: number;
  team?: number;
  status?: MatchStatus | "all";
}) {
  return useQuery({
    queryKey: ["football", "fixtures", params],
    queryFn: () => api.fixtures(params),
    staleTime: FIXTURES_STALE_MS,
  });
}

/**
 * Fetches full match detail (events, stats, lineups, H2H) for a fixture.
 * Pass `null` to disable the query — useful when no match is selected.
 */
export function useMatchDetail(fixtureId: number | null) {
  return useQuery({
    queryKey: ["football", "match", fixtureId],
    queryFn: () => api.match({ fixtureId: fixtureId as number }),
    enabled: fixtureId !== null,
  });
}

/**
 * Fetches the standings table for a given league ID.
 *
 * Routes through `getStandingsAuto`, which hits the ML-service
 * football-data.org proxy for real tables when `NEXT_PUBLIC_ML_API_URL`
 * is set and the league is on the free tier, and otherwise serves the
 * seeded demo standings. Cached for 5 minutes since standings change at
 * most once per match-day.
 */
export function useStandings(leagueId: number) {
  return useQuery({
    queryKey: ["football", "standings", leagueId],
    queryFn: () => getStandingsAuto(leagueId),
    staleTime: 5 * 60_000,
  });
}

/**
 * Fetches the top-scorers chart for a given league ID.
 *
 * Routes through `getScorersAuto`, which hits the ML-service
 * football-data.org proxy for real scorers when `NEXT_PUBLIC_ML_API_URL`
 * is set and the league is on the free tier, and otherwise serves the
 * seeded demo chart. Cached for 5 minutes — scorers change at most once
 * per match-day.
 */
export function useScorers(leagueId: number) {
  return useQuery({
    queryKey: ["football", "scorers", leagueId],
    queryFn: () => getScorersAuto(leagueId),
    staleTime: 5 * 60_000,
  });
}
