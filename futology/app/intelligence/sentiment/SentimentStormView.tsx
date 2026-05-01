"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, TrendingUp, Hash } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { LiveBadge } from "@/components/shared/LiveBadge";
import { SentimentTimeline } from "@/components/intelligence/SentimentTimeline";
import { SentimentGauge } from "@/components/intelligence/SentimentGauge";
import { getDemoMatches } from "@/lib/data/demoMatches";
import {
  getDemoSentiment,
  type SentimentSnapshot,
  type SentimentReaction,
} from "@/lib/data/demoSentiment";
import { cn } from "@/lib/utils/cn";

export function SentimentStormView() {
  const matches = useMemo(
    () => getDemoMatches().filter((m) => m.status !== "scheduled"),
    [],
  );
  const [matchId, setMatchId] = useState<number>(matches[0]?.id ?? 1);
  const snapshot = useMemo<SentimentSnapshot | null>(() => {
    const m = matches.find((x) => x.id === matchId) ?? matches[0];
    return m ? getDemoSentiment(m) : null;
  }, [matchId, matches]);

  // Tick the live feed by adding a synthetic reaction every 8s while a live match is selected.
  const [liveExtras, setLiveExtras] = useState<SentimentReaction[]>([]);
  useEffect(() => {
    if (!snapshot || snapshot.match.status !== "live") return;
    const id = setInterval(() => {
      const minute = (snapshot.match.minute ?? 60) + Math.floor(Math.random() * 3);
      const r = Math.random();
      const side: "home" | "away" | "neutral" = r < 0.4 ? "home" : r < 0.8 ? "away" : "neutral";
      const text =
        side === "home"
          ? "Massive cheer in the home end"
          : side === "away"
            ? "Travelling fans bouncing"
            : "Mod-thread is on fire right now";
      setLiveExtras((prev) =>
        [
          {
            id: `live-${Date.now()}`,
            minute,
            side,
            emotion: "neutral" as const,
            text,
            source: "reddit" as const,
          },
          ...prev,
        ].slice(0, 4),
      );
    }, 8000);
    return () => clearInterval(id);
  }, [snapshot]);

  if (!snapshot) {
    return <p className="text-text-secondary">No sentiment data available.</p>;
  }

  const reactions = [...liveExtras, ...snapshot.reactions].slice(0, 6);

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Intelligence Hub
      </Link>
      <PageHeader
        title="Sentiment Storm"
        description="Reddit (and optionally Twitter) match-thread sentiment, roBERTa-classified, bucketed by team. Demo data; real Reddit pulls in Phase 3."
      />

      <Card className="space-y-2 p-3">
        <p className="text-xs uppercase tracking-wider text-text-muted">
          Match
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {matches.map((m) => {
            const active = matchId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMatchId(m.id);
                  setLiveExtras([]);
                }}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                )}
              >
                {m.status === "live" ? (
                  <span className="live-dot h-1.5 w-1.5" aria-hidden />
                ) : null}
                <span className="truncate">
                  {m.homeTeam} vs {m.awayTeam}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <SentimentTimeline
          timeline={snapshot.timeline}
          goalEvents={snapshot.goalEvents}
          homeName={snapshot.match.homeTeam}
          awayName={snapshot.match.awayTeam}
        />

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <SentimentGauge
              label={snapshot.match.homeTeam}
              value={snapshot.homeMood}
              highlight="home"
            />
            <SentimentGauge
              label={snapshot.match.awayTeam}
              value={snapshot.awayMood}
              highlight="away"
            />
          </div>

          <ExcitementMeter excitement={snapshot.excitement} />

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Stat
              label="Posts"
              value={snapshot.totalPosts.toLocaleString()}
              icon={<Hash className="h-3 w-3" aria-hidden />}
            />
            <Stat
              label="Peak"
              value={`${snapshot.peakMinute}'`}
              icon={<TrendingUp className="h-3 w-3" aria-hidden />}
            />
            <Stat
              label="Swing"
              value={`${snapshot.biggestSwing.minute}'`}
              icon={null}
            />
          </div>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-text-secondary">
            <MessageCircle className="h-4 w-4" aria-hidden /> Live feed
          </h2>
          {snapshot.match.status === "live" ? <LiveBadge /> : null}
        </div>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {reactions.map((r) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={cn(
                  "rounded-lg border-l-4 px-3 py-2 text-sm",
                  r.side === "home"
                    ? "border-accent bg-accent-muted/40"
                    : r.side === "away"
                      ? "border-info bg-info/10"
                      : "border-border-strong bg-bg-elevated",
                )}
              >
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                  <span className="tabular">{r.minute}&apos;</span>
                  <span className="capitalize">{r.emotion}</span>
                  <span className="ml-auto uppercase tracking-wider">
                    {r.source}
                  </span>
                </div>
                <p className="mt-1 text-text-primary">{r.text}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </section>
    </div>
  );
}

function ExcitementMeter({ excitement }: { excitement: number }) {
  const pct = Math.round(excitement * 100);
  return (
    <div className="surface px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-text-muted">
          Excitement
        </p>
        <p className="tabular text-sm font-semibold">{pct}%</p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className="h-full bg-gradient-to-r from-accent via-warning to-live transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="surface px-2 py-2">
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </p>
      <p className="tabular mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
