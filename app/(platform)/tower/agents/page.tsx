import Link from 'next/link'
import { getAgentRegistry } from './agent-registry'
import { getSupportData } from '../support/support-data'
import { buildExecutionJobs, buildAgentUtilization } from '../execution/execution-data'
import type { AgentStatus, AgentHealth } from './agent-registry'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<AgentStatus, { dot: string; label: string; text: string }> = {
  active: {
    dot: 'bg-emerald-500',
    label: 'Active',
    text: 'text-emerald-700 dark:text-emerald-400',
  },
  'attention-required': {
    dot: 'bg-amber-400',
    label: 'Attention Required',
    text: 'text-amber-700 dark:text-amber-400',
  },
  idle: {
    dot: 'bg-muted-foreground/30',
    label: 'Idle',
    text: 'text-muted-foreground',
  },
  'not-configured': {
    dot: 'bg-muted-foreground/30',
    label: 'Not Configured',
    text: 'text-muted-foreground',
  },
}

const HEALTH_BADGE: Record<AgentHealth, string> = {
  healthy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'not-configured': 'bg-muted text-muted-foreground',
}

const HEALTH_LABEL: Record<AgentHealth, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  'not-configured': 'Not Configured',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
  return `${Math.round(diff / 86_400_000)}d ago`
}

export default async function AgentRegistryPage() {
  const [{ agents, agentTasks, generatedAt }, supportData] = await Promise.all([
    getAgentRegistry(),
    getSupportData(),
  ])

  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, generatedAt)
  const utilization = buildAgentUtilization(execJobs)
  const utilizationByAgentId = new Map(utilization.map((u) => [u.agentId, u]))

  const generatedTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const activeCount = agents.filter(
    (a) => a.status === 'active' || a.status === 'attention-required'
  ).length
  const attentionCount = agents.filter((a) => a.status === 'attention-required').length
  const totalWaitingApproval = utilization.reduce((s, u) => s + u.waitingApproval, 0)

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
            <span className="text-foreground">Agent Registry</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Agent Registry</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All platform agents — status, responsibilities, and pending work
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {generatedTime} · Refreshes on load
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Agents', value: agents.length },
          { label: 'Active', value: activeCount },
          { label: 'Need Attention', value: attentionCount },
          {
            label: 'Awaiting Approval',
            value: totalWaitingApproval,
            color:
              totalWaitingApproval > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${color ?? 'text-foreground'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Philosophy */}
      <div className="flex items-center gap-6 rounded-lg border border-border bg-card px-5 py-3">
        {['Agents recommend', 'Founder approves', 'System executes'].map((phrase, i) => (
          <div key={phrase} className="flex items-center gap-3">
            {i > 0 && <span className="hidden text-border sm:block">→</span>}
            <p className="text-xs font-medium text-muted-foreground">{phrase}</p>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/tower/execution"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Execution engine →
          </Link>
          <Link
            href="/tower/approvals"
            className="text-xs font-medium text-foreground hover:underline"
          >
            Approval queue →
          </Link>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="space-y-3">
        {agents.map((agent) => {
          const statusCfg = STATUS_CONFIG[agent.status]
          const util = utilizationByAgentId.get(agent.id)
          return (
            <div key={agent.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Name + status */}
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 flex-shrink-0 rounded-full ${statusCfg.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>

                {/* Health + status badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${HEALTH_BADGE[agent.health]}`}
                  >
                    {HEALTH_LABEL[agent.health]}
                  </span>
                  <span className={`text-xs font-medium ${statusCfg.text}`}>{statusCfg.label}</span>
                </div>
              </div>

              {/* Responsibility */}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {agent.currentResponsibility}
              </p>

              {/* Metrics row */}
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border/50 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last execution</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">
                    {agent.lastExecution ? timeAgo(agent.lastExecution) : 'Never'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Pending tasks</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">
                    {agent.pendingTaskCount > 0
                      ? `${agent.pendingTaskCount} task${agent.pendingTaskCount !== 1 ? 's' : ''}`
                      : 'None'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Queue (total)</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">
                    {util ? util.totalJobs : 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Waiting approval</p>
                  <p
                    className={`mt-0.5 text-xs font-medium ${
                      util && util.waitingApproval > 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {util ? util.waitingApproval : 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Avg confidence</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">
                    {util ? `${util.avgConfidence}%` : 'No data'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Completed today</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">0</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Success rate</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">No history</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Learning score</p>
                  <p
                    className={`mt-0.5 text-xs font-medium ${
                      util && util.avgConfidence >= 80
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : util && util.avgConfidence >= 65
                          ? 'text-amber-700 dark:text-amber-400'
                          : util && util.avgConfidence > 0
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-muted-foreground'
                    }`}
                  >
                    {util && util.avgConfidence > 0
                      ? `${Math.min(100, Math.round(util.avgConfidence * 0.8 + (util.totalJobs > 0 ? 20 : 0)))}`
                      : '—'}
                  </p>
                </div>

                {agent.lastRecommendation && (
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Last recommendation</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-foreground">
                      {agent.lastRecommendation}
                    </p>
                  </div>
                )}
              </div>

              {/* Action links */}
              <div className="mt-3 flex items-center gap-4">
                {agent.pendingTaskCount > 0 && (
                  <Link
                    href={`/tower/approvals?agent=${agent.id}`}
                    className="text-xs text-foreground hover:underline"
                  >
                    Review {agent.pendingTaskCount} pending task
                    {agent.pendingTaskCount !== 1 ? 's' : ''} →
                  </Link>
                )}
                {util && util.totalJobs > 0 && (
                  <Link
                    href="/tower/execution"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View in execution engine →
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
