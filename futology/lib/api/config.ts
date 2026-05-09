/**
 * True when no real RapidAPI key is configured. Every API route checks this
 * to decide whether to return seeded demo data or proxy to RapidAPI.
 *
 * Set `DEMO_MODE=true` to force demo mode even with a key present (useful
 * for local UI iteration without burning quota).
 */
export const isDemoMode =
  process.env.DEMO_MODE === "true" ||
  !process.env.RAPIDAPI_KEY ||
  process.env.RAPIDAPI_KEY === "";

/**
 * Cache-Control headers per resource type, per bible §10.
 *
 * Live data is `no-store` to avoid CDN caching mid-match. Fixtures and
 * standings get short TTLs; team/player/finished match data gets long TTLs
 * since it changes rarely.
 */
export const cacheHeaders = {
  noStore: "no-store",
  liveScores: "no-store",
  liveMatch: "public, s-maxage=30, stale-while-revalidate=60",
  fixtures: "public, s-maxage=300, stale-while-revalidate=600",
  standings: "public, s-maxage=300, stale-while-revalidate=600",
  team: "public, s-maxage=3600, stale-while-revalidate=7200",
  player: "public, s-maxage=3600, stale-while-revalidate=7200",
  finishedMatch: "public, s-maxage=3600, stale-while-revalidate=7200",
  search: "public, s-maxage=3600, stale-while-revalidate=7200",
  news: "public, s-maxage=900, stale-while-revalidate=1800",
} as const;

/**
 * Wraps a payload in the standard `{ data, demo }` envelope and sets the
 * Content-Type and Cache-Control headers in one place. The `demo` flag lets
 * the client distinguish seeded data from real API responses.
 */
export function jsonResponse<T>(
  data: T,
  cache: string,
  init?: ResponseInit,
): Response {
  return new Response(JSON.stringify({ data, demo: isDemoMode }), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache,
      ...(init?.headers ?? {}),
    },
  });
}
