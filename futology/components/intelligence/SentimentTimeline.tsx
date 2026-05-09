"use client";

import type { SentimentPoint } from "@/lib/data/demoSentiment";

const W = 600;
const H = 220;
const PAD = { left: 32, right: 16, top: 16, bottom: 22 };

type Props = {
  timeline: SentimentPoint[];
  goalEvents: { minute: number; team: "home" | "away"; player: string }[];
  homeName: string;
  awayName: string;
};

function buildArea(
  points: SentimentPoint[],
  pick: (p: SentimentPoint) => number,
  innerW: number,
  innerH: number,
  span: number,
): string {
  if (points.length === 0) return "";
  const cx0 = (m: number) => (m / span) * innerW;
  const cy = (v: number) => innerH / 2 - (v * innerH) / 2;
  const baseY = innerH / 2;
  const top = points
    .map((p) => `${cx0(p.minute).toFixed(2)},${cy(pick(p)).toFixed(2)}`)
    .join(" ");
  return `M ${cx0(points[0].minute)},${baseY} L ${top} L ${cx0(points[points.length - 1].minute)},${baseY} Z`;
}

function buildLine(
  points: SentimentPoint[],
  pick: (p: SentimentPoint) => number,
  innerW: number,
  innerH: number,
  span: number,
): string {
  if (points.length === 0) return "";
  const cx0 = (m: number) => (m / span) * innerW;
  const cy = (v: number) => innerH / 2 - (v * innerH) / 2;
  return points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${cx0(p.minute).toFixed(2)},${cy(pick(p)).toFixed(2)}`,
    )
    .join(" ");
}

/**
 * Pure-SVG sentiment timeline showing per-minute home and away mood.
 *
 * Goal events are rendered as vertical guide lines so the user can see
 * how a goal swings sentiment. Smooth-curve interpolation keeps the
 * trace readable even when minute-by-minute jitter is high.
 */
export function SentimentTimeline({
  timeline,
  goalEvents,
  homeName,
  awayName,
}: Props) {
  if (timeline.length === 0) {
    return (
      <div className="surface px-4 py-12 text-center text-sm text-text-muted">
        No timeline yet — match hasn&apos;t kicked off.
      </div>
    );
  }
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const span = Math.max(1, timeline[timeline.length - 1].minute);

  return (
    <div className="surface space-y-2 p-4">
      <div className="flex items-center justify-between text-xs">
        <p className="font-medium">Live sentiment timeline</p>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
            <span className="truncate text-text-secondary">{homeName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 rounded-full bg-info" />
            <span className="truncate text-text-secondary">{awayName}</span>
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Sentiment timeline over match minutes"
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Center line */}
          <line
            x1={0}
            y1={innerH / 2}
            x2={innerW}
            y2={innerH / 2}
            stroke="#1f1f1f"
          />
          {/* Y axis ticks */}
          {[-1, -0.5, 0, 0.5, 1].map((tick) => {
            const y = innerH / 2 - (tick * innerH) / 2;
            return (
              <g key={tick}>
                <line x1={0} y1={y} x2={innerW} y2={y} stroke="#1f1f1f" strokeDasharray="2 4" strokeWidth={tick === 0 ? 0 : 0.5} />
                <text x={-6} y={y + 3} textAnchor="end" className="fill-text-muted text-[9px]">
                  {tick > 0 ? `+${tick}` : tick}
                </text>
              </g>
            );
          })}
          {/* X axis labels */}
          {[0, 15, 30, 45, 60, 75, 90].map((m) =>
            m <= span ? (
              <g key={m}>
                <line x1={(m / span) * innerW} y1={0} x2={(m / span) * innerW} y2={innerH} stroke="#1f1f1f" strokeWidth="0.5" />
                <text x={(m / span) * innerW} y={innerH + 14} textAnchor="middle" className="fill-text-muted text-[9px]">
                  {m}&apos;
                </text>
              </g>
            ) : null,
          )}
          {/* Areas */}
          <path
            d={buildArea(timeline, (p) => p.away, innerW, innerH, span)}
            fill="rgba(59,130,246,0.18)"
          />
          <path
            d={buildArea(timeline, (p) => p.home, innerW, innerH, span)}
            fill="rgba(0,213,99,0.22)"
          />
          {/* Lines */}
          <path
            d={buildLine(timeline, (p) => p.away, innerW, innerH, span)}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1.5"
          />
          <path
            d={buildLine(timeline, (p) => p.home, innerW, innerH, span)}
            fill="none"
            stroke="#00D563"
            strokeWidth="1.5"
          />
          {/* Goal markers */}
          {goalEvents.map((g, i) => {
            const x = (g.minute / span) * innerW;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={innerH}
                  stroke={g.team === "home" ? "#00D563" : "#3B82F6"}
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={-4}
                  textAnchor="middle"
                  className="text-[11px]"
                  fill={g.team === "home" ? "#00D563" : "#3B82F6"}
                >
                  ⚽
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
