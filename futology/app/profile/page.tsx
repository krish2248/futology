import type { Metadata } from "next";
import { User, Settings, LogIn } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage who you follow, your predictions and notifications."
      />

      <Card className="flex items-center gap-4">
        <div
          aria-hidden
          className="grid h-14 w-14 place-items-center rounded-full bg-bg-elevated text-text-secondary"
        >
          <User className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium">Guest</p>
          <p className="text-sm text-text-secondary">
            Sign in to follow leagues, save predictions and join leagues.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
        >
          <LogIn className="h-4 w-4" aria-hidden /> Sign in
        </button>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Predictions" value="0" />
        <StatTile label="Accuracy" value="—" />
        <StatTile label="Leagues" value="0" />
        <StatTile label="Following" value="0" />
      </div>

      <Card className="flex items-start gap-3">
        <div
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-bg-elevated text-text-secondary"
        >
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">Settings</p>
          <p className="mt-1 text-sm text-text-secondary">
            Notification preferences, account, theme (locked to dark) — wires up
            in Phase 5.
          </p>
        </div>
      </Card>
    </div>
  );
}
