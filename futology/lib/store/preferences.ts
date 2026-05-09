"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Keys for each user-controllable notification channel. Mirrors the
 * `notifications_enabled` JSONB column in `profiles` (bible §6) so the
 * Supabase cutover is a one-to-one map.
 */
export type NotificationKey =
  | "matchStart"
  | "goal"
  | "transfer"
  | "predictionSettled"
  | "weeklyDigest";

export const NOTIFICATION_LABELS: Record<
  NotificationKey,
  { title: string; description: string }
> = {
  matchStart: {
    title: "Match starting",
    description: "Ping me 5 minutes before kickoff for matches I'm following.",
  },
  goal: {
    title: "Goal alerts",
    description: "Live goal events for my followed clubs and players.",
  },
  transfer: {
    title: "Transfer alerts",
    description: "Confirmed transfers for clubs and players I follow.",
  },
  predictionSettled: {
    title: "Prediction settled",
    description: "Match finished and points awarded.",
  },
  weeklyDigest: {
    title: "Weekly digest",
    description: "Sunday recap with your accuracy, leaderboard rank, and next week's fixtures.",
  },
};

type PreferencesState = {
  notifications: Record<NotificationKey, boolean>;
  emailEnabled: boolean;
  toggleNotification: (key: NotificationKey) => void;
  setEmailEnabled: (value: boolean) => void;
};

/**
 * Persisted Zustand slice for user notification preferences.
 *
 * Stored under `futology.preferences` in localStorage; separate from the
 * session store so toggling a preference doesn't churn the auth slice.
 */
export const useNotificationPreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      notifications: {
        matchStart: true,
        goal: true,
        transfer: true,
        predictionSettled: true,
        weeklyDigest: true,
      },
      emailEnabled: true,
      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),
      setEmailEnabled: (value) => set({ emailEnabled: value }),
    }),
    { name: "futology.preferences", version: 1 },
  ),
);
