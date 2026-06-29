import Link from 'next/link'
import { getExecutiveData } from '../executive/executive-data'
import { TowerExecutiveSummary } from '../_components/TowerExecutiveSummary'
import { TowerActionQueue } from '../_components/TowerActionQueue'
import type { HealthStatus } from '../executive/executive-data'

export const dynamic = 'force-dynamic'

const STATUS_DOT: Record<HealthStatus, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-400',
  critical: 'bg-destructive',
  'not-configured': 'bg-muted-foreground/30',
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  'not-configured': 'Not Configured',
}

const OUTCOME_BADGE: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  denied: 'bg-muted text-muted-foreground',
}

export default async function MorningBriefPage() {
  const data = await getExecutiveData()
  const { health, summary, actionQueue, revenue, recentActivity, newCustomers, generatedAt } = data

  const briefDate = new Date(generatedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const briefTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  const urgentActionCount = actionQueue.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  ).length

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
            <span className="text-foreground">Morning Brief</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Morning Brief</h1>
          <p className="mt-1 text-sm text-muted-foreground">{briefDate}</p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platform
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[health.overall]}`} />
            <span className="text-lg font-semibold text-foreground">
              {health.overall === 'healthy'
                ? 'Healthy'
                : health.overall === 'warning'
                  ? 'Degraded'
                  : 'Issues'}
            </span>
          </div>
          <Link
            href="/tower/health"
            className="mt-1 block text-xs text-muted-foreground hover:text-foreground"
          >
            View health →
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Actions
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{actionQueue.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {urgentActionCount > 0
              ? `${urgentActionCount} urgent`
              : actionQueue.length === 0
                ? 'All clear'
                : 'Low priority'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Subscriptions
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {revenue.active + revenue.trialing}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {revenue.pastDue > 0
              ? `${revenue.pastDue} past due`
              : revenue.stripeConnected
                ? 'No issues'
                : 'Stripe not connected'}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            New (24h)
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {newCustomers.orgsLast24h > 0 || newCustomers.usersLast24h > 0
              ? `+${newCustomers.orgsLast24h} / +${newCustomers.usersLast24h}`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {newCustomers.orgsLast24h > 0 || newCustomers.usersLast24h > 0
              ? 'orgs / users'
              : 'No new signups'}
          </p>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Executive Summary</h2>
        <TowerExecutiveSummary summary={summary} generatedAt={generatedAt} />
      </section>

      {/* Founder Action Queue */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Action Queue</h2>
        <TowerActionQueue items={actionQueue} />
      </section>

      {/* Platform Health */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Platform Health</h2>
          <Link
            href="/tower/health"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full health dashboard →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              { label: 'Database', status: health.database.status, href: '/tower/health/database' },
              {
                label: 'Auth',
                status: health.authentication.status,
                href: '/tower/health/authentication',
              },
              {
                label: 'Subscriptions',
                status: health.subscriptions.status,
                href: '/tower/health/subscriptions',
              },
              {
                label: 'Billing',
                status: health.billingHealth.status,
                href: '/tower/health/billing',
              },
              {
                label: 'AI Runs',
                status: health.engagementRuns.status,
                href: '/tower/health/runs',
              },
              {
                label: 'Audit (24h)',
                status: health.auditLog.status,
                href: '/tower/health/audit',
              },
            ] as const
          ).map(({ label, status, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 hover:border-foreground/20"
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <span className="text-xs font-medium text-foreground">{STATUS_LABEL[status]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Revenue Snapshot */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Revenue Snapshot</h2>
          <Link
            href="/tower/billing"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Manage billing →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {!revenue.stripeConnected ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground">Stripe Not Connected</p>
              <p className="mt-1 text-xs text-muted-foreground">{revenue.mrrNote}</p>
              <Link
                href="/tower/health/billing"
                className="mt-3 inline-block text-xs text-foreground underline-offset-2 hover:underline"
              >
                Configure billing →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                {[
                  { label: 'Active', value: revenue.active },
                  { label: 'Trialing', value: revenue.trialing },
                  { label: 'Past Due', value: revenue.pastDue },
                  { label: 'Canceled', value: revenue.canceled },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              {revenue.planBreakdown.length > 0 && (
                <div className="p-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Plan distribution
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {revenue.planBreakdown.map((plan) => (
                      <span
                        key={plan.planId}
                        className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground"
                      >
                        {plan.planId} · {plan.count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-border px-4 py-2">
                <p className="text-xs text-muted-foreground">{revenue.mrrNote}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Recent Activity{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({recentActivity.total24h} events in last 24h)
            </span>
          </h2>
          <Link href="/tower/audit" className="text-xs text-muted-foreground hover:text-foreground">
            Full audit log →
          </Link>
        </div>

        {recentActivity.events.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No audit events in the last 24 hours</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Action
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Actor
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Outcome
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivity.events.map((event, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{event.action}</td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                      {event.actorType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${OUTCOME_BADGE[event.outcome] ?? OUTCOME_BADGE.denied}`}
                      >
                        {event.outcome}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground lg:table-cell">
                      {new Date(event.occurredAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
