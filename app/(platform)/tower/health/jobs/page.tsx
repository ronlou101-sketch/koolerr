import Link from 'next/link'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'

export default function JobsHealthPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <Link href="/tower/health" className="hover:text-foreground">
              System Health
            </Link>
            <span>/</span>
            <span className="text-foreground">Background Jobs</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Background Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Async task execution status, queue depth, and processing reliability.
          </p>
        </div>
        <TowerHealthBadge status="not-configured" />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">No Background Job Queue Configured</p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
          Background job monitoring requires a job queue implementation. The current platform
          processes tasks synchronously or via Supabase Edge Functions without a persistent job
          queue table.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          To enable: implement a job_queue table or connect a queue service (BullMQ, Inngest, etc.)
        </p>
      </div>

      <TowerHealthCalc
        description="Background job health would track the following once a queue is implemented:"
        rules={[
          'Healthy when queue depth is low and jobs are processing within expected time.',
          'Warning when queue depth exceeds threshold or job failure rate increases.',
          'Critical when jobs are stuck, the queue is growing uncontrollably, or workers are offline.',
        ]}
      />
    </div>
  )
}
