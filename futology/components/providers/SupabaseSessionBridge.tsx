"use client";

import { useEffect } from "react";

import { useSession, type DemoUser } from "@/lib/store/session";

/**
 * Bridges a Supabase auth session into the app's session store.
 *
 * Why this exists: `AuthGate` gates protected routes on
 * `useSession(s => s.user)`. In Supabase OTP mode, `signInAuto` sends the
 * magic link but nothing populates that store slice when the user lands
 * back via the redirect — so without this bridge the user would bounce
 * straight back to `/login`. This component closes that loop: it reads the
 * Supabase session on mount and subscribes to auth changes, mirroring the
 * authenticated user into the store so the rest of the app (which only
 * knows about `useSession`) works unchanged.
 *
 * Bundle hygiene: the check is a pure `process.env` read (no Supabase
 * import), and the client is pulled via a dynamic `import()` only when
 * configured. That keeps `@supabase/ssr` out of the shared layout chunk —
 * the static-export demo build never downloads it.
 *
 * Renders nothing.
 */
export function SupabaseSessionBridge() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Env-only gate — same condition as `isSupabaseConfigured()` but
    // without importing the Supabase client module (and its deps).
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowserClient();
      if (!supabase || !active) return;

      // Instantiating the browser client above triggers
      // `detectSessionInUrl`, which exchanges the magic-link code in the
      // URL for a session before the first `getSession()` resolves.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      let notifUnsub: (() => void) | null = null;

      async function rehydrateUser(userId: string) {
        const [{ rehydrateFollows }, { rehydratePredictions }, { rehydrateNotifications, subscribeToNotifications }, { rehydrateLeagues }, { rehydratePollVotes }] =
          await Promise.all([
            import("@/lib/supabase/followSync"),
            import("@/lib/supabase/predictionsSync"),
            import("@/lib/supabase/notificationsSync"),
            import("@/lib/supabase/leaguesSync"),
            import("@/lib/supabase/pollsSync"),
          ]);
        rehydrateFollows(userId);
        rehydratePredictions(userId);
        rehydrateNotifications(userId);
        rehydrateLeagues(userId);
        rehydratePollVotes(userId);
        notifUnsub?.();
        notifUnsub = subscribeToNotifications(userId, (notification) => {
          useSession.getState().prependNotification(notification);
        });
      }

      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        useSession.getState().setAuthUser(user);
        rehydrateUser(user.id);
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        if (nextSession?.user) {
          const user = mapSupabaseUser(nextSession.user);
          useSession.getState().setAuthUser(user);
          rehydrateUser(user.id);
        } else if (event === "SIGNED_OUT") {
          notifUnsub?.();
          // Only clear on an explicit sign-out — an empty INITIAL_SESSION
          // must not wipe a store that another path populated.
          useSession.getState().signOut();
        }
      });
      unsubscribe = () => {
        subscription.unsubscribe();
        notifUnsub?.();
      };
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return null;
}

/** Minimal shape we read off the Supabase user — avoids importing the
 * `@supabase/supabase-js` `User` type into the shared chunk. */
type SupabaseUserLike = {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown> | null;
};

/**
 * Maps a Supabase auth user onto the app's `DemoUser` shape. Keeps the
 * real UUID as `id`; derives a display name from metadata or the email
 * local part, title-cased to match the demo path's formatting.
 */
function mapSupabaseUser(user: SupabaseUserLike): DemoUser {
  const email = (user.email ?? "").trim().toLowerCase();
  const meta = user.user_metadata ?? {};
  const rawName =
    (typeof meta.display_name === "string" && meta.display_name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    email.split("@")[0] ||
    "Friend";
  const displayName = rawName
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: user.id,
    email,
    displayName,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}
