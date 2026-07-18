import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { businessBrainService } from '@/domains/business-brain'
import type { DeliverableFilter } from '@/domains/deliverables/types'
import type { EngagementRunId } from '@/shared/types'
import { RUN_STATUS_LABELS, RUN_STATUS_BADGE_COLORS } from '@/shared/lib/run-status'
import { findRunFailure } from './_lib/run-failure'

const DEPARTMENT_LABELS: Record<string, string> = {
  research: 'Research',
  strategy: 'Strategy',
  creative: 'Creative',
  video: 'Video Production',
  publishing: 'Publishing',
  approval: 'Approval',
  delivery: 'Delivery',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function RunDetailPage({ params }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { id } = await params
  const runId = id as EngagementRunId

  const runResult = await workforceEngineService.getEngagementRun(runId, ctx.organizationId)
  if (!runResult.ok) notFound()

  const run = runResult.value

  // These three reads are independent of each other, so fetch them in parallel:
  //   - all runs (lineage: parent + children)
  //   - deliverables (filtered to this run)
  //   - pipeline progress memories (to surface a failure, if any)
  const filter: DeliverableFilter = { organizationId: ctx.organizationId }
  const [allRunsResult, allDeliverablesResult, progressResult] = await Promise.all([
    workforceEngineService.listEngagementRuns(ctx.organizationId),
    deliverablesService.listDeliverables(filter),
    businessBrainService.queryMemory({
      organizationId: ctx.organizationId,
      relevanceScope: [run.id],
    }),
  ])

  const allRuns = allRunsResult.ok ? allRunsResult.value : []
  const parentRun = run.parentRunId ? allRuns.find((r) => r.id === run.parentRunId) : null
  const childRuns = allRuns.filter((r) => r.parentRunId === run.id)

  const runDeliverables = allDeliverablesResult.ok
    ? allDeliverablesResult.value.filter((d) => run.deliverableIds.includes(d.id))
    : []

  const failure =
    run.status === 'failed' && progressResult.ok
      ? findRunFailure(progressResult.value.memories)
      : null

  const statusLabel = RUN_STATUS_LABELS[run.status] ?? run.status
  const statusColor = RUN_STATUS_BADGE_COLORS[run.status] ?? 'bg-muted text-muted-foreground'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/runs" className="hover:text-foreground">
              Runs
            </Link>
            <span>/</span>
            <span className="font-mono">{run.id.slice(0, 16)}…</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">{run.objective}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{run.id}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Failure detail — which department stopped the run, and why */}
      {failure && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="mb-1 text-sm font-semibold text-destructive">
            Pipeline failed at {DEPARTMENT_LABELS[failure.department] ?? failure.department}
          </h2>
          <p className="text-sm text-muted-foreground">{failure.reason}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Earlier steps completed successfully. Relaunch the pipeline to try again.
          </p>
        </div>
      )}

      {/* Run metadata */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Run Details</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Workforce</dt>
            <dd className="font-mono text-xs">
              <Link href="/workforces" className="text-foreground hover:underline">
                {run.workforceId}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Participants</dt>
            <dd className="text-foreground">{run.participantIds.length}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Deliverables</dt>
            <dd className="text-foreground">{run.deliverableIds.length}</dd>
          </div>
          {run.startedAt && (
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="text-foreground">{run.startedAt.toLocaleString()}</dd>
            </div>
          )}
          {run.completedAt && (
            <div>
              <dt className="text-muted-foreground">Completed</dt>
              <dd className="text-foreground">{run.completedAt.toLocaleString()}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-foreground">{run.createdAt.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {/* Lineage */}
      {(parentRun || childRuns.length > 0) && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Run Lineage</h2>
          <div className="space-y-3">
            {parentRun && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Triggered by (parent run)</p>
                <Link
                  href={`/runs/${parentRun.id}`}
                  className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 hover:bg-muted/60"
                >
                  <span className="shrink-0 text-muted-foreground">↑</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {parentRun.objective}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{parentRun.id}</p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_BADGE_COLORS[parentRun.status] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {RUN_STATUS_LABELS[parentRun.status] ?? parentRun.status}
                  </span>
                </Link>
              </div>
            )}

            {childRuns.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Child runs ({childRuns.length})
                </p>
                <div className="space-y-2">
                  {childRuns.map((child) => (
                    <Link
                      key={child.id}
                      href={`/runs/${child.id}`}
                      className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 hover:bg-muted/60"
                    >
                      <span className="shrink-0 text-muted-foreground">↓</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {child.objective}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">{child.id}</p>
                      </div>
                      <span
                        className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_BADGE_COLORS[child.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {RUN_STATUS_LABELS[child.status] ?? child.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deliverables */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Deliverables ({runDeliverables.length})
        </h2>
        {runDeliverables.length === 0 ? (
          <p className="text-sm text-muted-foreground">No deliverables produced yet.</p>
        ) : (
          <div className="space-y-2">
            {runDeliverables.map((d) => (
              <Link
                key={d.id}
                href={`/deliverables/${d.id}`}
                className="flex items-start gap-3 rounded-md border bg-muted/40 p-3 hover:bg-muted/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {d.type.replace(/_/g, ' ')} · {d.createdAt.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.status === 'approved' || d.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : d.status === 'rejected'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {d.status.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
