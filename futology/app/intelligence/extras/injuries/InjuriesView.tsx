"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Stethoscope, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import {
  getDemoInjuries,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  type Injury,
  type TeamInjuryImpact,
} from "@/lib/data/demoInjuries";
import { cn } from "@/lib/utils/cn";

export function InjuriesView() {
  const teams = useMemo(() => getDemoInjuries(), []);
  const totalInjuries = teams.reduce((acc, t) => acc + t.injuries.length, 0);
  const teamsWithInjuries = teams.filter((t) => t.injuries.length > 0);
  const sortedByImpact = useMemo(
    () =>
      [...teamsWithInjuries].sort(
        (a, b) =>
          b.goalsImpactPer90 + b.defenseImpactPer90 -
          (a.goalsImpactPer90 + a.defenseImpactPer90),
      ),
    [teamsWithInjuries],
  );

  const [selectedId, setSelectedId] = useState<number | null>(
    sortedByImpact[0]?.team.id ?? null,
  );
  const selected = teams.find((t) => t.team.id === selectedId);

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence/extras"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Extras
      </Link>
      <PageHeader
        title="Injury Intelligence"
        description="Per-team injury list with predicted impact on goals and clean sheets. Demo seed; bible Phase 6 cutover scrapes Premier-Injuries / Transfermarkt."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Active injuries"
          value={String(totalInjuries)}
          hint="Across all clubs"
        />
        <StatTile
          label="Affected clubs"
          value={String(teamsWithInjuries.length)}
        />
        <StatTile
          label="Most affected"
          value={sortedByImpact[0]?.team.shortName ?? "—"}
          hint={
            sortedByImpact[0]
              ? `${sortedByImpact[0].injuries.length} out`
              : ""
          }
        />
        <StatTile
          label="Avg impact"
          value={(
            teamsWithInjuries.reduce(
              (acc, t) => acc + t.goalsImpactPer90 + t.defenseImpactPer90,
              0,
            ) / Math.max(1, teamsWithInjuries.length)
          ).toFixed(2)}
          hint="Per affected club"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
        <Card className="max-h-[34rem] overflow-y-auto p-2">
          <ul className="space-y-1">
            {sortedByImpact.map((t) => {
              const active = t.team.id === selectedId;
              const totalImpact = t.goalsImpactPer90 + t.defenseImpactPer90;
              return (
                <li key={t.team.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.team.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-accent-muted"
                        : "hover:bg-bg-elevated",
                    )}
                  >
                    <span
                      aria-hidden
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-primary text-[10px] font-semibold text-text-secondary"
                    >
                      {t.team.shortName.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {t.team.name}
                      </span>
                      <span className="block truncate text-[11px] text-text-secondary">
                        {t.injuries.length} out · impact{" "}
                        <span className="tabular">{totalImpact.toFixed(2)}</span>
                      </span>
                    </span>
                    <ImpactDot impact={totalImpact} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected ? (
          <TeamPanel impact={selected} />
        ) : (
          <Card className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-text-muted" aria-hidden />
            <p className="text-sm text-text-secondary">
              No injuries to show. Pick a team from the list once data loads.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function TeamPanel({ impact }: { impact: TeamInjuryImpact }) {
  const totalImpact = impact.goalsImpactPer90 + impact.defenseImpactPer90;
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-muted">
              {impact.team.country}
            </p>
            <p className="text-base font-semibold">{impact.team.name}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
            <Stethoscope className="h-3 w-3" aria-hidden /> {impact.injuries.length} out
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Mini
            label="Goals impact / 90"
            value={impact.goalsImpactPer90.toFixed(2)}
            tone="warning"
          />
          <Mini
            label="Defense impact / 90"
            value={impact.defenseImpactPer90.toFixed(2)}
            tone="warning"
          />
          <Mini
            label="Clean sheet Δ"
            value={`${(impact.cleanSheetProbDelta * 100).toFixed(1)}pp`}
            tone="live"
          />
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
            <span>Total per-90 impact</span>
            <span className="tabular text-text-secondary">{totalImpact.toFixed(2)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div
              className="h-full bg-warning"
              style={{ width: `${Math.min(100, totalImpact * 25)}%` }}
            />
          </div>
        </div>
      </Card>

      {impact.injuries.length === 0 ? (
        <Card className="text-sm text-text-secondary">No active injuries.</Card>
      ) : (
        <Card className="space-y-2 p-3">
          <p className="px-2 pt-1 text-[11px] uppercase tracking-wider text-text-muted">
            Active injuries
          </p>
          <ul className="space-y-2">
            {impact.injuries
              .slice()
              .sort(
                (a, b) =>
                  severityRank(b.severity) - severityRank(a.severity) ||
                  b.daysOut - a.daysOut,
              )
              .map((inj) => (
                <InjuryRow key={inj.id} injury={inj} />
              ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function severityRank(s: "minor" | "moderate" | "major"): number {
  if (s === "major") return 3;
  if (s === "moderate") return 2;
  return 1;
}

function InjuryRow({ injury }: { injury: Injury }) {
  return (
    <li
      className="flex items-center gap-3 rounded-lg bg-bg-elevated px-3 py-2 text-sm"
    >
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-bg-primary"
        style={{ background: SEVERITY_COLOR[injury.severity] }}
      >
        {injury.position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{injury.player}</p>
        <p className="truncate text-[11px] text-text-secondary">
          {injury.reason} · {SEVERITY_LABEL[injury.severity]}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular text-sm font-semibold">{injury.daysOut}d</p>
        <p className="text-[10px] text-text-muted">return ~{injury.expectedReturn}</p>
      </div>
    </li>
  );
}

function ImpactDot({ impact }: { impact: number }) {
  const tone =
    impact > 1.5 ? "live" : impact > 0.7 ? "warning" : "text-secondary";
  const color =
    tone === "live" ? "#FF3B3B" : tone === "warning" ? "#F5A623" : "#A1A1A1";
  return (
    <span
      aria-hidden
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "live";
}) {
  const color =
    tone === "warning" ? "text-warning" : tone === "live" ? "text-live" : "text-accent";
  return (
    <div className="rounded-md bg-bg-elevated px-2 py-1.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn("tabular mt-0.5 text-sm font-semibold", color)}>
        {value}
      </p>
    </div>
  );
}
