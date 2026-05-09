"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the component has mounted on the client.
 *
 * Use this to gate access to persisted state (Zustand's localStorage adapter)
 * so SSR HTML matches the first client render — otherwise hydration
 * mismatches throw warnings and the persisted slice may be temporarily wrong.
 */
export function useIsClient() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
