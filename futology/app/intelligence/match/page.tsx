import type { Metadata } from "next";
import { MatchPredictorView } from "./MatchPredictorView";

export const metadata: Metadata = { title: "Match Predictor" };

export default function MatchPredictorPage() {
  return <MatchPredictorView />;
}
