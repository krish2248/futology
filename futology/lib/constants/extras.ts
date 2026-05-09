import {
  Activity,
  Crown,
  CloudRain,
  Gavel,
  Flame,
  Stethoscope,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

export type ExtraFeature = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  status: "ready" | "soon";
};

/**
 * Phase 6 wishlist features. Each entry has a stable `slug` that powers
 * the deep-link route under `/intelligence/extras/<slug>`. The `status`
 * field marks whether the feature is shipped or queued — the Extras hub
 * UI uses it to dim out unfinished cards.
 */
export const EXTRA_FEATURES: readonly ExtraFeature[] = [
  {
    slug: "tournament-simulator",
    title: "Tournament Simulator",
    tagline: "Monte Carlo · 10,000 sims",
    description:
      "Run 10,000 bracket simulations over a knockout tournament. See each team's advancement probability and final-winner odds.",
    icon: Crown,
    status: "ready",
  },
  {
    slug: "momentum",
    title: "Match Momentum",
    tagline: "Rolling 5-min xG",
    description:
      "Track in-game momentum minute by minute with a 5-minute rolling xG window. Spot the swing moments.",
    icon: Activity,
    status: "ready",
  },
  {
    slug: "press-intensity",
    title: "Press Intensity",
    tagline: "PPDA · pitch heatmap",
    description:
      "PPDA per team and a pitch heatmap of where they apply pressure. Drill into any club to see their pressing style.",
    icon: Flame,
    status: "ready",
  },
  {
    slug: "referee-bias",
    title: "Referee Bias",
    tagline: "Cards · big-game effect",
    description:
      "Average cards per match per referee, with a big-game comparison toggle so you can see who tightens up under pressure.",
    icon: Gavel,
    status: "ready",
  },
  {
    slug: "weather",
    title: "Weather Impact",
    tagline: "Open-Meteo-style buckets",
    description:
      "Home-win rate split by weather: rain / heat / wind / clear. Filter by league and competition tier.",
    icon: CloudRain,
    status: "ready",
  },
  {
    slug: "injuries",
    title: "Injury Intelligence",
    tagline: "Squad · predicted impact",
    description:
      "Per-team injury list with predicted impact on goals/90 and clean-sheet probability, sorted by overall hit.",
    icon: Stethoscope,
    status: "ready",
  },
  {
    slug: "odds",
    title: "Odds Movement",
    tagline: "Implied prob shifts",
    description:
      "Opening vs current odds across upcoming and live fixtures. Implied-probability swings ≥ 12 pp escalate to alerts.",
    icon: AlertCircle,
    status: "ready",
  },
] as const;
