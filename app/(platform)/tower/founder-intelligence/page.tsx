import Link from 'next/link'
import { getExecutiveData } from '../executive/executive-data'
import { getSupportData } from '../support/support-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { buildExecutionJobs } from '../execution/execution-data'
import { buildBrainScores, buildBrainObjectives } from '../business-brain/brain-data'
import { buildCompanyOSData } from '../company-os/company-os-data'
import { buildCompanyMemoryData } from '../company-memory/company-memory-data'
import { buildOptimizationData } from '../optimization/optimization-data'
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
  const os = buildCompanyOSData(executiveData, supportData, workforceData, agentTasks)
  const memory = buildCompanyMemoryData(
    executiveData,
    supportData,
    workforceData,
    agentTasks,
    execJobs
  )
  const optimization = buildOptimizationData(
    executiveData,
    supportData,
    workforceData,
    agentTasks,
    execJobs
  )

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

  // Phase 9: Decision classification
  const criticalDecisions = os.missionsByState.awaiting_founder.filter(
    (m) => m.priority === 'critical' || m.priority === 'high'
  )
  const delegatedDecisions = os.missions.filter(
    (m) => !m.requiresFounderApproval && (m.state === 'executing' || m.state === 'planning')
  )
  const avgAgentConfidence =
    os.agentWorkloads.filter((w) => w.avgConfidence > 0).length > 0
      ? Math.round(
          os.agentWorkloads
            .filter((w) => w.avgConfidence > 0)
            .reduce((s, w) => s + w.avgConfidence, 0) /
            os.agentWorkloads.filter((w) => w.avgConfidence > 0).length
        )
      : 0

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

      {/* Critical Decisions */}
      {criticalDecisions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Critical Decisions{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({criticalDecisions.length})
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            High-impact decisions requiring immediate founder action — agents cannot proceed until
            resolved
          </p>
          <div className="space-y-2">
            {criticalDecisions.map((m) => (
              <div
                key={m.id}
                className={`rounded-lg border bg-card p-4 ${
                  m.priority === 'critical'
                    ? 'border-red-200 dark:border-red-800'
                    : 'border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                    >
                      {m.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.agentName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.confidence}% confidence</span>
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">{m.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                <p className="mt-2 text-xs">
                  <span className="font-medium text-foreground">Business impact: </span>
                  <span className="text-muted-foreground">{m.businessImpact}</span>
                </p>
                <Link
                  href="/tower/approvals"
                  className="mt-2 inline-block text-xs font-medium text-foreground hover:underline"
                >
                  Approve in queue →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Delegated Decisions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Delegated Decisions{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({delegatedDecisions.length})
            </span>
          </h2>
          <Link
            href="/tower/company-os"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Company OS →
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Missions the Business Brain is executing without founder sign-off
        </p>
        {delegatedDecisions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              No missions in autonomous execution — all are awaiting approval or queued
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {delegatedDecisions.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {m.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.agentName}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-foreground">
                      {m.title}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-medium text-muted-foreground">
                    {m.confidence}%
                  </span>
                </div>
              ))}
              {delegatedDecisions.length > 6 && (
                <div className="px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    +{delegatedDecisions.length - 6} more delegated
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Recommendation Confidence */}
      {avgAgentConfidence > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recommendation Confidence</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Agent
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Missions
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Confidence
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Awaiting You
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {os.agentWorkloads.map((wl) => (
                  <tr key={wl.agentId}>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">
                      {wl.agentName}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-muted-foreground">
                      {wl.totalMissions}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-xs font-medium ${
                          wl.avgConfidence >= 80
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : wl.avgConfidence >= 65
                              ? 'text-amber-700 dark:text-amber-400'
                              : wl.avgConfidence > 0
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-muted-foreground'
                        }`}
                      >
                        {wl.avgConfidence > 0 ? `${wl.avgConfidence}%` : '—'}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right sm:table-cell">
                      <span
                        className={`text-xs ${wl.awaitingFounder > 0 ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
                      >
                        {wl.awaitingFounder > 0 ? wl.awaitingFounder : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border bg-muted/20 px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                System average:{' '}
                <span className="font-medium text-foreground">{avgAgentConfidence}%</span>{' '}
                confidence across all agents
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Completed Decisions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Completed Decisions</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-4">
          <p className="text-sm font-medium text-foreground">No completion history available</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Decision outcomes are not yet persisted. Once a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              founder_decisions
            </code>{' '}
            table is added, this section will show: decisions approved, decisions rejected,
            time-to-decision, and outcome tracking.
          </p>
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

      {/* Decision Effectiveness */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Decision Effectiveness</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Intelligence Score
            </p>
            <p
              className={`mt-2 text-2xl font-semibold tabular-nums ${
                memory.intelligenceScore.overall >= 70
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : memory.intelligenceScore.overall >= 45
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-700 dark:text-red-400'
              }`}
            >
              {memory.intelligenceScore.overall}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Composite platform signal — updates on load
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Patterns Detected
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {memory.patterns.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {memory.patterns.filter((p) => p.impact === 'negative').length} negative,{' '}
              {memory.patterns.filter((p) => p.impact === 'positive').length} positive
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Learning Objectives
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {memory.learningObjectives.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {
                memory.learningObjectives.filter(
                  (o) => o.priority === 'critical' || o.priority === 'high'
                ).length
              }{' '}
              critical / high priority
            </p>
          </div>
        </div>

        {memory.recentWins.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/10">
            <div className="border-b border-emerald-200 bg-emerald-100/50 px-4 py-2 dark:border-emerald-900 dark:bg-emerald-950/20">
              <p className="text-xs font-medium text-emerald-900 dark:text-emerald-300">
                Recent Wins
              </p>
            </div>
            <div className="divide-y divide-emerald-100 dark:divide-emerald-900/30">
              {memory.recentWins.slice(0, 3).map((win) => (
                <div key={win.id} className="px-4 py-2.5">
                  <p className="text-xs font-medium text-foreground">{win.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{win.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {memory.recentFailures.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/10">
            <div className="border-b border-red-200 bg-red-100/50 px-4 py-2 dark:border-red-900 dark:bg-red-950/20">
              <p className="text-xs font-medium text-red-900 dark:text-red-300">
                Active Failures to Address
              </p>
            </div>
            <div className="divide-y divide-red-100 dark:divide-red-900/30">
              {memory.recentFailures.slice(0, 3).map((fail) => (
                <div key={fail.id} className="px-4 py-2.5">
                  <p className="text-xs font-medium text-foreground">{fail.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fail.recommendedNextAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Decision outcome tracking requires a{' '}
          <code className="rounded bg-muted px-1 font-mono text-xs">founder_decisions</code> table.{' '}
          <Link href="/tower/company-memory" className="hover:text-foreground">
            Full Company Memory →
          </Link>
        </p>
      </section>

      {/* Founder Productivity */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Founder Productivity</h2>
          <Link
            href="/tower/optimization"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full Optimization Center →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Time Recoverable', value: optimization.founderTimeSaved },
            {
              label: 'Strategic Focus Score',
              value: `${optimization.optimizationScore}/100`,
            },
            {
              label: 'Delegation Ops',
              value: String(optimization.delegationOpportunities.length),
            },
            {
              label: 'Approval Reduction Ops',
              value: String(
                optimization.timeSavings.filter(
                  (r) => r.id.includes('approval') || r.id.includes('delegation')
                ).length
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {optimization.delegationOpportunities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Delegation Opportunities</p>
            {optimization.delegationOpportunities.slice(0, 3).map((rec) => (
              <div key={rec.id} className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-medium text-foreground">{rec.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rec.estimatedTimeSaved} · {rec.suggestedAgent}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{rec.recommendedNextStep}</p>
              </div>
            ))}
          </div>
        )}

        {optimization.highestROIRecommendation && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/10">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Highest ROI Action Available
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {optimization.highestROIRecommendation.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {optimization.highestROIRecommendation.recommendedNextStep}
            </p>
            {optimization.highestROIRecommendation.requiresFounderApproval && (
              <Link
                href="/tower/approvals"
                className="mt-1.5 inline-block text-xs font-medium text-foreground underline underline-offset-2 hover:no-underline"
              >
                Requires approval →
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
