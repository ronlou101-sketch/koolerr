import Link from 'next/link'
import { getExecutionData } from './execution-data'
import { getExecutiveData } from '../executive/executive-data'
import { getSupportData } from '../support/support-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { buildOptimizationData } from '../optimization/optimization-data'
import { buildPredictionData } from '../predictions/prediction-data'
import type { ExecutionStage, ExecutionJob } from './execution-data'

export const dynamic = 'force-dynamic'

const STAGE_CONFIG: Record<ExecutionStage, { label: string; badge: string; border: string }> = {
  queued: {
    label: 'Queued',
    badge: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
  planning: {
    label: 'Planning',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  executing: {
    label: 'Executing',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  verification: {
    label: 'Verification',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  waiting_approval: {
    label: 'Waiting Approval',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  failed: {
    label: 'Failed',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
}

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

function confidenceColor(score: number): string {
  if (score >= 80) return 'text-emerald-700 dark:text-emerald-400'
  if (score >= 60) return 'text-amber-700 dark:text-amber-400'
  return 'text-red-700 dark:text-red-400'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}

function JobCard({ job }: { job: ExecutionJob }) {
  const stageCfg = STAGE_CONFIG[job.stage]
  return (
    <div className={`rounded-lg border bg-card p-4 ${stageCfg.border}`}>
      {/* Badges */}
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[job.priority]}`}
        >
          {job.priority}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stageCfg.badge}`}
        >
          {stageCfg.label}
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {job.agentName}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(job.createdAt)}</span>
      </div>

      {/* Title + description */}
      <p className="mt-2 text-sm font-medium text-foreground">{job.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{job.description}</p>

      {/* Metrics row */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-border/50 pt-3 text-xs">
        <span>
          <span className="text-muted-foreground">Confidence: </span>
          <span className={`font-medium ${confidenceColor(job.confidenceScore)}`}>
            {job.confidenceScore}%
          </span>
        </span>
        <span>
          <span className="text-muted-foreground">ETA: </span>
          <span className="text-foreground">{job.estimatedCompletionTime}</span>
        </span>
        <span>
          <span className="text-muted-foreground">Rollback: </span>
          <span className="text-foreground">
            {job.rollbackAvailable ? 'Available' : 'Not available'}
          </span>
        </span>
      </div>

      {/* Impact */}
      <p className="mt-1.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Impact: </span>
        {job.estimatedImpact}
      </p>

      {/* Timeline */}
      <div className="mt-3 space-y-1 border-t border-border/50 pt-3">
        {job.timeline.map((event, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium capitalize text-foreground">{event.stage}: </span>
              {event.note}
            </p>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="mt-3">
        <Link href={job.href} className="text-xs text-foreground hover:underline">
          {job.requiresFounderApproval ? 'Review in approval queue →' : 'View details →'}
        </Link>
      </div>
    </div>
  )
}

export default async function ExecutionEnginePage() {
  const [
    { jobs, metrics, agentUtilization, generatedAt },
    executiveData,
    supportData,
    workforceData,
  ] = await Promise.all([
    getExecutionData(),
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])
  const agentTasks = buildAgentTasks(executiveData)
  const optimization = buildOptimizationData(
    executiveData,
    supportData,
    workforceData,
    agentTasks,
    jobs
  )
  const prediction = buildPredictionData(
    executiveData,
    supportData,
    workforceData,
    agentTasks,
    jobs
  )

  const briefTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const waitingJobs = jobs.filter((j) => j.stage === 'waiting_approval')
  const queuedJobs = jobs.filter((j) => j.stage === 'queued')
  const activeJobs = jobs.filter(
    (j) => j.stage === 'planning' || j.stage === 'executing' || j.stage === 'verification'
  )
  const completedJobs = jobs.filter((j) => j.stage === 'completed')
  const failedJobs = jobs.filter((j) => j.stage === 'failed')

  const topAgent = agentUtilization[0]

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
            <span className="text-foreground">Execution Engine</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Execution Engine</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mission control for all AI agent operations — every task tracked from queue to
            completion
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Pipeline philosophy strip */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2 rounded-lg border border-border bg-card px-5 py-3">
          {(
            [
              { label: 'Queued', count: metrics.queued },
              null,
              { label: 'Planning', count: metrics.active },
              null,
              { label: 'Executing', count: metrics.running },
              null,
              { label: 'Verification', count: 0 },
              null,
              { label: 'Completed', count: metrics.completedToday },
            ] as Array<{ label: string; count: number } | null>
          ).map((item, i) =>
            item === null ? (
              <span key={i} className="text-xs text-muted-foreground/40">
                →
              </span>
            ) : (
              <div key={item.label} className="text-center">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-lg font-semibold tabular-nums text-foreground">{item.count}</p>
              </div>
            )
          )}
          <div className="ml-6 border-l border-border pl-6">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Waiting Approval
            </p>
            <p className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
              {metrics.waitingApproval}
            </p>
          </div>
          <div className="border-l border-border pl-6">
            <p className="text-xs font-medium text-muted-foreground">Failed</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {metrics.failedToday}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active', value: metrics.active },
          { label: 'Queued', value: metrics.queued },
          {
            label: 'Waiting Approval',
            value: metrics.waitingApproval,
            color: metrics.waitingApproval > 0 ? 'text-amber-700 dark:text-amber-400' : undefined,
          },
          { label: 'Completed Today', value: metrics.completedToday },
          {
            label: 'Failed Today',
            value: metrics.failedToday,
            color: metrics.failedToday > 0 ? 'text-red-700 dark:text-red-400' : undefined,
          },
          { label: 'Avg Execution', value: metrics.avgExecutionTime, isText: true },
          {
            label: 'Success Rate',
            value: metrics.successRate !== null ? `${metrics.successRate}%` : 'No history',
            isText: true,
          },
          {
            label: 'Running',
            value: metrics.running,
            color: metrics.running > 0 ? 'text-emerald-700 dark:text-emerald-400' : undefined,
          },
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

      {/* Business impact */}
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 flex-shrink-0 rounded-full ${
              metrics.waitingApproval > 0
                ? 'bg-amber-400'
                : jobs.length === 0
                  ? 'bg-emerald-500'
                  : 'bg-muted-foreground/40'
            }`}
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Estimated Business Impact: </span>
            {metrics.estimatedBusinessImpact}
          </p>
        </div>
      </div>

      {/* Waiting for Approval — show first, most urgent */}
      {waitingJobs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Waiting Founder Approval{' '}
              <span className="ml-1 font-normal text-muted-foreground">({waitingJobs.length})</span>
            </h2>
            <Link
              href="/tower/approvals"
              className="text-xs font-medium text-amber-700 hover:text-foreground dark:text-amber-400"
            >
              Open approval queue →
            </Link>
          </div>
          <div className="space-y-3">
            {waitingJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Queued for auto-execution */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Queued for Execution{' '}
            <span className="ml-1 font-normal text-muted-foreground">({queuedJobs.length})</span>
          </h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>
        {queuedJobs.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Execution queue is clear
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              No tasks queued for automatic execution
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queuedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Active pipeline stages */}
      {activeJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Active Pipeline{' '}
            <span className="ml-1 font-normal text-muted-foreground">({activeJobs.length})</span>
          </h2>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* History */}
      {(completedJobs.length > 0 || failedJobs.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Execution History</h2>
          <div className="space-y-3">
            {[...completedJobs, ...failedJobs].map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Agent Delegation Engine */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">AI Delegation Engine</h2>
        <p className="text-xs text-muted-foreground">
          Each recommendation is automatically routed to the specialized agent that owns that
          domain.
        </p>
        {agentUtilization.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No agent utilization data</p>
          </div>
        ) : (
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
                    Waiting Approval
                  </th>
                  <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Avg Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {agentUtilization.map((rec) => (
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
        {topAgent && (
          <p className="text-xs text-muted-foreground">
            Highest workload:{' '}
            <span className="font-medium text-foreground">{topAgent.agentName}</span> ·{' '}
            {topAgent.totalJobs} job{topAgent.totalJobs !== 1 ? 's' : ''}
          </p>
        )}
      </section>

      {/* Auto-Execution Rules */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Automatic Execution Rules</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold text-foreground">Executes Automatically</p>
            </div>
            <ul className="space-y-1.5">
              {[
                'Technical recommendations (run re-trigger, error review)',
                'Onboarding check-ins and status updates',
                'Support ticket triage and routing',
                'Platform health monitoring and alerting',
                'Audit log review and anomaly flagging',
                'Knowledge base gap identification',
                'Monitoring and observability setup guidance',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <p className="text-xs font-semibold text-foreground">Requires Founder Approval</p>
            </div>
            <ul className="space-y-1.5">
              {[
                'Financial transactions and billing changes',
                'Subscription creation, modification, or cancellation',
                'Pricing changes and plan modifications',
                'Public website or customer-facing content publishing',
                'Customer-facing messaging and outreach',
                'Security configuration and permission changes',
                'Organization deletion or access revocation',
                'Any action with significant irreversible impact',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Optimization Recommendations — approval-only routing */}
      {optimization.topOpportunities.filter((r) => r.requiresFounderApproval).length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Optimization Recommendations
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                Approval Required
              </span>
            </h2>
            <Link
              href="/tower/optimization"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Optimization Center →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            High-value improvements identified by the Self-Optimization Engine that require founder
            approval before execution.
          </p>
          <div className="space-y-2">
            {optimization.topOpportunities
              .filter((r) => r.requiresFounderApproval)
              .slice(0, 4)
              .map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-lg border bg-card p-4 ${
                    rec.priority === 'critical'
                      ? 'border-red-200 dark:border-red-800'
                      : 'border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{rec.title}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          rec.priority === 'critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {rec.suggestedAgent}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{rec.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>ROI: {rec.estimatedROI}</span>
                    <span>Time saved: {rec.estimatedTimeSaved}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-foreground">
                    <span className="font-medium">Next: </span>
                    {rec.recommendedNextStep}
                  </p>
                  <div className="mt-2">
                    <Link
                      href="/tower/approvals"
                      className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
                    >
                      Approve in approval queue →
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Predicted Mission Load */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Predicted Mission Load</h2>
          <Link
            href="/tower/predictions"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full Forecast Center →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Projected Approvals',
              value: prediction.approvalForecast.filter((p) => p.requiresFounderApproval).length,
              color:
                prediction.approvalForecast.filter((p) => p.requiresFounderApproval).length > 3
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-foreground',
              note: 'Require founder action',
            },
            {
              label: 'Execution Bottlenecks',
              value: prediction.upcomingBottlenecks.filter(
                (p) => p.category === 'execution' || p.category === 'ai-workforce'
              ).length,
              color:
                prediction.upcomingBottlenecks.length > 0
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-foreground',
              note: 'Predicted',
            },
            {
              label: 'Company Momentum',
              value: prediction.companyMomentum,
              color:
                prediction.companyMomentum === 'accelerating' ||
                prediction.companyMomentum === 'growing'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : prediction.companyMomentum === 'declining'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-foreground',
              note: 'Business trajectory',
            },
            {
              label: 'Forecast Confidence',
              value: `${prediction.forecastConfidence}%`,
              color:
                prediction.forecastConfidence >= 75
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400',
              note: 'Overall signal strength',
            },
          ].map(({ label, value, color, note }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className={`mt-2 text-lg font-semibold capitalize tabular-nums ${color}`}>
                {value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
        {/* Projected agent utilization */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border bg-muted/30 px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground">Projected Agent Utilization</p>
          </div>
          <div className="divide-y divide-border">
            {prediction.agentForecasts.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium text-foreground">{agent.agentName}</p>
                  <p className="text-xs text-muted-foreground">{agent.domain}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`font-medium ${
                      agent.predictedCapacity >= 70
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : agent.predictedCapacity >= 45
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {agent.predictedCapacity}%
                  </span>
                  <span className="text-muted-foreground">{agent.forecastedWorkload}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Top predicted bottleneck */}
        {prediction.upcomingBottlenecks[0] && (
          <div
            className={`rounded-lg border bg-card p-4 ${
              prediction.upcomingBottlenecks[0].priority === 'critical'
                ? 'border-red-200 dark:border-red-800'
                : 'border-amber-200 dark:border-amber-800'
            }`}
          >
            <p className="mb-1 text-xs font-medium text-amber-700 dark:text-amber-400">
              Top Predicted Execution Bottleneck
            </p>
            <p className="text-sm font-medium text-foreground">
              {prediction.upcomingBottlenecks[0].title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {prediction.upcomingBottlenecks[0].recommendedNextStep}
            </p>
          </div>
        )}
      </section>

      {/* Architecture note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How execution works</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The execution engine derives jobs from live platform signals on every load — no fabricated
          activity. Jobs are queued when agents identify actionable recommendations. When founder
          approves a task in the{' '}
          <Link
            href="/tower/approvals"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Approval Queue
          </Link>
          , execution proceeds to the relevant management page where the action is taken. Automatic
          execution of external actions (Stripe calls, email delivery, API integrations) requires
          the relevant service to be connected first. Rejected tasks reappear on the next load until
          the underlying condition is resolved.
        </p>
      </div>
    </div>
  )
}
