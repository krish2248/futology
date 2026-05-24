"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { TeamPicker } from "@/components/intelligence/TeamPicker";
import { WinProbabilityBar } from "@/components/predictions/WinProbabilityBar";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { ApiError } from "@/components/shared/ApiError";
import type { ClubSeed } from "@/lib/data/clubs";
import { predictMatchAuto } from "@/lib/ml/client";
import type { MatchPredictionResult } from "@/lib/ml/predictor";
import { cn } from "@/lib/utils/cn";

export function MatchPredictorView() {
  const [home, setHome] = useState<ClubSeed | null>(null);
  const [away, setAway] = useState<ClubSeed | null>(null);
  const [loading, startTransition] = useTransition();
  const [result, setResult] = useState<MatchPredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    if (!home || !away) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await predictMatchAuto({
          home,
          away,
          competitionId: home.leagueId,
        });
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not generate prediction.");
      }
    });
  }

  function reset() {
    setHome(null);
    setAway(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Intelligence Hub
      </Link>
      <PageHeader
        title="Match Predictor"
        description="Pick two teams. We'll predict the outcome with calibrated probabilities and plain-English reasons."
      />

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <TeamPicker
            label="Home"
            selected={home}
            onSelect={setHome}
            exclude={away?.id}
          />
          <span className="hidden self-end pb-3 text-text-muted md:inline">
            vs
          </span>
          <TeamPicker
            label="Away"
            selected={away}
            onSelect={setAway}
            exclude={home?.id}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={!home || !away || loading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" aria-hidden /> Predicting…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" aria-hidden /> Generate prediction
              </>
            )}
          </button>
          {result || error ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
            >
              Reset
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-text-muted">
          Demo: deterministic seeded predictions. Phase 3 swaps this for the
          XGBoost classifier with SHAP explanations.
        </p>
      </Card>

      {error ? (
        <ApiError message={error} onRetry={generate} />
      ) : null}

      <AnimatePresence>
        {result && home && away ? (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card>
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <Sparkles className="h-3 w-3" aria-hidden /> ML
                </span>
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  Confidence{" "}
                  <span className="tabular text-accent">
                    {result.confidence.toFixed(0)}%
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <p className="truncate text-base font-semibold">{home.name}</p>
                <p className="tabular text-3xl font-bold tracking-tight">
                  {result.predictedScore}
                </p>
                <p className="truncate text-right text-base font-semibold">
                  {away.name}
                </p>
              </div>

              <div className="mt-5">
                <WinProbabilityBar
                  home={result.homeWinProb}
                  draw={result.drawProb}
                  away={result.awayWinProb}
                  homeLabel={home.shortName}
                  awayLabel={away.shortName}
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                <Pill label="Predicted winner" value={
                  result.predictedWinner === "home"
                    ? home.shortName
                    : result.predictedWinner === "away"
                      ? away.shortName
                      : "Draw"
                } accent />
                <Pill label="Predicted score" value={result.predictedScore} />
                <Pill label="Confidence" value={`${result.confidence.toFixed(0)}%`} />
              </div>
            </Card>

            <Card>
              <p className="mb-3 text-sm font-medium">Key factors</p>
              <ul className="space-y-1.5 text-sm text-text-secondary">
                {result.keyFactors.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-text-muted">
                Phase 3 will replace these with SHAP-derived contributions
                (top-3 feature impacts mapped to plain English).
              </p>
            </Card>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Pill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-bg-elevated px-2 py-2">
      <p className="uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className={cn(
          "tabular mt-0.5 text-base font-semibold",
          accent && "text-accent",
        )}
      >
        {value}
      </p>
    </div>
  );
}
