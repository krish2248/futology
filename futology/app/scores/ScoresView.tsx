"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ApiError } from "@/components/shared/ApiError";
import { MatchCard } from "@/components/cards/MatchCard";
import { MatchDetailSheet } from "@/components/cards/MatchDetailSheet";
import { useFixtures } from "@/hooks/useLiveScores";
import {
  matchesByLeague,
  type MatchStatus,
  type DemoMatch,
} from "@/lib/data/demoMatches";
import { cn } from "@/lib/utils/cn";

const FILTERS: Array<{ id: MatchStatus | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "scheduled", label: "Scheduled" },
];

export function ScoresView() {
  const [filter, setFilter] = useState<MatchStatus | "all">("all");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useFixtures({
      status: filter,
    });

  const matches = useMemo(() => data ?? [], [data]);
  const grouped = useMemo(() => matchesByLeague(matches), [matches]);
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scores & Fixtures"
        description="Demo data via /api/football. Live tab refreshes every 30 seconds."
        action={
          isFetching ? (
            <span className="text-xs text-text-muted">Refreshing…</span>
          ) : null
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-3">
        {FILTERS.map((option) => {
          const active = filter === option.id;
          const showLiveDot = option.id === "live" && liveCount > 0;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              )}
            >
              {option.label}
              {showLiveDot ? (
                <span className="live-dot h-1.5 w-1.5" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </Card>

      {isLoading ? (
        <ScoresSkeleton />
      ) : isError ? (
        <ApiError
          message={error instanceof Error ? error.message : "Could not load scores."}
          onRetry={() => refetch()}
        />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No matches in this filter"
          description="Try a different filter — there are matches elsewhere on this page."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([league, items]) => (
            <section key={league}>
              <h2 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
                {league}
              </h2>
              <div className="grid gap-2 md:grid-cols-2">
                {items.map((m: DemoMatch) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setOpenId(m.id)}
                    className="text-left transition-transform active:scale-[0.99]"
                    aria-label={`Open match details: ${m.homeTeam} vs ${m.awayTeam}`}
                  >
                    <MatchCard match={m} />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <MatchDetailSheet
        fixtureId={openId}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function ScoresSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i}>
          <div className="skeleton mb-2 h-4 w-32" />
          <div className="grid gap-2 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="skeleton h-24" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
