export function ScoresSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((g) => (
          <div key={g} className="space-y-2">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 border border-border rounded-lg flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                  </div>
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
