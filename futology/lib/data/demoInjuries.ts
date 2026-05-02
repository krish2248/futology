import { CLUBS, type ClubSeed } from "./clubs";

export type InjurySeverity = "minor" | "moderate" | "major";

export type Injury = {
  id: string;
  teamId: number;
  teamName: string;
  player: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  reason: string;
  severity: InjurySeverity;
  daysOut: number;
  expectedReturn: string; // ISO date
  // Per-90 contribution before injury — used to size the impact bar.
  goalsContribution: number;
  defenseContribution: number;
};

export type TeamInjuryImpact = {
  team: ClubSeed;
  injuries: Injury[];
  goalsImpactPer90: number;
  defenseImpactPer90: number;
  cleanSheetProbDelta: number; // -0.30..+0.05
};

const REASONS = [
  "Hamstring strain",
  "ACL tear",
  "Calf injury",
  "Ankle sprain",
  "Concussion protocol",
  "Knee ligament",
  "Achilles tendinopathy",
  "Back spasm",
  "Groin strain",
  "Illness",
  "Suspension (3 yellows)",
  "Suspension (red card)",
];

const POSITIONS: Array<"GK" | "DEF" | "MID" | "FWD"> = ["GK", "DEF", "MID", "FWD"];

const SEVERITY_DAYS: Record<InjurySeverity, [number, number]> = {
  minor: [3, 12],
  moderate: [14, 35],
  major: [60, 220],
};

function s(seed: number) {
  let v = (seed * 9301) % 4294967296;
  if (v < 0) v += 4294967296;
  return () => {
    v = (v * 1664525 + 1013904223) % 4294967296;
    return v / 4294967296;
  };
}

function inferSeverity(rnd: () => number): InjurySeverity {
  const r = rnd();
  if (r < 0.5) return "minor";
  if (r < 0.85) return "moderate";
  return "major";
}

function isoFromDays(daysOut: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOut);
  return d.toISOString().slice(0, 10);
}

export function getDemoInjuries(): TeamInjuryImpact[] {
  return CLUBS.map((club, idx) => {
    const rnd = s(club.id * 31 + idx);
    const count = Math.floor(rnd() * 5); // 0–4 injuries
    const injuries: Injury[] = Array.from({ length: count }, (_, i) => {
      const severity = inferSeverity(rnd);
      const [lo, hi] = SEVERITY_DAYS[severity];
      const daysOut = Math.floor(lo + rnd() * (hi - lo));
      const position = POSITIONS[Math.floor(rnd() * POSITIONS.length)];
      const goalsContribution =
        position === "FWD"
          ? 0.4 + rnd() * 0.6
          : position === "MID"
            ? 0.2 + rnd() * 0.4
            : rnd() * 0.15;
      const defenseContribution =
        position === "DEF" || position === "GK"
          ? 0.5 + rnd() * 0.5
          : rnd() * 0.2;
      return {
        id: `${club.id}-${i}`,
        teamId: club.id,
        teamName: club.shortName,
        player: `${club.shortName} ${position}${i + 1}`,
        position,
        reason: REASONS[Math.floor(rnd() * REASONS.length)],
        severity,
        daysOut,
        expectedReturn: isoFromDays(daysOut),
        goalsContribution: Number(goalsContribution.toFixed(2)),
        defenseContribution: Number(defenseContribution.toFixed(2)),
      };
    });
    const goalsImpact = injuries.reduce((acc, i) => acc + i.goalsContribution, 0);
    const defenseImpact = injuries.reduce((acc, i) => acc + i.defenseContribution, 0);
    return {
      team: club,
      injuries,
      goalsImpactPer90: Number(goalsImpact.toFixed(2)),
      defenseImpactPer90: Number(defenseImpact.toFixed(2)),
      cleanSheetProbDelta: Number((-defenseImpact * 0.06).toFixed(3)),
    };
  });
}

export const SEVERITY_COLOR: Record<InjurySeverity, string> = {
  minor: "#F5A623",
  moderate: "#FF8E3B",
  major: "#FF3B3B",
};

export const SEVERITY_LABEL: Record<InjurySeverity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
};
