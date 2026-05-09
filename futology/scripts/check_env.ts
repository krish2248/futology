/**
 * Pre-deploy environment validation.
 *
 * Verifies that the variables required by each external integration are
 * present before the build runs against real services. Demo mode (no
 * `RAPIDAPI_KEY`) intentionally short-circuits — `lib/api/config.ts`
 * decides which branch to take, this script just enforces consistency.
 *
 * Run with `npx tsx scripts/check_env.ts` (or wire into a `predeploy`
 * npm script when the Vercel cutover lands).
 *
 * Exit codes:
 *   0 — environment looks valid for the chosen mode
 *   1 — required variables are missing
 */
type Var = { name: string; required: "always" | "if-real"; description: string };

const REQUIRED: Var[] = [
  { name: "NEXT_PUBLIC_BASE_PATH", required: "always", description: "Routing prefix — '' for Vercel, '/futology' for GH Pages." },
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: "if-real", description: "Supabase project URL." },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: "if-real", description: "Supabase anonymous key (browser-safe)." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: "if-real", description: "Supabase service role (server-only)." },
  { name: "RAPIDAPI_KEY", required: "if-real", description: "API-Football key — server-only, never expose." },
  { name: "RESEND_API_KEY", required: "if-real", description: "Resend transactional email key." },
  { name: "ML_SERVICE_URL", required: "if-real", description: "Base URL for the FastAPI ML microservice." },
  { name: "ML_SERVICE_TOKEN", required: "if-real", description: "Bearer token for the ML service." },
];

function main(): number {
  const isReal =
    !!process.env.RAPIDAPI_KEY && process.env.DEMO_MODE !== "true";
  const missing: Var[] = [];

  for (const v of REQUIRED) {
    if (v.required === "always" && !process.env[v.name]) {
      missing.push(v);
      continue;
    }
    if (v.required === "if-real" && isReal && !process.env[v.name]) {
      missing.push(v);
    }
  }

  console.log(
    `[check_env] mode=${isReal ? "real-services" : "demo"} · checked ${REQUIRED.length} variables`,
  );

  if (missing.length === 0) {
    console.log("[check_env] OK — environment looks valid.");
    return 0;
  }

  console.error("[check_env] MISSING required environment variables:");
  for (const v of missing) {
    console.error(`  - ${v.name}: ${v.description}`);
  }
  return 1;
}

process.exit(main());
