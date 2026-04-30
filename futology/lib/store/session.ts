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

type SessionState = {
  user: DemoUser | null;
  onboardingComplete: boolean;
  followedLeagues: FollowedLeague[];
  followedClubs: FollowedClub[];
  followedPlayers: FollowedPlayer[];
  followedTournaments: FollowedTournament[];

  signIn: (email: string) => DemoUser;
  signOut: () => void;
  completeOnboarding: () => void;
  toggleLeague: (league: FollowedLeague) => void;
  toggleClub: (club: FollowedClub) => void;
  togglePlayer: (player: FollowedPlayer) => void;
  toggleTournament: (tournament: FollowedTournament) => void;
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

function toggleBy<T extends { id: number }>(
  list: T[],
  candidate: T,
): T[] {
  return list.some((item) => item.id === candidate.id)
    ? list.filter((item) => item.id !== candidate.id)
    : [...list, candidate];
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      onboardingComplete: false,
      followedLeagues: [],
      followedClubs: [],
      followedPlayers: [],
      followedTournaments: [],

      signIn: (email) => {
        const user = makeUser(email);
        setSessionCookie(user.id);
        set({ user });
        return user;
      },

      signOut: () => {
        setSessionCookie(null);
        set({
          user: null,
          onboardingComplete: false,
          followedLeagues: [],
          followedClubs: [],
          followedPlayers: [],
          followedTournaments: [],
        });
      },

      completeOnboarding: () => set({ onboardingComplete: true }),

      toggleLeague: (league) =>
        set((state) => ({
          followedLeagues: toggleBy(state.followedLeagues, league),
        })),
      toggleClub: (club) =>
        set((state) => ({
          followedClubs: toggleBy(state.followedClubs, club),
        })),
      togglePlayer: (player) =>
        set((state) => ({
          followedPlayers: toggleBy(state.followedPlayers, player),
        })),
      toggleTournament: (tournament) =>
        set((state) => ({
          followedTournaments: toggleBy(state.followedTournaments, tournament),
        })),

      reset: () => {
        setSessionCookie(null);
        set({
          user: null,
          onboardingComplete: false,
          followedLeagues: [],
          followedClubs: [],
          followedPlayers: [],
          followedTournaments: [],
        });
      },
    }),
    {
      name: "futology.session",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state?.user?.id) setSessionCookie(state.user.id);
      },
    },
  ),
);
