import type { Metadata } from "next";
import { InjuriesView } from "./InjuriesView";

export const metadata: Metadata = { title: "Injury Intelligence" };

export default function InjuriesPage() {
  return <InjuriesView />;
}
