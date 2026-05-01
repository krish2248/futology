"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Hexagon, Users, Eye } from "lucide-react";
import { PitchSVG, PitchMarker } from "@/components/intelligence/PitchSVG";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { getDemoMatches } from "@/lib/data/demoMatches";
import {
  getDemoTactics,
  type Shot,
  type TacticsSnapshot,
} from "@/lib/data/demoTactics";
import { cn } from "@/lib/utils/cn";

type View = "shots" | "passes";

export function TacticBoardView() {
  const matches = useMemo(
    () => getDemoMatches().filter((m) => m.status !== "scheduled"),
    [],
  );
  const [matchId, setMatchId] = useState<number>(matches[0]?.id ?? 1);
  const [view, setView] = useState<View>("shots");
  const [hover, setHover] = useState<Shot | null>(null);

  const tactics = useMemo<TacticsSnapshot | null>(() => {
    const m = matches.find((x) => x.id === matchId) ?? matches[0];
    return m ? getDemoTactics(m) : null;
  }, [matchId, matches]);

  if (!tactics) {
    return <p className="text-text-secondary">No tactics data available.</p>;
  }

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Intelligence Hub
      </Link>
      <PageHeader
        title="TacticBoard"
        description="xG shot map, pass network and pressing intensity. Demo data; StatsBomb open data wires in Phase 4."
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

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {view === "shots" ? "xG shot map" : "Pass network"}
                </p>
                <p className="text-xs text-text-secondary">
                  {view === "shots"
                    ? "Circle size = xG · color = outcome"
                    : "Node size = passes received · edges (sample) per team"}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setView("shots")}
                  aria-pressed={view === "shots"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                    view === "shots"
                      ? "bg-accent-muted text-accent"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                  )}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden /> Shots
                </button>
                <button
                  type="button"
                  onClick={() => setView("passes")}
                  aria-pressed={view === "passes"}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                    view === "passes"
                      ? "bg-accent-muted text-accent"
                      : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
                  )}
                >
                  <Users className="h-3.5 w-3.5" aria-hidden /> Passes
                </button>
              </div>
            </div>

            <PitchSVG>
              {view === "shots"
                ? tactics.shots.map((s) => (
                    <ShotDot key={s.id} shot={s} onHover={setHover} />
                  ))
                : (
                  <PassNetworkLayer tactics={tactics} />
                )}
            </PitchSVG>

            <Legend view={view} />
          </Card>

          {hover && view === "shots" ? (
            <Card>
              <p className="text-xs uppercase tracking-wider text-text-muted">
                Shot detail
              </p>
              <div className="mt-1 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-secondary">Player</p>
                  <p className="font-medium">{hover.player}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Minute</p>
                  <p className="tabular font-medium">{hover.minute}&apos;</p>
                </div>
                <div>
                  <p className="text-text-secondary">xG</p>
                  <p className="tabular font-medium">{hover.xG.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Outcome</p>
                  <p className="font-medium capitalize">{hover.outcome}</p>
                </div>
              </div>
            </Card>
          ) : null}
        </div>

        <Sidebar tactics={tactics} />
      </div>
    </div>
  );
}

function Sidebar({ tactics }: { tactics: TacticsSnapshot }) {
  const s = tactics.stats;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label={`${tactics.match.homeTeam} xG`}
          value={s.homeXG.toFixed(2)}
        />
        <StatTile
          label={`${tactics.match.awayTeam} xG`}
          value={s.awayXG.toFixed(2)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Home PPDA"
          value={s.homePPDA.toFixed(1)}
          hint="Lower = more pressing"
        />
        <StatTile
          label="Away PPDA"
          value={s.awayPPDA.toFixed(1)}
          hint="Lower = more pressing"
        />
      </div>
      <Card>
        <div className="space-y-2 text-sm">
          <Row label="Possession" home={`${s.homePossession}%`} away={`${100 - s.homePossession}%`} />
          <Row label="Field tilt" home={`${s.homeFieldTilt}%`} away={`${100 - s.homeFieldTilt}%`} />
          <Row label="Pass accuracy" home={`${s.homePassAccuracy}%`} away={`${s.awayPassAccuracy}%`} />
          <Row label="Final-third entries" home={String(s.homeFinalThirdEntries)} away={String(s.awayFinalThirdEntries)} />
        </div>
      </Card>
    </div>
  );
}

function Row({ label, home, away }: { label: string; home: string; away: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="tabular font-medium text-accent">{home}</span>
      <span className="text-text-muted">{label}</span>
      <span className="tabular font-medium text-info">{away}</span>
    </div>
  );
}

function ShotDot({
  shot,
  onHover,
}: {
  shot: Shot;
  onHover: (s: Shot | null) => void;
}) {
  const size = 6 + shot.xG * 22; // 6–28 px
  const color =
    shot.outcome === "goal"
      ? "#FFD700"
      : shot.outcome === "saved"
        ? "#9aa0a6"
        : shot.outcome === "off-target"
          ? "#FF3B3B"
          : "#525252";
  const ringColor = shot.team === "home" ? "#00D563" : "#3B82F6";
  return (
    <PitchMarker x={shot.x} y={shot.y} size={size}>
      <span
        onMouseEnter={() => onHover(shot)}
        onMouseLeave={() => onHover(null)}
        className="block h-full w-full rounded-full"
        style={{
          background: `${color}cc`,
          boxShadow: `0 0 0 1.5px ${ringColor}`,
        }}
      />
    </PitchMarker>
  );
}

function PassNetworkLayer({ tactics }: { tactics: TacticsSnapshot }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      {/* Edges first so they sit under nodes */}
      {[...tactics.homeEdges, ...tactics.awayEdges].map((e, i) => {
        const nodes = e.team === "home" ? tactics.homeNodes : tactics.awayNodes;
        const from = nodes.find((n) => n.number === e.from);
        const to = nodes.find((n) => n.number === e.to);
        if (!from || !to) return null;
        const stroke = e.team === "home" ? "#00D563" : "#3B82F6";
        return (
          <line
            key={`${e.team}-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={stroke}
            strokeOpacity={Math.min(0.65, 0.15 + e.count / 12)}
            strokeWidth={0.6 + e.count / 18}
          />
        );
      })}
      {[...tactics.homeNodes, ...tactics.awayNodes].map((n) => {
        const r = 1.6 + (n.passes / 40) * 1.6;
        const fill = n.team === "home" ? "#00D563" : "#3B82F6";
        return (
          <g key={`${n.team}-${n.number}`}>
            <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke="#0a0a0a" strokeWidth={0.4} />
            <text
              x={n.x}
              y={n.y + 0.6}
              textAnchor="middle"
              className="fill-bg-primary"
              style={{ fontSize: "1.6px", fontWeight: 700 }}
            >
              {n.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Legend({ view }: { view: View }) {
  if (view === "shots") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
        <Item color="#FFD700" label="Goal" />
        <Item color="#9aa0a6" label="On target (saved)" />
        <Item color="#FF3B3B" label="Off target" />
        <Item color="#525252" label="Blocked" />
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Hexagon className="h-3 w-3" aria-hidden /> Bigger circle = higher xG
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
      <Item color="#00D563" label="Home network" />
      <Item color="#3B82F6" label="Away network" />
      <span className="ml-auto">Edge thickness = pass frequency (sampled)</span>
    </div>
  );
}

function Item({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
