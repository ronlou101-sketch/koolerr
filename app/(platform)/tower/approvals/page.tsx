import Link from 'next/link'
import { getAgentTasks } from '../agents/agent-tasks'
import { TowerApprovalQueue } from '../_components/TowerApprovalQueue'
import type { AgentId } from '../agents/agent-tasks'

export const dynamic = 'force-dynamic'

const AGENT_LABELS: Record<AgentId, string> = {
  cto: 'CTO Agent',
  cfo: 'CFO Agent',
  cmo: 'CMO Agent',
  'customer-success': 'Customer Success Agent',
  'support-manager': 'Support Manager Agent',
  'content-director': 'Content Director Agent',
}

interface Props {
  searchParams: Promise<{ agent?: string }>
}

export default async function TowerApprovalsPage({ searchParams }: Props) {
  const { agent: agentFilter } = await searchParams
  const { tasks, generatedAt } = await getAgentTasks()

  const generatedTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const requiresApprovalTasks = tasks.filter((t) => t.requiresApproval)
  const noApprovalTasks = tasks.filter((t) => !t.requiresApproval)

  const criticalCount = requiresApprovalTasks.filter((t) => t.priority === 'critical').length
  const highCount = requiresApprovalTasks.filter((t) => t.priority === 'high').length
  const mediumCount = requiresApprovalTasks.filter((t) => t.priority === 'medium').length
  const lowCount = requiresApprovalTasks.filter((t) => t.priority === 'low').length

  const agentFilterLabel =
    agentFilter && agentFilter in AGENT_LABELS ? AGENT_LABELS[agentFilter as AgentId] : null

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
            <span className="text-foreground">Approvals</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Agent Approval Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every agent recommendation routes here. Nothing executes without founder approval.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Generated {generatedTime} · Refreshes on load
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Critical', value: criticalCount, color: 'text-red-700 dark:text-red-400' },
          { label: 'High', value: highCount, color: 'text-amber-700 dark:text-amber-400' },
          { label: 'Medium', value: mediumCount, color: 'text-foreground' },
          { label: 'Low', value: lowCount, color: 'text-muted-foreground' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Agent filter breadcrumb */}
      {agentFilterLabel && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing tasks from{' '}
            <span className="font-medium text-foreground">{agentFilterLabel}</span>
          </p>
          <Link
            href="/tower/approvals"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Show all →
          </Link>
        </div>
      )}

      {/* Requires approval */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Requires Approval{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({requiresApprovalTasks.length})
            </span>
          </h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>
        <TowerApprovalQueue tasks={requiresApprovalTasks} agentFilter={agentFilter} />
      </section>

      {/* Informational (no approval required) */}
      {noApprovalTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Informational{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({noApprovalTasks.length})
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            These items do not require approval — they are direct actions the system has flagged for
            your awareness.
          </p>
          <div className="space-y-2">
            {noApprovalTasks
              .filter((t) => !agentFilter || t.agentId === agentFilter)
              .map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {task.agentName}
                      </span>
                      <span className="text-xs text-muted-foreground">{task.source}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-foreground">{task.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{task.recommendedAction}</p>
                  </div>
                  <Link
                    href={task.href}
                    className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View →
                  </Link>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Philosophy note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How approvals work</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Agent recommendations are derived from live platform data on every load — they reflect the
          current state of the platform. Approved items redirect you to the relevant management page
          where the action can be taken. Deferred and rejected items reappear on the next load until
          the underlying issue is resolved. Persistent approval state will be added when a
          decision-tracking table is introduced.
        </p>
      </div>
    </div>
  )
}
