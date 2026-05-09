/**
 * Single source of truth for app-level metadata. Imported by `app/layout.tsx`
 * for `<Metadata>`, by the manifest, and anywhere we need the canonical
 * product name or tagline rendered.
 *
 * Updating these here propagates to every surface that imports them —
 * avoid scattering hard-coded "FUTOLOGY" strings across the codebase.
 */
export const APP = {
  name: "FUTOLOGY",
  tagline: "Every Goal. Every Emotion. Every Insight.",
  description:
    "Football intelligence platform — live scores, ML predictions, sentiment, tactics, transfer values, fantasy optimisation.",
  liveUrl: "https://krish2248.github.io/futology/",
  repoUrl: "https://github.com/krish2248/futology",
  author: "Sonik Krish",
  authorEmail: "sonikrish2248@gmail.com",
  /** Defaults to dark; theme toggle is intentionally out of scope. */
  theme: "dark" as const,
  /** Background color for the manifest + apple-touch icons. */
  backgroundColor: "#0A0A0A",
  /** Primary accent — the only colour allowed for primary CTAs. */
  accentColor: "#00D563",
} as const;

export type AppMetadata = typeof APP;
