"use client";

import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Globe,
  Lock,
  Crown,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/shared/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { useSession, type PredictionLeague } from "@/lib/store/session";
import { useIsClient } from "@/hooks/useHydratedSession";
import { PUBLIC_LEAGUES_SEED } from "@/lib/data/demoLeagues";
import { cn } from "@/lib/utils/cn";

type Modal = null | "create" | "join";

/**
 * Prediction Leagues tab — create, join, browse, and inspect leaderboards.
 *
 * Two modal states (`create`, `join`) handle the new-league flow and the
 * invite-code lookup. Public-leagues seed feeds the Browse list before
 * the user creates anything of their own. Detail view renders the
 * leaderboard with rank arrows and highlights the active user's row.
 */
export function PredictionLeagues() {
  const ready = useIsClient();
  const myLeagues = useSession((s) => s.predictionLeagues);
  const [modal, setModal] = useState<Modal>(null);
  const [openLeagueId, setOpenLeagueId] = useState<string | null>(null);

  if (!ready) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-12" />
        <div className="skeleton h-32" />
      </div>
    );
  }

  if (openLeagueId) {
    const league =
      myLeagues.find((l) => l.id === openLeagueId) ??
      PUBLIC_LEAGUES_SEED.find((l) => l.id === openLeagueId);
    if (league) {
      return (
        <LeagueDetail
          league={league}
          onBack={() => setOpenLeagueId(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModal("create")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" aria-hidden /> Create league
        </button>
        <button
          type="button"
          onClick={() => setModal("join")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
        >
          <KeyRound className="h-4 w-4" aria-hidden /> Join with code
        </button>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
          My leagues
        </h3>
        {myLeagues.length === 0 ? (
          <EmptyState
            icon={Users}
            title="You haven't joined any leagues yet"
            description="Create a private league for friends, or join one of the public leagues below."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {myLeagues.map((l) => (
              <LeagueCard key={l.id} league={l} onOpen={setOpenLeagueId} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium tracking-wide text-text-secondary">
          Public leagues to join
        </h3>
        <ul className="grid gap-3 md:grid-cols-2">
          {PUBLIC_LEAGUES_SEED.map((l) => (
            <LeagueCard key={l.id} league={l} onOpen={setOpenLeagueId} compact />
          ))}
        </ul>
      </section>

      <AnimatePresence>
        {modal === "create" ? (
          <CreateLeagueModal onClose={() => setModal(null)} />
        ) : modal === "join" ? (
          <JoinLeagueModal onClose={() => setModal(null)} />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function LeagueCard({
  league,
  onOpen,
  compact,
}: {
  league: PredictionLeague;
  onOpen: (id: string) => void;
  compact?: boolean;
}) {
  const userId = useSession((s) => s.user?.id ?? "demo_anon");
  const me = league.members.find((m) => m.userId === userId);
  const myRank = me ? rankOf(league, me.userId) : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(league.id)}
        className="surface surface-hover w-full p-4 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{league.name}</p>
            <p className="line-clamp-2 text-xs text-text-secondary">
              {league.description ?? "Private league."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
            {league.isPublic ? <Globe className="h-3 w-3" aria-hidden /> : <Lock className="h-3 w-3" aria-hidden />}
            {league.isPublic ? "Public" : "Private"}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-text-muted">
          <span className="tabular">{league.members.length} members</span>
          {!compact && me ? (
            <>
              <span aria-hidden>·</span>
              <span className="tabular text-text-secondary">
                Rank #{myRank} · {me.totalPoints} pts
              </span>
            </>
          ) : null}
          <span aria-hidden className="ml-auto text-text-secondary">
            {league.inviteCode}
          </span>
        </div>
      </button>
    </li>
  );
}

function LeagueDetail({
  league,
  onBack,
}: {
  league: PredictionLeague;
  onBack: () => void;
}) {
  const userId = useSession((s) => s.user?.id ?? "demo_anon");
  const leaveLeague = useSession((s) => s.leaveLeague);
  const joinLeagueByCode = useSession((s) => s.joinLeagueByCode);
  const myLeagues = useSession((s) => s.predictionLeagues);

  const isMember = league.members.some((m) => m.userId === userId);
  const isInOwnList = myLeagues.some((l) => l.id === league.id);

  const sorted = useMemo(
    () =>
      [...league.members].sort(
        (a, b) =>
          b.totalPoints - a.totalPoints ||
          b.correctPredictions - a.correctPredictions,
      ),
    [league.members],
  );

  const [copied, setCopied] = useState(false);

  function copyInvite() {
    if (typeof navigator === "undefined") return;
    navigator.clipboard.writeText(league.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleJoin() {
    joinLeagueByCode(league.inviteCode);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to leagues
      </button>

      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold">{league.name}</p>
            <p className="text-sm text-text-secondary">
              {league.description ?? "Private league."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-wider text-text-secondary">
            {league.isPublic ? <Globe className="h-3 w-3" aria-hidden /> : <Lock className="h-3 w-3" aria-hidden />}
            {league.isPublic ? "Public" : "Private"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyInvite}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" aria-hidden /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden /> {league.inviteCode}
              </>
            )}
          </button>
          {!isInOwnList ? (
            <button
              type="button"
              onClick={handleJoin}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg-primary transition-colors hover:bg-accent-hover"
            >
              {isMember ? "Already in" : "Join this league"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                leaveLeague(league.id);
                onBack();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-live/40 hover:text-live"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden /> Leave
            </button>
          )}
        </div>
      </Card>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
                <th className="py-2 pl-3 pr-2 text-left">#</th>
                <th className="py-2 pr-2 text-left">Member</th>
                <th className="py-2 pr-2 text-right tabular">Pts</th>
                <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">P</th>
                <th className="hidden py-2 pr-2 text-right tabular sm:table-cell">✓</th>
                <th className="py-2 pr-3 text-right tabular">Acc</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => {
                const acc =
                  m.totalPredictions > 0
                    ? Math.round((m.correctPredictions / m.totalPredictions) * 100)
                    : 0;
                const isMe = m.userId === userId;
                return (
                  <tr
                    key={m.userId}
                    className={cn(
                      "border-b border-border last:border-b-0",
                      isMe && "bg-accent-muted/40",
                    )}
                  >
                    <td className="py-2 pl-3 pr-2 tabular text-text-secondary">
                      {i + 1}
                      {i === 0 ? (
                        <Crown
                          className="ml-1 inline h-3 w-3 text-premium"
                          aria-hidden
                        />
                      ) : null}
                    </td>
                    <td className="py-2 pr-2">
                      <span className="truncate font-medium">{m.displayName}</span>
                      {isMe ? (
                        <span className="ml-1.5 rounded bg-accent-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent">
                          You
                        </span>
                      ) : null}
                    </td>
                    <td className="tabular py-2 pr-2 text-right font-semibold">
                      {m.totalPoints}
                    </td>
                    <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                      {m.totalPredictions}
                    </td>
                    <td className="tabular hidden py-2 pr-2 text-right sm:table-cell">
                      {m.correctPredictions}
                    </td>
                    <td className="tabular py-2 pr-3 text-right">{acc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function rankOf(league: PredictionLeague, userId: string): number {
  const sorted = [...league.members].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.correctPredictions - a.correctPredictions,
  );
  return sorted.findIndex((m) => m.userId === userId) + 1;
}

function CreateLeagueModal({ onClose }: { onClose: () => void }) {
  const createLeague = useSession((s) => s.createLeague);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const canSubmit = name.trim().length >= 3;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    createLeague({ name: name.trim(), description: description.trim() || undefined, isPublic });
    onClose();
  }

  return (
    <ModalShell onClose={onClose} title="Create league">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-text-secondary">
            League name
          </span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="The Sunday League"
            className="mt-1 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none transition-colors focus-within:border-accent/60"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-text-secondary">
            Description (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the rules?"
            rows={3}
            className="mt-1 w-full resize-none rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm outline-none transition-colors focus-within:border-accent/60"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 accent-[#00D563]"
          />
          Make this league public (anyone can find it)
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-strong px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            Create
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function JoinLeagueModal({ onClose }: { onClose: () => void }) {
  const joinLeagueByCode = useSession((s) => s.joinLeagueByCode);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    const result = joinLeagueByCode(code);
    if (!result) {
      setError("No league with that code. Check with the league creator.");
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess(`Joined "${result.name}"`);
    setTimeout(onClose, 800);
  }

  return (
    <ModalShell onClose={onClose} title="Join with invite code">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-text-secondary">
            Invite code
          </span>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD1234"
            className="mt-1 w-full rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 text-sm uppercase tracking-wider outline-none transition-colors focus-within:border-accent/60"
          />
        </label>
        {error ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-live">
            <XCircle className="h-3.5 w-3.5" aria-hidden /> {error}
          </p>
        ) : null}
        {success ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-accent">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {success}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-strong px-3 py-2 text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
          >
            Join
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="surface-elevated relative w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 text-base font-medium">{title}</p>
        {children}
      </motion.div>
    </motion.div>
  );
}
