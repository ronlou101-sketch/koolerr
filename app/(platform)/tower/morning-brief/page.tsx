import Link from 'next/link'
import { getExecutiveData } from '../executive/executive-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { derivePendingDecisions } from '../cto/cto-data'
import { TowerExecutiveSummary } from '../_components/TowerExecutiveSummary'
import { TowerActionQueue } from '../_components/TowerActionQueue'
import type { HealthStatus } from '../executive/executive-data'
import type { WorkforceHealth } from '../workforce-status/workforce-data'

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

const WF_HEALTH_DOT: Record<WorkforceHealth, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-400',
  critical: 'bg-destructive',
  'not-configured': 'bg-muted-foreground/30',
}

export default async function MorningBriefPage() {
  const [data, workforceData] = await Promise.all([getExecutiveData(), getWorkforceStatusData()])
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

  const criticalIssues = actionQueue.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  )
  const nextThreeActions = actionQueue.slice(0, 3)
  const pendingDecisions = derivePendingDecisions(data)

  // Workforce summary
  const wfHealthy = workforceData.workforces.filter((w) => w.health === 'healthy').length
  const wfWarning = workforceData.workforces.filter((w) => w.health === 'warning').length
  const wfCritical = workforceData.workforces.filter((w) => w.health === 'critical').length
  const wfTotal = workforceData.workforces.length
  const wfActiveRuns = workforceData.workforces.reduce((s, w) => s + w.runningRuns, 0)
  const wfFailedTotal = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)

  // CTO report: top issues from health
  const ctoIssueCount = [
    health.database.status === 'critical',
    health.billingHealth.status === 'not-configured',
    health.subscriptions.status === 'warning',
    health.engagementRuns.status === 'warning' || health.engagementRuns.status === 'critical',
    health.auditLog.status === 'warning',
    health.apiHealth.status === 'not-configured',
    health.deployments.status === 'not-configured',
    health.backgroundJobs.status === 'not-configured',
  ].filter(Boolean).length

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

      {/* CTO Report */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">CTO Report</h2>
          <Link href="/tower/cto" className="text-xs text-muted-foreground hover:text-foreground">
            Full CTO Operations →
          </Link>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          {ctoIssueCount === 0 ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              No platform issues detected — all monitored systems are operating normally
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <p className="text-sm font-medium text-foreground">
                  {ctoIssueCount} platform issue{ctoIssueCount !== 1 ? 's' : ''} detected
                </p>
              </div>
              <ul className="mt-3 space-y-1.5">
                {[
                  health.database.status === 'critical' && {
                    label: 'Database connection failure — all operations blocked',
                    href: '/tower/health/database',
                    sev: 'critical' as const,
                  },
                  health.billingHealth.status === 'not-configured' && {
                    label: 'Stripe not configured — billing cannot process payments',
                    href: '/tower/health/billing',
                    sev: 'high' as const,
                  },
                  health.subscriptions.status === 'warning' && {
                    label: 'Past due subscriptions — revenue at risk',
                    href: '/tower/health/billing',
                    sev: 'high' as const,
                  },
                  (health.engagementRuns.status === 'warning' ||
                    health.engagementRuns.status === 'critical') && {
                    label: 'Failed engagement runs — customer impact possible',
                    href: '/tower/health/runs',
                    sev: 'medium' as const,
                  },
                  health.auditLog.status === 'warning' && {
                    label: 'Error events in audit log — investigation needed',
                    href: '/tower/health/audit',
                    sev: 'medium' as const,
                  },
                  health.apiHealth.status === 'not-configured' && {
                    label: 'No API monitoring configured',
                    href: '/tower/health/api',
                    sev: 'low' as const,
                  },
                  health.deployments.status === 'not-configured' && {
                    label: 'Deployment tracking not connected',
                    href: '/tower/health/deployments',
                    sev: 'low' as const,
                  },
                  health.backgroundJobs.status === 'not-configured' && {
                    label: 'No background job queue configured',
                    href: '/tower/health/jobs',
                    sev: 'low' as const,
                  },
                ]
                  .filter(Boolean)
                  .map(
                    (issue) =>
                      issue && (
                        <li key={issue.href} className="flex items-start gap-2">
                          <span
                            className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${issue.sev === 'critical' ? 'bg-destructive' : issue.sev === 'high' ? 'bg-amber-400' : issue.sev === 'medium' ? 'bg-blue-400' : 'bg-muted-foreground/40'}`}
                          />
                          <Link
                            href={issue.href}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {issue.label}
                          </Link>
                        </li>
                      )
                  )}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* AI Workforce Report */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">AI Workforce Report</h2>
          <Link
            href="/tower/workforce-status"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Workforce Status →
          </Link>
        </div>
        {wfTotal === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No AI workforces configured yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Workforces are created by customer organizations
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Total workforces</p>
                <p className="text-lg font-semibold text-foreground">{wfTotal}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="mt-1 flex items-center gap-3">
                  {wfHealthy > 0 && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${WF_HEALTH_DOT.healthy}`} />
                      <span className="text-foreground">{wfHealthy} healthy</span>
                    </span>
                  )}
                  {wfWarning > 0 && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${WF_HEALTH_DOT.warning}`} />
                      <span className="text-amber-700 dark:text-amber-400">
                        {wfWarning} warning
                      </span>
                    </span>
                  )}
                  {wfCritical > 0 && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`h-1.5 w-1.5 rounded-full ${WF_HEALTH_DOT.critical}`} />
                      <span className="text-red-700 dark:text-red-400">{wfCritical} critical</span>
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total runs</p>
                <p className="text-lg font-semibold text-foreground">
                  {workforceData.totalRunsAllWorkforces}
                </p>
              </div>
              {wfActiveRuns > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Active now</p>
                  <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                    {wfActiveRuns}
                  </p>
                </div>
              )}
              {wfFailedTotal > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Total failed</p>
                  <p className="text-lg font-semibold text-red-700 dark:text-red-400">
                    {wfFailedTotal}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Revenue Alerts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Revenue Alerts</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          {revenue.pastDue > 0 ? (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {revenue.pastDue} past-due subscription{revenue.pastDue !== 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Payment failures detected. Review Stripe dunning settings and follow up with
                  affected customers.
                </p>
                <Link
                  href="/tower/health/billing"
                  className="mt-2 inline-block text-xs text-foreground hover:underline"
                >
                  Review billing →
                </Link>
              </div>
            </div>
          ) : !revenue.stripeConnected ? (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Stripe not configured</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Billing cannot process customer payments until Stripe is connected.
                </p>
                <Link
                  href="/tower/health/billing"
                  className="mt-2 inline-block text-xs text-foreground hover:underline"
                >
                  Configure billing →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              No revenue alerts — billing is operating normally
            </p>
          )}
        </div>
      </section>

      {/* Growth Alerts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Growth Alerts</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          {newCustomers.orgsLast24h > 0 || newCustomers.usersLast24h > 0 ? (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  New signups in the last 24 hours
                </p>
                <ul className="mt-1.5 space-y-1">
                  {newCustomers.orgsLast24h > 0 && (
                    <li className="text-xs text-muted-foreground">
                      · {newCustomers.orgsLast24h} new organization
                      {newCustomers.orgsLast24h !== 1 ? 's' : ''}
                    </li>
                  )}
                  {newCustomers.usersLast24h > 0 && (
                    <li className="text-xs text-muted-foreground">
                      · {newCustomers.usersLast24h} new user
                      {newCustomers.usersLast24h !== 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
                <Link
                  href="/tower/orgs"
                  className="mt-2 inline-block text-xs text-foreground hover:underline"
                >
                  View organizations →
                </Link>
              </div>
            </div>
          ) : actionQueue.some((a) => a.id === 'no-customers') ? (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
              <div>
                <p className="text-sm font-medium text-foreground">No customers onboarded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Acquiring the first customer is the top growth priority. The platform is ready.
                </p>
                <Link
                  href="/tower/marketing"
                  className="mt-2 inline-block text-xs text-foreground hover:underline"
                >
                  Configure marketing →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No new signups in the last 24 hours</p>
          )}
        </div>
      </section>

      {/* Critical Risks */}
      {criticalIssues.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Critical Risks{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({criticalIssues.length})
            </span>
          </h2>
          <div className="space-y-2">
            {criticalIssues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-start gap-3 rounded-lg border p-3 ${issue.priority === 'critical' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30' : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'}`}
              >
                <span
                  className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${issue.priority === 'critical' ? 'bg-destructive' : 'bg-amber-400'}`}
                />
                <div className="flex-1">
                  <p
                    className={`text-xs font-medium ${issue.priority === 'critical' ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}
                  >
                    {issue.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{issue.reason}</p>
                </div>
                <Link
                  href={issue.href}
                  className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Fix →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Founder Decisions */}
      {pendingDecisions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Upcoming Decisions{' '}
              <span className="ml-1 font-normal text-muted-foreground">
                ({pendingDecisions.length})
              </span>
            </h2>
            <Link href="/tower/cto" className="text-xs text-muted-foreground hover:text-foreground">
              CTO Operations →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingDecisions.map((decision) => (
              <div key={decision.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{decision.title}</p>
                  <Link
                    href={decision.href}
                    className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Decide →
                  </Link>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{decision.context}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Next 3 Actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recommended Next 3 Actions</h2>
        {nextThreeActions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              No actions required — platform is operating well
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {nextThreeActions.map((action, i) => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
              >
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">{action.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{action.recommendedAction}</p>
                </div>
                <Link
                  href={action.href}
                  className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Go →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
