"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Persists a piece of state to localStorage and keeps it in sync with
 * other tabs via the `storage` event.
 *
 * SSR-safe — returns `initial` on the server and during the first render
 * so the hydrated HTML matches. Reads from storage in an effect after
 * mount.
 *
 * Don't use this for the session/preferences slices — those go through
 * Zustand's `persist` middleware so we can migrate schema versions.
 * This hook is for one-off, non-versioned scratch state (search recents,
 * UI tab preference, dismissed banners).
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* corrupted JSON — fall back to initial value */
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* quota exceeded or storage disabled — keep in-memory state */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
