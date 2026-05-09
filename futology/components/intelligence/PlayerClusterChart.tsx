"use client";

import { useMemo, useState } from "react";
import {
  PLAYER_STATS,
  type PlayerStatLine,
} from "@/lib/data/demoPlayerStats";
import { CLUSTERS, clusterById, type ClusterId } from "@/lib/data/playerClusters";
import { cn } from "@/lib/utils/cn";

const PADDING = 24;

type Props = {
  onSelect?: (player: PlayerStatLine) => void;
  highlightId?: number;
  filterCluster?: ClusterId | null;
};

/**
 * Pure-SVG scatter plot showing players positioned by creative output
 * (x-axis) and defensive activity (y-axis), coloured by their KMeans
 * cluster (one of 6 styles per bible §9.2).
 *
 * `filterCluster` dims out non-matching dots so the user can focus on a
 * single playing style; `highlightId` ringed the active comparison
 * subject; `onSelect` fires when a dot is clicked.
 */
export function PlayerClusterChart({
  onSelect,
  highlightId,
  filterCluster,
}: Props) {
  const [hover, setHover] = useState<PlayerStatLine | null>(null);

  const players = useMemo(
    () =>
      filterCluster
        ? PLAYER_STATS.filter((p) => p.cluster === filterCluster)
        : PLAYER_STATS,
    [filterCluster],
  );

  return (
    <div className="surface space-y-3 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">Playing-style clusters</p>
          <p className="text-xs text-text-secondary">
            X = creative output · Y = defensive activity · dot size = minutes played
          </p>
        </div>
        <p className="text-[11px] text-text-muted">{players.length} players · 6 clusters</p>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-bg-elevated md:aspect-[16/10]">
        <svg
          viewBox="0 0 400 300"
          className="h-full w-full"
          role="img"
          aria-label="Player cluster scatter"
        >
          {/* Grid */}
          <g stroke="#1f1f1f" strokeWidth="0.5">
            {[0.25, 0.5, 0.75].map((t) => (
              <g key={t}>
                <line
                  x1={PADDING + (400 - 2 * PADDING) * t}
                  y1={PADDING}
                  x2={PADDING + (400 - 2 * PADDING) * t}
                  y2={300 - PADDING}
                />
                <line
                  x1={PADDING}
                  y1={PADDING + (300 - 2 * PADDING) * t}
                  x2={400 - PADDING}
                  y2={PADDING + (300 - 2 * PADDING) * t}
                />
              </g>
            ))}
            <rect
              x={PADDING}
              y={PADDING}
              width={400 - 2 * PADDING}
              height={300 - 2 * PADDING}
              fill="none"
              stroke="#2a2a2a"
            />
          </g>
          {/* Axis labels */}
          <text
            x={200}
            y={300 - 4}
            textAnchor="middle"
            className="fill-text-muted text-[9px]"
          >
            Creative output →
          </text>
          <text
            x={10}
            y={150}
            textAnchor="middle"
            transform="rotate(-90 10 150)"
            className="fill-text-muted text-[9px]"
          >
            ← Defensive activity
          </text>

          {/* Dots */}
          {players.map((p) => {
            const cluster = clusterById(p.cluster);
            const cx = PADDING + ((400 - 2 * PADDING) * p.creativity) / 100;
            const cy =
              300 - PADDING - ((300 - 2 * PADDING) * p.defensiveActivity) / 100;
            const r = 4 + (p.minutesPlayed / 2500) * 5;
            const isHover = hover?.playerId === p.playerId;
            const isHighlight = highlightId === p.playerId;
            return (
              <g
                key={p.playerId}
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect?.(p)}
                style={{ cursor: onSelect ? "pointer" : "default" }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={cluster.color}
                  fillOpacity={isHover || isHighlight ? 1 : 0.78}
                  stroke={isHover || isHighlight ? "#fafafa" : cluster.color}
                  strokeWidth={isHover || isHighlight ? 1.5 : 0}
                />
              </g>
            );
          })}
        </svg>

        {hover ? <Tooltip player={hover} /> : null}
      </div>

      <Legend />
    </div>
  );
}

function Tooltip({ player }: { player: PlayerStatLine }) {
  const cluster = clusterById(player.cluster);
  return (
    <div className="surface-elevated pointer-events-none absolute right-3 top-3 max-w-[14rem] rounded-lg p-3 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-2 w-2 rounded-full"
          style={{ background: cluster.color }}
        />
        <span className="text-[11px] uppercase tracking-wider text-text-muted">
          {cluster.name}
        </span>
      </div>
      <p className="mt-1 truncate font-semibold">{player.name}</p>
      <p className="truncate text-text-secondary">{player.team}</p>
      <ul className="mt-2 space-y-0.5">
        {player.topStats.map((s) => (
          <li key={s.label} className="flex justify-between">
            <span className="text-text-muted">{s.label}</span>
            <span className="tabular text-text-primary">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
      {CLUSTERS.map((c) => (
        <span key={c.id} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: c.color }}
          />
          {c.name}
        </span>
      ))}
    </div>
  );
}

export function ClusterFilter({
  value,
  onChange,
}: {
  value: ClusterId | null;
  onChange: (id: ClusterId | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value === null}
        className={cn(
          "rounded-full border px-2.5 py-1 text-xs transition-colors",
          value === null
            ? "border-accent/60 bg-accent-muted text-accent"
            : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
        )}
      >
        All clusters
      </button>
      {CLUSTERS.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              active
                ? "border-accent/60 bg-accent-muted text-accent"
                : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
            )}
          >
            <span
              aria-hidden
              className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
              style={{ background: c.color }}
            />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
