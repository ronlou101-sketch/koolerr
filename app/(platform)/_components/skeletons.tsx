/**
 * Presentational loading skeletons shared across platform pages.
 *
 * Each page's `loading.tsx` composes these primitives (wrapped in `animate-pulse`)
 * so the skeleton roughly matches the real layout while data is fetched. Purely
 * decorative — no data, no logic.
 */

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-8 w-48 rounded-md bg-muted" />
      <div className="h-4 w-full max-w-md rounded bg-muted" />
    </div>
  )
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-36 rounded-lg border border-border bg-card" />
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
          <div className="ml-4 h-5 w-16 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  )
}
