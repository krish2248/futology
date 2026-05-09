/**
 * Formats a number in compact form — `1234` → `"1.2K"`, `2_500_000` → `"2.5M"`.
 *
 * Used in stat tiles where horizontal space is tight (e.g. follower
 * counts, vote totals, transfer-value mini cards). Negative numbers are
 * supported and keep their sign.
 *
 * @example
 * formatCompactNumber(950)        // → "950"
 * formatCompactNumber(1234)       // → "1.2K"
 * formatCompactNumber(2_500_000)  // → "2.5M"
 * formatCompactNumber(-1500)      // → "-1.5K"
 */
export function formatCompactNumber(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
}
