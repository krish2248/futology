"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Coins, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { PlayerPicker } from "@/components/intelligence/PlayerPicker";
import {
  formatEUR,
  formatEURSigned,
  type TransferValuation,
} from "@/lib/ml/transfer";
import { predictTransferValueAuto } from "@/lib/ml/transferClient";
import { type PlayerStatLine } from "@/lib/data/demoPlayerStats";
import { cn } from "@/lib/utils/cn";

export function TransferOracleView() {
  const [player, setPlayer] = useState<PlayerStatLine | null>(null);
  const [valuation, setValuation] = useState<TransferValuation | null>(null);

  useEffect(() => {
    if (!player) {
      setValuation(null);
      return;
    }
    let cancelled = false;
    predictTransferValueAuto(player)
      .then((v) => {
        if (!cancelled) setValuation(v);
      })
      .catch(() => {
        if (!cancelled) setValuation(null);
      });
    return () => {
      cancelled = true;
    };
  }, [player]);

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Intelligence Hub
      </Link>
      <PageHeader
        title="Transfer Oracle"
        description="XGBoost regression on log(market_value_eur) with SHAP explanations. Demo seeds in place; FBref + Transfermarkt training in Phase 3."
      />

      <Card className="space-y-3">
        <PlayerPicker
          label="Player"
          selected={player}
          onSelect={setPlayer}
        />
        <p className="text-[11px] text-text-muted">
          Pick a player. We&apos;ll predict their market value with low/high
          confidence band and break down the top SHAP-style factors.
        </p>
      </Card>

      <AnimatePresence>
        {valuation && player ? (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="space-y-4"
          >
            <Card>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  <Coins className="h-3 w-3" aria-hidden /> Predicted value
                </span>
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  80% band
                </span>
              </div>
              <p className="tabular mt-3 text-4xl font-bold tracking-tight md:text-5xl">
                {formatEUR(valuation.predictedValueEur)}
              </p>
              <ConfidenceBand
                low={valuation.lowEstimate}
                value={valuation.predictedValueEur}
                high={valuation.highEstimate}
              />
              <p className="mt-2 text-xs text-text-secondary">
                {player.name} · {player.team} · {player.position}
              </p>
            </Card>

            <Card>
              <p className="mb-3 text-sm font-medium">Top factors (SHAP)</p>
              <ul className="space-y-2">
                {valuation.shapFactors.map((f) => {
                  const positive = f.contribution > 0;
                  const max = Math.max(
                    ...valuation.shapFactors.map((x) => Math.abs(x.contribution)),
                  );
                  const pct = (Math.abs(f.contribution) / max) * 100;
                  return (
                    <li key={f.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate text-text-secondary">{f.label}</span>
                        <span
                          className={cn(
                            "tabular font-medium",
                            positive ? "text-accent" : "text-live",
                          )}
                        >
                          {formatEURSigned(f.contribution)}
                        </span>
                      </div>
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            positive ? "bg-accent" : "bg-live",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] text-text-muted">
                Phase 3 swaps these heuristics for real SHAP TreeExplainer
                outputs from the trained XGBoost regressor.
              </p>
            </Card>

            <Card>
              <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
                <Users className="h-4 w-4 text-text-secondary" aria-hidden />{" "}
                Comparable players
              </p>
              <ul className="space-y-1.5">
                {valuation.comparablePlayers.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 rounded-md bg-bg-elevated px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {c.name}
                    </span>
                    <span className="truncate text-xs text-text-secondary">
                      {c.team}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ConfidenceBand({
  low,
  value,
  high,
}: {
  low: number;
  value: number;
  high: number;
}) {
  // Visualize a band with the predicted point centered
  return (
    <div className="mt-4 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-text-muted">
        <span className="tabular">{formatEUR(low)}</span>
        <span>predicted</span>
        <span className="tabular">{formatEUR(high)}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-bg-elevated">
        <div
          className="absolute h-full rounded-full bg-accent/40"
          style={{
            left: 0,
            right: 0,
          }}
        />
        <div
          className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_3px_#0a0a0a]"
          style={{
            left: `${((value - low) / Math.max(1, high - low)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
