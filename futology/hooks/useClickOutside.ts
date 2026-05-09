"use client";

import { useEffect, type RefObject } from "react";

/**
 * Calls `handler` when a click or touch lands outside the element
 * referenced by `ref`.
 *
 * Common pattern for popovers, dropdowns, and slide-up sheets that need
 * to close on outside interaction. Pair with an Escape-key listener for
 * full keyboard parity.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setOpen(false));
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void,
): void {
  useEffect(() => {
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [ref, handler]);
}
