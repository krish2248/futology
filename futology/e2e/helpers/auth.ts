import type { Page } from "@playwright/test";

/**
 * Primes the Zustand session store in localStorage before any page script
 * runs, so AuthGate sees a hydrated demo user and doesn't redirect to
 * `/login`. Mirrors the shape persisted by `lib/store/session.ts`
 * (storage key `futology.session`, version 2).
 *
 * Call before `page.goto(...)` in any test that exercises a protected
 * route. Skip for tests that explicitly cover the unauthenticated /login
 * or /onboarding flows.
 */
export async function seedAuth(page: Page): Promise<void> {
  const user = {
    id: "demo-e2e-user",
    email: "e2e@futology.test",
    displayName: "E2E Tester",
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
  };
  const state = {
    state: {
      user,
      onboardingComplete: true,
      followedLeagues: [],
      followedClubs: [],
      followedPlayers: [],
      followedTournaments: [],
      predictions: [],
      predictionLeagues: [],
      pollVotes: [],
      notifications: [],
    },
    version: 2,
  };
  await page.addInitScript((payload) => {
    try {
      window.localStorage.setItem("futology.session", payload);
      document.cookie = "futology_session=demo-e2e-user; path=/";
    } catch {
      // ignore — Playwright sometimes injects before storage is ready
    }
  }, JSON.stringify(state));
}
