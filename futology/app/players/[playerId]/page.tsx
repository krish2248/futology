import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findPlayer, PLAYERS } from "@/lib/data/players";
import { PlayerDetailView } from "./PlayerDetailView";

type Params = { playerId: string };

export function generateStaticParams(): Params[] {
  return PLAYERS.map((p) => ({ playerId: String(p.id) }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const p = findPlayer(Number(params.playerId));
  return { title: p?.name ?? "Player" };
}

export default function PlayerPage({ params }: { params: Params }) {
  const id = Number(params.playerId);
  const player = findPlayer(id);
  if (!player) notFound();
  return <PlayerDetailView playerId={id} />;
}
