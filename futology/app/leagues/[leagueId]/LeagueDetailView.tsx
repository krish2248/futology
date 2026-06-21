"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useScorers, useStandings } from "@/hooks/useLiveScores";
import { PageHeader } from "@/components/shared/PageHeader";
import { StandingsTable } from "@/components/cards/StandingsTable";
import { ScorersTable } from "@/components/cards/ScorersTable";
import { ApiError } from "@/components/shared/ApiError";
import { cn } from "@/lib/utils/cn";

type Tab = "standings" | "scorers";

const TABS: { key: Tab; label: string }[] = [
  { key: "standings", label: "Standings" },
  { key: "scorers", label: "Top Scorers" },
];

export function LeagueDetailView({ leagueId }: { leagueId: number }) {
  const [tab, setTab] = useState<Tab>("standings");
  const standings = useStandings(leagueId);
  const scorers = useScorers(leagueId);
  const league = standings.data?.league;

  return (
    <div className="space-y-6">
      <Link
        href="/leagues"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All leagues
      </Link>

      <PageHeader
        title={league?.name ?? "League"}
        description={league ? `${league.country} · ${league.shortName}` : undefined}
      />

      <div className="flex gap-1" role="tablist" aria-label="League views">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-bg-elevated text-text-primary"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "standings" ? (
        <StandingsPanel query={standings} />
      ) : (
        <ScorersPanel query={scorers} />
      )}
    </div>
  );
}

function StandingsPanel({
  query,
}: {
  query: ReturnType<typeof useStandings>;
}) {
  const { data, isLoading, isError, error, refetch } = query;
  if (isLoading) return <TableSkeleton />;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Could not load standings."}
        onRetry={() => refetch()}
      />
    );
  }
  if (data && data.rows.length > 0) {
    return <StandingsTable rows={data.rows} bands={data.bands} />;
  }
  return <EmptyPanel label="No standings available for this league yet." />;
}

function ScorersPanel({ query }: { query: ReturnType<typeof useScorers> }) {
  const { data, isLoading, isError, error, refetch } = query;
  if (isLoading) return <TableSkeleton />;
  if (isError) {
    return (
      <ApiError
        message={error instanceof Error ? error.message : "Could not load scorers."}
        onRetry={() => refetch()}
      />
    );
  }
  if (data && data.length > 0) {
    return <ScorersTable rows={data} />;
  }
  return <EmptyPanel label="No scorers available for this league yet." />;
}

function TableSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <div className="space-y-1 p-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton h-8" />
        ))}
      </div>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="surface px-4 py-10 text-center text-sm text-text-secondary">
      {label}
    </div>
  );
}
