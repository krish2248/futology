import type { Metadata } from "next";
import { Target, Sparkles, Users, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";

export const metadata: Metadata = { title: "Predictions" };

const TABS = [
  { id: "ai", label: "AI Predictions", icon: Sparkles },
  { id: "mine", label: "My Predictions", icon: Target },
  { id: "leagues", label: "Leagues", icon: Users },
  { id: "community", label: "Community", icon: MessageCircle },
] as const;

export default function PredictionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictions"
        description="Pick scores, climb leaderboards, compare with the ML model."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Total" value="0" />
        <StatTile label="Correct" value="—" />
        <StatTile label="Points" value="0" />
        <StatTile label="Streak" value="0" />
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={
                i === 0
                  ? "inline-flex items-center gap-1.5 rounded-lg bg-accent-muted px-3 py-1.5 text-sm text-accent"
                  : "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </Card>

      <Card className="flex flex-col items-start gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
          <Sparkles className="h-3 w-3" aria-hidden /> ML
        </span>
        <p className="font-medium">AI predictions will surface here</p>
        <p className="text-sm text-text-secondary">
          Once Phase 3 trains the XGBoost match predictor, upcoming fixtures of
          your followed teams will appear with win-probability bars, predicted
          scores, and SHAP-powered key factors.
        </p>
      </Card>
    </div>
  );
}
