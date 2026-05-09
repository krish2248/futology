type Props = {
  label: string;
  value: number; // -1..1
  highlight?: "home" | "away";
};

/**
 * Pure-SVG sentiment gauge.
 *
 * Maps a `-1..1` value to a 220° arc with a colour-coded needle and an
 * adjacent mood label ("very negative", "neutral", "very positive").
 * Used twice on the Sentiment Storm page — one per team.
 */
export function SentimentGauge({ label, value, highlight = "home" }: Props) {
  const clamped = Math.max(-1, Math.min(1, value));
  // Map -1..1 to 220deg arc starting at -110deg
  const startDeg = -110;
  const endDeg = 110;
  const ratio = (clamped + 1) / 2; // 0..1
  const needleDeg = startDeg + (endDeg - startDeg) * ratio;
  const color =
    clamped > 0.15
      ? "#00D563"
      : clamped < -0.15
        ? "#FF3B3B"
        : "#F5A623";

  // Label
  const moodLabel =
    clamped > 0.4
      ? "Buzzing"
      : clamped > 0.1
        ? "Optimistic"
        : clamped > -0.1
          ? "Tense"
          : clamped > -0.4
            ? "Frustrated"
            : "Furious";

  return (
    <div className="surface flex flex-col items-center gap-2 p-4">
      <p className="text-xs uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <div className="relative">
        <svg viewBox="0 0 120 80" className="h-24 w-32" role="img" aria-label={`Sentiment ${value.toFixed(2)}`}>
          {/* Background arc */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke="#1f1f1f"
            strokeWidth="8"
          />
          {/* Active arc */}
          <path
            d="M 10 70 A 50 50 0 0 1 110 70"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${ratio * 157} 157`}
            strokeLinecap="round"
          />
          {/* Needle */}
          <g transform={`rotate(${needleDeg} 60 70)`}>
            <line x1={60} y1={70} x2={60} y2={20} stroke="#FAFAFA" strokeWidth="2" strokeLinecap="round" />
            <circle cx={60} cy={70} r={3} fill="#FAFAFA" />
          </g>
        </svg>
      </div>
      <p className="tabular text-base font-semibold" style={{ color }}>
        {(clamped * 100).toFixed(0)}
      </p>
      <p className="text-[11px] text-text-secondary">{moodLabel}</p>
      <p className="sr-only">{highlight}</p>
    </div>
  );
}
