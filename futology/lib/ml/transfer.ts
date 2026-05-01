import type { PlayerStatLine } from "@/lib/data/demoPlayerStats";
import { nearestPlayers } from "@/lib/data/demoPlayerStats";

export type TransferFactor = {
  label: string;
  contribution: number; // EUR
};

export type TransferValuation = {
  predictedValueEur: number;
  lowEstimate: number;
  highEstimate: number;
  shapFactors: TransferFactor[];
  comparablePlayers: { id: number; name: string; team: string }[];
};

function seeded(seed: number) {
  let s = (seed * 374761393) % 4294967296;
  if (s < 0) s += 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const POSITION_BASE: Record<PlayerStatLine["position"], number> = {
  GK: 18_000_000,
  DEF: 28_000_000,
  MID: 42_000_000,
  FWD: 55_000_000,
};

export function predictTransferValue(
  player: PlayerStatLine,
): TransferValuation {
  const rnd = seeded(player.playerId);
  const base = POSITION_BASE[player.position];

  // Player-level adjustments derived from stats. These produce SHAP-style factors.
  const goalsBonus = player.goals * 18_000_000;
  const xGBonus = player.xG * 9_000_000;
  const assistsBonus = player.assists * 14_000_000;
  const passingBonus = (player.passAccuracy - 80) * 600_000;
  const pressingBonus = (player.pressures - 18) * 250_000;
  const minutesBonus = (player.minutesPlayed - 1500) * 4_000;

  // Composite predicted value with random jitter to keep it interesting
  const noise = (rnd() - 0.5) * 8_000_000;
  const predicted = Math.max(
    1_500_000,
    base +
      goalsBonus +
      xGBonus +
      assistsBonus +
      passingBonus +
      pressingBonus +
      minutesBonus +
      noise,
  );

  // 80% confidence band
  const low = Math.max(1_000_000, predicted * 0.78);
  const high = predicted * 1.18;

  const shapFactors: TransferFactor[] = [
    { label: `Goals/90 contribution (${player.goals.toFixed(2)})`, contribution: goalsBonus },
    { label: `xG/90 quality (${player.xG.toFixed(2)})`, contribution: xGBonus },
    { label: `Assists/90 (${player.assists.toFixed(2)})`, contribution: assistsBonus },
    { label: `Pass accuracy ${player.passAccuracy.toFixed(0)}% vs 80% baseline`, contribution: passingBonus },
    { label: `Pressing intensity (${player.pressures}/90)`, contribution: pressingBonus },
    { label: `Minutes played (${player.minutesPlayed.toLocaleString()})`, contribution: minutesBonus },
  ]
    .filter((f) => Math.abs(f.contribution) > 200_000)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 5);

  const comps = nearestPlayers(player, 3);
  return {
    predictedValueEur: Math.round(predicted),
    lowEstimate: Math.round(low),
    highEstimate: Math.round(high),
    shapFactors,
    comparablePlayers: comps.map((c) => ({ id: c.playerId, name: c.name, team: c.team })),
  };
}

export function formatEUR(value: number): string {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}K`;
  return `€${value}`;
}

export function formatEURSigned(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatEUR(Math.abs(value))}`;
}
