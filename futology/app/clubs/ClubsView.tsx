"use client";

import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { CLUBS, CLUB_QUICK_PICKS } from "@/lib/data/clubs";
import { findLeague } from "@/lib/data/leagues";
import { useSession } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";

export function ClubsView() {
  const ready = useIsClient();
  const followedClubs = useSession((s) => s.followedClubs);

  const followed = followedClubs
    .map((c) => CLUBS.find((club) => club.id === c.id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const popular = CLUBS.filter((c) => CLUB_QUICK_PICKS.includes(c.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubs"
        description="Followed clubs surface here. Click any card to open the 6-tab club page."
      />

      {ready && followed.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
            You follow
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followed.map((c) => (
              <ClubLink key={c.id} club={c} />
            ))}
          </div>
        </section>
      ) : ready ? (
        <EmptyState
          icon={Shield}
          title="You don't follow any clubs yet"
          description="Pick clubs during onboarding, or follow one from the popular list below. Each card opens the full 6-tab club page (Overview, Squad, Fixtures, Results, Transfers, Stats)."
        />
      ) : (
        <div className="skeleton h-32" />
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
          Popular clubs
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((c) => (
            <ClubLink key={c.id} club={c} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ClubLink({ club }: { club: (typeof CLUBS)[number] }) {
  const league = findLeague(club.leagueId);
  return (
    <Link href={`/clubs/${club.id}`} className="group block">
      <Card hover className="flex h-full items-center gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bg-elevated text-xs font-semibold text-text-secondary"
        >
          {club.shortName.slice(0, 3).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{club.name}</p>
          <p className="truncate text-xs text-text-secondary">
            {league?.name ?? club.country}
          </p>
        </div>
        <ArrowRight
          aria-hidden
          className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </Card>
    </Link>
  );
}
