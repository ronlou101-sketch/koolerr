import Link from 'next/link'
import { getSupportData } from './support-data'
import type { TicketStatus, TicketPriority, SupportAgent } from './support-data'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<TicketStatus, { label: string; badge: string }> = {
  new: { label: 'New', badge: 'bg-muted text-muted-foreground' },
  'ai-reviewing': {
    label: 'AI Reviewing',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  'ai-resolved': {
    label: 'AI Resolved',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  'waiting-for-customer': {
    label: 'Waiting for Customer',
    badge: 'bg-muted text-muted-foreground',
  },
  escalated: {
    label: 'Escalated',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  'requires-founder-decision': {
    label: 'Requires Founder',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
  closed: { label: 'Closed', badge: 'bg-muted text-muted-foreground' },
}

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badge: string; border: string }> = {
  critical: {
    label: 'Critical',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  high: {
    label: 'High',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    border: 'border-border',
  },
  low: { label: 'Low', badge: 'bg-muted text-muted-foreground', border: 'border-border' },
}

const AGENT_STATUS_DOT: Record<SupportAgent['status'], string> = {
  active: 'bg-emerald-500',
  idle: 'bg-muted-foreground/30',
  'not-configured': 'bg-muted-foreground/20',
}

function confidenceBadge(score: number): string {
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

export default async function SupportCenterPage() {
  const { tickets, agents, stats, generatedAt } = await getSupportData()

  const briefTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const openTickets = tickets.filter((t) => t.status !== 'closed' && t.status !== 'ai-resolved')
  const resolvedTickets = tickets.filter((t) => t.status === 'ai-resolved')

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
            <span className="text-foreground">Support</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            AI Support Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-detected support incidents — triaged and routed by AI agents
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total Open', value: stats.totalOpen, color: 'text-foreground' },
          { label: 'Opened (8h)', value: stats.openedLast8h, color: 'text-foreground' },
          {
            label: 'Auto-Resolved',
            value: stats.autoResolved,
            color: 'text-emerald-700 dark:text-emerald-400',
          },
          {
            label: 'Awaiting Founder',
            value: stats.awaitingFounder,
            color:
              stats.awaitingFounder > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground',
          },
          {
            label: 'Escalations',
            value: stats.escalations,
            color: stats.escalations > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground',
          },
          {
            label: 'AI Resolution',
            value: stats.aiResolutionPct !== null ? `${stats.aiResolutionPct}%` : '—',
            color:
              stats.aiResolutionPct !== null && stats.aiResolutionPct >= 50
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-muted-foreground',
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

      {/* Open Tickets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Open Tickets{' '}
            <span className="ml-1 font-normal text-muted-foreground">({openTickets.length})</span>
          </h2>
          {stats.awaitingFounder > 0 && (
            <Link
              href="/tower/approvals"
              className="text-xs font-medium text-amber-700 hover:text-foreground dark:text-amber-400"
            >
              {stats.awaitingFounder} awaiting approval →
            </Link>
          )}
        </div>

        {openTickets.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              No open tickets
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              All platform-detected incidents have been resolved or are not present
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openTickets.map((ticket) => {
              const statusCfg = STATUS_CONFIG[ticket.status]
              const priorityCfg = PRIORITY_CONFIG[ticket.priority]
              return (
                <div
                  key={ticket.id}
                  className={`rounded-lg border bg-card p-4 ${priorityCfg.border}`}
                >
                  {/* Top row */}
                  <div className="flex flex-wrap items-start gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityCfg.badge}`}
                    >
                      {priorityCfg.label}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.badge}`}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {ticket.assignedAgentName}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {timeAgo(ticket.createdAt)}
                    </span>
                  </div>

                  {/* Title + org */}
                  <p className="mt-2 text-sm font-medium text-foreground">{ticket.title}</p>
                  {ticket.organizationName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Customer: {ticket.organizationName}
                    </p>
                  )}
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {ticket.description}
                  </p>

                  {/* Confidence + action */}
                  <div className="mt-3 border-t border-border/50 pt-3">
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-1">
                      <p className="text-xs">
                        <span className="text-muted-foreground">Confidence: </span>
                        <span className={`font-medium ${confidenceBadge(ticket.confidenceScore)}`}>
                          {ticket.confidenceScore}%
                        </span>
                      </p>
                      <p className="flex-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Action: </span>
                        {ticket.recommendedAction}
                      </p>
                    </div>
                    {ticket.requiresFounderApproval && (
                      <div className="mt-2">
                        <Link
                          href="/tower/approvals"
                          className="inline-flex items-center text-xs font-medium text-foreground hover:underline"
                        >
                          Review in approval queue →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* AI Support Agents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">AI Support Agents</h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${AGENT_STATUS_DOT[agent.status]}`}
                />
                <p className="text-sm font-medium text-foreground">{agent.name}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{agent.role}</p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div>
                  <p className="text-xs text-muted-foreground">Workload</p>
                  <p
                    className={`text-xs font-medium ${agent.currentWorkload > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {agent.status === 'not-configured'
                      ? 'Not configured'
                      : agent.currentWorkload > 0
                        ? `${agent.currentWorkload} ticket${agent.currentWorkload !== 1 ? 's' : ''}`
                        : 'Idle'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg response</p>
                  <p className="text-xs font-medium text-foreground">{agent.avgResponseTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Success rate</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {agent.successRate !== null ? `${agent.successRate}%` : 'No history'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last activity</p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {agent.status === 'not-configured'
                      ? 'Never'
                      : agent.lastActivity
                        ? timeAgo(agent.lastActivity)
                        : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resolved tickets (if any) */}
      {resolvedTickets.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            AI Resolved{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({resolvedTickets.length})
            </span>
          </h2>
          <div className="space-y-2">
            {resolvedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Resolved
                    </span>
                    {ticket.organizationName && (
                      <span className="text-xs text-muted-foreground">
                        {ticket.organizationName}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-medium text-foreground">{ticket.title}</p>
                  {ticket.resolutionSummary && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ticket.resolutionSummary}
                    </p>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {timeAgo(ticket.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CSAT placeholder */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Customer Satisfaction</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-5">
          <p className="text-sm text-muted-foreground">{stats.satisfactionNote}</p>
          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
            CSAT scores, NPS responses, and satisfaction trends will be available once a helpdesk
            platform is connected and customer tickets are flowing through the system.
          </p>
        </div>
      </section>

      {/* Philosophy + flow */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How support resolution works</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Platform incidents are detected automatically and routed to the appropriate AI agent.
          High-confidence items are reviewed and actioned by the agent. Low-confidence items
          escalate to the Escalation Agent. Anything requiring founder attention routes to the{' '}
          <Link
            href="/tower/approvals"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Approval Queue
          </Link>
          . Tickets derived from real platform signals — no helpdesk integration required for
          internal incident tracking.
        </p>
      </div>
    </div>
  )
}
