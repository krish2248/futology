"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users,
  Calendar,
  Coins,
  BarChart3,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { EmptyState } from "@/components/shared/EmptyState";
import { MatchCard } from "@/components/cards/MatchCard";
import { MatchDetailSheet } from "@/components/cards/MatchDetailSheet";
import { findClub } from "@/lib/data/clubs";
import { findLeague } from "@/lib/data/leagues";
import {
  getDemoMatches,
  type DemoMatch,
} from "@/lib/data/demoMatches";
import {
  getDemoStandings,
  type StandingRow,
} from "@/lib/data/demoStandings";
import { useSession } from "@/lib/store/session";
import { cn } from "@/lib/utils/cn";

type TabId = "overview" | "squad" | "fixtures" | "results" | "transfers" | "stats";

const TABS: Array<{ id: TabId; label: string; icon: typeof Shield }> = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "squad", label: "Squad", icon: Users },
  { id: "fixtures", label: "Fixtures", icon: Calendar },
  { id: "results", label: "Results", icon: BarChart3 },
  { id: "transfers", label: "Transfers", icon: Coins },
  { id: "stats", label: "Stats", icon: Shield },
];

export function ClubDetailView({ clubId }: { clubId: number }) {
  const club = findClub(clubId);
  const [tab, setTab] = useState<TabId>("overview");
  const [openMatchId, setOpenMatchId] = useState<number | null>(null);

  const allMatches = useMemo(() => getDemoMatches(), []);
  const matches = useMemo(
    () =>
      allMatches.filter(
        (m) => m.homeTeamId === clubId || m.awayTeamId === clubId,
      ),
    [allMatches, clubId],
  );

  const upcoming = matches.filter((m) => m.status === "scheduled");
  const finished = matches.filter((m) => m.status === "finished");
  const live = matches.filter((m) => m.status === "live");

  const standings = useMemo(
    () => (club ? getDemoStandings(club.leagueId) : []),
    [club],
  );
  const myRow = useMemo(
    () => standings.find((r) => r.teamId === clubId),
    [standings, clubId],
  );

  const toggleClub = useSession((s) => s.toggleClub);
  const isFollowed = useSession((s) =>
    s.followedClubs.some((c) => c.id === clubId),
  );

  if (!club) {
    return (
      <div className="surface p-6 text-center text-sm text-text-secondary">
        Club not found.
      </div>
    );
  }

  const league = findLeague(club.leagueId);
  const formScore = myRow ? formAvg(myRow.form) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/clubs"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> All clubs
      </Link>

      <Card className="flex items-start gap-4">
        <div
          aria-hidden
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-bg-elevated text-sm font-semibold text-text-secondary"
        >
          {club.shortName.slice(0, 3).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{club.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {league?.name ?? club.country}
            {club.founded ? ` · founded ${club.founded}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            toggleClub({ id: club.id, name: club.name, leagueId: club.leagueId })
          }
          aria-pressed={isFollowed}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isFollowed
              ? "border border-accent/40 bg-accent-muted text-accent"
              : "border border-border-strong text-text-secondary hover:border-accent/40 hover:text-text-primary",
          )}
        >
          {isFollowed ? "Following" : "Follow"}
        </button>
      </Card>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t.label}
            </button>
          );
        })}
      </Card>

      {tab === "overview" ? (
        <Overview
          club={club}
          row={myRow}
          live={live}
          upcoming={upcoming}
          formScore={formScore}
          onOpenMatch={setOpenMatchId}
        />
      ) : null}

      {tab === "squad" ? (
        <EmptyState
          icon={Users}
          title="Squad detail wires up in Phase 2 cutover"
          description="Once API-Football is wired, this tab fetches the full squad with positions, ages, contract years and per-90 stats."
        />
      ) : null}

      {tab === "fixtures" ? (
        <FixturesTab matches={upcoming} onOpen={setOpenMatchId} />
      ) : null}

      {tab === "results" ? (
        <FixturesTab matches={finished} onOpen={setOpenMatchId} />
      ) : null}

      {tab === "transfers" ? (
        <EmptyState
          icon={Coins}
          title="Transfer history wires up in Phase 6"
          description="Recent ins/outs, fees, and predicted Transfer-Oracle valuations for each move."
        />
      ) : null}

      {tab === "stats" ? <StatsTab row={myRow} /> : null}

      <MatchDetailSheet
        fixtureId={openMatchId}
        onClose={() => setOpenMatchId(null)}
      />
    </div>
  );
}

function formAvg(form: ("W" | "D" | "L")[]): number {
  const points = form.reduce(
    (acc, r) => acc + (r === "W" ? 3 : r === "D" ? 1 : 0),
    0,
  );
  return Number((points / form.length).toFixed(2));
}

function Overview({
  club,
  row,
  live,
  upcoming,
  formScore,
  onOpenMatch,
}: {
  club: { name: string; shortName: string };
  row: StandingRow | undefined;
  live: DemoMatch[];
  upcoming: DemoMatch[];
  formScore: number | null;
  onOpenMatch: (id: number) => void;
}) {
  const next = upcoming[0];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Position"
          value={row ? `#${row.position}` : "—"}
          hint={row ? `${row.points} pts · ${row.played} P` : "Waiting on standings"}
        />
        <StatTile
          label="Goal diff"
          value={
            row
              ? row.goalDifference > 0
                ? `+${row.goalDifference}`
                : String(row.goalDifference)
              : "—"
          }
          hint={row ? `${row.goalsFor} for · ${row.goalsAgainst} against` : ""}
        />
        <StatTile
          label="Form (avg pts)"
          value={formScore !== null ? formScore.toFixed(2) : "—"}
          hint={row ? row.form.join(" ") : ""}
        />
        <StatTile
          label="Played"
          value={row ? String(row.played) : "—"}
          hint={row ? `${row.won}W ${row.drawn}D ${row.lost}L` : ""}
        />
      </div>

      {live.length > 0 ? (
        <section>
          <p className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
            Live now
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {live.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onOpenMatch(m.id)}
                className="text-left transition-transform active:scale-[0.99]"
              >
                <MatchCard match={m} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {next ? (
        <section>
          <p className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
            Up next
          </p>
          <button
            type="button"
            onClick={() => onOpenMatch(next.id)}
            className="block w-full text-left transition-transform active:scale-[0.99]"
          >
            <MatchCard match={next} />
          </button>
        </section>
      ) : null}
    </div>
  );
}

function FixturesTab({
  matches,
  onOpen,
}: {
  matches: DemoMatch[];
  onOpen: (id: number) => void;
}) {
  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No matches in the demo window"
        description="The seeded fixture list rolls relative to today."
      />
    );
  }
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {matches.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onOpen(m.id)}
          className="text-left transition-transform active:scale-[0.99]"
        >
          <MatchCard match={m} />
        </button>
      ))}
    </div>
  );
}

function StatsTab({ row }: { row: StandingRow | undefined }) {
  if (!row) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No standings row available for this league"
        description="Pick a club from a top-five league to see real splits."
      />
    );
  }
  const winRate = row.played > 0 ? (row.won / row.played) * 100 : 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="Win rate" value={`${winRate.toFixed(0)}%`} hint={`${row.won}/${row.played}`} />
      <StatTile label="Goals/match" value={(row.goalsFor / Math.max(1, row.played)).toFixed(2)} />
      <StatTile label="Conceded/match" value={(row.goalsAgainst / Math.max(1, row.played)).toFixed(2)} />
      <StatTile label="Points/match" value={(row.points / Math.max(1, row.played)).toFixed(2)} />
    </div>
  );
}
