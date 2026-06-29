import Link from 'next/link'
import { getWorkforceStatusData } from './workforce-data'
import type { WorkforceHealth } from './workforce-data'

export const dynamic = 'force-dynamic'

const HEALTH_DOT: Record<WorkforceHealth, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-400',
  critical: 'bg-destructive',
  'not-configured': 'bg-muted-foreground/30',
}

const HEALTH_LABEL: Record<WorkforceHealth, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  'not-configured': 'No Runs',
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  pending: 'bg-muted text-muted-foreground',
  awaiting_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  canceled: 'bg-muted text-muted-foreground',
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`
  return `${(ms / 3_600_000).toFixed(1)}h`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}

export default async function WorkforceStatusPage() {
  const data = await getWorkforceStatusData()
  const { workforces, totalRunsAllWorkforces, generatedAt } = data

  const generatedTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const healthyCount = workforces.filter((w) => w.health === 'healthy').length
  const warningCount = workforces.filter((w) => w.health === 'warning').length
  const criticalCount = workforces.filter((w) => w.health === 'critical').length
  const idleCount = workforces.filter((w) => w.health === 'not-configured').length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Workforce Status</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">AI Workforce Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational status of every AI workforce across all organizations
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {generatedTime} · Refreshes on load
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Workforces', value: workforces.length },
          { label: 'Healthy', value: healthyCount },
          { label: 'Warning', value: warningCount },
          { label: 'Critical', value: criticalCount },
          { label: 'No Runs', value: idleCount },
          { label: 'Total Runs', value: totalRunsAllWorkforces },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Workforce Cards */}
      {workforces.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No AI workforces found</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Workforces are created by customer organizations. None exist yet.
          </p>
          <Link
            href="/tower/orgs"
            className="mt-3 inline-block text-xs text-foreground underline-offset-2 hover:underline"
          >
            View organizations →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workforces.map((wf) => (
            <div key={wf.workforceId} className="rounded-lg border border-border bg-card p-4">
              {/* Name + health */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${HEALTH_DOT[wf.health]}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{wf.workforceName}</p>
                    <p className="text-xs text-muted-foreground">{wf.businessFunction}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {HEALTH_LABEL[wf.health]}
                </span>
              </div>

              {/* Run stats */}
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total runs</p>
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {wf.totalRuns}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {wf.completedRuns}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p
                    className={`text-sm font-semibold tabular-nums ${wf.failedRuns > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}
                  >
                    {wf.failedRuns}
                  </p>
                </div>
                {wf.runningRuns > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Running</p>
                    <p className="text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-400">
                      {wf.runningRuns}
                    </p>
                  </div>
                )}
                {wf.awaitingApprovalRuns > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                    <p className="text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {wf.awaitingApprovalRuns}
                    </p>
                  </div>
                )}
                {wf.pendingRuns > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {wf.pendingRuns}
                    </p>
                  </div>
                )}
              </div>

              {/* Last execution detail */}
              {wf.lastRunAt && (
                <div className="mt-3 border-t border-border/50 pt-3">
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Last execution</p>
                      <p className="text-xs font-medium text-foreground">{timeAgo(wf.lastRunAt)}</p>
                    </div>
                    {wf.lastRunStatus && (
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[wf.lastRunStatus] ?? STATUS_BADGE.canceled}`}
                        >
                          {wf.lastRunStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                    {wf.lastRunDurationMs !== null && wf.lastRunDurationMs > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-xs font-medium text-foreground">
                          {formatDuration(wf.lastRunDurationMs)}
                        </p>
                      </div>
                    )}
                    {wf.lastRunObjective && (
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Objective</p>
                        <p className="line-clamp-2 text-xs text-foreground">
                          {wf.lastRunObjective}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Last error */}
              {wf.lastError && (
                <div className="mt-2 rounded-md bg-red-50 px-3 py-2 dark:bg-red-950/30">
                  <p className="text-xs font-medium text-red-800 dark:text-red-300">Last error</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-400">
                    {wf.lastError}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-right">
        <Link href="/tower/runs" className="text-xs text-muted-foreground hover:text-foreground">
          View all AI run activity →
        </Link>
      </div>
    </div>
  )
}
