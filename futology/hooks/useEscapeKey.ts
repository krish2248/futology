"use client";

import { useEffect } from "react";

/**
 * Calls `handler` when the Escape key is pressed.
 *
 * Pairs with `useClickOutside` to give popovers and modals full
 * keyboard parity. Pass `enabled = false` to disable temporarily — e.g.
 * when a nested popover is open and should swallow the event itself.
 *
 * @example
 * useEscapeKey(() => setOpen(false), open);
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handler(event);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}
