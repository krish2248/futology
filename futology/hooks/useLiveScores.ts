"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MatchStatus } from "@/lib/data/demoMatches";

const LIVE_POLL_MS = 30_000;
const FIXTURES_STALE_MS = 5 * 60_000;

export function useLiveScores() {
  return useQuery({
    queryKey: ["football", "live-scores"],
    queryFn: () => api.liveScores({ status: "live" }),
    refetchInterval: LIVE_POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

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

export function useMatchDetail(fixtureId: number | null) {
  return useQuery({
    queryKey: ["football", "match", fixtureId],
    queryFn: () => api.match({ fixtureId: fixtureId as number }),
    enabled: fixtureId !== null,
  });
}

export function useStandings(leagueId: number) {
  return useQuery({
    queryKey: ["football", "standings", leagueId],
    queryFn: () => api.standings(leagueId),
    staleTime: 5 * 60_000,
  });
}
