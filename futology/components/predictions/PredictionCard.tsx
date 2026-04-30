"use client";

import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import type { DemoPrediction } from "@/lib/data/demoPredictions";
import { WinProbabilityBar } from "./WinProbabilityBar";
import {
  formatKickoff,
  formatRelativeMinute,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  prediction: DemoPrediction;
  className?: string;
};

export function PredictionCard({ prediction, className }: Props) {
  const [open, setOpen] = useState(false);
  const m = prediction.match;
  const isLive = m.status === "live";

  return (
    <article
      className={cn(
        "surface surface-hover overflow-hidden p-4 md:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3 w-3" aria-hidden /> ML
        </span>
        <span className="truncate text-[11px] uppercase tracking-wider text-text-muted">
          {m.leagueName}
        </span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-live">
            <span className="live-dot" aria-hidden />
            {formatRelativeMinute(m.minute) || "Live"}
          </span>
        ) : (
          <span className="tabular text-[11px] text-text-secondary">
            {formatKickoff(m.kickoff)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="truncate text-sm font-medium">{m.homeTeam}</p>
        <span className="tabular rounded-md bg-bg-elevated px-2.5 py-1 text-xs text-text-secondary">
          vs
        </span>
        <p className="truncate text-right text-sm font-medium">{m.awayTeam}</p>
      </div>

      <div className="mt-4">
        <WinProbabilityBar
          home={prediction.homeWinProb}
          draw={prediction.drawProb}
          away={prediction.awayWinProb}
          homeLabel={m.homeTeam}
          awayLabel={m.awayTeam}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-bg-elevated px-2 py-2">
          <p className="uppercase tracking-wider text-text-muted">Predicted</p>
          <p className="tabular mt-0.5 text-base font-semibold">
            {prediction.predictedScore}
          </p>
        </div>
        <div className="rounded-lg bg-bg-elevated px-2 py-2">
          <p className="uppercase tracking-wider text-text-muted">Confidence</p>
          <p className="tabular mt-0.5 text-base font-semibold text-accent">
            {prediction.confidence.toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg bg-bg-elevated px-2 py-2">
          <p className="uppercase tracking-wider text-text-muted">Winner</p>
          <p className="mt-0.5 text-base font-semibold capitalize">
            {prediction.predictedWinner}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-3 inline-flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
      >
        <ChevronDown
          aria-hidden
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
        {open ? "Hide" : "Show"} key factors
      </button>

      {open ? (
        <ul className="mt-2 space-y-1 text-sm text-text-secondary">
          {prediction.keyFactors.map((factor) => (
            <li key={factor} className="flex items-start gap-2">
              <span
                aria-hidden
                className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              {factor}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover"
        >
          Use this prediction
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          Save
        </button>
      </div>
    </article>
  );
}
