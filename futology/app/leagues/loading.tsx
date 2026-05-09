import { LeaguesSkeleton } from "@/components/shared/LeaguesSkeleton";

export default function Loading() {
  return (
    <div className="container-page py-6">
      <LeaguesSkeleton />
    </div>
  );
}
