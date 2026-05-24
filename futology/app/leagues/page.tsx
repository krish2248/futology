import type { Metadata } from "next";
import { LeaguesView } from "./LeaguesView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = { title: "Leagues" };

export default function LeaguesPage() {
  return (
    <ErrorBoundary>
      <LeaguesView />
    </ErrorBoundary>
  );
}
