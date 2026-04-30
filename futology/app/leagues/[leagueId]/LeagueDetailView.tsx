"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useStandings } from "@/hooks/useLiveScores";
import { PageHeader } from "@/components/shared/PageHeader";
import { StandingsTable } from "@/components/cards/StandingsTable";
import { ApiError } from "@/components/shared/ApiError";

export function LeagueDetailView({ leagueId }: { leagueId: number }) {
  const { data, isLoading, isError, error, refetch } = useStandings(leagueId);

  return (
    <div className="space-y-6">
      <Link
        href="/leagues"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All leagues
      </Link>

      <PageHeader
        title={data?.league?.name ?? "League"}
        description={data?.league ? `${data.league.country} · ${data.league.shortName}` : undefined}
      />

      {isLoading ? (
        <div className="surface overflow-hidden">
          <div className="space-y-1 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton h-8" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <ApiError
          message={error instanceof Error ? error.message : "Could not load standings."}
          onRetry={() => refetch()}
        />
      ) : data && data.rows.length > 0 ? (
        <StandingsTable rows={data.rows} bands={data.bands} />
      ) : (
        <div className="surface px-4 py-10 text-center text-sm text-text-secondary">
          No standings available for this league yet.
        </div>
      )}
    </div>
  );
}
