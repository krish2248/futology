"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Flame,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/shared/Card";
import { useSession } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import {
  ACCURACY_LEADERS,
  COMMUNITY_POLLS,
  TRENDING_PICKS,
  type CommunityPoll,
  type PollOption,
} from "@/lib/data/demoCommunity";
import { cn } from "@/lib/utils/cn";

/**
 * Community tab on the Predictions page.
 *
 * Three sections, all driven by the seeded `demoCommunity.ts` data:
 * - Active polls (vote-once with bar fill animated by vote count).
 * - Trending predictions (what other users are picking).
 * - Anonymous accuracy-leaders table.
 *
 * Cutover: Polls become a Supabase Realtime subscription on the `polls`
 * table; trending and leaders become materialised views.
 */
export function CommunityTab() {
  const ready = useIsClient();

  if (!ready) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-44" />
        <div className="skeleton h-24" />
        <div className="skeleton h-44" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-text-secondary">
          <Flame className="h-4 w-4 text-warning" aria-hidden /> Active polls
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {COMMUNITY_POLLS.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-text-secondary">
          <TrendingUp className="h-4 w-4 text-accent" aria-hidden /> Trending predictions
        </h3>
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TRENDING_PICKS.map((t) => (
            <li key={t.fixtureId}>
              <Card>
                <p className="text-xs uppercase tracking-wider text-text-muted">
                  Most predicted
                </p>
                <p className="mt-1 truncate font-medium">
                  {t.homeTeam} vs {t.awayTeam}
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="tabular text-3xl font-bold tracking-tight">
                    {t.topScoreline}
                  </span>
                  <span className="tabular text-xs text-text-secondary">
                    {t.count} of {t.totalVotes} votes
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${(t.count / t.totalVotes) * 100}%` }}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium tracking-wide text-text-secondary">
          <Trophy className="h-4 w-4 text-premium" aria-hidden /> Community accuracy leaders
        </h3>
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
                  <th className="py-2 pl-3 pr-2 text-left">#</th>
                  <th className="py-2 pr-2 text-left">User</th>
                  <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">P</th>
                  <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">✓</th>
                  <th className="py-2 pr-2 text-right tabular">Acc</th>
                  <th className="py-2 pr-3 text-right tabular">Pts</th>
                </tr>
              </thead>
              <tbody>
                {ACCURACY_LEADERS.map((row) => (
                  <tr
                    key={row.username}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="tabular py-2 pl-3 pr-2 text-text-secondary">
                      {row.rank}
                    </td>
                    <td className="py-2 pr-2 font-medium">{row.username}</td>
                    <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                      {row.predictions}
                    </td>
                    <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                      {row.correct}
                    </td>
                    <td className="tabular py-2 pr-2 text-right">{row.accuracy}%</td>
                    <td className="tabular py-2 pr-3 text-right font-semibold">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border bg-bg-primary/50 px-3 py-2 text-[11px] text-text-muted">
            Anonymous community ranking — settles via Supabase Realtime in
            Phase 5 cutover.
          </p>
        </div>
      </section>
    </div>
  );
}

function PollCard({ poll }: { poll: CommunityPoll }) {
  const voteInPoll = useSession((s) => s.voteInPoll);
  const myVote = useSession((s) => s.pollVotes.find((v) => v.pollId === poll.id));

  const totals = useMemo(() => {
    const counts = new Map<string, number>(
      poll.options.map((o) => [o.id, o.baseVotes]),
    );
    if (myVote) {
      counts.set(myVote.optionId, (counts.get(myVote.optionId) ?? 0) + 1);
    }
    const sum = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    return { counts, sum };
  }, [poll, myVote]);

  function vote(option: PollOption) {
    if (myVote) return;
    voteInPoll(poll.id, option.id);
  }

  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-text-muted">
        {poll.scope}
      </p>
      <p className="mt-1 font-medium">{poll.question}</p>
      <ul className="mt-3 space-y-2">
        {poll.options.map((o) => {
          const count = totals.counts.get(o.id) ?? 0;
          const pct = totals.sum > 0 ? (count / totals.sum) * 100 : 0;
          const voted = myVote?.optionId === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => vote(o)}
                disabled={Boolean(myVote)}
                aria-pressed={voted}
                className={cn(
                  "relative flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  voted
                    ? "border-accent/60 bg-accent-muted text-text-primary"
                    : myVote
                      ? "border-border bg-bg-elevated text-text-secondary"
                      : "border-border bg-bg-elevated hover:border-accent/40",
                )}
              >
                {/* Background bar */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 left-0 z-0 rounded-lg",
                    voted ? "bg-accent/20" : "bg-bg-raised",
                  )}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative z-10 flex w-full items-center gap-2">
                  {o.flag ? (
                    <span aria-hidden className="text-base">
                      {o.flag}
                    </span>
                  ) : null}
                  <span className="flex-1 truncate">{o.label}</span>
                  {voted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden />
                  ) : null}
                  <span className="tabular text-xs text-text-secondary">
                    {pct.toFixed(0)}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-text-muted">
        {totals.sum.toLocaleString()} votes ·{" "}
        {myVote ? "Your vote is locked in" : "Tap to vote"}
      </p>
    </Card>
  );
}
