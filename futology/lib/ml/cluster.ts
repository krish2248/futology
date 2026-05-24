import type { PlayerStatLine } from "@/lib/data/demoPlayerStats";
import { clusterById } from "@/lib/data/playerClusters";
import type { ClusterId } from "@/lib/data/playerClusters";

export type PlayerClusterResult = {
  name: string;
  clusterId: ClusterId;
  clusterName: string;
  color: string;
  pcaX: number;
  pcaY: number;
  confidence: number;
};

/**
 * Routes the player-cluster classification to the FastAPI ML service
 * (`POST /predict-player-cluster`) when `NEXT_PUBLIC_ML_API_URL` is
 * configured, otherwise reuses the seeded `PlayerStatLine.cluster`
 * already on the demo data layer.
 *
 * The demo fallback maps to the same `ClusterId` set the FastAPI
 * service returns — so the front-end never has to handle two shapes.
 */
export async function predictPlayerClusterAuto(
  player: PlayerStatLine,
): Promise<PlayerClusterResult> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl) {
    const profile = clusterById(player.cluster);
    return {
      name: player.name,
      clusterId: player.cluster,
      clusterName: profile.name,
      color: profile.color,
      // The local demo carries seeded "creativity" / "defensiveActivity"
      // axes 0-100; the FastAPI service returns PCA coords from a real
      // sklearn PCA. Convert the demo axes into the same -3..3 range
      // sklearn's PCA(2) usually spits out so the scatter looks
      // consistent across modes.
      pcaX: round3((player.creativity - 50) / 16),
      pcaY: round3((player.defensiveActivity - 50) / 16),
      confidence: 100,
    };
  }

  const url = baseUrl.replace(/\/+$/, "") + "/predict-player-cluster";
  const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: player.name,
      goals: player.goals,
      assists: player.assists,
      xG: player.xG,
      xA: player.xA,
      keyPasses: player.keyPasses,
      progressivePasses: player.progressivePasses,
      progressiveCarries: player.progressiveCarries,
      pressures: player.pressures,
      tacklesPlusInterceptions: player.tacklesPlusInterceptions,
      passAccuracy: player.passAccuracy,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `ML cluster service responded ${res.status} ${res.statusText}.`,
    );
  }

  return (await res.json()) as PlayerClusterResult;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
