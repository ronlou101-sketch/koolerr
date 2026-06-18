import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { identityService } from '@/domains/identity'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'

/**
 * Dashboard — the primary authenticated landing page.
 *
 * Shows a real-time snapshot of:
 * - Business Brain health (memory count)
 * - Recent Engagement Runs
 * - Deliverables pending customer review
 *
 * If the Business Brain has no memories, redirects to onboarding so the
 * customer can give their workforce the context it needs to produce great work.
 *
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md §Phase 1 — Success Criteria.
 */

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
  if (!ctx) redirect('/signup?error=no_platform_account')

  // Fetch all dashboard data in parallel.
  const [orgResult, brainResult, runsResult, pendingResult] = await Promise.all([
    identityService.findOrganizationById(ctx.organizationId),
    businessBrainService.queryMemory({ organizationId: ctx.organizationId, limit: 100 }),
    workforceEngineService.listEngagementRuns(ctx.organizationId),
    deliverablesService.listDeliverables({
      organizationId: ctx.organizationId,
      status: 'pending_review',
    }),
  ])

  const orgName = orgResult.ok ? orgResult.value.name : 'Your Organization'
  const memoryCount = brainResult.ok ? brainResult.value.totalCount : 0
  const recentRuns = runsResult.ok ? runsResult.value.slice(0, 5) : []
  const pendingDeliverables = pendingResult.ok ? pendingResult.value : []

  // Redirect to onboarding if the Brain has never been set up.
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

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brain Memories
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{memoryCount}</p>
          <Link href="/brain" className="mt-1 block text-xs text-primary hover:underline">
            View Brain →
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Runs
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {runsResult.ok ? runsResult.value.length : '—'}
          </p>
          <Link href="/runs" className="mt-1 block text-xs text-primary hover:underline">
            Start a run →
          </Link>
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
            <p className="mt-1 text-xs text-yellow-600">Needs your attention</p>
          )}
        </div>
      </div>

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
                    {d.type.replace('_', ' ')}
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
              href="/runs"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start your first run
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{run.objective}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{run.id}</p>
                </div>
                <span className={`ml-4 shrink-0 text-xs ${STATUS_COLORS[run.status]}`}>
                  {STATUS_LABELS[run.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
