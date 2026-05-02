import type { Metadata } from "next";
import { ClubsView } from "./ClubsView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = { title: "Clubs" };

export default function ClubsPage() {
  return (
    <ErrorBoundary>
      <ClubsView />
    </ErrorBoundary>
  );
}
