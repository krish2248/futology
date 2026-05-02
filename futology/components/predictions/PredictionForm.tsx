"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Sparkles, Trash2 } from "lucide-react";
import { ScoresPicker } from "./ScoresPicker";
import {
  useSession,
  type Prediction,
  type Winner,
} from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import { cn } from "@/lib/utils/cn";

type Props = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  isLocked?: boolean; // true after kickoff
  ml?: { winner: Winner; confidence: number; predictedScore?: string };
  className?: string;
  onSaved?: (prediction: Prediction) => void;
};

export function PredictionForm({
  fixtureId,
  homeTeam,
  awayTeam,
  matchDate,
  isLocked,
  ml,
  className,
  onSaved,
}: Props) {
  const ready = useIsClient();
  const upsertPrediction = useSession((s) => s.upsertPrediction);
  const deletePrediction = useSession((s) => s.deletePrediction);
  const existing = useSession((s) =>
    s.predictions.find((p) => p.fixtureId === fixtureId),
  );

  const [home, setHome] = useState<number>(existing?.predictedHomeScore ?? 1);
  const [away, setAway] = useState<number>(existing?.predictedAwayScore ?? 1);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (existing) {
      setHome(existing.predictedHomeScore);
      setAway(existing.predictedAwayScore);
    }
  }, [existing]);

  function applyML() {
    if (!ml) return;
    const score = ml.predictedScore?.match(/(\d+)\s*-\s*(\d+)/);
    if (score) {
      setHome(Number(score[1]));
      setAway(Number(score[2]));
      return;
    }
    // Fallback when no predicted score string: encode the winner
    if (ml.winner === "home") {
      setHome(2);
      setAway(1);
    } else if (ml.winner === "away") {
      setHome(1);
      setAway(2);
    } else {
      setHome(1);
      setAway(1);
    }
  }

  function save() {
    const next = upsertPrediction({
      fixtureId,
      homeTeam,
      awayTeam,
      matchDate,
      predictedHomeScore: home,
      predictedAwayScore: away,
      mlSuggestedWinner: ml?.winner,
      mlConfidence: ml?.confidence,
    });
    void confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#00D563", "#FFD700"],
    });
    setSavedAt(Date.now());
    onSaved?.(next);
  }

  function clear() {
    if (!existing) return;
    deletePrediction(existing.id);
    setHome(1);
    setAway(1);
    setSavedAt(null);
  }

  const justSaved = savedAt !== null && Date.now() - savedAt < 2500;

  return (
    <div className={cn("space-y-4", className)}>
      <ScoresPicker
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={home}
        awayScore={away}
        onChange={({ homeScore, awayScore }) => {
          setHome(homeScore);
          setAway(awayScore);
        }}
        disabled={isLocked}
      />

      <p className="text-center text-xs text-text-secondary">
        {home === away
          ? "Predicted: draw"
          : home > away
            ? `Predicted winner: ${homeTeam}`
            : `Predicted winner: ${awayTeam}`}
      </p>

      {ml ? (
        <button
          type="button"
          onClick={applyML}
          disabled={isLocked}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent-muted px-3 py-2 text-left text-sm text-accent transition-colors hover:bg-accent-muted/80",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden />
            ML hint:{" "}
            {ml.predictedScore ?? (ml.winner === "draw" ? "draw" : ml.winner)}
            <span className="tabular text-text-muted">
              · {ml.confidence.toFixed(0)}%
            </span>
          </span>
          <span className="text-xs uppercase tracking-wider text-text-muted">
            Use
          </span>
        </button>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isLocked || !ready}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {justSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Saved
            </>
          ) : existing ? (
            "Update prediction"
          ) : (
            "Save prediction"
          )}
        </button>
        {existing ? (
          <button
            type="button"
            onClick={clear}
            disabled={isLocked}
            aria-label="Delete prediction"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border-strong text-text-secondary transition-colors hover:border-live/40 hover:text-live disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isLocked ? (
        <p className="text-center text-xs text-text-muted">
          Match has kicked off — predictions locked.
        </p>
      ) : (
        <p className="text-center text-xs text-text-muted">
          3 pts for exact score · 1 pt for correct winner.
        </p>
      )}
    </div>
  );
}
