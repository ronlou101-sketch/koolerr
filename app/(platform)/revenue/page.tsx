import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { businessBrainService } from '@/domains/business-brain'
import { billingService } from '@/domains/billing'
import { computeTimeSeries, computeRevenueMetrics } from '@/shared/analytics/service'
import { CTO_BUSINESS_FUNCTION } from '@/infrastructure/cto-workforce'
import { PLAN_LABELS } from '@/domains/billing/plans'
import type { PlanId } from '@/domains/billing/plans'

/**
 * Revenue Dashboard — Operational Brain
 *
 * Shows MRR, subscription status, platform activity time series, and
 * Atlas revenue intelligence. Designed to grow into the data-driven
 * recommendation and campaign intelligence layer described in the V1
 * Readiness Report.
 *
 * Phase 3 scope: single-organization view, computed from existing domain data.
 * Phase 4: cross-organization admin view via service-role, real-time updates.
 */

function formatCents(cents: number): string {
  if (cents === 0) return '$0'
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function BarChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex h-20 items-end gap-0.5">
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
            <div
              className="w-full rounded-sm bg-foreground/20 transition-colors group-hover:bg-foreground/40"
              style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}

export default async function RevenuePage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [runsResult, deliverablesResult, memoriesResult, subscriptionResult, workforcesResult] =
    await Promise.all([
      workforceEngineService.listEngagementRuns(ctx.organizationId),
      deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
      businessBrainService.listAllMemories(ctx.organizationId),
      billingService.getSubscription(ctx.organizationId),
      workforceEngineService.listWorkforces(ctx.organizationId),
    ])

  const runs = runsResult.ok ? runsResult.value : []
  const deliverables = deliverablesResult.ok ? deliverablesResult.value : []
  const memories = memoriesResult.ok ? memoriesResult.value : []
  const subscription = subscriptionResult.ok ? subscriptionResult.value : null
  const workforces = workforcesResult.ok ? workforcesResult.value : []

  const timeSeries = computeTimeSeries(runs, deliverables, memories, 30)
  const revenue = computeRevenueMetrics(subscription)

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const runsThisMonth = runs.filter((r) => r.createdAt >= thirtyDaysAgo).length
  const deliverablesThisMonth = deliverables.filter((d) => d.createdAt >= thirtyDaysAgo).length
  const completedRuns = runs.filter((r) => r.status === 'completed').length
  const successRate = runs.length > 0 ? Math.round((completedRuns / runs.length) * 100) : null

  const ctoWorkforce = workforces.find((w) => w.businessFunction === CTO_BUSINESS_FUNCTION)
  const allCtoDeliverables = ctoWorkforce
    ? deliverables
        .filter((d) => d.type === 'v1_readiness_report')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : []
  const latestReadiness = allCtoDeliverables[0]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Revenue Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational brain. Platform activity, subscription health, and Atlas revenue
            intelligence.
          </p>
        </div>
        {!revenue.stripeConfigured && (
          <Link
            href="/billing"
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Configure Billing →
          </Link>
        )}
      </div>

      {/* Revenue KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">MRR</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {revenue.stripeConfigured ? formatCents(revenue.mrrCents) : '—'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {revenue.stripeConfigured
              ? `${PLAN_LABELS[revenue.planId as PlanId] ?? revenue.planId} · ${revenue.subscriptionStatus}`
              : 'Stripe not configured'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Runs (30d)
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{runsThisMonth}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {successRate !== null ? `${successRate}% success rate` : 'No completed runs yet'}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Deliverables (30d)
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{deliverablesThisMonth}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{deliverables.length} total</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brain Memories
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{memories.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            across {workforces.length} workforce{workforces.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Time series charts */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <BarChart data={timeSeries.runsPerDay} label="Engagement Runs — last 30 days" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <BarChart data={timeSeries.deliverablesPerDay} label="Deliverables — last 30 days" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <BarChart data={timeSeries.memoriesPerDay} label="Brain Memories — last 30 days" />
        </div>
      </div>

      {/* Subscription status */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Subscription</h2>
        {subscription ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium text-foreground">
                {PLAN_LABELS[subscription.planId as PlanId] ?? subscription.planId}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd
                className={`font-medium ${
                  subscription.status === 'active' || subscription.status === 'trialing'
                    ? 'text-green-600'
                    : 'text-destructive'
                }`}
              >
                {subscription.status}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Period ends</dt>
              <dd className="text-foreground">
                {subscription.currentPeriodEnd.toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Stripe</dt>
              <dd className="text-foreground">
                {subscription.stripeCustomerId ? (
                  <span className="text-green-600">Connected</span>
                ) : (
                  <Link href="/billing" className="text-muted-foreground underline">
                    Not connected
                  </Link>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No subscription found.</p>
        )}
      </div>

      {/* Workforce breakdown */}
      {workforces.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Active Workforces</h2>
          <div className="space-y-2">
            {workforces.map((wf) => {
              const wfRuns = runs.filter((r) => r.workforceId === wf.id)
              const wfDeliverables = deliverables.filter((d) =>
                wfRuns.some((r) => r.deliverableIds.includes(d.id))
              )
              return (
                <div
                  key={wf.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{wf.name}</p>
                    <p className="text-xs text-muted-foreground">{wf.businessFunction}</p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-sm font-medium text-foreground">{wfRuns.length}</p>
                      <p className="text-xs text-muted-foreground">runs</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{wfDeliverables.length}</p>
                      <p className="text-xs text-muted-foreground">deliverables</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Atlas Revenue Intelligence */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Atlas Revenue Intelligence</h2>
        {latestReadiness ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Latest V1 Readiness Report — {latestReadiness.createdAt.toLocaleDateString()} at{' '}
              {latestReadiness.createdAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <Link
              href={`/deliverables/${latestReadiness.id}`}
              className="block rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
            >
              {latestReadiness.title} →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              No V1 Readiness Report generated yet. Ask Atlas to assess launch readiness.
            </p>
            <Link
              href="/cto"
              className="inline-block rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
            >
              Ask Atlas →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
