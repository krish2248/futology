import { ClubsSkeleton } from "@/components/shared/ClubsSkeleton";

export default function Loading() {
  return (
    <div className="container-page py-6">
      <ClubsSkeleton />
    </div>
  );
}
