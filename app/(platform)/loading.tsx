export default function PlatformLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6">
      <div className="mb-6 h-8 w-48 rounded-md bg-muted" />
      <div className="mb-3 h-4 w-full max-w-lg rounded bg-muted" />
      <div className="mb-8 h-4 w-72 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg border border-border bg-card" />
        ))}
      </div>
    </div>
  )
}
