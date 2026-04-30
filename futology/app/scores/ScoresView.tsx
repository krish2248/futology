"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { MatchCard } from "@/components/cards/MatchCard";
import {
  getDemoMatches,
  matchesByLeague,
  matchesByStatus,
  type MatchStatus,
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
  const matches = useMemo(() => getDemoMatches(), []);
  const filtered = useMemo(
    () => matchesByStatus(matches, filter),
    [matches, filter],
  );
  const grouped = useMemo(() => matchesByLeague(filtered), [filtered]);

  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scores & Fixtures"
        description="Demo data for now. Phase 2 wires API-Football for live matches."
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
              {option.id === "all" ? (
                <span className="tabular ml-1 rounded bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted">
                  {matches.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </Card>

      {filtered.length === 0 ? (
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
                {items.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
