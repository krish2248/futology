"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  onChange: (next: { homeScore: number; awayScore: number }) => void;
  disabled?: boolean;
};

export function ScoresPicker({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onChange,
  disabled,
}: Props) {
  function bump(side: "home" | "away", delta: number) {
    if (disabled) return;
    const home = side === "home" ? Math.max(0, Math.min(9, homeScore + delta)) : homeScore;
    const away = side === "away" ? Math.max(0, Math.min(9, awayScore + delta)) : awayScore;
    onChange({ homeScore: home, awayScore: away });
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <SideColumn
        team={homeTeam}
        score={homeScore}
        onMinus={() => bump("home", -1)}
        onPlus={() => bump("home", 1)}
        disabled={disabled}
      />
      <span className="tabular text-3xl font-bold text-text-muted md:text-4xl">–</span>
      <SideColumn
        team={awayTeam}
        score={awayScore}
        onMinus={() => bump("away", -1)}
        onPlus={() => bump("away", 1)}
        disabled={disabled}
        align="end"
      />
    </div>
  );
}

function SideColumn({
  team,
  score,
  onMinus,
  onPlus,
  disabled,
  align = "start",
}: {
  team: string;
  score: number;
  onMinus: () => void;
  onPlus: () => void;
  disabled?: boolean;
  align?: "start" | "end";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        align === "end" && "items-center",
      )}
    >
      <p className="line-clamp-1 max-w-full text-center text-sm font-medium">
        {team}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMinus}
          disabled={disabled || score === 0}
          aria-label={`Decrease ${team} score`}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full border border-border-strong text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Minus className="h-5 w-5" />
        </button>
        <span
          className="tabular grid h-12 w-12 place-items-center rounded-xl bg-bg-elevated text-2xl font-bold"
          aria-live="polite"
        >
          {score}
        </span>
        <button
          type="button"
          onClick={onPlus}
          disabled={disabled || score === 9}
          aria-label={`Increase ${team} score`}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-full border border-border-strong text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
