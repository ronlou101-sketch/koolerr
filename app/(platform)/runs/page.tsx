import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { timeAgo } from '@/shared/lib/time'
import { RUN_STATUS_LABELS, RUN_STATUS_BADGE_COLORS } from '@/shared/lib/run-status'

export default async function RunsPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const runsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  const runs = runsResult.ok ? runsResult.value : []
  const sortedRuns = [...runs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const completedCount = runs.filter((r) => r.status === 'completed').length
  const activeCount = runs.filter((r) => r.status === 'pending' || r.status === 'running').length

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Runs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {runs.length === 0
              ? 'No runs yet. Launch the pipeline to start your first one.'
              : `${runs.length} ${runs.length === 1 ? 'run' : 'runs'} total · ${completedCount} completed${activeCount > 0 ? ` · ${activeCount} active` : ''}`}
          </p>
        </div>
        <Link
          href="/pipeline"
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Launch Pipeline
        </Link>
      </div>

      {sortedRuns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No runs yet.</p>
          <Link
            href="/pipeline"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Launch your first pipeline →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {sortedRuns.map((run) => (
            <Link
              key={run.id}
              href={`/runs/${run.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{run.objective}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {timeAgo(run.createdAt)}
                  {run.deliverableIds.length > 0 && (
                    <>
                      {' '}
                      · {run.deliverableIds.length}{' '}
                      {run.deliverableIds.length === 1 ? 'deliverable' : 'deliverables'}
                    </>
                  )}
                </p>
              </div>
              <span
                className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_BADGE_COLORS[run.status]}`}
              >
                {RUN_STATUS_LABELS[run.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
