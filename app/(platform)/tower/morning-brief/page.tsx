import Link from 'next/link'
import { getExecutiveData } from '../executive/executive-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { getSupportData } from '../support/support-data'
import { buildExecutionJobs, buildExecutionMetrics } from '../execution/execution-data'
import {
  buildBrainScores,
  buildBrainReasoning,
  buildBrainObjectives,
} from '../business-brain/brain-data'
import { buildCompanyOSData } from '../company-os/company-os-data'
import { buildCompanyMemoryData } from '../company-memory/company-memory-data'
import { TowerExecutiveSummary } from '../_components/TowerExecutiveSummary'
import { TowerActionQueue } from '../_components/TowerActionQueue'
import type { HealthStatus } from '../executive/executive-data'
import type { WorkforceHealth } from '../workforce-status/workforce-data'
import type { TaskPriority } from '../agents/agent-tasks'

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

const TASK_PRIORITY_BADGE: Record<TaskPriority, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

export default async function MorningBriefPage() {
  const [data, workforceData, supportData] = await Promise.all([
    getExecutiveData(),
    getWorkforceStatusData(),
    getSupportData(),
  ])
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

  // Agent intelligence
  const agentTasks = buildAgentTasks(data)
  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, generatedAt)
  const execMetrics = buildExecutionMetrics(execJobs)

  // Business Brain
  const brainScores = buildBrainScores(data, supportData, workforceData)
  const brainReasoning = buildBrainReasoning(data, brainScores)
  const brainObjectives = buildBrainObjectives(data, supportData, workforceData)
  const biggestOpportunity =
    brainObjectives
      .filter((o) => o.status === 'at-risk' || o.status === 'blocked')
      .sort((a, b) => b.score - a.score)[0] ?? null
  const biggestRisk =
    brainObjectives
      .filter((o) => o.status === 'blocked' || o.status === 'at-risk')
      .sort((a, b) => a.score - b.score)[0] ?? null
  const tasksNeedingApproval = agentTasks.filter((t) => t.requiresApproval)
  const urgentApprovals = tasksNeedingApproval.filter(
    (t) => t.priority === 'critical' || t.priority === 'high'
  )
  const deferrableApprovals = tasksNeedingApproval.filter(
    (t) => t.priority === 'medium' || t.priority === 'low'
  )
  const topThreeTasks = agentTasks.slice(0, 3)

  // Company OS
  const os = buildCompanyOSData(data, supportData, workforceData, agentTasks)
  // Company Memory — institutional learning derived from same sources
  const memory = buildCompanyMemoryData(data, supportData, workforceData, agentTasks, execJobs)
  const topMission = os.topPriorities[0] ?? null
  const mostLoadedAgent = [...os.agentWorkloads].sort(
    (a, b) => b.totalMissions - a.totalMissions
  )[0]
  const biggestBottleneck = os.conflicts[0] ?? null

  // Workforce summary
  const wfHealthy = workforceData.workforces.filter((w) => w.health === 'healthy').length
  const wfWarning = workforceData.workforces.filter((w) => w.health === 'warning').length
  const wfCritical = workforceData.workforces.filter((w) => w.health === 'critical').length
  const wfTotal = workforceData.workforces.length
  const wfActiveRuns = workforceData.workforces.reduce((s, w) => s + w.runningRuns, 0)
  const wfFailedTotal = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)

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

      {/* Company OS — daily orchestration summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Company Operating System</h2>
          <Link
            href="/tower/company-os"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Mission control →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Objective */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Company Objective
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{os.companyObjective}</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border sm:grid-cols-4">
            {[
              {
                label: "Today's Top Mission",
                value: topMission ? topMission.agentName : 'No active missions',
                sub: topMission ? topMission.priority : null,
              },
              {
                label: 'Highest Risk',
                value:
                  os.missionsByState.awaiting_founder.length > 0
                    ? `${os.missionsByState.awaiting_founder.length} awaiting approval`
                    : os.missionsByState.blocked.length > 0
                      ? `${os.missionsByState.blocked.length} missions blocked`
                      : 'No critical risks',
                sub: null,
              },
              {
                label: 'Most Loaded Agent',
                value: mostLoadedAgent?.agentName ?? '—',
                sub: mostLoadedAgent ? `${mostLoadedAgent.totalMissions} missions` : null,
              },
              {
                label: 'Biggest Bottleneck',
                value: biggestBottleneck
                  ? 'Conflict detected'
                  : os.stateCounts.awaiting_founder > 0
                    ? 'Awaiting approval'
                    : 'No bottlenecks',
                sub: null,
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 line-clamp-1 text-xs font-medium text-foreground">{value}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
              </div>
            ))}
          </div>

          {/* Revenue + Growth Watch */}
          <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Revenue Watch
              </p>
              {!os.revenueWatch.stripeConnected ? (
                <p className="text-xs text-red-700 dark:text-red-400">Stripe not connected</p>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  {[
                    { label: 'Active', value: os.revenueWatch.active },
                    { label: 'Trialing', value: os.revenueWatch.trialing },
                    {
                      label: 'Past Due',
                      value: os.revenueWatch.pastDue,
                      warn: os.revenueWatch.pastDue > 0,
                    },
                  ].map(({ label, value, warn }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p
                        className={`text-sm font-semibold ${warn ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Growth Watch
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <p className="text-xs text-muted-foreground">Organizations</p>
                  <p className="text-sm font-semibold text-foreground">{os.growthWatch.orgCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New Orgs (24h)</p>
                  <p
                    className={`text-sm font-semibold ${os.growthWatch.newOrgs24h > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}
                  >
                    {os.growthWatch.newOrgs24h > 0 ? `+${os.growthWatch.newOrgs24h}` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Founder Actions */}
          {os.missionsByState.awaiting_founder.length > 0 && (
            <div className="border-t border-border p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommended Founder Actions ({os.missionsByState.awaiting_founder.length})
                </p>
                <Link href="/tower/approvals" className="text-xs text-foreground hover:underline">
                  Review all →
                </Link>
              </div>
              <div className="space-y-1.5">
                {os.missionsByState.awaiting_founder.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-start gap-2">
                    <span className="mt-px inline-flex flex-shrink-0 items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                      {m.priority}
                    </span>
                    <p className="line-clamp-1 text-xs text-foreground">{m.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Business Brain Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Business Brain Summary</h2>
          <Link
            href="/tower/business-brain"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full intelligence view →
          </Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Score strip */}
          <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
            {[
              { label: 'Overall', value: brainScores.overall.score },
              { label: 'Growth', value: brainScores.growth.score },
              { label: 'Financial', value: brainScores.financial.score },
              { label: 'Risk', value: brainScores.risk.score },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                  className={`mt-1 text-lg font-semibold tabular-nums ${
                    value >= 70
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : value >= 45
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4">
            {/* Executive recommendation */}
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Executive Recommendation
            </p>
            <p className="mt-1.5 text-sm font-medium text-foreground">{brainReasoning.belief}</p>
            <p className="mt-1 text-xs text-muted-foreground">{brainReasoning.why}</p>

            {/* Top 3 priorities */}
            <div className="mt-4 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top 3 Priorities Today
              </p>
              {brainReasoning.recommendedActions.slice(0, 3).map((action, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <p className="text-xs text-foreground">{action}</p>
                </div>
              ))}
            </div>

            {/* Opportunity + Risk */}
            {(biggestOpportunity || biggestRisk) && (
              <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border/50 pt-3 sm:grid-cols-2">
                {biggestOpportunity && (
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Biggest Opportunity
                    </p>
                    <p className="mt-0.5 text-xs text-foreground">{biggestOpportunity.title}</p>
                    <p className="text-xs text-muted-foreground">{biggestOpportunity.signal}</p>
                  </div>
                )}
                {biggestRisk && (
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      Biggest Risk
                    </p>
                    <p className="mt-0.5 text-xs text-foreground">{biggestRisk.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {biggestRisk.blockingIssue ?? biggestRisk.signal}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

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

      {/* Daily Agent Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Daily Agent Intelligence</h2>
          <Link
            href="/tower/approvals"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full approval queue →
          </Link>
        </div>

        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {/* What happened? */}
          <div className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What happened? (last 24h)
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Audit events</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {recentActivity.total24h}
                </p>
              </div>
              {(newCustomers.orgsLast24h > 0 || newCustomers.usersLast24h > 0) && (
                <div>
                  <p className="text-xs text-muted-foreground">New signups</p>
                  <p className="mt-0.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {newCustomers.orgsLast24h > 0 &&
                      `+${newCustomers.orgsLast24h} org${newCustomers.orgsLast24h !== 1 ? 's' : ''}`}
                    {newCustomers.orgsLast24h > 0 && newCustomers.usersLast24h > 0 && ' · '}
                    {newCustomers.usersLast24h > 0 &&
                      `+${newCustomers.usersLast24h} user${newCustomers.usersLast24h !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
              {wfTotal > 0 && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Workforce runs</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      {workforceData.totalRunsAllWorkforces}
                    </p>
                  </div>
                  {wfFailedTotal > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Failed runs</p>
                      <p className="mt-0.5 text-sm font-medium text-red-700 dark:text-red-400">
                        {wfFailedTotal}
                      </p>
                    </div>
                  )}
                  {wfActiveRuns > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Active now</p>
                      <p className="mt-0.5 text-sm font-medium text-blue-700 dark:text-blue-400">
                        {wfActiveRuns}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Workforce health</p>
                    <div className="mt-0.5 flex items-center gap-3">
                      {wfHealthy > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${WF_HEALTH_DOT.healthy}`} />
                          <span className="text-foreground">{wfHealthy}</span>
                        </span>
                      )}
                      {wfWarning > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${WF_HEALTH_DOT.warning}`} />
                          <span className="text-amber-700 dark:text-amber-400">{wfWarning}</span>
                        </span>
                      )}
                      {wfCritical > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <span className={`h-1.5 w-1.5 rounded-full ${WF_HEALTH_DOT.critical}`} />
                          <span className="text-red-700 dark:text-red-400">{wfCritical}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* What needs approval? */}
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What needs approval?{' '}
                <span className="font-normal">
                  ({urgentApprovals.length} critical/high priority)
                </span>
              </p>
              {urgentApprovals.length > 0 && (
                <Link href="/tower/approvals" className="text-xs text-foreground hover:underline">
                  Review all →
                </Link>
              )}
            </div>
            {urgentApprovals.length === 0 ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                No critical or high-priority approvals pending
              </p>
            ) : (
              <div className="space-y-2">
                {urgentApprovals.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between gap-2 rounded-md border p-2.5 ${
                      task.priority === 'critical'
                        ? 'border-red-200 dark:border-red-800'
                        : 'border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2">
                      <span
                        className={`mt-px inline-flex flex-shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${TASK_PRIORITY_BADGE[task.priority]}`}
                      >
                        {task.priority}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {task.description}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{task.agentName}</p>
                      </div>
                    </div>
                    <Link
                      href="/tower/approvals"
                      className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Approve →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What can wait? */}
          <div className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What can wait?{' '}
              <span className="font-normal">
                ({deferrableApprovals.length} medium/low priority)
              </span>
            </p>
            {deferrableApprovals.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing deferred</p>
            ) : (
              <div className="space-y-1.5">
                {deferrableApprovals.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {task.priority}
                      </span>
                      <p className="truncate text-xs text-muted-foreground">{task.description}</p>
                    </div>
                    <Link
                      href="/tower/approvals"
                      className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What should I do first? */}
          <div className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What should I do first?
            </p>
            {topThreeTasks.length === 0 ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                No agent recommendations — all systems clear
              </p>
            ) : (
              <div className="space-y-2">
                {topThreeTasks.map((task, i) => (
                  <div key={task.id} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{task.description}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.recommendedAction}
                      </p>
                    </div>
                    <Link
                      href={task.href}
                      className="flex-shrink-0 text-xs text-foreground hover:underline"
                    >
                      Go →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Today's Executions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Today&apos;s Executions</h2>
          <Link
            href="/tower/execution"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Execution engine →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Completed Overnight', value: execMetrics.completedToday, note: 'No history' },
            { label: 'Running Now', value: execMetrics.running, note: null },
            {
              label: 'Waiting Approval',
              value: execMetrics.waitingApproval,
              color:
                execMetrics.waitingApproval > 0 ? 'text-amber-700 dark:text-amber-400' : undefined,
            },
            { label: 'Failed', value: execMetrics.failedToday, note: null },
          ].map(({ label, value, color, note }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-2 text-xl font-semibold tabular-nums ${color ?? 'text-foreground'}`}
              >
                {value}
              </p>
              {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
            </div>
          ))}
        </div>
        {execMetrics.waitingApproval > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {execMetrics.waitingApproval} execution job
              {execMetrics.waitingApproval !== 1 ? 's' : ''} waiting for founder approval —{' '}
              <Link href="/tower/approvals" className="font-medium underline underline-offset-2">
                review now
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Support Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Support Intelligence</h2>
          <Link
            href="/tower/support"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Support command center →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Opened (8h)', value: supportData.stats.openedLast8h },
            {
              label: 'Auto-Resolved',
              value: supportData.stats.autoResolved,
              color:
                supportData.stats.autoResolved > 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : undefined,
            },
            {
              label: 'Awaiting Founder',
              value: supportData.stats.awaitingFounder,
              color:
                supportData.stats.awaitingFounder > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : undefined,
            },
            {
              label: 'Escalations',
              value: supportData.stats.escalations,
              color:
                supportData.stats.escalations > 0 ? 'text-red-700 dark:text-red-400' : undefined,
            },
            {
              label: 'Avg Response',
              value: '< 5 min',
              color: 'text-muted-foreground',
            },
            {
              label: 'CSAT',
              value: '—',
              color: 'text-muted-foreground',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-2 text-xl font-semibold tabular-nums ${color ?? 'text-foreground'}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        {supportData.stats.awaitingFounder > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {supportData.stats.awaitingFounder} ticket
              {supportData.stats.awaitingFounder !== 1 ? 's' : ''} require founder approval —{' '}
              <Link href="/tower/approvals" className="font-medium underline underline-offset-2">
                review now
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Learning Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Learning Intelligence</h2>
          <Link
            href="/tower/company-memory"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full Company Memory →
          </Link>
        </div>

        {/* Score strip */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Intelligence Score', value: memory.intelligenceScore.overall },
            { label: 'Execution Health', value: memory.intelligenceScore.executionHealth },
            { label: 'Automation Health', value: memory.intelligenceScore.automationHealth },
            { label: 'Learning Progress', value: memory.intelligenceScore.learningProgress },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p
                className={`mt-1 text-xl font-semibold tabular-nums ${
                  value >= 70
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : value >= 45
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-700 dark:text-red-400'
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Top win + top failure */}
        {(memory.recentWins.length > 0 || memory.recentFailures.length > 0) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {memory.recentWins[0] && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/10">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Top Win
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {memory.recentWins[0].title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {memory.recentWins[0].summary}
                </p>
              </div>
            )}
            {memory.recentFailures[0] && (
              <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/10">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-400">
                  Top Risk
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {memory.recentFailures[0].title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {memory.recentFailures[0].recommendedNextAction}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Biggest pattern */}
        {memory.biggestPattern && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Detected Pattern
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{memory.biggestPattern}</p>
          </div>
        )}

        {/* Top learning signal */}
        {memory.topLearning && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/10">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-400">
              Today&apos;s Learning Signal
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">{memory.topLearning}</p>
          </div>
        )}
      </section>
    </div>
  )
}
