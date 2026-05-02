import type { Metadata } from "next";
import { ClubsView } from "./ClubsView";

export const metadata: Metadata = { title: "Clubs" };

export default function ClubsPage() {
  return <ClubsView />;
}
