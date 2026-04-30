"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Target,
  Users,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { EmptyState } from "@/components/shared/EmptyState";
import { PredictionCard } from "@/components/predictions/PredictionCard";
import { getDemoPredictions } from "@/lib/data/demoPredictions";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "ai", label: "AI Predictions", icon: Sparkles },
  { id: "mine", label: "My Predictions", icon: Target },
  { id: "leagues", label: "Leagues", icon: Users },
  { id: "community", label: "Community", icon: MessageCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function PredictionsView() {
  const [tab, setTab] = useState<TabId>("ai");
  const predictions = useMemo(() => getDemoPredictions().slice(0, 8), []);

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
        {TABS.map((option) => {
          const Icon = option.icon;
          const active = tab === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTab(option.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {option.label}
            </button>
          );
        })}
      </Card>

      {tab === "ai" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {predictions.map((p) => (
            <PredictionCard key={p.fixtureId} prediction={p} />
          ))}
        </div>
      ) : null}

      {tab === "mine" ? (
        <EmptyState
          icon={Target}
          title="You haven't picked any matches yet"
          description="Pick a winner and score for any upcoming match. Earn 3 points for an exact score, 1 for the right winner."
        />
      ) : null}

      {tab === "leagues" ? (
        <EmptyState
          icon={Users}
          title="Prediction leagues ship in Phase 5"
          description="Create or join private leagues, invite friends with a code, climb the leaderboard."
        />
      ) : null}

      {tab === "community" ? (
        <EmptyState
          icon={MessageCircle}
          title="Community polls and reactions ship in Phase 5"
          description="Live polls, trending predictions, and community accuracy leaders."
        />
      ) : null}
    </div>
  );
}
