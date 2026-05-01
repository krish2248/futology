"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { getDemoMatches } from "@/lib/data/demoMatches";
import {
  getDemoMomentum,
  type MomentumSnapshot,
} from "@/lib/data/demoMomentum";
import { cn } from "@/lib/utils/cn";

const W = 600;
const H = 220;
const PAD = { left: 32, right: 16, top: 16, bottom: 22 };

export function MomentumView() {
  const matches = useMemo(
    () => getDemoMatches().filter((m) => m.status !== "scheduled"),
    [],
  );
  const [matchId, setMatchId] = useState<number>(matches[0]?.id ?? 1);

  const snapshot = useMemo<MomentumSnapshot | null>(() => {
    const m = matches.find((x) => x.id === matchId) ?? matches[0];
    return m ? getDemoMomentum(m) : null;
  }, [matchId, matches]);

  if (!snapshot) {
    return <p className="text-text-secondary">No momentum data available.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence/extras"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Extras
      </Link>
      <PageHeader
        title="Match Momentum"
        description="Rolling 5-minute xG window. Home xG above the centerline, away below. Crossings are swing moments."
      />

      <Card className="space-y-2 p-3">
        <p className="text-xs uppercase tracking-wider text-text-muted">Match</p>
        <div className="flex flex-wrap items-center gap-2">
          {matches.map((m) => {
            const active = matchId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMatchId(m.id)}
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
                {m.homeTeam} vs {m.awayTeam}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Peak home xG (5m)"
          value={snapshot.peakHome.value.toFixed(2)}
          hint={`Minute ${snapshot.peakHome.minute}'`}
        />
        <StatTile
          label="Peak away xG (5m)"
          value={snapshot.peakAway.value.toFixed(2)}
          hint={`Minute ${snapshot.peakAway.minute}'`}
        />
        <StatTile
          label="Momentum swings"
          value={String(snapshot.totalSwings)}
          hint="Sign flips on net xG"
        />
        <StatTile
          label="Window"
          value="5 min"
          hint="Rolling sum"
        />
      </div>

      <Card className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <p className="font-medium">Net momentum</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
              <span className="truncate text-text-secondary">
                {snapshot.match.homeTeam}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-info" />
              <span className="truncate text-text-secondary">
                {snapshot.match.awayTeam}
              </span>
            </span>
          </div>
        </div>
        <MomentumChart snapshot={snapshot} />
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <Activity className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
        <div className="text-sm text-text-secondary">
          Demo signal: home xG and away xG accumulated over the last 5 minutes,
          per match-minute. Phase 6 cutover swaps in StatsBomb event-level xG.
        </div>
      </Card>
    </div>
  );
}

function MomentumChart({ snapshot }: { snapshot: MomentumSnapshot }) {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const span = Math.max(1, snapshot.series.length - 1);
  const maxNet = Math.max(
    0.5,
    ...snapshot.series.map((p) => Math.abs(p.net)),
  );

  const cx = (m: number) => (m / span) * innerW;
  const cy = (v: number) => innerH / 2 - (v / maxNet) * (innerH / 2);

  // Build area paths: home above center (positive net), away below (negative net)
  function buildArea(side: "home" | "away"): string {
    if (snapshot.series.length === 0) return "";
    const baseY = innerH / 2;
    const top = snapshot.series
      .map((p) => {
        const v = side === "home" ? Math.max(0, p.net) : Math.min(0, p.net);
        return `${cx(p.minute).toFixed(2)},${cy(v).toFixed(2)}`;
      })
      .join(" L ");
    const first = `${cx(snapshot.series[0].minute).toFixed(2)},${baseY.toFixed(2)}`;
    const last = `${cx(snapshot.series[snapshot.series.length - 1].minute).toFixed(2)},${baseY.toFixed(2)}`;
    return `M ${first} L ${top} L ${last} Z`;
  }

  function buildLine(side: "home" | "away"): string {
    if (snapshot.series.length === 0) return "";
    return snapshot.series
      .map((p, i) => {
        const v = side === "home" ? p.homeXG : -p.awayXG;
        return `${i === 0 ? "M" : "L"} ${cx(p.minute).toFixed(2)},${cy(v).toFixed(2)}`;
      })
      .join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Match momentum over minutes"
    >
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {/* center axis */}
        <line x1={0} y1={innerH / 2} x2={innerW} y2={innerH / 2} stroke="#1f1f1f" />
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <g key={t}>
            <line
              x1={0}
              y1={innerH * (1 - t) / 2 + innerH / 4}
              x2={innerW}
              y2={innerH * (1 - t) / 2 + innerH / 4}
              stroke="#1f1f1f"
              strokeDasharray="2 4"
              strokeWidth="0.5"
            />
            <line
              x1={0}
              y1={innerH * t / 2}
              x2={innerW}
              y2={innerH * t / 2}
              stroke="#1f1f1f"
              strokeDasharray="2 4"
              strokeWidth="0.5"
            />
          </g>
        ))}
        {[0, 15, 30, 45, 60, 75, 90].map((m) =>
          m <= span ? (
            <g key={m}>
              <line
                x1={(m / span) * innerW}
                y1={0}
                x2={(m / span) * innerW}
                y2={innerH}
                stroke="#1f1f1f"
                strokeWidth="0.5"
              />
              <text
                x={(m / span) * innerW}
                y={innerH + 14}
                textAnchor="middle"
                className="fill-text-muted text-[9px]"
              >
                {m}&apos;
              </text>
            </g>
          ) : null,
        )}
        {/* Areas */}
        <path d={buildArea("home")} fill="rgba(0,213,99,0.22)" />
        <path d={buildArea("away")} fill="rgba(59,130,246,0.18)" />
        {/* Lines */}
        <path d={buildLine("home")} fill="none" stroke="#00D563" strokeWidth="1.5" />
        <path d={buildLine("away")} fill="none" stroke="#3B82F6" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
