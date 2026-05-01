"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Crown,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import {
  probability,
  runSimulation,
  UCL_R16,
  type SimResult,
} from "@/lib/ml/tournamentSim";
import { cn } from "@/lib/utils/cn";

const RUN_OPTIONS = [1_000, 5_000, 10_000, 25_000];

export function TournamentSimulatorView() {
  const [runs, setRuns] = useState(10_000);
  const [seed, setSeed] = useState(42);
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState(() => runSimulation(UCL_R16, runs, seed));

  function rerun(nextRuns: number) {
    setRuns(nextRuns);
    const nextSeed = Math.floor(Math.random() * 1_000_000);
    setSeed(nextSeed);
    startTransition(() => {
      setOutcome(runSimulation(UCL_R16, nextRuns, nextSeed));
    });
  }

  const champion = outcome.results[0];
  const finalists = outcome.results.slice(0, 4);

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence/extras"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Extras
      </Link>
      <PageHeader
        title="Tournament Simulator"
        description="Monte Carlo bracket simulation. ELO-based win probability with home-tilt; runs all knockout rounds and aggregates outcomes."
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <p className="text-xs uppercase tracking-wider text-text-secondary">
          Runs
        </p>
        <div className="flex flex-wrap gap-1.5">
          {RUN_OPTIONS.map((n) => {
            const active = runs === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => rerun(n)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-accent/60 bg-accent-muted text-accent"
                    : "border-border bg-bg-surface text-text-secondary hover:border-accent/40",
                )}
              >
                {n.toLocaleString()}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => rerun(runs)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", pending && "animate-spin")}
            aria-hidden
          />
          Re-run
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Most likely champion"
          value={champion?.team.shortName ?? "—"}
          hint={
            champion
              ? `${probability(champion.won, runs).toFixed(1)}% to win`
              : ""
          }
        />
        <StatTile
          label="Total simulations"
          value={runs.toLocaleString()}
          hint={`Seed #${seed}`}
        />
        <StatTile
          label="Teams"
          value={String(outcome.results.length)}
          hint="Round of 16"
        />
        <StatTile
          label="Average matches/run"
          value="15"
          hint="R16 + QF + SF + Final"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={`grid-${seed}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Advancement probabilities
          </h2>
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
                    <th className="py-2 pl-3 pr-2 text-left">Team</th>
                    <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">QF %</th>
                    <th className="py-2 pr-2 text-right tabular">SF %</th>
                    <th className="py-2 pr-2 text-right tabular">Final %</th>
                    <th className="py-2 pr-3 text-right tabular">Win %</th>
                  </tr>
                </thead>
                <tbody>
                  {outcome.results.map((r, i) => (
                    <Row key={r.team.id} result={r} runs={runs} rank={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      <section>
        <h2 className="mb-3 inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          <Trophy className="h-4 w-4 text-premium" aria-hidden /> Top 4 favorites
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {finalists.map((r, i) => (
            <Card key={r.team.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "tabular grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold",
                    i === 0
                      ? "bg-premium text-bg-primary"
                      : "bg-bg-elevated text-text-secondary",
                  )}
                >
                  {i + 1}
                </span>
                <p className="truncate font-medium">{r.team.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Mini label="Win" value={`${probability(r.won, runs).toFixed(1)}%`} accent />
                <Mini label="Final" value={`${probability(r.reachedFinal, runs).toFixed(1)}%`} />
                <Mini label="SF" value={`${probability(r.reachedSF, runs).toFixed(1)}%`} />
                <Mini label="QF" value={`${probability(r.reachedQF, runs).toFixed(1)}%`} />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Row({ result, runs, rank }: { result: SimResult; runs: number; rank: number }) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pl-3 pr-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="tabular w-5 shrink-0 text-text-muted"
          >
            {rank + 1}
          </span>
          <span className="truncate font-medium">{result.team.name}</span>
          {rank === 0 ? (
            <Crown className="ml-1 h-3 w-3 shrink-0 text-premium" aria-hidden />
          ) : null}
        </div>
      </td>
      <td className="hidden py-2 pr-2 text-right sm:table-cell">
        <ProbCell value={probability(result.reachedQF, runs)} />
      </td>
      <td className="py-2 pr-2 text-right">
        <ProbCell value={probability(result.reachedSF, runs)} />
      </td>
      <td className="py-2 pr-2 text-right">
        <ProbCell value={probability(result.reachedFinal, runs)} />
      </td>
      <td className="py-2 pr-3 text-right">
        <ProbCell value={probability(result.won, runs)} accent />
      </td>
    </tr>
  );
}

function ProbCell({ value, accent }: { value: number; accent?: boolean }) {
  return (
    <div className="ml-auto inline-flex flex-col items-end gap-0.5">
      <span
        className={cn(
          "tabular text-sm font-semibold",
          accent && value > 5 ? "text-accent" : "text-text-primary",
        )}
      >
        {value.toFixed(1)}%
      </span>
      <span
        aria-hidden
        className="block h-1 w-16 overflow-hidden rounded-full bg-bg-elevated"
      >
        <span
          className={cn("block h-full rounded-full", accent ? "bg-accent" : "bg-info/60")}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </span>
    </div>
  );
}

function Mini({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-bg-elevated px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p
        className={cn(
          "tabular mt-0.5 text-sm font-semibold",
          accent && "text-accent",
        )}
      >
        {value}
      </p>
    </div>
  );
}
