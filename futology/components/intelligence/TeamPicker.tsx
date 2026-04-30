"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { CLUBS, type ClubSeed } from "@/lib/data/clubs";
import { findLeague } from "@/lib/data/leagues";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  selected: ClubSeed | null;
  onSelect: (club: ClubSeed | null) => void;
  exclude?: number;
  leagueFilter?: number | null;
};

export function TeamPicker({
  label,
  selected,
  onSelect,
  exclude,
  leagueFilter,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CLUBS.filter((c) => {
      if (c.id === exclude) return false;
      if (leagueFilter && c.leagueId !== leagueFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q)
      );
    }).slice(0, 12);
  }, [query, exclude, leagueFilter]);

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
      <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-border-strong bg-bg-elevated px-3 py-2.5 text-left text-sm transition-colors",
          "hover:border-accent/40 focus-within:border-accent/60",
        )}
      >
        {selected ? (
          <>
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-primary text-[10px] font-semibold text-text-secondary"
            >
              {selected.shortName.slice(0, 3).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {selected.name}
              </span>
              <span className="block truncate text-xs text-text-secondary">
                {findLeague(selected.leagueId)?.name ?? selected.country}
              </span>
            </span>
            <button
              type="button"
              aria-label={`Clear ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="rounded p-1 text-text-muted hover:bg-bg-raised hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 text-text-muted" aria-hidden />
            <span className="flex-1 text-text-muted">Search teams</span>
          </>
        )}
      </button>

      {open ? (
        <div className="surface-elevated absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-text-muted" aria-hidden />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search teams"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto">
            {candidates.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-text-muted">
                No teams match.
              </li>
            ) : (
              candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-raised"
                  >
                    <span
                      aria-hidden
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-primary text-[10px] font-semibold text-text-secondary"
                    >
                      {c.shortName.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{c.name}</span>
                      <span className="block truncate text-xs text-text-secondary">
                        {findLeague(c.leagueId)?.name ?? c.country}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
