import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { identityService } from '@/domains/identity'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { approvalWorkflowService } from '@/shared/approval'
import { LiveRunsPanel } from './_components/LiveRunsPanel'
import { computeMediaStats } from './_components/media-stats'
import { timeAgo } from '@/shared/lib/time'

const STATUS_LABELS = {
  pending: 'Pending',
  running: 'Running',
  awaiting_approval: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
} as const

const STATUS_COLORS = {
  pending: 'text-muted-foreground',
  running: 'text-blue-600',
  awaiting_approval: 'text-yellow-600 font-medium',
  approved: 'text-green-600',
  rejected: 'text-destructive',
  completed: 'text-green-600',
  failed: 'text-destructive',
} as const

export default async function DashboardPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login?error=account_error')

  const [
    orgResult,
    brainResult,
    runsResult,
    allDeliverablesResult,
    workforcesResult,
    approvalsResult,
  ] = await Promise.all([
    identityService.findOrganizationById(ctx.organizationId),
    businessBrainService.queryMemory({ organizationId: ctx.organizationId, limit: 100 }),
    workforceEngineService.listEngagementRuns(ctx.organizationId),
    deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
    workforceEngineService.listWorkforces(ctx.organizationId),
    approvalWorkflowService.listPending(ctx.organizationId, ctx.tenantId),
  ])

  const orgName = orgResult.ok ? orgResult.value.name : 'Your Organization'
  const brainMemories = brainResult.ok ? brainResult.value.memories : []
  const memoryCount = brainResult.ok ? brainResult.value.totalCount : 0
  const brainCoveragePct =
    brainMemories.length > 0
      ? Math.round((new Set(brainMemories.map((m) => m.type)).size / 12) * 100)
      : 0
  const allRuns = runsResult.ok ? runsResult.value : []
  const recentRuns = allRuns.slice(0, 5)
  const activeRuns = allRuns.filter((r) => r.status === 'pending' || r.status === 'running')
  const allDeliverables = allDeliverablesResult.ok ? allDeliverablesResult.value : []
  const pendingDeliverables = allDeliverables.filter((d) => d.status === 'pending_review')
  const mediaStats = computeMediaStats(allDeliverables)
  const workforces = workforcesResult.ok ? workforcesResult.value : []
  const pendingApprovals = approvalsResult.ok ? approvalsResult.value : []
  const activeWorkforceCount = workforces.filter((w) => w.status === 'active').length

  if (memoryCount === 0) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{orgName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your workforce is standing by.</p>
      </div>

      {/* Live workforce activity — shown whenever runs are active */}
      <LiveRunsPanel runs={activeRuns.map((r) => ({ id: r.id, objective: r.objective }))} />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brain Memories
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{memoryCount}</p>
          {brainCoveragePct > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {brainCoveragePct}% type coverage
            </p>
          )}
          <Link href="/brain" className="mt-1 block text-xs text-primary hover:underline">
            View Brain →
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Active Workforces
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{activeWorkforceCount}</p>
          <Link href="/workforces" className="mt-1 block text-xs text-primary hover:underline">
            View team →
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending Approvals
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              pendingApprovals.length > 0 ? 'text-yellow-600' : 'text-foreground'
            }`}
          >
            {pendingApprovals.length}
          </p>
          {pendingApprovals.length > 0 ? (
            <Link href="/approvals" className="mt-1 block text-xs text-yellow-600 hover:underline">
              Review now →
            </Link>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">All clear</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pending Reviews
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              pendingDeliverables.length > 0 ? 'text-yellow-600' : 'text-foreground'
            }`}
          >
            {pendingDeliverables.length}
          </p>
          {pendingDeliverables.length > 0 && (
            <Link
              href="/deliverables"
              className="mt-1 block text-xs text-yellow-600 hover:underline"
            >
              Review media →
            </Link>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Deliverables
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{allDeliverables.length}</p>
          <Link href="/deliverables" className="mt-1 block text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>
      </div>

      {/* Pending approvals alert */}
      {pendingApprovals.length > 0 && (
        <section className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {pendingApprovals.length} action{pendingApprovals.length === 1 ? '' : 's'} awaiting
                your approval
              </p>
              <p className="mt-1 text-xs text-yellow-700">
                {pendingApprovals[0].description}
                {pendingApprovals.length > 1 && ` and ${pendingApprovals.length - 1} more.`}
              </p>
            </div>
            <Link
              href="/approvals"
              className="shrink-0 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
            >
              Review
            </Link>
          </div>
        </section>
      )}

      {/* Pending deliverables */}
      {pendingDeliverables.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-foreground">Deliverables Awaiting Review</h2>
          <div className="divide-y divide-border rounded-lg border border-yellow-200 bg-card">
            {pendingDeliverables.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {d.type.replace(/_/g, ' ')}
                  </p>
                </div>
                <Link
                  href={`/deliverables/${d.id}`}
                  className="ml-4 shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Media output summary */}
      {mediaStats.total > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Media Output</h2>
            <Link href="/deliverables" className="text-xs text-primary hover:underline">
              View deliverables →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Video Scripts</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{mediaStats.scripts}</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Videos</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{mediaStats.videos}</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Images</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">{mediaStats.images}</p>
            </div>
          </div>
          {mediaStats.approved > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {mediaStats.approved} approved ·{' '}
              {mediaStats.pendingReview > 0
                ? `${mediaStats.pendingReview} pending review`
                : 'none pending'}
            </p>
          )}
        </section>
      )}

      {/* Recent runs */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Recent Runs</h2>
          <Link href="/runs" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No runs yet.</p>
            <Link
              href="/pipeline"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Launch your first pipeline
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {recentRuns.map((run) => (
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
                        · {run.deliverableIds.length} deliverable
                        {run.deliverableIds.length === 1 ? '' : 's'}
                      </>
                    )}
                  </p>
                </div>
                <span className={`ml-4 shrink-0 text-xs ${STATUS_COLORS[run.status]}`}>
                  {STATUS_LABELS[run.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
