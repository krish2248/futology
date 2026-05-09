"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DemoUser = {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
};

export type FollowedLeague = {
  id: number;
  name: string;
  country: string;
  logo?: string;
};

export type FollowedClub = {
  id: number;
  name: string;
  leagueId?: number;
  crest?: string;
};

export type FollowedPlayer = {
  id: number;
  name: string;
  team?: string;
  photo?: string;
};

export type FollowedTournament = {
  id: number;
  name: string;
  logo?: string;
};

export type Winner = "home" | "draw" | "away";

export type Prediction = {
  id: string;
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedWinner: Winner;
  actualHomeScore?: number;
  actualAwayScore?: number;
  pointsEarned: number;
  isSettled: boolean;
  mlSuggestedWinner?: Winner;
  mlConfidence?: number;
  createdAt: string;
};

export type PredictionLeague = {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  isPublic: boolean;
  createdBy: string;
  members: PredictionLeagueMember[];
  createdAt: string;
};

export type PredictionLeagueMember = {
  userId: string;
  displayName: string;
  totalPoints: number;
  totalPredictions: number;
  correctPredictions: number;
  joinedAt: string;
};

export type PollVote = {
  pollId: string;
  optionId: string;
  votedAt: string;
};

export type AppNotification = {
  id: string;
  type: "match_start" | "goal" | "transfer" | "prediction_settled" | "league_invite";
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type PredictionInput = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  mlSuggestedWinner?: Winner;
  mlConfidence?: number;
};

type SettlementInput = {
  fixtureId: number;
  actualHomeScore: number;
  actualAwayScore: number;
};

type CreateLeagueInput = {
  name: string;
  description?: string;
  isPublic: boolean;
};

type SessionState = {
  user: DemoUser | null;
  onboardingComplete: boolean;
  followedLeagues: FollowedLeague[];
  followedClubs: FollowedClub[];
  followedPlayers: FollowedPlayer[];
  followedTournaments: FollowedTournament[];
  predictions: Prediction[];
  predictionLeagues: PredictionLeague[];
  pollVotes: PollVote[];
  notifications: AppNotification[];

  signIn: (email: string) => DemoUser;
  signOut: () => void;
  completeOnboarding: () => void;
  toggleLeague: (league: FollowedLeague) => void;
  toggleClub: (club: FollowedClub) => void;
  togglePlayer: (player: FollowedPlayer) => void;
  toggleTournament: (tournament: FollowedTournament) => void;

  upsertPrediction: (input: PredictionInput) => Prediction;
  deletePrediction: (id: string) => void;
  settlePrediction: (input: SettlementInput) => Prediction | null;

  createLeague: (input: CreateLeagueInput) => PredictionLeague;
  joinLeagueByCode: (inviteCode: string) => PredictionLeague | null;
  leaveLeague: (leagueId: string) => void;
  recomputeLeagueStats: () => void;

  voteInPoll: (pollId: string, optionId: string) => void;

  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "isRead">) => void;
  markAllNotificationsRead: () => void;

  reset: () => void;
};

const SESSION_COOKIE = "futology_session";

function setSessionCookie(value: string | null) {
  if (typeof document === "undefined") return;
  if (value === null) {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
  } else {
    document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }
}

function makeUser(email: string): DemoUser {
  const cleaned = email.trim().toLowerCase();
  const displayName = cleaned.split("@")[0]?.replace(/[._]/g, " ") ?? "Friend";
  return {
    id: `demo_${cleaned}`,
    email: cleaned,
    displayName: displayName.replace(/\b\w/g, (c) => c.toUpperCase()),
    createdAt: new Date().toISOString(),
  };
}

function toggleBy<T extends { id: number }>(list: T[], candidate: T): T[] {
  return list.some((item) => item.id === candidate.id)
    ? list.filter((item) => item.id !== candidate.id)
    : [...list, candidate];
}

