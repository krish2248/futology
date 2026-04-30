"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type {
  StandingRow,
  StandingsBands,
} from "@/lib/data/demoStandings";
import { cn } from "@/lib/utils/cn";

type Props = {
  rows: StandingRow[];
  bands: StandingsBands;
};

function bandFor(position: number, total: number, bands: StandingsBands) {
  if (position <= bands.ucl) return "ucl";
  if (position <= bands.ucl + bands.uel) return "uel";
  if (position <= bands.ucl + bands.uel + bands.conference) return "conference";
  if (position > total - bands.relegation) return "relegation";
  return null;
}

const BAND_COLORS: Record<string, string> = {
  ucl: "bg-accent",
  uel: "bg-info",
  conference: "bg-info/40",
  relegation: "bg-live",
};

const BAND_LABELS: Array<{ key: keyof StandingsBands; label: string; color: string }> = [
  { key: "ucl", label: "Champions League", color: "bg-accent" },
  { key: "uel", label: "Europa League", color: "bg-info" },
  { key: "conference", label: "Conference League", color: "bg-info/40" },
  { key: "relegation", label: "Relegation", color: "bg-live" },
];

export function StandingsTable({ rows, bands }: Props) {
  const total = rows.length;
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
              <th className="py-2 pl-3 pr-1 text-left">#</th>
              <th className="py-2 pr-2 text-left">Team</th>
              <th className="py-2 pr-2 text-right tabular">P</th>
              <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">W</th>
              <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">D</th>
              <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">L</th>
              <th className="hidden py-2 pr-2 text-right tabular md:table-cell">GF</th>
              <th className="hidden py-2 pr-2 text-right tabular md:table-cell">GA</th>
              <th className="py-2 pr-2 text-right tabular">GD</th>
              <th className="py-2 pr-3 text-right tabular">Pts</th>
              <th className="hidden py-2 pl-2 pr-3 text-left lg:table-cell">Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const band = bandFor(row.position, total, bands);
              const change = row.prevPosition - row.position;
              return (
                <tr
                  key={row.teamId}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-bg-elevated"
                >
                  <td className="py-2 pl-3 pr-1">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "h-4 w-1 shrink-0 rounded",
                          band ? BAND_COLORS[band] : "bg-transparent",
                        )}
                      />
                      <span className="tabular text-text-secondary">
                        {row.position}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {row.teamName}
                      </span>
                      <PositionDelta change={change} />
                    </div>
                  </td>
                  <td className="tabular py-2 pr-2 text-right">
                    {row.played}
                  </td>
                  <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                    {row.won}
                  </td>
                  <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                    {row.drawn}
                  </td>
                  <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                    {row.lost}
                  </td>
                  <td className="tabular hidden py-2 pr-2 text-right md:table-cell">
                    {row.goalsFor}
                  </td>
                  <td className="tabular hidden py-2 pr-2 text-right md:table-cell">
                    {row.goalsAgainst}
                  </td>
                  <td
                    className={cn(
                      "tabular py-2 pr-2 text-right",
                      row.goalDifference > 0
                        ? "text-accent"
                        : row.goalDifference < 0
                          ? "text-live"
                          : "text-text-secondary",
                    )}
                  >
                    {row.goalDifference > 0
                      ? `+${row.goalDifference}`
                      : row.goalDifference}
                  </td>
                  <td className="tabular py-2 pr-3 text-right font-semibold">
                    {row.points}
                  </td>
                  <td className="hidden py-2 pl-2 pr-3 lg:table-cell">
                    <Form form={row.form} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Legend />
    </div>
  );
}

function PositionDelta({ change }: { change: number }) {
  if (change === 0) {
    return <Minus className="h-3.5 w-3.5 text-text-muted" aria-label="Unchanged" />;
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center text-accent" aria-label={`Up ${change}`}>
        <ArrowUp className="h-3.5 w-3.5" />
        <span className="tabular ml-0.5 text-[11px]">{change}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-live" aria-label={`Down ${-change}`}>
      <ArrowDown className="h-3.5 w-3.5" />
      <span className="tabular ml-0.5 text-[11px]">{-change}</span>
    </span>
  );
}

function Form({ form }: { form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          aria-label={r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}
          className={cn(
            "tabular grid h-5 w-5 place-items-center rounded text-[10px] font-semibold",
            r === "W"
              ? "bg-accent text-bg-primary"
              : r === "D"
                ? "bg-bg-elevated text-text-secondary"
                : "bg-live/30 text-live",
          )}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border bg-bg-primary/50 px-3 py-2 text-[11px] text-text-muted">
      {BAND_LABELS.map((b) => (
        <span key={b.key} className="inline-flex items-center gap-1.5">
          <span aria-hidden className={cn("h-2 w-2 rounded-sm", b.color)} />
          {b.label}
        </span>
      ))}
    </div>
  );
}
