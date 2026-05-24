"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { LiveStrip } from "@/components/cards/MatchCard";
import { LiveBadge } from "@/components/shared/LiveBadge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useLiveScores } from "@/hooks/useLiveScores";

const MatchDetailSheet = dynamic(
  () =>
    import("@/components/cards/MatchDetailSheet").then((m) => m.MatchDetailSheet),
  { ssr: false },
);

export function HomeLive() {
  const [openId, setOpenId] = useState<number | null>(null);
  const { data, isLoading } = useLiveScores();
  const live = data ?? [];

  return (
    <section>
      <PageHeader
        title="Live now"
        description={
          isLoading
            ? "Checking for live matches…"
            : live.length > 0
              ? `${live.length} match${live.length === 1 ? "" : "es"} in progress.`
              : "No live matches right now. Check back at kickoff."
        }
        action={live.length > 0 ? <LiveBadge /> : null}
      />
      {isLoading ? (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 w-72 shrink-0" />
          ))}
        </div>
      ) : live.length > 0 ? (
        <LiveStrip matches={live} onSelect={(m) => setOpenId(m.id)} />
      ) : (
        <Card className="flex flex-col items-start gap-2">
          <p className="text-sm text-text-secondary">
            Nothing live. Browse upcoming fixtures instead.
          </p>
          <Link
            href="/scores"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            See upcoming fixtures →
          </Link>
        </Card>
      )}
      <MatchDetailSheet fixtureId={openId} onClose={() => setOpenId(null)} />
    </section>
  );
}
