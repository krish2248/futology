export function IntelligenceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 border border-border rounded-lg space-y-3">
            <div className="w-10 h-10 bg-muted rounded animate-pulse" />
            <div className="h-5 bg-muted rounded w-2/3 animate-pulse" />
            <div className="h-3 bg-muted rounded w-full animate-pulse" />
            <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
