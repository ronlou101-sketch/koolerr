import Link from 'next/link'
import { getCTOData } from './cto-data'
import { getAgentTasks } from '../agents/agent-tasks'
import { getSupportData } from '../support/support-data'
import {
  buildExecutionJobs,
  buildExecutionMetrics,
  buildAgentUtilization,
} from '../execution/execution-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildOptimizationData } from '../optimization/optimization-data'
import { buildPredictionData } from '../predictions/prediction-data'
import { getExecutiveData } from '../executive/executive-data'
import type { IssueSeverity } from './cto-data'
import type { TaskPriority } from '../agents/agent-tasks'

export const dynamic = 'force-dynamic'

const TASK_PRIORITY_BADGE: Record<TaskPriority, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

const SEVERITY_BADGE: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
  info: 'bg-muted text-muted-foreground',
}

const SEVERITY_BORDER: Record<IssueSeverity, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
  info: 'border-border',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

export default async function CTOOperationsCenterPage() {
  const [data, { tasks: allTasks }, supportData, workforceData, executiveData] = await Promise.all([
    getCTOData(),
    getAgentTasks(),
    getSupportData(),
    getWorkforceStatusData(),
    getExecutiveData(),
  ])
  const { platformIssues, maintenance, technicalDebt, pendingDecisions, generatedAt } = data

  const execJobs = buildExecutionJobs(allTasks, supportData.tickets, data.generatedAt)
  const execMetrics = buildExecutionMetrics(execJobs)
  const agentUtil = buildAgentUtilization(execJobs)
  const optimization = buildOptimizationData(
    executiveData,
    supportData,
    workforceData,
    allTasks,
    execJobs
  )
  const prediction = buildPredictionData(
    executiveData,
    supportData,
    workforceData,
    allTasks,
    execJobs
  )

  // Mission Health (Phase 9 — inline derivation from existing task data)
  const MISSION_DEPS_CTO: Record<string, string[]> = {
    'cs-first-customer': ['cfo-stripe-not-configured'],
    'cs-onboarding-not-configured': ['cs-first-customer'],
    'cs-health-scores-not-configured': ['cs-first-customer'],
    'cmo-crm-not-configured': ['cs-first-customer'],
    'content-feedback-not-configured': ['cs-first-customer'],
  }
  const taskIds = new Set(allTasks.map((t) => t.id))
  const blockedMissions = allTasks.filter((t) => {
    if (t.requiresApproval) return false
    const deps = MISSION_DEPS_CTO[t.id] ?? []
    return deps.some((dep) => taskIds.has(dep))
  })
  const executingMissions = allTasks.filter((t) => !t.requiresApproval && t.priority === 'critical')
  const planningMissions = allTasks.filter((t) => !t.requiresApproval && t.priority === 'high')
  const awaitingFounderCount = allTasks.filter((t) => t.requiresApproval).length
  const avgSystemConfidence =
    execJobs.length > 0
      ? Math.round(execJobs.reduce((s, j) => s + j.confidenceScore, 0) / execJobs.length)
      : 0
  const wfSuccessRate =
    workforceData.totalRunsAllWorkforces > 0
      ? Math.round(
          (workforceData.workforces.reduce((s, w) => s + w.completedRuns, 0) /
            workforceData.totalRunsAllWorkforces) *
            100
        )
      : null

  // Business Brain cross-agent intelligence (derived from existing data)
  const tasksByAgent = new Map<string, typeof allTasks>()
  for (const task of allTasks) {
    const existing = tasksByAgent.get(task.agentId) ?? []
    existing.push(task)
    tasksByAgent.set(task.agentId, existing)
  }
  const billingTasks = allTasks.filter((t) => t.agentId === 'cfo')
  const supportTasks = allTasks.filter((t) => t.agentId === 'support-manager')
  const csTasks = allTasks.filter((t) => t.agentId === 'customer-success')
  const crossAgentCollaborations: Array<{ agents: string; topic: string }> = []
  if (billingTasks.length > 0 && csTasks.length > 0) {
    crossAgentCollaborations.push({
      agents: 'CFO + Customer Success',
      topic: 'Billing health and customer retention require coordinated action',
    })
  }
  if (allTasks.filter((t) => t.agentId === 'cto').length > 0 && supportTasks.length > 0) {
    crossAgentCollaborations.push({
      agents: 'CTO + Support Manager',
      topic: 'Technical issues feeding into support ticket queue',
    })
  }

  const ctoTasks = allTasks.filter((t) => t.agentId === 'cto')
  const ctoCritical = ctoTasks.filter((t) => t.priority === 'critical' || t.priority === 'high')
  const ctoOther = ctoTasks.filter((t) => t.priority === 'medium' || t.priority === 'low')

  const briefTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

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
            <span className="text-foreground">CTO Operations</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">CTO Operations Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform issues, maintenance backlog, technical debt, and pending decisions
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* CTO Agent Recommendations */}
      {ctoTasks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              CTO Agent Recommendations{' '}
              <span className="ml-1 font-normal text-muted-foreground">({ctoTasks.length})</span>
            </h2>
            <Link
              href="/tower/approvals?agent=cto"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Review all in queue →
            </Link>
          </div>
          <div className="space-y-2">
            {[...ctoCritical, ...ctoOther].map((task) => (
              <div
                key={task.id}
                className={`rounded-lg border bg-card p-4 ${
                  task.priority === 'critical'
                    ? 'border-red-200 dark:border-red-800'
                    : task.priority === 'high'
                      ? 'border-amber-200 dark:border-amber-800'
                      : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TASK_PRIORITY_BADGE[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{task.source}</span>
                  </div>
                  <Link
                    href={`/tower/approvals?agent=cto`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Submit to approvals →
                  </Link>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{task.description}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {task.recommendedAction}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Agents recommend · Founder approves · System executes
          </p>
        </section>
      )}

      {/* Platform Issues */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Platform Issues{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({platformIssues.length})
            </span>
          </h2>
          <Link
            href="/tower/health"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full health dashboard →
          </Link>
        </div>

        {platformIssues.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              No platform issues detected
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              All monitored systems are operating normally
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {platformIssues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-lg border bg-card p-4 ${SEVERITY_BORDER[issue.severity]}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{issue.affectedSystem}</span>
                  </div>
                  <Link
                    href={issue.href}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View details →
                  </Link>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{issue.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {issue.explanation}
                </p>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Action:</span>{' '}
                    {issue.recommendedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Resolved */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recently Resolved</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6">
          <p className="text-sm text-muted-foreground">
            Resolution history is not available — requires health state persistence
          </p>
          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
            Tower Control derives platform issues from live data on each page load. To track when
            issues are resolved and how long they persisted, a health history table would need to be
            added to the database.
          </p>
        </div>
      </section>

      {/* Recommended Maintenance */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Recommended Maintenance{' '}
          <span className="ml-1 font-normal text-muted-foreground">({maintenance.length})</span>
        </h2>
        <div className="space-y-3">
          {maintenance.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.area}</span>
                </div>
                {item.href && (
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View →
                  </Link>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Effort:</span> {item.effort}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Debt */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Technical Debt{' '}
          <span className="ml-1 font-normal text-muted-foreground">({technicalDebt.length})</span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Item
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Category
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Impact
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Effort
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {technicalDebt.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 align-top sm:table-cell">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {item.category}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 align-top text-xs text-muted-foreground lg:table-cell">
                    {item.impact}
                  </td>
                  <td className="hidden px-4 py-3 text-right align-top text-xs text-muted-foreground md:table-cell">
                    {item.effort}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending Founder Decisions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Pending Founder Decisions{' '}
          <span className="ml-1 font-normal text-muted-foreground">
            ({pendingDecisions.length})
          </span>
        </h2>

        {pendingDecisions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No pending decisions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDecisions.map((decision) => (
              <div key={decision.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{decision.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {decision.context}
                </p>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Options
                  </p>
                  <ul className="space-y-1">
                    {decision.options.map((opt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-px flex-shrink-0 font-medium text-muted-foreground/60">
                          {i + 1}.
                        </span>
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={decision.href}
                    className="mt-3 inline-flex items-center text-xs text-foreground hover:underline"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Business Brain Insights */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Business Brain Insights</h2>
          <Link
            href="/tower/business-brain"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full Business Brain →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Cross-agent coordination */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cross-Agent Coordination
            </p>
            {crossAgentCollaborations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active cross-agent collaborations</p>
            ) : (
              <ul className="space-y-2">
                {crossAgentCollaborations.map((c, i) => (
                  <li key={i}>
                    <p className="text-xs font-medium text-foreground">{c.agents}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.topic}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Organizational bottlenecks */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bottlenecks
            </p>
            {execMetrics.waitingApproval === 0 && supportData.stats.awaitingFounder === 0 ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                No organizational bottlenecks detected
              </p>
            ) : (
              <ul className="space-y-1.5">
                {execMetrics.waitingApproval > 0 && (
                  <li className="text-xs text-muted-foreground">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {execMetrics.waitingApproval} execution job
                      {execMetrics.waitingApproval !== 1 ? 's' : ''}
                    </span>{' '}
                    blocked on founder approval
                  </li>
                )}
                {supportData.stats.awaitingFounder > 0 && (
                  <li className="text-xs text-muted-foreground">
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {supportData.stats.awaitingFounder} support ticket
                      {supportData.stats.awaitingFounder !== 1 ? 's' : ''}
                    </span>{' '}
                    require founder decision
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Long-term risks */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Long-Term Risks
            </p>
            {technicalDebt.length === 0 ? (
              <p className="text-xs text-muted-foreground">No registered technical debt</p>
            ) : (
              <ul className="space-y-1.5">
                {technicalDebt.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-xs">
                    <span className="font-medium text-foreground">{item.title}</span>
                    <span className="ml-1 text-muted-foreground">· {item.category}</span>
                  </li>
                ))}
                {technicalDebt.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{technicalDebt.length - 3} more items
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Suggested improvements */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested Platform Improvements
            </p>
            {maintenance.length === 0 ? (
              <p className="text-xs text-muted-foreground">No maintenance items queued</p>
            ) : (
              <ul className="space-y-1.5">
                {maintenance.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-xs">
                    <span className="font-medium text-foreground">{item.title}</span>
                    <span className="ml-1 text-muted-foreground">· {item.effort}</span>
                  </li>
                ))}
                {maintenance.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{maintenance.length - 3} more items
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Mission Health */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Mission Health</h2>
          <Link
            href="/tower/company-os"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Company OS →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            {
              label: 'Executing',
              value: executingMissions.length,
              color: 'text-blue-700 dark:text-blue-400',
            },
            { label: 'Planning', value: planningMissions.length, color: 'text-foreground' },
            {
              label: 'Awaiting Founder',
              value: awaitingFounderCount,
              color:
                awaitingFounderCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground',
            },
            {
              label: 'Blocked',
              value: blockedMissions.length,
              color:
                blockedMissions.length > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground',
            },
            {
              label: 'Avg Confidence',
              value: avgSystemConfidence > 0 ? `${avgSystemConfidence}%` : '—',
              color:
                avgSystemConfidence >= 80
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : avgSystemConfidence >= 60
                    ? 'text-amber-700 dark:text-amber-400'
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

        {/* Blocked Dependencies */}
        {blockedMissions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Blocked Dependencies
            </p>
            {blockedMissions.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-card p-3 dark:border-red-800"
              >
                <div className="flex-1">
                  <p className="line-clamp-1 text-xs font-medium text-foreground">
                    {task.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{task.agentName}</p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300">
                  Blocked
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Retry Queue */}
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Retry Queue
            </p>
            <span className="text-xs text-muted-foreground">0 items</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            No missions currently in retry — retry tracking requires execution history persistence
          </p>
        </div>

        {/* System Efficiency */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Avg Mission Confidence',
              value: avgSystemConfidence > 0 ? `${avgSystemConfidence}%` : 'No data',
            },
            {
              label: 'AI Workforce Success',
              value: wfSuccessRate !== null ? `${wfSuccessRate}%` : 'No runs',
            },
            { label: 'Completion Rate', value: 'Requires history' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Execution Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Execution Intelligence</h2>
          <Link
            href="/tower/execution"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full execution engine →
          </Link>
        </div>

        {/* Queue health */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Total in Queue',
              value: execJobs.length,
            },
            {
              label: 'Waiting Approval',
              value: execMetrics.waitingApproval,
              color:
                execMetrics.waitingApproval > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-foreground',
            },
            { label: 'Avg Execution Time', value: execMetrics.avgExecutionTime, isText: true },
            { label: 'Failure Rate', value: 'No history', isText: true },
          ].map(({ label, value, color, isText }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className={`mt-2 ${isText ? 'text-sm font-medium' : 'text-xl font-semibold tabular-nums'} ${color ?? 'text-foreground'}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Bottlenecks */}
        {execMetrics.waitingApproval > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Bottleneck: {execMetrics.waitingApproval} job
                {execMetrics.waitingApproval !== 1 ? 's' : ''} blocked on founder approval
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Execution cannot proceed until the founder approves these tasks.
              </p>
            </div>
            <Link
              href="/tower/approvals"
              className="flex-shrink-0 text-xs text-foreground hover:underline"
            >
              Approve →
            </Link>
          </div>
        )}

        {/* Agent utilization table */}
        {agentUtil.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Agent
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Domain
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Queue
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                    Awaiting Approval
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentUtil.map((rec) => (
                  <tr key={rec.agentId}>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      {rec.agentName}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                      {rec.domain}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-foreground">
                      {rec.totalJobs}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-xs tabular-nums md:table-cell">
                      <span
                        className={
                          rec.waitingApproval > 0
                            ? 'font-medium text-amber-700 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }
                      >
                        {rec.waitingApproval}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right lg:table-cell">
                      <span
                        className={`text-xs font-medium ${
                          rec.avgConfidence >= 80
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : rec.avgConfidence >= 60
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {rec.avgConfidence}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Retry Count', value: '0' },
            { label: 'Top Performing Agent', value: 'No history' },
            { label: 'Slowest Executions', value: 'No history' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Support Operations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Support Operations</h2>
          <Link
            href="/tower/support"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Support command center →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: 'Open Tickets',
              value: supportData.stats.totalOpen,
              color:
                supportData.stats.totalOpen > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400',
            },
            {
              label: 'Escalations',
              value: supportData.stats.escalations,
              color:
                supportData.stats.escalations > 0
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-foreground',
            },
            {
              label: 'AI Resolution',
              value:
                supportData.stats.aiResolutionPct !== null
                  ? `${supportData.stats.aiResolutionPct}%`
                  : '—',
              color: 'text-foreground',
            },
            { label: 'Avg Resolution', value: '—', color: 'text-muted-foreground' },
            {
              label: 'Awaiting Founder',
              value: supportData.stats.awaitingFounder,
              color:
                supportData.stats.awaitingFounder > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-foreground',
            },
            {
              label: 'Active Agents',
              value: supportData.agents.filter((a) => a.status === 'active').length,
              color: 'text-foreground',
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

        {/* Agent workload */}
        {supportData.agents.some((a) => a.currentWorkload > 0) && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Agent
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Workload
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Avg Response
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {supportData.agents
                  .filter((a) => a.status !== 'not-configured')
                  .map((agent) => (
                    <tr key={agent.id}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground">{agent.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{agent.role}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-foreground">
                        {agent.currentWorkload > 0 ? `${agent.currentWorkload}` : '—'}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs text-muted-foreground sm:table-cell">
                        {agent.avgResponseTime}
                      </td>
                      <td className="hidden px-4 py-3 text-right md:table-cell">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            agent.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottlenecks */}
        {supportData.stats.awaitingFounder > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Bottleneck: {supportData.stats.awaitingFounder} ticket
                {supportData.stats.awaitingFounder !== 1 ? 's' : ''} blocked on founder approval
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Billing tickets and escalations require founder sign-off before the agent can act.
              </p>
            </div>
            <Link
              href="/tower/approvals"
              className="flex-shrink-0 text-xs text-foreground hover:underline"
            >
              Approve →
            </Link>
          </div>
        )}
      </section>

      {/* Recurring Engineering Issues */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recurring Engineering Issues</h2>
        {(() => {
          const failedWorkforces = workforceData.workforces.filter(
            (w) => w.health === 'critical' || w.health === 'warning' || w.failedRuns > 0
          )
          const blockedTasks = allTasks.filter((t) => t.requiresApproval)
          const openHighTickets = supportData.tickets.filter(
            (t) =>
              (t.priority === 'critical' || t.priority === 'high') &&
              t.status !== 'ai-resolved' &&
              t.status !== 'closed'
          )

          const issues: Array<{
            title: string
            description: string
            severity: 'critical' | 'high' | 'medium'
            action: string
          }> = []

          if (failedWorkforces.length > 0) {
            const names = failedWorkforces
              .slice(0, 3)
              .map((w) => w.workforceName)
              .join(', ')
            issues.push({
              title: `${failedWorkforces.length} workforce${failedWorkforces.length !== 1 ? 's' : ''} with failures`,
              description: `${names}${failedWorkforces.length > 3 ? ` +${failedWorkforces.length - 3} more` : ''} have recorded failed runs`,
              severity: failedWorkforces.some((w) => w.health === 'critical') ? 'critical' : 'high',
              action: 'Review workforce health and last error logs',
            })
          }

          if (blockedTasks.length > 0) {
            issues.push({
              title: `${blockedTasks.length} agent task${blockedTasks.length !== 1 ? 's' : ''} awaiting approval`,
              description: 'Agents cannot proceed without founder sign-off',
              severity: blockedTasks.length > 5 ? 'high' : 'medium',
              action: 'Clear approval queue to unblock execution',
            })
          }

          if (openHighTickets.length > 0) {
            issues.push({
              title: `${openHighTickets.length} high-priority support ticket${openHighTickets.length !== 1 ? 's' : ''} unresolved`,
              description: 'Open urgent/high tickets indicate recurring customer-facing issues',
              severity: openHighTickets.some((t) => t.priority === 'critical') ? 'high' : 'medium',
              action: 'Prioritize resolution to prevent churn signals',
            })
          }

          if (workforceData.totalRunsAllWorkforces === 0) {
            issues.push({
              title: 'No workforce runs recorded',
              description:
                'Automation is not yet generating activity — workforces may need configuration',
              severity: 'medium',
              action: 'Verify workforce configuration and trigger initial engagement runs',
            })
          }

          if (issues.length === 0) {
            return (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-5 dark:border-emerald-800 dark:bg-emerald-950/20">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                  No recurring issues detected
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Platform signals are clean in the current snapshot
                </p>
              </div>
            )
          }

          return (
            <div className="space-y-2">
              {issues.map((issue, i) => (
                <div
                  key={i}
                  className={`rounded-lg border bg-card p-4 ${
                    issue.severity === 'critical'
                      ? 'border-red-200 dark:border-red-800'
                      : issue.severity === 'high'
                        ? 'border-amber-200 dark:border-amber-800'
                        : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm font-medium text-foreground">{issue.title}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        issue.severity === 'critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : issue.severity === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{issue.description}</p>
                  <p className="mt-1.5 text-xs font-medium text-foreground">
                    Action: {issue.action}
                  </p>
                </div>
              ))}
            </div>
          )
        })()}
        <p className="text-xs text-muted-foreground">
          <Link href="/tower/company-memory" className="hover:text-foreground">
            Full engineering insights in Company Memory →
          </Link>
        </p>
      </section>

      {/* Engineering Optimization */}
      {optimization.engineeringImprovements.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Engineering Optimization</h2>
            <Link
              href="/tower/optimization"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Full Optimization Center →
            </Link>
          </div>
          <div className="space-y-2">
            {optimization.engineeringImprovements.slice(0, 4).map((rec) => (
              <div
                key={rec.id}
                className={`rounded-lg border bg-card p-4 ${
                  rec.priority === 'critical'
                    ? 'border-red-200 dark:border-red-800'
                    : rec.priority === 'high'
                      ? 'border-amber-200 dark:border-amber-800'
                      : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      rec.priority === 'critical'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        : rec.priority === 'high'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{rec.description}</p>
                <p className="mt-1.5 text-xs text-foreground">
                  <span className="font-medium">Next: </span>
                  {rec.recommendedNextStep}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ROI: {rec.estimatedROI} · Agent: {rec.suggestedAgent}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Workforce Utilization */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">AI Workforce Utilization</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Efficiency
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Capacity
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Workload
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {optimization.agentEfficiency.map((agent) => (
                <tr key={agent.agentId}>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium text-foreground">{agent.agentName}</p>
                    <p className="text-xs text-muted-foreground">{agent.domain}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`text-xs font-semibold ${
                        agent.currentEfficiency >= 70
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : agent.currentEfficiency >= 45
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {agent.currentEfficiency}
                    </span>
                  </td>
                  <td className="hidden px-4 py-2.5 text-right text-xs text-muted-foreground sm:table-cell">
                    {agent.estimatedCapacity}%
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        agent.recommendedWorkload === 'increase'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : agent.recommendedWorkload === 'reduce'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {agent.recommendedWorkload}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Infrastructure & Engineering Forecast */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Infrastructure Forecast</h2>
          <Link
            href="/tower/predictions"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full Forecast Center →
          </Link>
        </div>
        {prediction.engineeringForecast.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
            <p className="text-xs text-muted-foreground">
              No engineering forecasts — platform is stable.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {prediction.engineeringForecast.slice(0, 4).map((pred) => (
              <div
                key={pred.id}
                className={`rounded-lg border bg-card p-4 ${
                  pred.priority === 'critical'
                    ? 'border-red-200 dark:border-red-800'
                    : pred.priority === 'high'
                      ? 'border-amber-200 dark:border-amber-800'
                      : 'border-border'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{pred.title}</p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        pred.priority === 'critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : pred.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      }`}
                    >
                      {pred.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{pred.confidence}% conf.</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{pred.description}</p>
                <p className="mt-1.5 text-xs text-foreground">
                  <span className="font-medium">Next: </span>
                  {pred.recommendedNextStep}
                </p>
              </div>
            ))}
          </div>
        )}
        {/* AI Workforce capacity forecast */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Projected AI Workforce Utilization
          </p>
          <div className="space-y-1.5">
            {prediction.agentForecasts.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{agent.agentName}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-medium ${
                      agent.predictedCapacity >= 70
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : agent.predictedCapacity >= 45
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {agent.predictedCapacity}% capacity
                  </span>
                  <span className="text-muted-foreground">{agent.trendForecast}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
