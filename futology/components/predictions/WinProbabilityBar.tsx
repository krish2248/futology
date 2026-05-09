import { cn } from "@/lib/utils/cn";

type Props = {
  home: number;
  draw: number;
  away: number;
  homeLabel?: string;
  awayLabel?: string;
  className?: string;
  size?: "sm" | "md";
};

/**
 * Three-segment probability bar showing home/draw/away percentages.
 *
 * The dominant outcome gets the saturated accent colour; the other two
 * segments use the muted variant so the eye lands on the most likely
 * result. Total need not be 100 — segments are normalised internally.
 *
 * Renders as `role="img"` with a verbose `aria-label` so screen readers
 * announce the full breakdown.
 */
export function WinProbabilityBar({
  home,
  draw,
  away,
  homeLabel = "Home",
  awayLabel = "Away",
  className,
  size = "md",
}: Props) {
  const total = home + draw + away;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const dominant: "home" | "draw" | "away" =
    home >= draw && home >= away
      ? "home"
      : away >= draw
        ? "away"
        : "draw";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "tabular font-medium",
            dominant === "home" ? "text-accent" : "text-text-secondary",
          )}
        >
          {homeLabel} {home.toFixed(0)}%
        </span>
        <span
          className={cn(
            "tabular",
            dominant === "draw"
              ? "font-medium text-text-primary"
              : "text-text-muted",
          )}
        >
          Draw {draw.toFixed(0)}%
        </span>
        <span
          className={cn(
            "tabular font-medium",
            dominant === "away" ? "text-accent" : "text-text-secondary",
          )}
        >
          {awayLabel} {away.toFixed(0)}%
        </span>
      </div>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full bg-bg-elevated",
          size === "sm" ? "h-1.5" : "h-2.5",
        )}
        role="img"
        aria-label={`Win probability: ${homeLabel} ${home.toFixed(0)}%, draw ${draw.toFixed(0)}%, ${awayLabel} ${away.toFixed(0)}%`}
      >
        <span
          className={cn(
            "block h-full transition-[width] duration-500 ease-out",
            dominant === "home" ? "bg-accent" : "bg-accent/50",
          )}
          style={{ width: `${pct(home)}%` }}
        />
        <span
          className="block h-full bg-text-muted/40 transition-[width] duration-500 ease-out"
          style={{ width: `${pct(draw)}%` }}
        />
        <span
          className={cn(
            "block h-full transition-[width] duration-500 ease-out",
            dominant === "away" ? "bg-info" : "bg-info/50",
          )}
          style={{ width: `${pct(away)}%` }}
        />
      </div>
    </div>
  );
}
