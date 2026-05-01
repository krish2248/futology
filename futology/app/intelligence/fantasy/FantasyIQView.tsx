"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Wand2,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { FantasyPitch } from "@/components/intelligence/FantasyPitch";
import {
  FANTASY_POOL,
  FORMATIONS,
  optimizeFantasy,
  type FantasyConstraints,
  type OptimizedSquad,
} from "@/lib/data/demoFantasy";
import { cn } from "@/lib/utils/cn";

export function FantasyIQView() {
  const [budget, setBudget] = useState(100);
  const [formationKey, setFormationKey] = useState<keyof typeof FORMATIONS>("4-3-3");
  const [risk, setRisk] = useState<FantasyConstraints["risk"]>("balanced");
  const [copied, setCopied] = useState(false);

  const squad = useMemo<OptimizedSquad | null>(
    () =>
      optimizeFantasy(FANTASY_POOL, {
        budget,
        formation: FORMATIONS[formationKey],
        risk,
      }),
    [budget, formationKey, risk],
  );

  function copyToClipboard() {
    if (!squad || typeof navigator === "undefined") return;
    const lines = [
      `FUTOLOGY Fantasy Squad — ${formationKey} · ${risk}`,
      ...squad.starters.map(
        (p) => `${p.position} · ${p.name} (${p.team}) · £${p.price.toFixed(1)}m${p.id === squad.captain.id ? " (C)" : ""}`,
      ),
      ...squad.bench.map(
        (p) => `BEN · ${p.name} (${p.team}) · £${p.price.toFixed(1)}m`,
      ),
      `Total cost £${squad.totalCost.toFixed(1)}m · Predicted ${squad.predictedPoints.toFixed(1)} pts`,
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        title="Fantasy IQ"
        description="Greedy demo solver maximizes predicted points under squad/club/budget constraints. Phase 3 swaps in PuLP linear programming."
      />

      <Card className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-text-secondary">
              Budget
            </span>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="range"
                min={80}
                max={105}
                step={0.5}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="flex-1 accent-[#00D563]"
              />
              <span className="tabular w-16 text-right font-medium">
                £{budget.toFixed(1)}m
              </span>
            </div>
          </label>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Formation
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {Object.keys(FORMATIONS).map((k) => {
              const active = formationKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setFormationKey(k as keyof typeof FORMATIONS)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "border-accent/60 bg-accent-muted text-accent"
                      : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
                  )}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-text-secondary">
            Risk tolerance
          </p>
          <div className="mt-1 flex gap-1.5">
            {(["safe", "balanced", "bold"] as const).map((r) => {
              const active = risk === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRisk(r)}
                  aria-pressed={active}
                  className={cn(
                    "flex-1 rounded-full border px-2.5 py-1 text-xs capitalize transition-colors",
                    active
                      ? "border-accent/60 bg-accent-muted text-accent"
                      : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {squad ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile
              label="Predicted points"
              value={squad.predictedPoints.toFixed(1)}
              hint="Includes captain bonus"
            />
            <StatTile
              label="Total cost"
              value={`£${squad.totalCost.toFixed(1)}m`}
              hint={`${(budget - squad.totalCost).toFixed(1)}m left`}
            />
            <StatTile
              label="Captain"
              value={squad.captain.name.split(" ").slice(-1)[0]}
              hint={`+${squad.captain.predictedPoints.toFixed(1)} pts`}
            />
            <StatTile
              label="Formation"
              value={formationKey}
              hint={`${risk}`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">Starting XI</p>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Copied
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" /> Export squad
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              <FantasyPitch starters={squad.starters} captain={squad.captain} />
            </Card>

            <div className="space-y-3">
              <Card>
                <p className="mb-2 text-sm font-medium">Bench</p>
                <ul className="space-y-1.5">
                  {squad.bench.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-md bg-bg-elevated px-2 py-1.5 text-xs"
                    >
                      <span className="tabular w-8 shrink-0 text-text-muted">
                        {p.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {p.name}
                      </span>
                      <span className="tabular text-text-secondary">
                        £{p.price.toFixed(1)}m
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium">
                  <Crown className="h-4 w-4 text-premium" aria-hidden /> Differentials
                </p>
                <p className="mb-2 text-xs text-text-secondary">
                  Low ownership, high upside.
                </p>
                <ul className="space-y-1.5">
                  {squad.differentialPicks.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-md bg-bg-elevated px-2 py-1.5 text-xs"
                    >
                      <span className="tabular w-8 shrink-0 text-text-muted">
                        {p.position}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {p.name}
                      </span>
                      <span className="tabular text-text-secondary">
                        {p.ownership.toFixed(0)}% own
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <Card className="flex items-start gap-3">
          <Wand2 className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
          <div>
            <p className="font-medium">No valid squad found</p>
            <p className="mt-1 text-sm text-text-secondary">
              Try a higher budget or a different risk tolerance — the demo
              solver couldn&apos;t fit a 15-player squad under the current
              constraints.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
