export default function TowerLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-7 w-40 rounded-md bg-muted" />
      <div className="mb-2 h-4 w-full max-w-sm rounded bg-muted" />
      <div className="mb-8 h-4 w-48 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-border bg-card" />
        ))}
      </div>
    </div>
  )
}
