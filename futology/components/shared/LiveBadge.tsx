import { cn } from "@/lib/utils/cn";

type Props = {
  variant?: "full" | "dot";
  className?: string;
};

/**
 * Pulsing "Live" indicator for in-progress matches.
 *
 * `dot` is a compact single-pixel pulse for tight UI (cards, list rows).
 * `full` is the labelled pill used in headers and detail sheets.
 *
 * Both honour `prefers-reduced-motion` via the `.live-dot` keyframe.
 */
export function LiveBadge({ variant = "full", className }: Props) {
  if (variant === "dot") {
    return <span aria-label="Live" className={cn("live-dot", className)} />;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-live/40 bg-live/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-live",
        className,
      )}
    >
      <span className="live-dot h-1.5 w-1.5" aria-hidden />
      Live
    </span>
  );
}