function winnerFromScores(home: number, away: number): Winner {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

/**
 * Scores a settled prediction against the final result.
 * - Exact score match → 3 points
 * - Correct winner only → 1 point
 * - Wrong winner → 0 points
 *
 * Lifted as-is when settlement moves to a Supabase Edge Function — the
 * 3/1/0 contract is bible §5 / §6.
 */
function pointsFor(prediction: Prediction, actualHome: number, actualAway: number): number {
  if (
    prediction.predictedHomeScore === actualHome &&
    prediction.predictedAwayScore === actualAway
  ) {
    return 3;
  }
  const actualWinner = winnerFromScores(actualHome, actualAway);
  return prediction.predictedWinner === actualWinner ? 1 : 0;
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function makeInviteCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

const EMPTY_USER_STATE = {
  user: null,
  onboardingComplete: false,
  followedLeagues: [],
  followedClubs: [],
  followedPlayers: [],
  followedTournaments: [],
  predictions: [],
  predictionLeagues: [],
  pollVotes: [],
  notifications: [],
} satisfies Pick<
  SessionState,
  | "user"
  | "onboardingComplete"
  | "followedLeagues"
  | "followedClubs"
  | "followedPlayers"
  | "followedTournaments"
  | "predictions"
  | "predictionLeagues"
  | "pollVotes"
  | "notifications"
>;

/**
 * Persisted Zustand store backing the demo authentication and follow-graph.
 *
 * Persistence: localStorage under `futology.session`, with a v2 `migrate`
 * step so existing v1 sessions keep their followed lists.
 *
 * Cookie shadow: `signIn` also writes `futology_session=1` so middleware
 * (or AuthGate after the static-export refactor) can gate routes without
 * reading the persisted slice.
 *
 * Cutover: replace `signIn` with `supabase.auth.signInWithOtp` and the
 * cookie with the Supabase SSR cookie — the rest of the store survives.
 */
export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      ...EMPTY_USER_STATE,

      signIn: (email) => {
        const user = makeUser(email);
        setSessionCookie(user.id);
        set({ user });
        return user;
      },

      signOut: () => {
        setSessionCookie(null);
        set({ ...EMPTY_USER_STATE });
      },

      completeOnboarding: () => set({ onboardingComplete: true }),

      toggleLeague: (league) =>
        set((state) => ({ followedLeagues: toggleBy(state.followedLeagues, league) })),
      toggleClub: (club) =>
        set((state) => ({ followedClubs: toggleBy(state.followedClubs, club) })),
      togglePlayer: (player) =>
        set((state) => ({ followedPlayers: toggleBy(state.followedPlayers, player) })),
      toggleTournament: (tournament) =>
        set((state) => ({
          followedTournaments: toggleBy(state.followedTournaments, tournament),
        })),

      upsertPrediction: (input) => {
        const winner = winnerFromScores(input.predictedHomeScore, input.predictedAwayScore);
        const existing = get().predictions.find((p) => p.fixtureId === input.fixtureId);
        const next: Prediction = existing
          ? {
              ...existing,
              homeTeam: input.homeTeam,
              awayTeam: input.awayTeam,
              matchDate: input.matchDate,
              predictedHomeScore: input.predictedHomeScore,
              predictedAwayScore: input.predictedAwayScore,
              predictedWinner: winner,
              mlSuggestedWinner: input.mlSuggestedWinner ?? existing.mlSuggestedWinner,
              mlConfidence: input.mlConfidence ?? existing.mlConfidence,
            }
          : {
              id: makeId("pred"),
              fixtureId: input.fixtureId,
              homeTeam: input.homeTeam,
              awayTeam: input.awayTeam,
              matchDate: input.matchDate,
              predictedHomeScore: input.predictedHomeScore,
              predictedAwayScore: input.predictedAwayScore,
              predictedWinner: winner,
              pointsEarned: 0,
              isSettled: false,
              mlSuggestedWinner: input.mlSuggestedWinner,
              mlConfidence: input.mlConfidence,
              createdAt: new Date().toISOString(),
            };
        set((state) => ({
          predictions: existing
            ? state.predictions.map((p) => (p.id === next.id ? next : p))
            : [next, ...state.predictions],
        }));
        return next;
      },

      deletePrediction: (id) =>
        set((state) => ({ predictions: state.predictions.filter((p) => p.id !== id) })),

      settlePrediction: ({ fixtureId, actualHomeScore, actualAwayScore }) => {
        const target = get().predictions.find((p) => p.fixtureId === fixtureId);
        if (!target || target.isSettled) return null;
        const points = pointsFor(target, actualHomeScore, actualAwayScore);
        const next: Prediction = {
          ...target,
          actualHomeScore,
          actualAwayScore,
          pointsEarned: points,
          isSettled: true,
        };
        const notif: AppNotification = {
          id: makeId("notif"),
          type: "prediction_settled",
          title:
            points === 3
              ? "🎯 Exact score! +3 points"
              : points === 1
                ? "✅ Right winner! +1 point"
                : "Match settled",
          body: `${target.homeTeam} ${actualHomeScore}–${actualAwayScore} ${target.awayTeam} · you predicted ${target.predictedHomeScore}–${target.predictedAwayScore}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          predictions: state.predictions.map((p) => (p.id === target.id ? next : p)),
          notifications: [notif, ...state.notifications].slice(0, 30),
        }));
        // Trigger league recompute on next tick (cheap; idempotent)
        queueMicrotask(() => get().recomputeLeagueStats());
        return next;
      },

      createLeague: ({ name, description, isPublic }) => {
        const u = get().user;
        const member: PredictionLeagueMember = {
          userId: u?.id ?? "demo_anon",
          displayName: u?.displayName ?? "You",
          totalPoints: get().predictions.reduce((acc, p) => acc + p.pointsEarned, 0),
          totalPredictions: get().predictions.length,
          correctPredictions: get().predictions.filter((p) => p.pointsEarned > 0).length,
          joinedAt: new Date().toISOString(),
        };
        const league: PredictionLeague = {
          id: makeId("league"),
          name,
          description,
          inviteCode: makeInviteCode(),
          isPublic,
          createdBy: u?.id ?? "demo_anon",
          members: [member],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ predictionLeagues: [league, ...state.predictionLeagues] }));
        return league;
      },

      joinLeagueByCode: (inviteCode) => {
        const code = inviteCode.trim().toUpperCase();
        const u = get().user;
        const league = get().predictionLeagues.find((l) => l.inviteCode === code);
        if (!league) return null;
        const userId = u?.id ?? "demo_anon";
        if (league.members.some((m) => m.userId === userId)) return league;
        const member: PredictionLeagueMember = {
          userId,
          displayName: u?.displayName ?? "You",
          totalPoints: get().predictions.reduce((acc, p) => acc + p.pointsEarned, 0),
          totalPredictions: get().predictions.length,
          correctPredictions: get().predictions.filter((p) => p.pointsEarned > 0).length,
          joinedAt: new Date().toISOString(),
        };
        const next: PredictionLeague = { ...league, members: [...league.members, member] };
        set((state) => ({
          predictionLeagues: state.predictionLeagues.map((l) =>
            l.id === league.id ? next : l,
          ),
        }));
        return next;
      },

      leaveLeague: (leagueId) => {
        const u = get().user;
        const userId = u?.id ?? "demo_anon";
        set((state) => ({
          predictionLeagues: state.predictionLeagues
            .map((l) =>
              l.id === leagueId
                ? { ...l, members: l.members.filter((m) => m.userId !== userId) }
                : l,
            )
            .filter((l) => l.members.length > 0 || l.createdBy !== userId),
        }));
      },

      recomputeLeagueStats: () => {
        const u = get().user;
        const userId = u?.id ?? "demo_anon";
        const totalPoints = get().predictions.reduce((acc, p) => acc + p.pointsEarned, 0);
        const totalPredictions = get().predictions.length;
        const correctPredictions = get().predictions.filter((p) => p.pointsEarned > 0).length;
        set((state) => ({
          predictionLeagues: state.predictionLeagues.map((l) => ({
            ...l,
            members: l.members.map((m) =>
              m.userId === userId
                ? { ...m, totalPoints, totalPredictions, correctPredictions }
                : m,
            ),
          })),
        }));
      },

      voteInPoll: (pollId, optionId) => {
        set((state) => {
          const filtered = state.pollVotes.filter((v) => v.pollId !== pollId);
          return {
            pollVotes: [
              ...filtered,
              { pollId, optionId, votedAt: new Date().toISOString() },
            ],
          };
        });
      },

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              id: makeId("notif"),
              isRead: false,
              createdAt: new Date().toISOString(),
              ...n,
            },
            ...state.notifications,
          ].slice(0, 30),
        })),

      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      reset: () => {
        setSessionCookie(null);
        set({ ...EMPTY_USER_STATE });
      },
    }),
    {
      name: "futology.session",
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state?.user?.id) setSessionCookie(state.user.id);
      },
      migrate: (persisted, fromVersion) => {
        if (!persisted || typeof persisted !== "object") return persisted;
        const draft = { ...(persisted as Record<string, unknown>) };
        if (fromVersion < 2) {
          if (!Array.isArray(draft.predictions)) draft.predictions = [];
          if (!Array.isArray(draft.predictionLeagues)) draft.predictionLeagues = [];
          if (!Array.isArray(draft.pollVotes)) draft.pollVotes = [];
          if (!Array.isArray(draft.notifications)) draft.notifications = [];
        }
        return draft as SessionState;
      },
    },
  ),
);
