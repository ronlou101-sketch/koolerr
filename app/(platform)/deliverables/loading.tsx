import { ListSkeleton } from '../_components/skeletons'

export default function DeliverablesLoading() {
  return (
    <div className="animate-pulse space-y-10">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-md bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
      </div>
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <ListSkeleton rows={3} />
        </div>
      ))}
    </div>
  )
}
