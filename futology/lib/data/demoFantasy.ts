import { CLUBS } from "./clubs";
import { LEAGUES } from "./leagues";
import { PLAYERS } from "./players";

export type FantasyPosition = "GK" | "DEF" | "MID" | "FWD";

export type FantasyPlayer = {
  id: number;
  name: string;
  team: string;
  position: FantasyPosition;
  price: number; // £M (one decimal)
  predictedPoints: number;
  form: number; // 0–10
  injuryRisk: number; // 0–1
  ownership: number; // 0–100
};

const PRICE_BY_POSITION: Record<FantasyPosition, [number, number]> = {
  GK: [4.0, 5.5],
  DEF: [4.0, 6.5],
  MID: [4.5, 13.0],
  FWD: [5.0, 14.0],
};

function seeded(seed: number) {
  let s = (seed * 33554393) % 4294967296;
  if (s < 0) s += 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function priceFor(position: FantasyPosition, rnd: () => number): number {
  const [lo, hi] = PRICE_BY_POSITION[position];
  return Number((lo + rnd() * (hi - lo)).toFixed(1));
}

/**
 * Pool of fantasy-league candidates with seeded prices and projected
 * points. Built from real player IDs in `players.ts` plus filler
 * synthetic entries to hit a usable squad-builder pool size.
 */
export const FANTASY_POOL: readonly FantasyPlayer[] = (() => {
  const out: FantasyPlayer[] = [];
  // Use seeded star players first
  for (const p of PLAYERS) {
    const rnd = seeded(p.id);
    const price = priceFor(p.position, rnd);
    const form = Number((4 + rnd() * 6).toFixed(1));
    out.push({
      id: p.id,
      name: p.name,
      team: p.team,
      position: p.position,
      price,
      predictedPoints: Number(((price * 1.6) + form * 4 + rnd() * 8).toFixed(1)),
      form,
      injuryRisk: Number((rnd() * 0.3).toFixed(2)),
      ownership: Number((rnd() * 100).toFixed(0)),
    });
  }
  // Pad with a generic pool from CLUBS so positional constraints are satisfiable
  const positions: FantasyPosition[] = ["GK", "DEF", "DEF", "DEF", "MID", "MID", "FWD"];
  let nextId = 9_000_000;
  for (const club of CLUBS) {
    for (const pos of positions) {
      const rnd = seeded(club.id * 13 + pos.charCodeAt(0));
      const price = priceFor(pos, rnd);
      const form = Number((3 + rnd() * 6).toFixed(1));
      const league = LEAGUES.find((l) => l.id === club.leagueId);
      out.push({
        id: nextId++,
        name: `${club.shortName} ${pos}${nextId % 5}`,
        team: club.shortName,
        position: pos,
        price,
        predictedPoints: Number(((price * 1.4) + form * 3 + rnd() * 6).toFixed(1)),
        form,
        injuryRisk: Number((rnd() * 0.35).toFixed(2)),
        ownership: Number((rnd() * 80).toFixed(0)),
      });
      // Quietly use the league reference so it isn't a wasted lookup
      if (!league) continue;
    }
  }
  return out;
})();

export type FantasyConstraints = {
  budget: number; // £M
  formation: { GK: number; DEF: number; MID: number; FWD: number };
  risk: "safe" | "balanced" | "bold";
};

/** Five formation presets selectable in the Fantasy IQ UI. */
export const FORMATIONS: Record<string, FantasyConstraints["formation"]> = {
  "4-4-2": { GK: 1, DEF: 4, MID: 4, FWD: 2 },
  "4-3-3": { GK: 1, DEF: 4, MID: 3, FWD: 3 },
  "3-5-2": { GK: 1, DEF: 3, MID: 5, FWD: 2 },
  "3-4-3": { GK: 1, DEF: 3, MID: 4, FWD: 3 },
  "5-3-2": { GK: 1, DEF: 5, MID: 3, FWD: 2 },
};

export type OptimizedSquad = {
  starters: FantasyPlayer[];
  bench: FantasyPlayer[];
  captain: FantasyPlayer;
  totalCost: number;
  predictedPoints: number;
  differentialPicks: FantasyPlayer[];
};

const SQUAD_QUOTA: Record<FantasyPosition, number> = { GK: 2, DEF: 5, MID: 5, FWD: 3 };

function score(player: FantasyPlayer, risk: FantasyConstraints["risk"]): number {
  // Weight predicted points by injury risk and price-to-points ratio. Risk
  // tolerance shifts how much we penalize injury risk and how much weight we
  // give to ownership (bold = lower ownership / higher upside).
  const safety = 1 - player.injuryRisk * (risk === "safe" ? 1.5 : risk === "bold" ? 0.5 : 1);
  const valueRatio = player.predictedPoints / player.price;
  const ownershipModifier =
    risk === "bold" ? 1 + (50 - player.ownership) / 100 : 1;
  return (
    player.predictedPoints * safety * 0.6 +
    valueRatio * 1.2 +
    (player.form / 10) * 1.5 * ownershipModifier
  );
}

/**
 * Greedy demo solver for the fantasy squad. Respects the bible §9.4
 * constraints — 15 players, 2 GK / 5 DEF / 5 MID / 3 FWD, max 3 per
 * club, budget cap. Risk tolerance biases the picker toward safer or
 * more differential players.
 *
 * Cutover: replaced by a `fetch` to the FastAPI ML service which runs a
 * proper integer linear programme via PuLP. The return shape is the
 * same so the UI doesn't change.
 */
export function optimizeFantasy(
  pool: readonly FantasyPlayer[],
  constraints: FantasyConstraints,
): OptimizedSquad | null {
  const ranked = [...pool].sort(
    (a, b) => score(b, constraints.risk) - score(a, constraints.risk),
  );
  // Greedy fill respecting quota of 15 (2 GK / 5 DEF / 5 MID / 3 FWD), max 3 from any club, budget.
  const squad: FantasyPlayer[] = [];
  const byPosition: Record<FantasyPosition, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
  const byClub = new Map<string, number>();
  let cost = 0;

  for (const p of ranked) {
    if (squad.length === 15) break;
    if (byPosition[p.position] >= SQUAD_QUOTA[p.position]) continue;
    if ((byClub.get(p.team) ?? 0) >= 3) continue;
    if (cost + p.price > constraints.budget) continue;
    squad.push(p);
    byPosition[p.position] += 1;
    byClub.set(p.team, (byClub.get(p.team) ?? 0) + 1);
    cost += p.price;
  }

  if (squad.length < 15) return null;

  // Pick starters per formation
  const starters: FantasyPlayer[] = [];
  for (const pos of ["GK", "DEF", "MID", "FWD"] as FantasyPosition[]) {
    const need = constraints.formation[pos];
    const ofPos = squad
      .filter((p) => p.position === pos)
      .sort((a, b) => b.predictedPoints - a.predictedPoints)
      .slice(0, need);
    starters.push(...ofPos);
  }
  const bench = squad.filter((p) => !starters.includes(p));
  const captain = [...starters].sort(
    (a, b) => b.predictedPoints - a.predictedPoints,
  )[0];

  // Differentials: low ownership + decent points
  const differentials = [...pool]
    .filter((p) => p.ownership < 15 && p.predictedPoints > 5)
    .sort((a, b) => b.predictedPoints - a.predictedPoints)
    .slice(0, 3);

  return {
    starters,
    bench,
    captain,
    totalCost: Number(cost.toFixed(1)),
    predictedPoints: Number(
      (
        starters.reduce((acc, p) => acc + p.predictedPoints, 0) +
        captain.predictedPoints
      ).toFixed(1),
    ),
    differentialPicks: differentials,
  };
}
