"use client";

import { type RadarAxes } from "@/lib/data/demoPlayerStats";

const AXES: Array<{ key: keyof RadarAxes; label: string }> = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "creativity", label: "Creativity" },
  { key: "pressing", label: "Pressing" },
  { key: "defending", label: "Defending" },
  { key: "passing", label: "Passing" },
];

const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 36;

type Props = {
  homeName: string;
  homeStats: RadarAxes;
  awayName?: string;
  awayStats?: RadarAxes;
};

function pointFor(value: number, index: number, total: number) {
  // Top of polygon = index 0, going clockwise
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const r = (Math.max(0, Math.min(100, value)) / 100) * RADIUS;
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r };
}

function polygonPoints(stats: RadarAxes): string {
  return AXES.map((a, i) => {
    const { x, y } = pointFor(stats[a.key], i, AXES.length);
    return `${x},${y}`;
  }).join(" ");
}

/**
 * Six-axis radar chart comparing two players (or a player vs himself
 * baseline). Pure SVG, no chart library — keeps the bundle small.
 *
 * Axes are normalised to a 0–1 scale per stat domain so a defender's
 * pressing radar isn't dwarfed by a forward's goal output.
 */
export function PlayerComparisonRadar({
  homeName,
  homeStats,
  awayName,
  awayStats,
}: Props) {
  return (
    <div className="surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">Side-by-side comparison</p>
          <p className="text-xs text-text-secondary">All axes scaled 0–100.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
            <span className="truncate">{homeName}</span>
          </span>
          {awayStats ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-info" />
              <span className="truncate">{awayName}</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-md">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="h-auto w-full"
          aria-label="Radar comparison"
        >
          {/* Concentric grid */}
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <polygon
              key={t}
              points={AXES.map((_, i) => {
                const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
                const r = RADIUS * t;
                return `${CENTER + Math.cos(angle) * r},${CENTER + Math.sin(angle) * r}`;
              }).join(" ")}
              fill="none"
              stroke="#1f1f1f"
              strokeWidth="0.6"
            />
          ))}
          {/* Spokes */}
          {AXES.map((_, i) => {
            const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={CENTER + Math.cos(angle) * RADIUS}
                y2={CENTER + Math.sin(angle) * RADIUS}
                stroke="#1f1f1f"
                strokeWidth="0.6"
              />
            );
          })}
          {/* Away polygon (drawn first so home sits on top) */}
          {awayStats ? (
            <polygon
              points={polygonPoints(awayStats)}
              fill="rgba(59,130,246,0.25)"
              stroke="#3B82F6"
              strokeWidth="1.5"
            />
          ) : null}
          {/* Home polygon */}
          <polygon
            points={polygonPoints(homeStats)}
            fill="rgba(0,213,99,0.25)"
            stroke="#00D563"
            strokeWidth="1.5"
          />
          {/* Axis labels */}
          {AXES.map((a, i) => {
            const angle = (i / AXES.length) * Math.PI * 2 - Math.PI / 2;
            const r = RADIUS + 18;
            const x = CENTER + Math.cos(angle) * r;
            const y = CENTER + Math.sin(angle) * r;
            return (
              <text
                key={a.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-text-secondary text-[10px]"
              >
                {a.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
