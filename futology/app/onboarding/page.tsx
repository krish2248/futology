"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Trophy,
  Shield,
  User,
  Crown,
  Search,
} from "lucide-react";
import { LEAGUES } from "@/lib/data/leagues";
import { CLUBS, CLUB_QUICK_PICKS } from "@/lib/data/clubs";
import { PLAYERS } from "@/lib/data/players";
import { TOURNAMENTS } from "@/lib/data/tournaments";
import { useSession } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import { cn } from "@/lib/utils/cn";

type StepId = "leagues" | "clubs" | "players";

const STEPS: ReadonlyArray<{
  id: StepId;
  title: string;
  subtitle: string;
  icon: typeof Trophy;
}> = [
  { id: "leagues", title: "Pick your leagues", subtitle: "Standings, scores and news will be tailored to these.", icon: Trophy },
  { id: "clubs", title: "Pick your clubs", subtitle: "We'll surface their fixtures, results and transfers.", icon: Shield },
  { id: "players", title: "Players & tournaments", subtitle: "Star players to track and major tournaments to watch.", icon: User },
];

export default function OnboardingPage() {
  const router = useRouter();
  const ready = useIsClient();
  const followedLeagues = useSession((s) => s.followedLeagues);
  const followedClubs = useSession((s) => s.followedClubs);
  const followedPlayers = useSession((s) => s.followedPlayers);
  const followedTournaments = useSession((s) => s.followedTournaments);
  const toggleLeague = useSession((s) => s.toggleLeague);
  const toggleClub = useSession((s) => s.toggleClub);
  const togglePlayer = useSession((s) => s.togglePlayer);
  const toggleTournament = useSession((s) => s.toggleTournament);
  const completeOnboarding = useSession((s) => s.completeOnboarding);

  const [stepIndex, setStepIndex] = useState(0);
  const [clubQuery, setClubQuery] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");

  const step = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const followedLeagueIds = useMemo(
    () => new Set(followedLeagues.map((l) => l.id)),
    [followedLeagues],
  );
  const followedClubIds = useMemo(
    () => new Set(followedClubs.map((c) => c.id)),
    [followedClubs],
  );
  const followedPlayerIds = useMemo(
    () => new Set(followedPlayers.map((p) => p.id)),
    [followedPlayers],
  );
  const followedTournamentIds = useMemo(
    () => new Set(followedTournaments.map((t) => t.id)),
    [followedTournaments],
  );

  const filteredClubs = useMemo(() => {
    if (!clubQuery.trim()) {
      const quick = new Set(CLUB_QUICK_PICKS);
      const followingByLeague = CLUBS.filter((c) =>
        followedLeagueIds.has(c.leagueId),
      );
      const seen = new Set<number>();
      return [
        ...followingByLeague,
        ...CLUBS.filter((c) => quick.has(c.id)),
      ].filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
    }
    const q = clubQuery.toLowerCase();
    return CLUBS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q),
    ).slice(0, 24);
  }, [clubQuery, followedLeagueIds]);

  const filteredPlayers = useMemo(() => {
    if (!playerQuery.trim()) return PLAYERS.slice(0, 16);
    const q = playerQuery.toLowerCase();
    return PLAYERS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q),
    ).slice(0, 24);
  }, [playerQuery]);

  function canAdvance(): boolean {
    if (step.id === "leagues") return followedLeagues.length >= 1;
    if (step.id === "clubs") return followedClubs.length >= 1;
    return true; // players + tournaments are optional
  }

  function next() {
    if (!canAdvance()) return;
    if (stepIndex === STEPS.length - 1) {
      completeOnboarding();
      void confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#00D563", "#FFD700", "#FAFAFA"],
      });
      setTimeout(() => router.push("/"), 700);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="skeleton h-32 w-full max-w-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to sign in
        </Link>
        <span className="tabular text-xs text-text-muted">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
      </div>

      <div
        className="mb-8 h-1 w-full overflow-hidden rounded-full bg-bg-elevated"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div
          aria-hidden
          className="grid h-10 w-10 place-items-center rounded-lg bg-accent-muted text-accent"
        >
          <step.icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            {step.title}
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">{step.subtitle}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {step.id === "leagues" ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {LEAGUES.map((league) => {
                const active = followedLeagueIds.has(league.id);
                return (
                  <button
                    key={league.id}
                    type="button"
                    onClick={() =>
                      toggleLeague({
                        id: league.id,
                        name: league.name,
                        country: league.country,
                      })
                    }
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      active
                        ? "border-accent/60 bg-accent-muted"
                        : "border-border bg-bg-surface hover:border-accent/40",
                    )}
                  >
                    <span className="text-xl" aria-hidden>
                      {league.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {league.name}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        {league.country}
                      </span>
                    </span>
                    {active ? (
                      <Check
                        className="h-4 w-4 shrink-0 text-accent"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {step.id === "clubs" ? (
            <div className="space-y-4">
              <label className="block">
                <span className="sr-only">Search clubs</span>
                <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 transition-colors focus-within:border-accent/60">
                  <Search className="h-4 w-4 text-text-muted" aria-hidden />
                  <input
                    type="search"
                    value={clubQuery}
                    onChange={(e) => setClubQuery(e.target.value)}
                    placeholder="Search clubs (e.g. Barcelona, Liverpool, Bayern)"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                  />
                </div>
              </label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClubs.map((club) => {
                  const active = followedClubIds.has(club.id);
                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() =>
                        toggleClub({
                          id: club.id,
                          name: club.name,
                          leagueId: club.leagueId,
                        })
                      }
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                        active
                          ? "border-accent/60 bg-accent-muted"
                          : "border-border bg-bg-surface hover:border-accent/40",
                      )}
                    >
                      <span
                        aria-hidden
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-elevated text-xs font-semibold text-text-secondary"
                      >
                        {club.shortName.slice(0, 3).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {club.name}
                        </span>
                        <span className="block truncate text-xs text-text-secondary">
                          {club.country}
                        </span>
                      </span>
                      {active ? (
                        <Check
                          className="h-4 w-4 shrink-0 text-accent"
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
                {filteredClubs.length === 0 ? (
                  <p className="col-span-full px-1 py-2 text-sm text-text-muted">
                    No clubs match &ldquo;{clubQuery}&rdquo;.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step.id === "players" ? (
            <div className="space-y-6">
              <section>
                <h2 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
                  Star players
                </h2>
                <label className="block">
                  <span className="sr-only">Search players</span>
                  <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 transition-colors focus-within:border-accent/60">
                    <Search className="h-4 w-4 text-text-muted" aria-hidden />
                    <input
                      type="search"
                      value={playerQuery}
                      onChange={(e) => setPlayerQuery(e.target.value)}
                      placeholder="Search players"
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                    />
                  </div>
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPlayers.map((player) => {
                    const active = followedPlayerIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() =>
                          togglePlayer({
                            id: player.id,
                            name: player.name,
                            team: player.team,
                          })
                        }
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-accent/60 bg-accent-muted"
                            : "border-border bg-bg-surface hover:border-accent/40",
                        )}
                      >
                        <span
                          aria-hidden
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-elevated text-[10px] font-semibold uppercase text-text-secondary"
                        >
                          {player.position}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {player.name}
                          </span>
                          <span className="block truncate text-xs text-text-secondary">
                            {player.team}
                          </span>
                        </span>
                        {active ? (
                          <Check
                            className="h-4 w-4 shrink-0 text-accent"
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-medium tracking-wide text-text-secondary">
                  <Crown className="h-3.5 w-3.5" aria-hidden /> Major tournaments
                </h2>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {TOURNAMENTS.map((t) => {
                    const active = followedTournamentIds.has(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          toggleTournament({ id: t.id, name: t.name })
                        }
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-accent/60 bg-accent-muted"
                            : "border-border bg-bg-surface hover:border-accent/40",
                        )}
                      >
                        <span className="text-xl" aria-hidden>
                          {t.flag}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {t.name}
                          </span>
                          <span className="block truncate text-xs text-text-secondary">
                            {t.region}
                          </span>
                        </span>
                        {active ? (
                          <Check
                            className="h-4 w-4 shrink-0 text-accent"
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-4 mt-8 flex items-center gap-3 md:bottom-6">
        <button
          type="button"
          onClick={back}
          disabled={stepIndex === 0}
          className="rounded-lg border border-border-strong bg-bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <p className="ml-1 hidden text-xs text-text-muted sm:block">
          {step.id === "leagues"
            ? `${followedLeagues.length} selected · pick at least 1`
            : step.id === "clubs"
              ? `${followedClubs.length} selected · pick at least 1`
              : `${followedPlayers.length} players · ${followedTournaments.length} tournaments · optional`}
        </p>
        <button
          type="button"
          onClick={next}
          disabled={!canAdvance()}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {stepIndex === STEPS.length - 1 ? "Finish" : "Continue"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
