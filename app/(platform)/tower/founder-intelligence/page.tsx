import Link from 'next/link'
import { getExecutiveData } from '../executive/executive-data'
import { getSupportData } from '../support/support-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { buildExecutionJobs } from '../execution/execution-data'
import { buildBrainScores, buildBrainObjectives } from '../business-brain/brain-data'
import type { ActionPriority } from '../executive/executive-data'

export const dynamic = 'force-dynamic'

const PRIORITY_BADGE: Record<ActionPriority, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

const PRIORITY_BORDER: Record<ActionPriority, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
}

export default async function FounderIntelligencePage() {
  const [executiveData, supportData, workforceData] = await Promise.all([
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])

  const agentTasks = buildAgentTasks(executiveData)
  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, executiveData.generatedAt)
  const scores = buildBrainScores(executiveData, supportData, workforceData)
  const objectives = buildBrainObjectives(executiveData, supportData, workforceData)

  const briefTime = new Date(executiveData.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  // Current pending approvals (executive action queue items that need founder action)
  const criticalHighActions = executiveData.actionQueue.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  )

  // Agent tasks requiring approval
  const approvalTasks = agentTasks.filter((t) => t.requiresApproval)
  const supportApprovals = supportData.tickets.filter((t) => t.requiresFounderApproval)

  // Execution jobs waiting
  const waitingJobs = execJobs.filter((j) => j.stage === 'waiting_approval')

  // Objectives affecting growth
  const growthObjectives = objectives.filter(
    (o) => o.id === 'grow-mrr' || o.id === 'improve-onboarding'
  )

  // Objectives affecting customers
  const customerObjectives = objectives.filter(
    (o) =>
      o.id === 'increase-satisfaction' || o.id === 'reduce-churn' || o.id === 'reduce-support-load'
  )

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Founder Intelligence</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Founder Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Current decisions pending, high-impact actions, and how your choices shape the business
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Pending Approvals',
            value: approvalTasks.length + supportApprovals.length,
            color:
              approvalTasks.length + supportApprovals.length > 0
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-foreground',
          },
          {
            label: 'Critical Actions',
            value: criticalHighActions.length,
            color:
              criticalHighActions.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground',
          },
          {
            label: 'Objectives On Track',
            value: objectives.filter((o) => o.status === 'on-track').length,
            color: 'text-emerald-700 dark:text-emerald-400',
          },
          {
            label: 'Objectives Blocked',
            value: objectives.filter((o) => o.status === 'blocked').length,
            color:
              objectives.filter((o) => o.status === 'blocked').length > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-foreground',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Current pending approvals */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Pending Approvals{' '}
            <span className="ml-1 font-normal text-muted-foreground">({waitingJobs.length})</span>
          </h2>
          <Link
            href="/tower/approvals"
            className="text-xs font-medium text-foreground hover:underline"
          >
            Full approval queue →
          </Link>
        </div>

        {waitingJobs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              No items awaiting your approval
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              All agent recommendations have been actioned or are queued for automatic execution
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {waitingJobs.slice(0, 8).map((job) => (
              <div
                key={job.id}
                className={`rounded-lg border bg-card p-4 ${
                  job.priority === 'critical'
                    ? 'border-red-200 dark:border-red-800'
                    : job.priority === 'high'
                      ? 'border-amber-200 dark:border-amber-800'
                      : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[job.priority]}`}
                    >
                      {job.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{job.agentName}</span>
                  </div>
                  <Link href="/tower/approvals" className="text-xs text-foreground hover:underline">
                    Review →
                  </Link>
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">{job.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{job.description}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Est. impact: </span>
                  {job.estimatedImpact}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* High-impact platform actions */}
      {criticalHighActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            High-Impact Actions{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({criticalHighActions.length})
            </span>
          </h2>
          <div className="space-y-2">
            {criticalHighActions.map((action) => (
              <div
                key={action.id}
                className={`rounded-lg border bg-card p-4 ${PRIORITY_BORDER[action.priority]}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[action.priority]}`}
                  >
                    {action.priority}
                  </span>
                  <Link
                    href={action.href}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View →
                  </Link>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{action.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{action.reason}</p>
                <p className="mt-2 text-xs">
                  <span className="font-medium text-foreground">Action: </span>
                  <span className="text-muted-foreground">{action.recommendedAction}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Decisions affecting growth */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Decisions Affecting Growth</h2>
        <div className="space-y-2">
          {growthObjectives.map((obj) => (
            <div key={obj.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{obj.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{obj.signal}</p>
                </div>
                <span
                  className={`flex-shrink-0 text-lg font-semibold tabular-nums ${
                    obj.score >= 70
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : obj.score >= 45
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {obj.score}
                </span>
              </div>
              {obj.blockingIssue && (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Blocking issue: {obj.blockingIssue}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Decisions affecting customers */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Decisions Affecting Customers</h2>
        <div className="space-y-2">
          {customerObjectives.map((obj) => (
            <div key={obj.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-foreground">{obj.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{obj.signal}</p>
                </div>
                <span
                  className={`flex-shrink-0 text-lg font-semibold tabular-nums ${
                    obj.score >= 70
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : obj.score >= 45
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {obj.score}
                </span>
              </div>
              {obj.blockingIssue && (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Blocking issue: {obj.blockingIssue}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Approval history honest note */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Decision History</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6">
          <p className="text-sm font-medium text-foreground">
            Approval history requires a persistence layer
          </p>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Previous approvals, rejections, and high-impact decisions are currently tracked
            client-side only (cleared on page reload). To persist founder decision history, a
            <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
              founder_decisions
            </code>
            database table would need to be added. Once persisted, this page will show: approval
            rate by agent, rejection patterns, time-to-decision averages, and outcomes of past
            approved actions.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/tower/approvals"
              className="inline-flex items-center rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Current approval queue →
            </Link>
            <Link
              href="/tower/audit"
              className="inline-flex items-center rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Platform audit log →
            </Link>
          </div>
        </div>
      </section>

      {/* Business brain score summary */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Business Health at a Glance</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Overall', value: scores.overall.score, note: scores.overall.note },
            { label: 'Financial', value: scores.financial.score, note: scores.financial.note },
            { label: 'Growth', value: scores.growth.score, note: scores.growth.note },
            { label: 'Risk', value: scores.risk.score, note: scores.risk.note },
          ].map(({ label, value, note }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-2 text-xl font-semibold tabular-nums ${
                  value >= 70
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : value >= 45
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-red-700 dark:text-red-400'
                }`}
              >
                {value}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <Link href="/tower/business-brain" className="hover:text-foreground">
            Full Business Brain →
          </Link>
        </p>
      </section>
    </div>
  )
}
