import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findLeague, LEAGUES } from "@/lib/data/leagues";
import { LeagueDetailView } from "./LeagueDetailView";

type Params = { leagueId: string };

export function generateStaticParams(): Params[] {
  return LEAGUES.map((l) => ({ leagueId: String(l.id) }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const league = findLeague(Number(params.leagueId));
  return { title: league?.name ?? "League" };
}

export default function LeaguePage({ params }: { params: Params }) {
  const id = Number(params.leagueId);
  const league = findLeague(id);
  if (!league) notFound();
  return <LeagueDetailView leagueId={id} />;
}
