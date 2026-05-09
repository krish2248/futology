import { PredictionsSkeleton } from "@/components/shared/PredictionsSkeleton";

export default function Loading() {
  return (
    <div className="container-page py-6">
      <PredictionsSkeleton />
    </div>
  );
}
