import type { Metadata } from "next";
import { TournamentSimulatorView } from "./TournamentSimulatorView";

export const metadata: Metadata = { title: "Tournament Simulator" };

export default function TournamentSimulatorPage() {
  return <TournamentSimulatorView />;
}
