import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "Clubs" };

export default function ClubsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubs"
        description="Followed clubs with form indicators and quick navigation."
      />
      <EmptyState
        icon={Shield}
        title="No clubs followed yet"
        description="In Phase 1 you'll follow clubs during onboarding. Phase 2 wires the club detail page (squad, fixtures, results, transfers, stats)."
      />
    </div>
  );
}
