import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { businessBrainService } from '@/domains/business-brain'
import { billingService } from '@/domains/billing'
import { CTO_BUSINESS_FUNCTION } from '@/infrastructure/cto-workforce'

/**
 * Mission Control — Founder's Executive Dashboard
 *
 * Atlas identifies priorities, blockers, and revenue opportunities.
 * The founder sees platform health, active operations, failed runs,
 * and Atlas recommendations in one place.
 *
 * Phase 3 scope: single-organization view, polling-based freshness.
 * Phase 4: real-time via Supabase Realtime, cross-org admin mode.
 *
 * See docs/adr/ADR-021-stripe-billing-integration.md §Decision 6.
 */

const STATUS_COLORS = {
  pending: 'bg-muted text-muted-foreground',
  running: 'bg-blue-100 text-blue-700',
  awaiting_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-destructive/10 text-destructive',
} as const

export default async function MissionControlPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [runsResult, deliverablesResult, memoriesResult, subscriptionResult, workforcesResult] =
    await Promise.all([
      workforceEngineService.listEngagementRuns(ctx.organizationId),
      deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
      businessBrainService.listAllMemories(ctx.organizationId),
      billingService.getSubscription(ctx.tenantId),
      workforceEngineService.listWorkforces(ctx.organizationId),
    ])

  const runs = runsResult.ok ? runsResult.value : []
  const deliverables = deliverablesResult.ok ? deliverablesResult.value : []
  const memories = memoriesResult.ok ? memoriesResult.value : []
  const subscription = subscriptionResult.ok ? subscriptionResult.value : null
  const workforces = workforcesResult.ok ? workforcesResult.value : []

  const activeRuns = runs.filter((r) => r.status === 'running' || r.status === 'pending')
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const failedRecently = runs.filter(
    (r) => r.status === 'failed' && r.updatedAt >= twentyFourHoursAgo
  )
  const awaitingApproval = runs.filter((r) => r.status === 'awaiting_approval')
  const completedRuns = runs.filter((r) => r.status === 'completed')
  const successRate =
    completedRuns.length + failedRecently.length > 0
      ? Math.round(
          (completedRuns.length /
            (completedRuns.length + runs.filter((r) => r.status === 'failed').length)) *
            100
        )
      : null

  const ctoWorkforce = workforces.find((w) => w.businessFunction === CTO_BUSINESS_FUNCTION)
  const readinessReports = deliverables
    .filter((d) => d.type === 'v1_readiness_report')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const latestReadiness = readinessReports[0]

  const activeWorkforces = workforces.filter((w) => w.status === 'active')
  const billingOk =
    subscription && (subscription.status === 'active' || subscription.status === 'trialing')

  // V1 launch checklist — derived from known Phase 3 milestones
  const launchChecklist = [
    { label: 'Atlas (CTO Agent) online', done: !!ctoWorkforce },
    { label: 'Cross-Workforce runs + GitHub integration', done: true },
    { label: 'Brain multi-Workforce intelligence', done: true },
    { label: 'Stripe billing integration', done: !!subscription?.stripeCustomerId },
    { label: 'Revenue Dashboard', done: true },
    { label: 'Mission Control', done: true },
    { label: 'V1 Readiness Report generated', done: !!latestReadiness },
    { label: 'Marketing site live', done: false },
    { label: 'Production deployment verified', done: false },
  ]
  const completedChecks = launchChecklist.filter((c) => c.done).length
  const readinessPercent = Math.round((completedChecks / launchChecklist.length) * 100)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mission Control</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Executive dashboard. Platform health, active operations, and Atlas recommendations.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">{readinessPercent}%</p>
          <p className="text-xs text-muted-foreground">V1 ready</p>
        </div>
      </div>

      {/* Platform health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Workforces
            </p>
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">{activeWorkforces.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">active of {workforces.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Brain
            </p>
            <span
              className={`h-2 w-2 rounded-full ${memories.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">{memories.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">memories stored</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Success Rate
            </p>
            <span
              className={`h-2 w-2 rounded-full ${
                successRate === null
                  ? 'bg-muted'
                  : successRate >= 80
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
              }`}
            />
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {successRate !== null ? `${successRate}%` : '—'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{runs.length} total runs</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Billing
            </p>
            <span
              className={`h-2 w-2 rounded-full ${billingOk ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
          </div>
          <p className="mt-1 text-xl font-semibold capitalize text-foreground">
            {subscription?.status ?? 'Unknown'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {subscription?.stripeCustomerId ? 'Stripe connected' : 'Stripe not connected'}
          </p>
        </div>
      </div>

      {/* Active operations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active runs */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">
            Active Runs
            {activeRuns.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {activeRuns.length}
              </span>
            )}
          </h2>
          {activeRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active runs.</p>
          ) : (
            <div className="space-y-2">
              {activeRuns.slice(0, 5).map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-start gap-3 rounded-md border border-border p-2 hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{run.objective}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {run.id.slice(0, 16)}…
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[run.status] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {run.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Failed runs (24h) + Awaiting approval */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Failed (last 24h)
              {failedRecently.length > 0 && (
                <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                  {failedRecently.length}
                </span>
              )}
            </h2>
            {failedRecently.length === 0 ? (
              <p className="text-sm text-green-600">All clear.</p>
            ) : (
              <div className="space-y-1">
                {failedRecently.slice(0, 3).map((run) => (
                  <Link
                    key={run.id}
                    href={`/runs/${run.id}`}
                    className="block truncate text-xs text-destructive hover:underline"
                  >
                    {run.objective}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-medium text-foreground">
              Awaiting Approval
              {awaitingApproval.length > 0 && (
                <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                  {awaitingApproval.length}
                </span>
              )}
            </h2>
            {awaitingApproval.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing awaiting review.</p>
            ) : (
              <div className="space-y-1">
                {awaitingApproval.slice(0, 3).map((run) => (
                  <Link
                    key={run.id}
                    href={`/approvals`}
                    className="block truncate text-xs text-yellow-700 hover:underline"
                  >
                    {run.objective}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Atlas Recommendations */}
      <div className="rounded-lg border-2 border-foreground/10 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">Atlas Recommendations</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Latest V1 Readiness Report from Atlas — updated on demand.
            </p>
          </div>
          <Link
            href="/cto"
            className="shrink-0 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            Run Assessment →
          </Link>
        </div>

        {latestReadiness ? (
          <div className="mt-4 space-y-2">
            <Link
              href={`/deliverables/${latestReadiness.id}`}
              className="block rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
            >
              {latestReadiness.title}
            </Link>
            <p className="text-xs text-muted-foreground">
              Generated {latestReadiness.createdAt.toLocaleDateString()} at{' '}
              {latestReadiness.createdAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {readinessReports.length > 1 && ` · ${readinessReports.length} total assessments`}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No assessment generated yet. Click &quot;Run Assessment&quot; to ask Atlas for a V1
            Readiness Report.
          </p>
        )}
      </div>

      {/* V1 Launch Checklist */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">V1 Launch Checklist</h2>
          <span className="text-xs text-muted-foreground">
            {completedChecks}/{launchChecklist.length} complete
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {launchChecklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <span
                className={`h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                  item.done ? 'border-green-500 bg-green-500' : 'border-muted-foreground'
                }`}
              >
                {item.done && (
                  <svg className="h-full w-full text-white" fill="none" viewBox="0 0 16 16">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 8l3 3 5-5"
                    />
                  </svg>
                )}
              </span>
              <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cto"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Ask Atlas
        </Link>
        <Link
          href="/runs"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          All Runs
        </Link>
        <Link
          href="/approvals"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Approvals
        </Link>
        <Link
          href="/revenue"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Revenue
        </Link>
        <Link
          href="/billing"
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Billing
        </Link>
      </div>
    </div>
  )
}
