"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles, ChevronDown, CheckCircle2 } from "lucide-react";
import type { DemoPrediction } from "@/lib/data/demoPredictions";
import { WinProbabilityBar } from "./WinProbabilityBar";
import { useSession } from "@/lib/store/session";
import {
  formatKickoff,
  formatRelativeMinute,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  prediction: DemoPrediction;
  className?: string;
};

/**
 * AI prediction card on the `/predictions` AI tab.
 *
 * Renders the ML probability bar, predicted score trio, confidence pill,
 * and a "Use this prediction" button that copies the suggestion into the
 * user's prediction store and fires confetti. The expandable footer
 * surfaces the seeded "key factors" so the user understands *why* the
 * model leans the way it does.
 */
export function PredictionCard({ prediction, className }: Props) {
  const [open, setOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const upsertPrediction = useSession((s) => s.upsertPrediction);
  const existing = useSession((s) =>
    s.predictions.find((p) => p.fixtureId === prediction.fixtureId),
  );
  const m = prediction.match;
  const isLive = m.status === "live";
  const justSaved = savedAt !== null && Date.now() - savedAt < 2500;
  const isLocked = m.status !== "scheduled";

  function parseScore(): { home: number; away: number } {
    const match = prediction.predictedScore.match(/(\d+)\s*-\s*(\d+)/);
    if (match) return { home: Number(match[1]), away: Number(match[2]) };
    return { home: 1, away: 1 };
  }

  function save() {
    if (isLocked) return;
    const { home, away } = parseScore();
    upsertPrediction({
      fixtureId: m.id,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchDate: m.kickoff,
      predictedHomeScore: home,
      predictedAwayScore: away,
      mlSuggestedWinner: prediction.predictedWinner,
      mlConfidence: prediction.confidence,
    });
    void confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#00D563", "#FFD700"],
    });
    setSavedAt(Date.now());
  }

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
          onClick={save}
          disabled={isLocked}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {justSaved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Saved
            </>
          ) : existing ? (
            "Update from ML"
          ) : (
            "Use this prediction"
          )}
        </button>
        {existing ? (
          <span className="text-[11px] text-text-muted">
            Yours: {existing.predictedHomeScore}–{existing.predictedAwayScore}
          </span>
        ) : isLocked ? (
          <span className="text-[11px] text-text-muted">Locked at kickoff</span>
        ) : null}
      </div>
    </article>
  );
}
