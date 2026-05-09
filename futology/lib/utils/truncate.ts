/**
 * Truncates a string to `max` characters, appending an ellipsis if it was
 * shortened. Returns the input unchanged when it's already short enough.
 *
 * Useful for player and club names that overflow tight cards on mobile.
 *
 * @example
 * truncate("Manchester United", 10)  // → "Manchester…"
 * truncate("Real Madrid", 20)        // → "Real Madrid"
 * truncate("Borussia Mönchengladbach", 12, "...")  // → "Borussia Mön..."
 */
export function truncate(
  value: string,
  max: number,
  ellipsis: string = "…",
): string {
  if (value.length <= max) return value;
  return value.slice(0, max) + ellipsis;
}
