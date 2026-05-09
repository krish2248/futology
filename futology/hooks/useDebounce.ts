"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * without further changes.
 *
 * Used by the SearchModal so we don't re-filter the player/team/league
 * list on every keystroke.
 *
 * @example
 * const [query, setQuery] = useState("");
 * const debounced = useDebounce(query, 300);
 * useEffect(() => { runSearch(debounced); }, [debounced]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
