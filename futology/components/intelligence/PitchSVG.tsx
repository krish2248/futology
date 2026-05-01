type Props = {
  children?: React.ReactNode;
  className?: string;
};

/**
 * Football pitch SVG with accurate-ish proportions (105m × 68m).
 * Children are rendered on top in a 100×100 coordinate space:
 *   x: 0 (own goal) → 100 (opponent goal)
 *   y: 0 (left side) → 100 (right side)
 */
export function PitchSVG({ children, className }: Props) {
  return (
    <div
      className={
        "relative aspect-[105/68] w-full overflow-hidden rounded-xl bg-[#0e2a18] " +
        (className ?? "")
      }
    >
      <svg
        viewBox="0 0 105 68"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        {/* outer */}
        <rect
          x={1}
          y={1}
          width={103}
          height={66}
          fill="none"
          stroke="#1f3a28"
          strokeWidth={0.4}
        />
        {/* halfway */}
        <line x1={52.5} y1={1} x2={52.5} y2={67} stroke="#1f3a28" strokeWidth={0.4} />
        <circle cx={52.5} cy={34} r={9.15} fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        <circle cx={52.5} cy={34} r={0.4} fill="#1f3a28" />
        {/* boxes */}
        <rect x={1} y={13.84} width={16.5} height={40.32} fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        <rect x={87.5} y={13.84} width={16.5} height={40.32} fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        {/* 6-yard */}
        <rect x={1} y={24.84} width={5.5} height={18.32} fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        <rect x={98.5} y={24.84} width={5.5} height={18.32} fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        {/* penalty arcs */}
        <path d="M 17.5 26.84 A 9 9 0 0 1 17.5 41.16" fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        <path d="M 87.5 26.84 A 9 9 0 0 0 87.5 41.16" fill="none" stroke="#1f3a28" strokeWidth={0.4} />
        {/* spots */}
        <circle cx={11} cy={34} r={0.3} fill="#1f3a28" />
        <circle cx={94} cy={34} r={0.3} fill="#1f3a28" />
      </svg>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/**
 * Position child in the 100×100 pitch coordinate space.
 */
export function PitchMarker({
  x,
  y,
  children,
  size = 12,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
      }}
    >
      {children}
    </span>
  );
}
