/**
 * Auth auto-router.
 *
 * Routes `signIn` and `signOut` to Supabase OTP when the project is
 * configured, otherwise to the existing Zustand demo store. Same
 * return shape on both branches so callers (the /login page, settings
 * danger zone) don't branch on auth mode.
 *
 * What "configured" means:
 *   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
 *   - `getSupabaseBrowserClient()` returns a non-null client
 *
 * The static-export GH Pages demo build leaves both vars unset, so
 * `signInAuto({email})` keeps emitting a synthetic demo user — the
 * live URL behaves exactly as today. The Vercel target sets both,
 * triggering the OTP path.
 */

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSession, type DemoUser } from "@/lib/store/session";

export type SignInResult =
  | { mode: "demo"; user: DemoUser }
  | { mode: "supabase-otp"; emailSentTo: string };

/**
 * Sign in. When Supabase is configured, sends a magic link to the
 * supplied email and returns immediately — the user lands back on
 * `/login?next=…` after clicking the link. When unconfigured, creates
 * a deterministic demo user in localStorage (existing behaviour).
 */
export async function signInAuto(email: string): Promise<SignInResult> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error(
        "isSupabaseConfigured() returned true but the browser client is null. " +
          "Check env var hygiene at build time.",
      );
    }
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/onboarding`
        : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });
    if (error) throw error;
    return { mode: "supabase-otp", emailSentTo: email };
  }

  // Demo path — synchronous Zustand action, wrapped for the unified
  // async signature.
  const user = useSession.getState().signIn(email);
  return { mode: "demo", user };
}

/**
 * Sign out. Clears both the Supabase session (if any) and the Zustand
 * demo state — that way switching between modes mid-session leaves no
 * stale store entries.
 */
export async function signOutAuto(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  }
  useSession.getState().signOut();
}
