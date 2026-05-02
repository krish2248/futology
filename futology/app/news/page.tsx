import type { Metadata } from "next";
import { NewsView } from "./NewsView";

export const metadata: Metadata = { title: "News" };

export default function NewsPage() {
  return <NewsView />;
}
