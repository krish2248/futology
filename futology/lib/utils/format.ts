/**
 * Format ISO date string to relative time display.
 * @param iso - ISO date string (e.g., "2026-05-02T14:30:00Z")
 * @returns Formatted string like "Today · 14:30", "Tomorrow · 15:00", or "Sat, 3 May · 16:00"
 */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (same(d, now)) return `Today · ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (same(d, tomorrow)) return `Tomorrow · ${time}`;

  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + ` · ${time}`;
}

/**
 * Format home and away scores to display string.
 * @param home - Home team score (optional)
 * @param away - Away team score (optional)
 * @returns Formatted score like "2 – 1" or "—" if undefined
 */
export function formatScore(home: number | undefined, away: number | undefined): string {
  if (typeof home !== "number" || typeof away !== "number") return "—";
  return `${home} – ${away}`;
}

/**
 * Format minute to relative time display with plus sign for extra time.
 * @param minute - Match minute (optional)
 * @returns Formatted minute like "45'" or "90'+"
 */
export function formatRelativeMinute(minute: number | undefined): string {
  if (typeof minute !== "number") return "";
  if (minute > 90) return `${minute}'+`;
  return `${minute}'`;
}
