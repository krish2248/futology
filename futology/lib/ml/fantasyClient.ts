import {
  optimizeFantasy,
  type FantasyConstraints,
  type FantasyPlayer,
  type OptimizedSquad,
} from "@/lib/data/demoFantasy";

const FORMATION_KEYS = [
  "3-4-3",
  "3-5-2",
  "4-3-3",
  "4-4-2",
  "4-5-1",
  "5-3-2",
  "5-4-1",
] as const;
type FormationKey = (typeof FORMATION_KEYS)[number];

function formationKey(
  formation: FantasyConstraints["formation"],
): FormationKey {
  const candidate = `${formation.DEF}-${formation.MID}-${formation.FWD}`;
  return (FORMATION_KEYS as readonly string[]).includes(candidate)
    ? (candidate as FormationKey)
    : "4-3-3";
}

type RemoteSquadPick = {
  id: number;
  name: string;
  team: string;
  position: FantasyPlayer["position"];
  price: number;
  predictedPoints: number;
  isStarter: boolean;
  isCaptain: boolean;
};

type RemoteFantasyResponse = {
  formation: string;
  budget: number;
  totalCost: number;
  remainingBudget: number;
  predictedTotalPoints: number;
  squad: RemoteSquadPick[];
  startingXiIds: number[];
  benchOrderIds: number[];
  captainId: number;
  differentials: RemoteSquadPick[];
  solverStatus: string;
};

/**
 * Routes the fantasy squad optimisation to the FastAPI ML service
 * (`POST /fantasy-optimize`) when `NEXT_PUBLIC_ML_API_URL` is
 * configured, otherwise falls back to the greedy
 * `optimizeFantasy(pool, constraints)` in the demo data layer.
 *
 * The remote service runs a real integer linear program (PuLP + CBC
 * solver) — same constraints (budget, 2/5/5/3, max 3 per club), but
 * a genuine optimum instead of greedy. The return shape
 * (`OptimizedSquad | null`) is identical so consumers don't change.
 */
export async function optimizeFantasyAuto(
  pool: readonly FantasyPlayer[],
  constraints: FantasyConstraints,
): Promise<OptimizedSquad | null> {
  const baseUrl = process.env.NEXT_PUBLIC_ML_API_URL;
  if (!baseUrl) {
    return optimizeFantasy(pool, constraints);
  }

  const url = baseUrl.replace(/\/+$/, "") + "/fantasy-optimize";
  const token = process.env.NEXT_PUBLIC_ML_API_TOKEN;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      budget: constraints.budget,
      formation: formationKey(constraints.formation),
      riskTolerance: constraints.risk,
      candidates: pool.map((p) => ({
        id: p.id,
        name: p.name,
        team: p.team,
        position: p.position,
        price: p.price,
        predictedPoints: p.predictedPoints,
        form: p.form,
        injuryRisk: p.injuryRisk,
      })),
    }),
  });

  if (!res.ok) {
    // Empty candidate pool or infeasibility -> null so the UI shows
    // the "no squad" empty state, same as the local greedy.
    if (res.status === 422) return null;
    throw new Error(
      `ML fantasy service responded ${res.status} ${res.statusText}.`,
    );
  }

  const remote = (await res.json()) as RemoteFantasyResponse;

  // Hydrate the remote picks back into the front-end's FantasyPlayer
  // shape by joining on `id` (extra fields like `ownership` come from
  // the local pool, which the user sent in the request).
  const byId = new Map(pool.map((p) => [p.id, p]));
  const hydrate = (pick: RemoteSquadPick): FantasyPlayer =>
    byId.get(pick.id) ?? {
      id: pick.id,
      name: pick.name,
      team: pick.team,
      position: pick.position,
      price: pick.price,
      predictedPoints: pick.predictedPoints,
      form: 5,
      injuryRisk: 0,
      ownership: 0,
    };

  const starterIds = new Set(remote.startingXiIds);
  const starters: FantasyPlayer[] = [];
  const bench: FantasyPlayer[] = [];
  for (const pick of remote.squad) {
    (starterIds.has(pick.id) ? starters : bench).push(hydrate(pick));
  }

  const captain = hydrate(
    remote.squad.find((p) => p.id === remote.captainId) ?? remote.squad[0],
  );
  const differentialPicks = remote.differentials.map(hydrate);

  return {
    starters,
    bench,
    captain,
    totalCost: remote.totalCost,
    predictedPoints: remote.predictedTotalPoints,
    differentialPicks,
  };
}
