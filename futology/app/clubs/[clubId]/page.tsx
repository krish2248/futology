import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLUBS, findClub } from "@/lib/data/clubs";
import { ClubDetailView } from "./ClubDetailView";

type Params = { clubId: string };

export function generateStaticParams(): Params[] {
  return CLUBS.map((c) => ({ clubId: String(c.id) }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const club = findClub(Number(params.clubId));
  return { title: club?.name ?? "Club" };
}

export default function ClubPage({ params }: { params: Params }) {
  const id = Number(params.clubId);
  const club = findClub(id);
  if (!club) notFound();
  return <ClubDetailView clubId={id} />;
}
