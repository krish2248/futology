import { NewsSkeleton } from "@/components/shared/NewsSkeleton";

export default function Loading() {
  return (
    <div className="container-page py-6">
      <NewsSkeleton />
    </div>
  );
}
