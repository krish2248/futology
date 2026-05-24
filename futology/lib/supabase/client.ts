/**
 * Browser-side Supabase client.
 *
 * Returns `null` when the project isn't configured (no
 * `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Callers
 * should branch on that and fall back to the Zustand demo path —
 * `lib/auth/auto.ts` is the canonical consumer.
 *
 * The static-export GH Pages build can use this for direct browser-only
 * calls (e.g. realtime polls) but auth itself requires SSR cookies, so
 * the full auth flow lights up on the Vercel target — see
 * `docs/SUPABASE_CUTOVER.md`.
 */

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

export type SupabaseBrowserClient = ReturnType<
  typeof createBrowserClient<Database>
>;

let cached: SupabaseBrowserClient | null = null;

/**
 * Reads the env at call time so the static-export demo bundle can ship
 * without any keys and light up the moment the env is set in the
 * Vercel build (or via `NEXT_PUBLIC_*` repo secrets for GH Pages).
 */
export function getSupabaseBrowserClient(): SupabaseBrowserClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  cached = createBrowserClient<Database>(url, anonKey);
  return cached;
}

/**
 * `true` iff both env vars are present at runtime. Cheap branch
 * helper — use this before showing OTP-only UI affordances so the demo
 * deploy keeps its "click to sign in" copy.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
