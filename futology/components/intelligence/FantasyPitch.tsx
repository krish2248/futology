"use client";

import type { FantasyPlayer } from "@/lib/data/demoFantasy";
import { PitchSVG } from "@/components/intelligence/PitchSVG";
import { cn } from "@/lib/utils/cn";

type Props = {
  starters: FantasyPlayer[];
  captain: FantasyPlayer;
};

const ROW_Y: Record<string, number> = {
  GK: 92,
  DEF: 75,
  MID: 50,
  FWD: 22,
};

function placeRow(players: FantasyPlayer[], y: number): Array<FantasyPlayer & { x: number; y: number }> {
  const n = players.length;
  return players.map((p, i) => ({
    ...p,
    y,
    x: ((i + 1) / (n + 1)) * 100,
  }));
}

/**
 * Pitch view of the optimised fantasy XI.
 *
 * Players are slotted into rows by position (GK / DEF / MID / FWD), and
 * the captain gets the gold armband marker. Pure SVG so the component
 * adapts to mobile widths without external chart deps.
 */
export function FantasyPitch({ starters, captain }: Props) {
  const rows = (["GK", "DEF", "MID", "FWD"] as const).flatMap((pos) =>
    placeRow(
      starters.filter((p) => p.position === pos),
      ROW_Y[pos],
    ),
  );

  return (
    <PitchSVG className="aspect-[3/4] md:aspect-[2/3]">
      {rows.map((p) => {
        const isCaptain = p.id === captain.id;
        return (
          <span
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span
              aria-hidden
              className={cn(
                "tabular relative grid h-9 w-9 place-items-center rounded-full bg-accent text-[11px] font-bold text-bg-primary ring-2 ring-bg-primary",
              )}
            >
              {p.position}
              {isCaptain ? (
                <span
                  aria-label="Captain"
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-premium text-[9px] font-black text-bg-primary"
                >
                  C
                </span>
              ) : null}
            </span>
            <span className="mt-1 block w-24 truncate text-[11px] font-medium text-text-primary">
              {p.name}
            </span>
            <span className="tabular block text-[10px] text-text-secondary">
              £{p.price.toFixed(1)}m
            </span>
          </span>
        );
      })}
    </PitchSVG>
  );
}
