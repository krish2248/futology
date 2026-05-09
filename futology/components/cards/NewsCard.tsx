"use client";

import {
  NEWS_CATEGORY_COLOR,
  NEWS_CATEGORY_LABELS,
  type NewsItem,
} from "@/lib/data/demoNews";
import { cn } from "@/lib/utils/cn";

type Props = {
  item: NewsItem;
  personalized?: boolean;
  className?: string;
  variant?: "default" | "compact";
};

/**
 * News article card.
 *
 * - Category badge color comes from `NEWS_CATEGORY_COLOR`.
 * - Pass `personalized` to surface the "For you" pill — used when the
 *   article matches the user's followed clubs/players/leagues.
 * - `compact` variant trims padding for dense lists; `default` is for
 *   the home feed and the full news page.
 */
export function NewsCard({
  item,
  personalized,
  className,
  variant = "default",
}: Props) {
  const color = NEWS_CATEGORY_COLOR[item.category];
  const compact = variant === "compact";

  return (
    <article
      className={cn(
        "surface surface-hover relative overflow-hidden",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            background: `${color}1F`,
            color,
            border: `1px solid ${color}55`,
          }}
        >
          {NEWS_CATEGORY_LABELS[item.category]}
        </span>
        {personalized ? (
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
            For you
          </span>
        ) : null}
        <span className="ml-auto truncate text-[11px] text-text-muted">
          {timeAgo(item.publishedAt)}
        </span>
      </div>
      <h3 className={cn("font-medium leading-snug", compact ? "text-sm" : "text-base")}>
        {item.title}
      </h3>
      {!compact ? (
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
          {item.summary}
        </p>
      ) : null}
      <p className="mt-2 text-[11px] text-text-muted">{item.source}</p>
    </article>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hr ago`;
  return `${Math.floor(ms / 86_400_000)} d ago`;
}
