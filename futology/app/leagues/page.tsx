import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LEAGUES } from "@/lib/data/leagues";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/shared/Card";

export const metadata: Metadata = { title: "Leagues" };

export default function LeaguesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leagues"
        description="Click a league for live standings, top scorers and assists."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEAGUES.map((l) => (
          <Link key={l.id} href={`/leagues/${l.id}`} className="group block">
            <Card hover className="flex h-full items-center gap-3">
              <span aria-hidden className="text-2xl">
                {l.flag}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.name}</p>
                <p className="truncate text-xs text-text-secondary">
                  {l.country} · {l.shortName}
                </p>
              </div>
              <ArrowRight
                aria-hidden
                className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
