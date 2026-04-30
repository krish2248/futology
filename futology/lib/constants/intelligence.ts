import {
  Sparkles,
  Users,
  Activity,
  Hexagon,
  Coins,
  Crown,
  type LucideIcon,
} from "lucide-react";

export type IntelFeature = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
};

export const INTEL_FEATURES: readonly IntelFeature[] = [
  {
    slug: "match",
    title: "Match Predictor",
    tagline: "XGBoost · SHAP",
    description:
      "Win probabilities, predicted score and plain-English explanations for any fixture.",
    icon: Sparkles,
  },
  {
    slug: "players",
    title: "Player Pulse",
    tagline: "KMeans · 6 styles",
    description:
      "Cluster scatter, player comparison radar and similar-player suggestions.",
    icon: Users,
  },
  {
    slug: "sentiment",
    title: "Sentiment Storm",
    tagline: "Reddit · live",
    description:
      "Live sentiment timeline, gauges and excitement meter sourced from match threads.",
    icon: Activity,
  },
  {
    slug: "tactics",
    title: "TacticBoard",
    tagline: "StatsBomb",
    description:
      "xG shot maps, pass networks, heatmaps and pressing intensity (PPDA).",
    icon: Hexagon,
  },
  {
    slug: "transfer",
    title: "Transfer Oracle",
    tagline: "XGBoost regressor",
    description:
      "Predicted market value with low/high band, SHAP factors and comparable players.",
    icon: Coins,
  },
  {
    slug: "fantasy",
    title: "Fantasy IQ",
    tagline: "Linear programming",
    description:
      "Optimize a 15-player squad against budget, formation and risk tolerance.",
    icon: Crown,
  },
] as const;
