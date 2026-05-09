import { getDemoMatches, type DemoMatch } from "./demoMatches";

export type OddsSnapshot = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export type OddsMovement = {
  fixtureId: number;
  match: DemoMatch;
  opening: OddsSnapshot;
  current: OddsSnapshot;
  bookmaker: string;
  // Implied probability shifts (percentage points)
  shift: { home: number; draw: number; away: number };
  // Largest absolute shift across the three outcomes
  maxShift: number;
  // Direction the line moved in: home / draw / away
  movedTo: "home" | "draw" | "away";
  severity: "info" | "watch" | "alert";
  takeRate: number; // share of bets on the strengthened outcome
  alerts: string[];
};

const BOOKMAKERS = [
  "Pinnacle",
  "Betfair Exchange",
  "DraftKings",
  "Bet365",
  "Sportsbet",
];

function s(seed: number) {
  let v = (seed * 9176999) % 4294967296;
  if (v < 0) v += 4294967296;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

function impliedProb(odds: OddsSnapshot): { home: number; draw: number; away: number } {
  const inv = 1 / odds.homeWin + 1 / odds.draw + 1 / odds.awayWin;
  return {
    home: 1 / odds.homeWin / inv,
    draw: 1 / odds.draw / inv,
    away: 1 / odds.awayWin / inv,
  };
}

function generateOpening(rnd: () => number): OddsSnapshot {
  const homeBase = 2 + rnd() * 3.5;
  const drawBase = 3.0 + rnd() * 1.6;
  const awayBase = 2 + rnd() * 3.8;
  return {
    homeWin: Number(homeBase.toFixed(2)),
    draw: Number(drawBase.toFixed(2)),
    awayWin: Number(awayBase.toFixed(2)),
  };
}

function shiftedFromOpening(
  opening: OddsSnapshot,
  rnd: () => number,
): { current: OddsSnapshot; movedTo: "home" | "draw" | "away" } {
  const r = rnd();
  const drift = 0.85 + rnd() * 0.3;
  if (r < 0.45) {
    return {
      current: {
        homeWin: Number(Math.max(1.2, opening.homeWin / drift).toFixed(2)),
        draw: Number((opening.draw * (1 + (rnd() - 0.5) * 0.05)).toFixed(2)),
        awayWin: Number((opening.awayWin * (1 + (rnd() - 0.5) * 0.1)).toFixed(2)),
      },
      movedTo: "home",
    };
  }
  if (r < 0.78) {
    return {
      current: {
        homeWin: Number((opening.homeWin * (1 + (rnd() - 0.5) * 0.1)).toFixed(2)),
        draw: Number((opening.draw * (1 + (rnd() - 0.5) * 0.05)).toFixed(2)),
        awayWin: Number(Math.max(1.2, opening.awayWin / drift).toFixed(2)),
      },
      movedTo: "away",
    };
  }
  return {
    current: {
      homeWin: Number((opening.homeWin * (1 + (rnd() - 0.5) * 0.1)).toFixed(2)),
      draw: Number(Math.max(2.4, opening.draw / drift).toFixed(2)),
      awayWin: Number((opening.awayWin * (1 + (rnd() - 0.5) * 0.1)).toFixed(2)),
    },
    movedTo: "draw",
  };
}

function severityFromShift(maxShift: number): OddsMovement["severity"] {
  if (maxShift >= 12) return "alert";
  if (maxShift >= 7) return "watch";
  return "info";
}

/**
 * Generates opening + current odds across 5 bookmakers per upcoming or
 * live fixture. Severity (`alert` / `watch` / `info`) escalates when
 * implied probability shifts ≥ 12 percentage points — that's the cue
 * the Odds Movement Alert page surfaces.
 */
export function getDemoOdds(): OddsMovement[] {
  const candidates = getDemoMatches().filter((m) => m.status !== "finished");
  return candidates.map((match) => {
    const rnd = s(match.id * 53 + match.leagueId);
    const opening = generateOpening(rnd);
    const { current, movedTo } = shiftedFromOpening(opening, rnd);
    const o = impliedProb(opening);
    const c = impliedProb(current);
    const shift = {
      home: (c.home - o.home) * 100,
      draw: (c.draw - o.draw) * 100,
      away: (c.away - o.away) * 100,
    };
    const maxShift = Math.max(
      Math.abs(shift.home),
      Math.abs(shift.draw),
      Math.abs(shift.away),
    );
    const severity = severityFromShift(maxShift);
    const takeRate = Math.min(95, Math.max(40, 50 + maxShift * 1.6));
    const alerts: string[] = [];
    if (severity === "alert") {
      alerts.push("Sharp move detected — sustained line drift across multiple books.");
    }
    if (severity !== "info" && match.status === "live") {
      alerts.push("In-play repricing — check lineup or VAR news.");
    }
    if (movedTo === "draw" && severity !== "info") {
      alerts.push("Draw money rare in size — investigate weather / starter changes.");
    }
    return {
      fixtureId: match.id,
      match,
      opening,
      current,
      bookmaker: BOOKMAKERS[Math.floor(rnd() * BOOKMAKERS.length)],
      shift,
      maxShift: Number(maxShift.toFixed(1)),
      movedTo,
      severity,
      takeRate: Number(takeRate.toFixed(0)),
      alerts,
    };
  });
}

export const SEVERITY_COLOR: Record<OddsMovement["severity"], string> = {
  info: "#A1A1A1",
  watch: "#F5A623",
  alert: "#FF3B3B",
};

export const SEVERITY_LABEL: Record<OddsMovement["severity"], string> = {
  info: "Info",
  watch: "Watch",
  alert: "Alert",
};
