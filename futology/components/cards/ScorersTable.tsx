"use client";

import type { ScorerRow } from "@/lib/data/demoScorers";

type Props = {
  rows: ScorerRow[];
};

/**
 * League top-scorers chart. Goals are the headline column; assists,
 * penalties and appearances sit behind responsive breakpoints so the table
 * stays readable on mobile. Mirrors `StandingsTable`'s look and feel.
 */
export function ScorersTable({ rows }: Props) {
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
              <th className="py-2 pl-3 pr-1 text-left">#</th>
              <th className="py-2 pr-2 text-left">Player</th>
              <th className="py-2 pr-2 text-left">Team</th>
              <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">Pld</th>
              <th className="hidden py-2 pr-2 text-right tabular md:table-cell">Pen</th>
              <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">A</th>
              <th className="py-2 pr-3 text-right tabular">G</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.playerId}
                className="border-b border-border last:border-b-0 transition-colors hover:bg-bg-elevated"
              >
                <td className="tabular py-2 pl-3 pr-1 text-text-secondary">
                  {row.rank}
                </td>
                <td className="py-2 pr-2">
                  <span className="truncate font-medium">{row.playerName}</span>
                </td>
                <td className="py-2 pr-2 text-text-secondary">
                  <span className="truncate">{row.teamName}</span>
                </td>
                <td className="tabular hidden py-2 pr-2 text-right text-text-secondary sm:table-cell">
                  {row.playedMatches}
                </td>
                <td className="tabular hidden py-2 pr-2 text-right text-text-secondary md:table-cell">
                  {row.penalties}
                </td>
                <td className="tabular hidden py-2 pr-2 text-right text-text-secondary sm:table-cell">
                  {row.assists}
                </td>
                <td className="tabular py-2 pr-3 text-right font-semibold text-accent">
                  {row.goals}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
