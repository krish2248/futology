"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Root client-side providers — currently just the TanStack Query client.
 *
 * Defaults follow bible §Phase 7: 30s staleTime, 5min gcTime, single
 * retry on failure, and no refetch on window focus or remount. The
 * client is created once via `useState` so HMR doesn't churn it.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
