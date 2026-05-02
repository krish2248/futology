import type { Metadata } from "next";
import { NewsView } from "./NewsView";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  return (
    <ErrorBoundary>
      <NewsView />
    </ErrorBoundary>
  );
}
