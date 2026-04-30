import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";
import { StatTile } from "@/components/shared/StatTile";
import { INTEL_FEATURES } from "@/lib/constants/intelligence";

export const metadata: Metadata = { title: "Intelligence" };

export default function IntelligencePage() {
  return (
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
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Model performance
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Match accuracy" value="—" hint="Trained Phase 3" />
          <StatTile label="Player clusters" value="6" hint="KMeans" />
          <StatTile label="Sentiment F1" value="—" hint="Reddit · RoBERTa" />
          <StatTile label="Last trained" value="—" hint="Pending" />
        </div>
      </section>
    </div>
  );
}
