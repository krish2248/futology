"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, type AppNotification } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import { cn } from "@/lib/utils/cn";

const SEED_FALLBACK: AppNotification[] = [
  {
    id: "seed_welcome",
    type: "match_start",
    title: "Welcome to FUTOLOGY",
    body: "Settle a match prediction and your notifications will arrive here.",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Bell button + popover that surfaces user notifications from the
 * session store, with a seed fallback so the popover never looks empty
 * on a first visit.
 *
 * Closes on Escape and on outside click. Mark-all-read is wired through
 * to the store so the unread count is the source of truth.
 *
 * Cutover: replace the store reads with a Supabase Realtime subscription
 * on the `notifications` table — the popover shape stays the same.
 */
export function NotificationBell() {
  const ready = useIsClient();
  const stored = useSession((s) => s.notifications);
  const markAllNotificationsRead = useSession((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = useMemo<AppNotification[]>(
    () => (stored.length > 0 ? stored : SEED_FALLBACK),
    [stored],
  );
  const unread = ready ? items.filter((n) => !n.isRead).length : 0;

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : "Notifications"
        }
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span
            aria-hidden
            className="tabular absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg-primary"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="surface-elevated absolute right-0 top-11 z-40 w-80 overflow-hidden md:w-96"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Notifications</p>
              {unread > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-raised hover:text-text-primary"
                >
                  <Check className="h-3 w-3" aria-hidden /> Mark all read
                </button>
              ) : null}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-text-muted">
                  You&apos;re all caught up 🎉
                </li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "border-b border-border px-4 py-3 last:border-b-0",
                      !n.isRead && "bg-accent-muted/30",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead ? (
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] text-text-muted">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-border px-4 py-2 text-center text-[11px] text-text-muted">
              Realtime via Supabase wires up in cutover
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "Just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} min ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} hr ago`;
  return `${Math.floor(ms / 86_400_000)} d ago`;
}
