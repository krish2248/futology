import type { DemoMatch } from "@/lib/data/demoMatches";
import { LiveBadge } from "@/components/shared/LiveBadge";
import {
  formatKickoff,
  formatRelativeMinute,
  formatScore,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  match: DemoMatch;
  variant?: "default" | "compact";
  className?: string;
};

/**
 * Match summary card. Renders three implicit visual variants based on
 * `match.status`:
 * - `live` → pulsing LiveBadge + minute counter, current score
 * - `finished` → final score, no badge
 * - `scheduled` → kickoff time, no score
 *
 * `compact` is the dense variant used inside the LiveStrip on the home
 * page; `default` is for the scores grid and league/club fixture lists.
 */
export function MatchCard({ match, variant = "default", className }: Props) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const compact = variant === "compact";

  return (
    <article
      className={cn(
        "surface surface-hover relative overflow-hidden",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-[11px] uppercase tracking-wider text-text-muted">
          {match.leagueName}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-live">
            <span className="live-dot" aria-hidden />
            {formatRelativeMinute(match.minute) || "Live"}
          </span>
        ) : isFinished ? (
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
            FT
          </span>
        ) : (
          <span className="tabular text-[11px] text-text-secondary">
            {formatKickoff(match.kickoff)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Team
          name={match.homeTeam}
          align="start"
          dim={isFinished && (match.homeScore ?? 0) < (match.awayScore ?? 0)}
        />
        <ScoreOrTime match={match} />
        <Team
          name={match.awayTeam}
          align="end"
          dim={isFinished && (match.awayScore ?? 0) < (match.homeScore ?? 0)}
        />
      </div>

      {!compact && match.venue ? (
        <p className="mt-3 truncate text-xs text-text-muted">{match.venue}</p>
      ) : null}
    </article>
  );
}

function Team({
  name,
  align,
  dim,
}: {
  name: string;
  align: "start" | "end";
  dim: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        align === "end" ? "flex-row-reverse text-right" : "",
      )}
    >
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-elevated text-[10px] font-semibold text-text-secondary"
      >
        {name.slice(0, 3).toUpperCase()}
      </span>
      <span
        className={cn(
          "min-w-0 truncate text-sm font-medium",
          dim && "text-text-secondary",
        )}
      >
        {name}
      </span>
    </div>
  );
}

function ScoreOrTime({ match }: { match: DemoMatch }) {
  if (match.status === "scheduled") {
    return (
      <span className="tabular rounded-md bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary">
        vs
      </span>
    );
  }
  return (
    <span
      className={cn(
        "tabular text-lg font-semibold tracking-tight",
        match.status === "live" && "text-live",
      )}
    >
      {formatScore(match.homeScore, match.awayScore)}
    </span>
  );
}

export function LiveStrip({
  matches,
  onSelect,
}: {
  matches: DemoMatch[];
  onSelect?: (match: DemoMatch) => void;
}) {
  if (matches.length === 0) return null;
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex snap-x gap-3 pb-2">
        {matches.map((m) => (
          <div key={m.id} className="w-72 shrink-0 snap-start">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="block w-full text-left transition-transform active:scale-[0.99]"
                aria-label={`Open match details: ${m.homeTeam} vs ${m.awayTeam}`}
              >
                <MatchCard match={m} variant="compact" />
              </button>
            ) : (
              <MatchCard match={m} variant="compact" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
