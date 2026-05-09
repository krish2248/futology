"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
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
 * Cached for 5 minutes since standings change at most once per match-day.
 */
export function useStandings(leagueId: number) {
  return useQuery({
    queryKey: ["football", "standings", leagueId],
    queryFn: () => api.standings(leagueId),
    staleTime: 5 * 60_000,
  });
}
