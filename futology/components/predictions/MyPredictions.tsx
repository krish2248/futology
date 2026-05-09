"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, Edit2, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { MatchDetailSheet } from "@/components/cards/MatchDetailSheet";
import { useSession, type Prediction } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import { useFixtures } from "@/hooks/useLiveScores";
import {
  formatKickoff,
  formatScore,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * "My Predictions" view inside the Predictions page.
 *
 * - Reads predictions and stats from the session store.
 * - Auto-settles any prediction whose fixture has transitioned to
 *   `finished` via the polling fixtures hook — runs on render so this
 *   is the trigger point that becomes a Supabase Edge cron in Phase 5.
 * - Splits the list into upcoming (still editable via the sheet) and
 *   settled (3/1/0 result chip).
 */
export function MyPredictions() {
  const ready = useIsClient();
  const predictions = useSession((s) => s.predictions);
  const settlePrediction = useSession((s) => s.settlePrediction);
  const [openId, setOpenId] = useState<number | null>(null);

  // Pull current fixture state — used to auto-settle finished matches.
  const { data: matches } = useFixtures();

  useEffect(() => {
    if (!matches || !ready) return;
    for (const m of matches) {
      if (m.status !== "finished") continue;
      const matched = predictions.find((p) => p.fixtureId === m.id && !p.isSettled);
      if (
        matched &&
        typeof m.homeScore === "number" &&
        typeof m.awayScore === "number"
      ) {
        settlePrediction({
          fixtureId: m.id,
          actualHomeScore: m.homeScore,
          actualAwayScore: m.awayScore,
        });
      }
    }
  }, [matches, predictions, ready, settlePrediction]);

  const upcoming = useMemo(
    () => predictions.filter((p) => !p.isSettled).sort((a, b) => +new Date(a.matchDate) - +new Date(b.matchDate)),
    [predictions],
  );
  const past = useMemo(
    () => predictions.filter((p) => p.isSettled).sort((a, b) => +new Date(b.matchDate) - +new Date(a.matchDate)),
    [predictions],
  );

  if (!ready) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="You haven't picked any matches yet"
        description="Open any match card and tap the Predict tab. 3 pts for an exact score, 1 for the right winner."
      />
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
            Upcoming · editable until kickoff
          </h3>
          <div className="grid gap-2 md:grid-cols-2">
            {upcoming.map((p) => (
              <UpcomingRow
                key={p.id}
                prediction={p}
                onEdit={() => setOpenId(p.fixtureId)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h3 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
            Settled
          </h3>
          <ul className="space-y-2">
            {past.map((p) => (
              <SettledRow key={p.id} prediction={p} />
            ))}
          </ul>
        </section>
      ) : null}

      <MatchDetailSheet fixtureId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function UpcomingRow({
  prediction,
  onEdit,
}: {
  prediction: Prediction;
  onEdit: () => void;
}) {
  return (
    <Card hover className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {prediction.homeTeam} vs {prediction.awayTeam}
        </p>
        <p className="tabular mt-0.5 text-xs text-text-secondary">
          {formatKickoff(prediction.matchDate)}
        </p>
      </div>
      <div className="text-right">
        <p className="tabular text-lg font-bold">
          {prediction.predictedHomeScore} – {prediction.predictedAwayScore}
        </p>
        <p className="text-[11px] capitalize text-text-muted">
          {prediction.predictedWinner}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Edit prediction"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border-strong text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
      >
        <Edit2 className="h-4 w-4" />
      </button>
    </Card>
  );
}

function SettledRow({ prediction }: { prediction: Prediction }) {
  const correctScore = prediction.pointsEarned === 3;
  const correctWinner = prediction.pointsEarned >= 1;
  return (
    <li className="surface flex items-center gap-3 px-4 py-3 text-sm">
      <div
        aria-hidden
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
          correctWinner ? "bg-accent-muted text-accent" : "bg-live/10 text-live",
        )}
      >
        {correctWinner ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {prediction.homeTeam} vs {prediction.awayTeam}
        </p>
        <p className="tabular text-xs text-text-secondary">
          You: {prediction.predictedHomeScore}–{prediction.predictedAwayScore} ·
          Result:{" "}
          <span className="text-text-primary">
            {formatScore(prediction.actualHomeScore, prediction.actualAwayScore)}
          </span>
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "tabular text-lg font-bold",
            correctScore
              ? "text-premium"
              : correctWinner
                ? "text-accent"
                : "text-text-muted",
          )}
        >
          {prediction.pointsEarned > 0 ? `+${prediction.pointsEarned}` : "0"}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-text-muted">
          {correctScore ? "Exact" : correctWinner ? "Winner" : "Miss"}
        </p>
      </div>
    </li>
  );
}
