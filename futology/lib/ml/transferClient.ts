import type { PlayerStatLine } from "@/lib/data/demoPlayerStats";
import { predictTransferValue, type TransferValuation } from "./transfer";

const ELITE_LEAGUE_IDS = new Set([39, 140, 135, 78, 61]);
const MAJOR_LEAGUE_IDS = new Set([253, 88, 94, 203]);

function leagueLevelFromTeam(team: string): number {
  // Best-effort heuristic — when the front-end has the player's club
  // id, swap this for a real lookup. Until then: any team whose name
  // matches a known elite club tag → tier 1, etc.
  const t = team.toLowerCase();
  if (
    t.includes("real madrid") || t.includes("barcelona") || t.includes("city") ||
    t.includes("liverpool") || t.includes("bayern") || t.includes("psg") ||
    t.includes("milan") || t.includes("inter") || t.includes("juve") ||
    t.includes("united") || t.includes("arsenal") || t.includes("chelsea") ||
    t.includes("dortmund")
  ) {
    return 1;
  }
  return 2;
}

/**
 * Routes the transfer-value prediction to the FastAPI ML service
 * (`POST /predict-transfer-value`) when `NEXT_PUBLIC_ML_API_URL` is
 * configured, otherwise falls back to the local seeded
 * `predictTransferValue` stub.
 *
 * The remote service uses an XGBoost quantile-regression triple
 * (median + p10 + p90) and SHAP for factor attribution; the local
 * stub uses additive heuristic factors. The return shape
 * (`TransferValuation`) is identical so callers can't tell which
 * served them.
 */
export async function predictTransferValueAuto(
  player: PlayerStatLine,
): Promise<TransferValuation> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl) {
    return predictTransferValue(player);
  }

  const url = baseUrl.replace(/\/+$/, "") + "/predict-transfer-value";
  const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Age isn't in the demo stat line; midfielder default at 26 keeps
  // the model on a sensible age-curve plateau until real ages land.
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: player.name,
      position: player.position === "GK" ? "GK" : player.position,
      age: 26,
      goalsPer90: player.goals,
      assistsPer90: player.assists,
      xGPer90: player.xG,
      xAPer90: player.xA,
      passAccuracy: player.passAccuracy,
      minutesPlayed: player.minutesPlayed,
      leagueLevel: leagueLevelFromTeam(player.team),
    }),
  });

  if (!res.ok) {
    throw new Error(
      `ML transfer service responded ${res.status} ${res.statusText}.`,
    );
  }

  const remote = (await res.json()) as {
    name: string;
    predictedValueEur: number;
    lowEstimate: number;
    highEstimate: number;
    shapFactors: { label: string; contribution: number }[];
  };

  // The remote service doesn't return comparable players yet (deferred
  // to v0.7 when a real player universe lands). Hold the local stub's
  // nearest-neighbour list so the Transfer Oracle's "comps" panel
  // still renders.
  const localComps = predictTransferValue(player).comparablePlayers;

  return {
    predictedValueEur: remote.predictedValueEur,
    lowEstimate: remote.lowEstimate,
    highEstimate: remote.highEstimate,
    shapFactors: remote.shapFactors,
    comparablePlayers: localComps,
  };
}
