import type { Metadata } from "next";
import { FantasyIQView } from "./FantasyIQView";

export const metadata: Metadata = { title: "Fantasy IQ" };

export default function FantasyPage() {
  return <FantasyIQView />;
}
