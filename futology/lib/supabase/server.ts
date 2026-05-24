/**
 * Server-side Supabase client for Route Handlers, Server Actions, and
 * Server Components on the Vercel target.
 *
 * Unused by the static-export GH Pages build (`output: 'export'` has
 * no server runtime) — the file is dead code there. The Vercel
 * deployment doesn't set `NEXT_OUTPUT=export`, so it picks up the
 * server runtime + this client.
 *
 * Callers MUST be inside a request context; passing the `cookies()`
 * helper from `next/headers` is the documented pattern.
 */

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";

import type { Database } from "./types";

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set?: (name: string, value: string, options: CookieOptions) => void;
};

export function getSupabaseServerClient(cookieStore: CookieStore) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing on server: NEXT_PUBLIC_SUPABASE_URL / " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY required. The static-export build " +
        "should not import lib/supabase/server.ts — guard with " +
        "isSupabaseConfigured() at the call site.",
    );
  }
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        cookieStore.set?.(name, value, options);
      },
      remove: (name: string, options: CookieOptions) => {
        cookieStore.set?.(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}
