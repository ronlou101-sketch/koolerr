export function TowerCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export function TowerSectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section className="space-y-3">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <TowerCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}
