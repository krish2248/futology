import type { Metadata } from "next";
import { SentimentStormView } from "./SentimentStormView";

export const metadata: Metadata = { title: "Sentiment Storm" };

export default function SentimentPage() {
  return <SentimentStormView />;
}
