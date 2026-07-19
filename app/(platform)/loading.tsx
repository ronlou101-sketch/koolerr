import { PageHeaderSkeleton, CardGridSkeleton } from './_components/skeletons'

export default function PlatformLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  )
}
