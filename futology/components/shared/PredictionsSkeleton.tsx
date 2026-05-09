export function PredictionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 border border-border rounded-lg space-y-2">
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            <div className="h-7 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-2 w-full bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-12 bg-muted rounded animate-pulse" />
              <div className="h-12 bg-muted rounded animate-pulse" />
              <div className="h-12 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
