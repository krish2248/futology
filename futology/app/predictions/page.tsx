import type { Metadata } from "next";
import { PredictionsView } from "./PredictionsView";

export const metadata: Metadata = { title: "Predictions" };

export default function PredictionsPage() {
  return <PredictionsView />;
}
