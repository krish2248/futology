"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Trophy, Shield, User, Clock } from "lucide-react";
import { LEAGUES } from "@/lib/data/leagues";
import { CLUBS } from "@/lib/data/clubs";
import { PLAYERS } from "@/lib/data/players";
import { cn } from "@/lib/utils/cn";

type SearchResult = {
  kind: "league" | "club" | "player";
  id: number;
  title: string;
  subtitle: string;
  href: string;
};

const RECENT_KEY = "futology.search.recent";
const TABS = ["all", "teams", "players", "leagues"] as const;
type Tab = (typeof TABS)[number];

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Cmd+K (or `/`) global search modal.
 *
 * - Debounced 300 ms while typing.
 * - 4 tabs (All / Teams / Players / Leagues) filter the result list.
 * - Recent searches persisted under `futology.search.recent` (cap 5).
 * - Keyboard navigable: ↑/↓ moves selection, Enter navigates, Esc closes.
 *
 * Currently reads `lib/data/*` directly — could move to `/api/football/search`
 * for consistency, but local debounced search is already fast enough.
 */
export function SearchModal({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [highlight, setHighlight] = useState(0);
  const [recents, setRecents] = useState<SearchResult[]>([]);

  // Debounce 300ms per bible spec
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebounced("");
    setHighlight(0);
    setTab("all");
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      setRecents(raw ? (JSON.parse(raw) as SearchResult[]) : []);
    } catch {
      setRecents([]);
    }
    // Focus the input after the modal mounts
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    const items: SearchResult[] = [];

    if (tab === "all" || tab === "leagues") {
      for (const l of LEAGUES) {
        if (
          l.name.toLowerCase().includes(q) ||
          l.shortName.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q)
        ) {
          items.push({
            kind: "league",
            id: l.id,
            title: l.name,
            subtitle: l.country,
            href: `/leagues/${l.id}`,
          });
        }
      }
    }
    if (tab === "all" || tab === "teams") {
      for (const c of CLUBS) {
        if (
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q)
        ) {
          items.push({
            kind: "club",
            id: c.id,
            title: c.name,
            subtitle: c.country,
            href: `/clubs/${c.id}`,
          });
        }
      }
    }
    if (tab === "all" || tab === "players") {
      for (const p of PLAYERS) {
        if (
          p.name.toLowerCase().includes(q) ||
          p.team.toLowerCase().includes(q)
        ) {
          items.push({
            kind: "player",
            id: p.id,
            title: p.name,
            subtitle: `${p.team} · ${p.position}`,
            href: `/players/${p.id}`,
          });
        }
      }
    }
    return items.slice(0, 24);
  }, [debounced, tab]);

  const visible: SearchResult[] = debounced.trim() ? results : recents;

  useEffect(() => {
    setHighlight(0);
  }, [debounced, tab]);

  const choose = useCallback(
    (item: SearchResult) => {
      try {
        const next = [
          item,
          ...recents.filter(
            (r) => !(r.kind === item.kind && r.id === item.id),
          ),
        ].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        setRecents(next);
      } catch {
        // ignore quota errors
      }
      onClose();
      router.push(item.href);
    },
    [onClose, recents, router],
  );

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(visible.length - 1, h + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
      } else if (e.key === "Enter") {
        const item = visible[highlight];
        if (item) {
          e.preventDefault();
          choose(item);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, visible, highlight, choose, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[8vh] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Search FUTOLOGY"
        >
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden
          />
          <motion.div
            className="surface-elevated relative w-full max-w-2xl overflow-hidden"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-text-muted" aria-hidden />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams, players, leagues…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                aria-label="Search"
              />
              <kbd className="hidden rounded border border-border bg-bg-primary px-1.5 py-0.5 text-[10px] text-text-muted sm:inline">
                Esc
              </kbd>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="rounded-md p-1 text-text-muted hover:bg-bg-primary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 border-b border-border px-2 py-2">
              {TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs capitalize transition-colors",
                    tab === id
                      ? "bg-accent-muted text-accent"
                      : "text-text-secondary hover:bg-bg-raised hover:text-text-primary",
                  )}
                >
                  {id}
                </button>
              ))}
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {!debounced.trim() && recents.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  Try &ldquo;Real Madrid&rdquo;, &ldquo;Haaland&rdquo;, or
                  &ldquo;Bundesliga&rdquo;.
                </p>
              ) : null}

              {!debounced.trim() && recents.length > 0 ? (
                <p className="flex items-center gap-1.5 px-4 pb-1 pt-1 text-[11px] uppercase tracking-wider text-text-muted">
                  <Clock className="h-3 w-3" aria-hidden /> Recent
                </p>
              ) : null}

              {visible.length === 0 && debounced.trim() ? (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  Nothing matches &ldquo;{debounced}&rdquo;.
                </p>
              ) : null}

              <ul role="listbox" aria-label="Search results">
                {visible.map((item, i) => {
                  const Icon =
                    item.kind === "league"
                      ? Trophy
                      : item.kind === "club"
                        ? Shield
                        : User;
                  const active = i === highlight;
                  return (
                    <li key={`${item.kind}-${item.id}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => choose(item)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                          active
                            ? "bg-accent-muted text-text-primary"
                            : "hover:bg-bg-raised",
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                            active
                              ? "bg-accent text-bg-primary"
                              : "bg-bg-primary text-text-secondary",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-text-secondary">
                            {item.subtitle}
                          </span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-text-muted">
                          {item.kind}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2 text-[11px] text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-bg-primary px-1 py-0.5">
                  ↑↓
                </kbd>
                navigate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-bg-primary px-1 py-0.5">
                  ↵
                </kbd>
                open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className="rounded border border-border bg-bg-primary px-1 py-0.5">
                  Esc
                </kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
