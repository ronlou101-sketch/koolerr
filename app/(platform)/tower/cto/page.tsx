import Link from 'next/link'
import { getCTOData } from './cto-data'
import { getAgentTasks } from '../agents/agent-tasks'
import { getSupportData } from '../support/support-data'
import {
  buildExecutionJobs,
  buildExecutionMetrics,
  buildAgentUtilization,
} from '../execution/execution-data'
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
  const [data, { tasks: allTasks }, supportData] = await Promise.all([
    getCTOData(),
    getAgentTasks(),
    getSupportData(),
  ])
  const { platformIssues, maintenance, technicalDebt, pendingDecisions, generatedAt } = data

  const execJobs = buildExecutionJobs(allTasks, supportData.tickets, data.generatedAt)
  const execMetrics = buildExecutionMetrics(execJobs)
  const agentUtil = buildAgentUtilization(execJobs)

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
    </div>
  )
}
