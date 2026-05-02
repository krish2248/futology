"use client";

import { useMemo, useState } from "react";
import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { NewsCard } from "@/components/cards/NewsCard";
import {
  NEWS_CATEGORY_LABELS,
  NEWS_ITEMS,
  filterByCategory,
  isPersonalized,
  rankPersonalized,
  type NewsCategory,
  type NewsFilter,
} from "@/lib/data/demoNews";
import { useSession } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import { cn } from "@/lib/utils/cn";
import { NewsSkeleton } from "@/components/shared/NewsSkeleton";

const CATEGORIES: NewsFilter[] = [
  "all",
  "transfers",
  "match",
  "analysis",
  "tactics",
  "injuries",
];

export function NewsView() {
  const ready = useIsClient();
  const followedClubs = useSession((s) => s.followedClubs);
  const followedPlayers = useSession((s) => s.followedPlayers);
  const followedLeagues = useSession((s) => s.followedLeagues);
  const [category, setCategory] = useState<NewsFilter>("all");
  const [scope, setScope] = useState<"all" | "for-you">("all");

  const followed = useMemo(
    () => ({
      clubs: ready ? followedClubs.map((c) => c.id) : [],
      players: ready ? followedPlayers.map((p) => p.id) : [],
      leagues: ready ? followedLeagues.map((l) => l.id) : [],
    }),
    [ready, followedClubs, followedPlayers, followedLeagues],
  );

  const personalizedCount = useMemo(
    () =>
      ready
        ? NEWS_ITEMS.filter((i) => isPersonalized(i, followed)).length
        : 0,
    [followed, ready],
  );

  const items = useMemo(() => {
    let out = filterByCategory(NEWS_ITEMS, category);
    if (scope === "for-you") {
      out = out.filter((i) => isPersonalized(i, followed));
    }
    return rankPersonalized(out, followed);
  }, [category, scope, followed]);

  if (!ready) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="News"
          description="Loading..."
        />
        <NewsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="News"
        description={
          ready && personalizedCount > 0
            ? `${personalizedCount} of ${NEWS_ITEMS.length} stories match what you follow.`
            : "Football headlines, tactical breakdowns and transfer rumors."
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <span className="text-xs uppercase tracking-wider text-text-secondary">
          Category
        </span>
        {CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-accent/60 bg-accent-muted text-accent"
                  : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
              )}
            >
              {c === "all" ? "All" : NEWS_CATEGORY_LABELS[c as NewsCategory]}
            </button>
          );
        })}
        <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:inline" />
        {(
          [
            { id: "all", label: "Everything" },
            { id: "for-you", label: `For you · ${personalizedCount}` },
          ] as const
        ).map((s) => {
          const active = scope === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              aria-pressed={active}
              disabled={s.id === "for-you" && personalizedCount === 0}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-accent/60 bg-accent-muted text-accent"
                  : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={
            scope === "for-you"
              ? "Nothing personalized in this category yet"
              : "No stories in this category right now"
          }
          description={
            scope === "for-you"
              ? "Try All, or follow more clubs / players / leagues."
              : "Try a different filter."
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              personalized={ready && isPersonalized(item, followed)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
