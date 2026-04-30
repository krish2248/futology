"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin } from "lucide-react";
import { useMatchDetail } from "@/hooks/useLiveScores";
import { LiveBadge } from "@/components/shared/LiveBadge";
import { ApiError } from "@/components/shared/ApiError";
import {
  formatKickoff,
  formatRelativeMinute,
  formatScore,
} from "@/lib/utils/format";
import type {
  MatchDetail,
  MatchEvent,
  MatchStats,
  Lineup,
} from "@/lib/data/demoMatchDetail";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stats", label: "Stats" },
  { id: "lineups", label: "Lineups" },
  { id: "events", label: "Events" },
  { id: "h2h", label: "H2H" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  fixtureId: number | null;
  onClose: () => void;
};

export function MatchDetailSheet({ fixtureId, onClose }: Props) {
  const [tab, setTab] = useState<TabId>("overview");
  const open = fixtureId !== null;
  const { data, isLoading, isError, error, refetch } = useMatchDetail(fixtureId);

  useEffect(() => {
    if (open) setTab("overview");
  }, [fixtureId, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-end justify-center md:items-stretch md:justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Match details"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
          <motion.div
            className="surface-elevated relative flex max-h-[92vh] w-full flex-col overflow-hidden md:h-screen md:max-h-screen md:max-w-xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Match details</p>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="rounded-md p-1 text-text-muted hover:bg-bg-raised hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <SheetSkeleton />
              ) : isError || !data ? (
                <ApiError
                  message={error instanceof Error ? error.message : "Could not load match."}
                  onRetry={() => refetch()}
                />
              ) : (
                <>
                  <Header detail={data} />

                  <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-bg-primary/40 px-2 py-2">
                    {TABS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        aria-pressed={tab === t.id}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                          tab === t.id
                            ? "bg-accent-muted text-accent"
                            : "text-text-secondary hover:bg-bg-raised hover:text-text-primary",
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="px-4 py-4">
                    {tab === "overview" ? <OverviewTab detail={data} /> : null}
                    {tab === "stats" ? <StatsTab stats={data.stats} /> : null}
                    {tab === "lineups" ? (
                      <LineupsTab home={data.homeLineup} away={data.awayLineup} />
                    ) : null}
                    {tab === "events" ? <EventsTab events={data.events} /> : null}
                    {tab === "h2h" ? <H2HTab detail={data} /> : null}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Header({ detail }: { detail: MatchDetail }) {
  const m = detail.match;
  const isLive = m.status === "live";
  const isFinished = m.status === "finished";
  return (
    <div className="border-b border-border px-4 py-5">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-wider text-text-muted">
        <span>{m.leagueName}</span>
        {isLive ? (
          <LiveBadge />
        ) : isFinished ? (
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] text-text-secondary">
            FT
          </span>
        ) : (
          <span className="tabular text-text-secondary">
            {formatKickoff(m.kickoff)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <p className="truncate text-base font-semibold">{m.homeTeam}</p>
        <div className="text-center">
          {m.status === "scheduled" ? (
            <span className="tabular rounded-md bg-bg-elevated px-3 py-2 text-sm">
              vs
            </span>
          ) : (
            <span
              className={cn(
                "tabular text-2xl font-bold tracking-tight md:text-3xl",
                isLive && "text-live",
              )}
            >
              {formatScore(m.homeScore, m.awayScore)}
            </span>
          )}
          {isLive && m.minute ? (
            <p className="tabular mt-0.5 text-[11px] text-live">
              {formatRelativeMinute(m.minute)}
            </p>
          ) : null}
        </div>
        <p className="truncate text-right text-base font-semibold">
          {m.awayTeam}
        </p>
      </div>
    </div>
  );
}

function OverviewTab({ detail }: { detail: MatchDetail }) {
  const goals = detail.events.filter((e) => e.type === "goal");
  return (
    <div className="space-y-4 text-sm">
      <ul className="space-y-2 text-text-secondary">
        {detail.match.venue ? (
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-text-muted" aria-hidden />
            <span className="text-text-primary">{detail.match.venue}</span>
          </li>
        ) : null}
        {detail.referee ? (
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-text-muted">🟨</span>
            <span>Referee:</span>
            <span className="text-text-primary">{detail.referee}</span>
          </li>
        ) : null}
        {detail.attendance ? (
          <li className="flex items-center gap-2">
            <span aria-hidden className="text-text-muted">👥</span>
            <span>Attendance:</span>
            <span className="tabular text-text-primary">
              {detail.attendance.toLocaleString()}
            </span>
          </li>
        ) : null}
      </ul>

      {goals.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-text-muted">
            Goalscorers
          </p>
          <ul className="space-y-1.5">
            {goals.map((g, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  g.team === "away" && "flex-row-reverse text-right",
                )}
              >
                <span aria-hidden>⚽</span>
                <span className="font-medium">{g.player}</span>
                <span className="tabular text-text-muted">
                  {g.minute}&apos;
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-text-muted">No goals yet.</p>
      )}
    </div>
  );
}

function StatsTab({ stats }: { stats: MatchStats[] }) {
  return (
    <ul className="space-y-3">
      {stats.map((s) => {
        const total = s.home + s.away;
        const homePct = total > 0 ? (s.home / total) * 100 : 50;
        const awayPct = 100 - homePct;
        const homeWins = s.home > s.away;
        const awayWins = s.away > s.home;
        return (
          <li key={s.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span
                className={cn(
                  "tabular",
                  homeWins ? "font-semibold text-accent" : "text-text-secondary",
                )}
              >
                {s.home}
                {s.unit ?? ""}
              </span>
              <span className="text-text-muted">{s.label}</span>
              <span
                className={cn(
                  "tabular",
                  awayWins ? "font-semibold text-accent" : "text-text-secondary",
                )}
              >
                {s.away}
                {s.unit ?? ""}
              </span>
            </div>
            <div className="flex h-1.5 w-full items-stretch overflow-hidden rounded-full bg-bg-elevated">
              <span
                className={cn(
                  "block h-full rounded-l-full",
                  homeWins ? "bg-accent" : "bg-accent/40",
                )}
                style={{ width: `${homePct}%` }}
              />
              <span
                className={cn(
                  "block h-full rounded-r-full",
                  awayWins ? "bg-info" : "bg-info/40",
                )}
                style={{ width: `${awayPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LineupsTab({ home, away }: { home: Lineup; away: Lineup }) {
  return (
    <div className="space-y-4">
      <div className="surface relative aspect-[16/10] overflow-hidden rounded-xl bg-[#0e2a18]">
        {/* Pitch markings */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          {/* outer */}
          <rect x="2" y="2" width="96" height="96" fill="none" stroke="#1f3a28" strokeWidth="0.4" />
          {/* halfway */}
          <line x1="50" y1="2" x2="50" y2="98" stroke="#1f3a28" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="9" fill="none" stroke="#1f3a28" strokeWidth="0.4" />
          {/* boxes */}
          <rect x="2" y="20" width="14" height="60" fill="none" stroke="#1f3a28" strokeWidth="0.4" />
          <rect x="84" y="20" width="14" height="60" fill="none" stroke="#1f3a28" strokeWidth="0.4" />
          {/* 6-yard */}
          <rect x="2" y="34" width="6" height="32" fill="none" stroke="#1f3a28" strokeWidth="0.4" />
          <rect x="92" y="34" width="6" height="32" fill="none" stroke="#1f3a28" strokeWidth="0.4" />
        </svg>
        {/* Players */}
        <div className="absolute inset-0">
          {home.starters.map((p) => (
            <PitchDot
              key={`h-${p.number}`}
              x={p.x}
              y={p.y}
              number={p.number}
              color="accent"
            />
          ))}
          {away.starters.map((p) => (
            <PitchDot
              key={`a-${p.number}`}
              x={p.x}
              y={p.y}
              number={p.number}
              color="info"
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <LineupColumn title="Home" lineup={home} />
        <LineupColumn title="Away" lineup={away} alignRight />
      </div>
    </div>
  );
}

function PitchDot({
  x,
  y,
  number,
  color,
}: {
  x: number;
  y: number;
  number: number;
  color: "accent" | "info";
}) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={cn(
          "tabular grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ring-2 ring-bg-primary",
          color === "accent"
            ? "bg-accent text-bg-primary"
            : "bg-info text-bg-primary",
        )}
      >
        {number}
      </span>
    </span>
  );
}

function LineupColumn({
  title,
  lineup,
  alignRight,
}: {
  title: string;
  lineup: Lineup;
  alignRight?: boolean;
}) {
  return (
    <div className={alignRight ? "text-right" : ""}>
      <p className="mb-1 text-[11px] uppercase tracking-wider text-text-muted">
        {title} · {lineup.formation}
      </p>
      <ul className="space-y-1">
        {lineup.starters.map((p) => (
          <li
            key={p.number}
            className={cn(
              "flex items-center gap-2 text-text-secondary",
              alignRight && "flex-row-reverse",
            )}
          >
            <span className="tabular w-5 shrink-0 text-text-muted">
              {p.number}
            </span>
            <span className="truncate text-text-primary">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventsTab({ events }: { events: MatchEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-sm text-text-muted">
        No events yet.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {events.map((e, i) => (
        <li
          key={i}
          className={cn(
            "flex items-center gap-3 text-sm",
            e.team === "away" && "flex-row-reverse text-right",
          )}
        >
          <span
            aria-hidden
            className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-elevated text-[11px] text-text-secondary"
          >
            {e.minute}&apos;
          </span>
          <span className="text-lg" aria-hidden>
            {e.type === "goal"
              ? "⚽"
              : e.type === "yellow"
                ? "🟨"
                : e.type === "red"
                  ? "🟥"
                  : "↔︎"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{e.player}</p>
            <p className="text-xs capitalize text-text-secondary">
              {e.type === "goal"
                ? "Goal"
                : e.type === "yellow"
                  ? "Yellow card"
                  : e.type === "red"
                    ? "Red card"
                    : "Substitution"}
              {e.detail ? ` · ${e.detail}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function H2HTab({ detail }: { detail: MatchDetail }) {
  const homeWins = detail.h2h.filter(
    (h) =>
      (h.home === detail.match.homeTeam && h.homeScore > h.awayScore) ||
      (h.away === detail.match.homeTeam && h.awayScore > h.homeScore),
  ).length;
  const awayWins = detail.h2h.filter(
    (h) =>
      (h.home === detail.match.awayTeam && h.homeScore > h.awayScore) ||
      (h.away === detail.match.awayTeam && h.awayScore > h.homeScore),
  ).length;
  const draws = detail.h2h.length - homeWins - awayWins;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Stat label={detail.match.homeTeam} value={String(homeWins)} accent />
        <Stat label="Draws" value={String(draws)} />
        <Stat label={detail.match.awayTeam} value={String(awayWins)} accent />
      </div>
      <ul className="space-y-2">
        {detail.h2h.map((h, i) => (
          <li
            key={i}
            className="surface flex items-center gap-3 px-3 py-2 text-sm"
          >
            <span className="tabular w-20 text-[11px] text-text-muted">
              {h.date}
            </span>
            <p className="min-w-0 flex-1 truncate">
              {h.home}{" "}
              <span className="tabular font-semibold">
                {h.homeScore} – {h.awayScore}
              </span>{" "}
              {h.away}
            </p>
            <span className="text-[11px] text-text-muted">{h.competition}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="surface px-2 py-3">
      <p className="truncate text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          "tabular mt-0.5 text-2xl font-bold",
          accent && "text-accent",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="skeleton h-20" />
      <div className="skeleton h-10" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-6" />
        ))}
      </div>
    </div>
  );
}
