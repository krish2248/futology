import type { Metadata } from "next";
import { MomentumView } from "./MomentumView";

export const metadata: Metadata = { title: "Match Momentum" };

export default function MomentumPage() {
  return <MomentumView />;
}
