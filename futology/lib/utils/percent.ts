/**
 * Formats a 0–1 ratio (or 0–100 percentage) as a percentage string.
 *
 * Pass `digits` to control decimal places. Numbers ≤ 1 are treated as
 * ratios; numbers > 1 are assumed to already be in percentage form, so
 * this works for both win-probability shapes used in the codebase.
 *
 * @example
 * formatPercent(0.46)        // → "46%"
 * formatPercent(46)          // → "46%"
 * formatPercent(0.4625, 1)   // → "46.3%"
 */
export function formatPercent(value: number, digits: number = 0): string {
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(digits)}%`;
}
