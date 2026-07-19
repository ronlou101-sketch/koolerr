import { ListSkeleton } from '../_components/skeletons'

export default function RunsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded-md bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted" />
      </div>
      <ListSkeleton rows={6} />
    </div>
  )
}
