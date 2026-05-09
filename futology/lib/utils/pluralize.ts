/**
 * Picks singular or plural based on count, optionally prefixed with the
 * number itself.
 *
 * Useful in copy that has to read naturally for both single and multiple
 * counts — "1 prediction" vs "5 predictions", "1 league" vs "3 leagues".
 *
 * @example
 * pluralize(1, "prediction")             // → "prediction"
 * pluralize(5, "prediction")             // → "predictions"
 * pluralize(0, "league", "leagues", true) // → "0 leagues"
 * pluralize(1, "child", "children", true) // → "1 child"
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string = `${singular}s`,
  withCount: boolean = false,
): string {
  const word = count === 1 ? singular : plural;
  return withCount ? `${count} ${word}` : word;
}
