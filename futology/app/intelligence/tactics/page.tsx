import type { Metadata } from "next";
import { TacticBoardView } from "./TacticBoardView";

export const metadata: Metadata = { title: "TacticBoard" };

export default function TacticsPage() {
  return <TacticBoardView />;
}
