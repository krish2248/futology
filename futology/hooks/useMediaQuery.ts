"use client";

import { useEffect, useState } from "react";

/**
 * Returns a boolean that tracks whether the given CSS media query matches.
 *
 * SSR-safe — defaults to `false` on the server and during the first
 * render so hydration matches. The subscription is set up after mount.
 *
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 * if (isDesktop) ...
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
