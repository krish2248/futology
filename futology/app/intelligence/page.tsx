import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { INTEL_FEATURES } from "@/lib/constants/intelligence";
import { EXTRA_FEATURES } from "@/lib/constants/extras";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = { title: "Intelligence" };

export default function IntelligencePage() {
  return (
    <ErrorBoundary>
      <div className="space-y-8">
      <PageHeader
        title="Intelligence Hub"
        description="Six ML-powered lenses on the game. Pick one to dive in."
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {INTEL_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.slug}
              href={`/intelligence/${feature.slug}`}
              className="group block"
            >
              <Card hover className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div
                    aria-hidden
                    className="grid h-10 w-10 place-items-center rounded-lg bg-accent-muted text-accent"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-text-muted">
                    {feature.tagline}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-sm font-medium text-accent">
                  Open
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Extras</h2>
            <p className="text-sm text-text-secondary">
              {EXTRA_FEATURES.length} wishlist features beyond the core six.
            </p>
          </div>
          <Link
            href="/intelligence/extras"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View all <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {EXTRA_FEATURES.slice(0, 3).map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.slug}
                href={`/intelligence/extras/${feature.slug}`}
                className="group block"
              >
                <Card hover className="flex h-full items-start gap-3">
                  <div
                    aria-hidden
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-muted text-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{feature.title}</p>
                    <p className="line-clamp-2 text-xs text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                  <ArrowRight
                    aria-hidden
                    className="ml-auto mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden /> Model performance
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Match accuracy" value="—" hint="Trained Phase 3" />
          <StatTile label="Player clusters" value="6" hint="KMeans" />
          <StatTile label="Sentiment F1" value="—" hint="Reddit · RoBERTa" />
          <StatTile label="Last trained" value="—" hint="Pending" />
        </div>
      </section>
    </div>
    </ErrorBoundary>
  );
}
