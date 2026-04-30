import Link from "next/link";
import {
  Trophy,
  Target,
  Brain,
  Newspaper,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/shared/Card";
import { LiveBadge } from "@/components/shared/LiveBadge";
import { StatTile } from "@/components/shared/StatTile";
import { PageHeader } from "@/components/shared/PageHeader";

const QUICK_LINKS = [
  {
    href: "/scores",
    icon: Trophy,
    title: "Live Scores",
    description: "Today's matches, updated in real time.",
  },
  {
    href: "/predictions",
    icon: Target,
    title: "Predictions",
    description: "Pick scores. Climb the leaderboard.",
  },
  {
    href: "/intelligence",
    icon: Brain,
    title: "Intelligence",
    description: "ML-powered match, player & tactical insight.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="surface relative overflow-hidden p-6 md:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-accent">
            <Sparkles className="h-3 w-3" aria-hidden />
            Welcome to FUTOLOGY
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            Every Goal.{" "}
            <span className="text-accent">Every Emotion.</span> Every Insight.
          </h1>
          <p className="mt-3 max-w-2xl text-text-secondary">
            One home for live scores, ML-powered match prediction, player
            playing-style clusters, sentiment, tactics, transfer values and
            fantasy optimization. Built for fans who want the data behind the
            game.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/scores"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
            >
              View live scores <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-accent/40"
            >
              Explore intelligence
            </Link>
          </div>
        </div>
      </section>

      <section>
        <PageHeader
          title="Live now"
          description="Auto-refreshes every 30 seconds during matches."
          action={<LiveBadge />}
        />
        <Card className="flex flex-col items-start gap-2">
          <p className="text-sm text-text-secondary">
            No live matches right now. Check back at kickoff.
          </p>
          <Link
            href="/scores"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            See upcoming fixtures →
          </Link>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Jump in</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className="group block">
                <Card hover className="flex h-full items-start gap-4">
                  <div
                    aria-hidden
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-muted text-accent"
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{link.title}</p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {link.description}
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
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Your snapshot
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile label="Predictions" value="0" hint="All time" />
          <StatTile label="Accuracy" value="—" hint="Pick your first match" />
          <StatTile label="Following" value="0" hint="Leagues, clubs, players" />
          <StatTile label="Streak" value="0" hint="Correct in a row" />
        </div>
      </section>

      <section>
        <PageHeader
          title="News"
          description="Filtered to your followed teams once you're signed in."
        />
        <Card className="flex items-start gap-3">
          <div
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-bg-elevated text-text-secondary"
          >
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">News feed will appear here</p>
            <p className="mt-1 text-sm text-text-secondary">
              We&apos;ll wire NewsAPI in Phase 2 and personalize it to the
              leagues, clubs and players you follow.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
