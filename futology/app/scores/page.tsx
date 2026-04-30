import type { Metadata } from "next";
import { ScoresView } from "./ScoresView";

export const metadata: Metadata = { title: "Scores" };

export default function ScoresPage() {
  return <ScoresView />;
}
