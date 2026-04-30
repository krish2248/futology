import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { INTEL_FEATURES } from "@/lib/constants/intelligence";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return INTEL_FEATURES.map((feature) => ({ slug: feature.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const feature = INTEL_FEATURES.find((f) => f.slug === params.slug);
  return { title: feature?.title ?? "Intelligence" };
}

export default function IntelligenceFeaturePage({
  params,
}: {
  params: Params;
}) {
  const feature = INTEL_FEATURES.find((f) => f.slug === params.slug);
  if (!feature) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Intelligence Hub
      </Link>
      <PageHeader title={feature.title} description={feature.description} />
      <EmptyState
        icon={feature.icon}
        title={`${feature.title} ships in a later phase`}
        description="The UI shell is here. The model and data wiring arrives in Phase 3 (ML service) and Phase 4 (intelligence pages)."
      />
    </div>
  );
}
