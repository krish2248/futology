/**
 * Formats an ISO date as a short relative time — "just now", "5m ago",
 * "3h ago", "2d ago". Beyond a week falls back to a locale date.
 *
 * Used by the news feed timestamps and the notification list, where
 * "ago" reads more naturally than an absolute time.
 *
 * @example
 * formatTimeAgo(new Date(Date.now() - 30_000).toISOString())   // → "just now"
 * formatTimeAgo(new Date(Date.now() - 300_000).toISOString())  // → "5m ago"
 * formatTimeAgo(new Date(Date.now() - 7200_000).toISOString()) // → "2h ago"
 */
export function formatTimeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  if (diffMs < 0) return "just now";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return then.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
