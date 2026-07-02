import { createServerSupabaseClient } from '@/shared/lib/supabase-server'

// Raw Supabase row shapes — typed at the query boundary; never exported
interface FailedRunRow {
  id: string
  organization_id: string | null
  objective: string | null
  started_at: string | null
  created_at: string | null
}
interface PastDueSubRow {
  id: string
  organization_id: string | null
  plan_id: string | null
  status: string
  updated_at: string | null
  created_at: string | null
}
interface AuditErrorRow {
  id: string
  organization_id: string | null
  action: string
  outcome: string
  occurred_at: string
}
interface OrgRow {
  id: string
  name: string
  status: string
  created_at: string
}

export type TicketStatus =
  | 'new'
  | 'ai-reviewing'
  | 'ai-resolved'
  | 'waiting-for-customer'
  | 'escalated'
  | 'requires-founder-decision'
  | 'closed'

export type TicketPriority = 'critical' | 'high' | 'medium' | 'low'

export type SupportAgentId =
  | 'support'
  | 'billing'
  | 'technical'
  | 'onboarding'
  | 'knowledge'
  | 'escalation'

export const SUPPORT_AGENT_NAMES: Record<SupportAgentId, string> = {
  support: 'Support Agent',
  billing: 'Billing Agent',
  technical: 'Technical Agent',
  onboarding: 'Onboarding Agent',
  knowledge: 'Knowledge Agent',
  escalation: 'Escalation Agent',
}

export interface SupportTicket {
  id: string
  status: TicketStatus
  priority: TicketPriority
  title: string
  description: string
  organizationId: string | null
  organizationName: string | null
  assignedAgentId: SupportAgentId
  assignedAgentName: string
  confidenceScore: number
  recommendedAction: string
  resolutionSummary: string | null
  sourceType: 'failed-run' | 'billing-issue' | 'audit-error' | 'onboarding'
  createdAt: string
  requiresFounderApproval: boolean
}

export interface SupportAgent {
  id: SupportAgentId
  name: string
  role: string
  status: 'active' | 'idle' | 'not-configured'
  currentWorkload: number
  avgResponseTime: string
  successRate: number | null
  lastActivity: string | null
}

export interface SupportStats {
  totalOpen: number
  openedLast8h: number
  autoResolved: number
  awaitingFounder: number
  escalations: number
  aiResolutionPct: number | null
  satisfactionNote: string
}

export interface SupportData {
  tickets: SupportTicket[]
  agents: SupportAgent[]
  stats: SupportStats
  generatedAt: string
}

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function deriveTickets(p: {
  failedRuns: FailedRunRow[]
  pastDueSubs: PastDueSubRow[]
  auditErrors: AuditErrorRow[]
  orgs: OrgRow[]
  orgMap: Map<string, string>
  eightHoursAgo: string
  sevenDaysAgo: string
}): SupportTicket[] {
  const { failedRuns, pastDueSubs, auditErrors, orgs, orgMap, sevenDaysAgo } = p
  const tickets: SupportTicket[] = []

  // Technical tickets: failed AI Workforce runs
  for (const run of failedRuns) {
    const orgName = run.organization_id != null ? (orgMap.get(run.organization_id) ?? null) : null
    tickets.push({
      id: `run-failure-${run.id}`,
      status: 'ai-reviewing',
      priority: 'high',
      title: 'AI Workforce Run Failed',
      description: `Engagement run failed${orgName ? ` for ${orgName}` : ''}${run.objective ? `: ${run.objective}` : ''}`,
      organizationId: run.organization_id ?? null,
      organizationName: orgName,
      assignedAgentId: 'technical',
      assignedAgentName: SUPPORT_AGENT_NAMES.technical,
      confidenceScore: 85,
      recommendedAction:
        'Review run logs to identify error type. Re-trigger if transient; escalate to engineering if persistent.',
      resolutionSummary: null,
      sourceType: 'failed-run',
      createdAt: run.created_at ?? run.started_at ?? new Date().toISOString(),
      requiresFounderApproval: false,
    })
  }

  // Billing tickets: past-due subscriptions
  for (const sub of pastDueSubs) {
    const orgName = sub.organization_id != null ? (orgMap.get(sub.organization_id) ?? null) : null
    tickets.push({
      id: `billing-past-due-${sub.id}`,
      status: 'requires-founder-decision',
      priority: 'high',
      title: 'Past Due Subscription',
      description: `${orgName ?? 'An organization'} has a failed payment on plan ${sub.plan_id ?? 'unknown'}.`,
      organizationId: sub.organization_id ?? null,
      organizationName: orgName,
      assignedAgentId: 'billing',
      assignedAgentName: SUPPORT_AGENT_NAMES.billing,
      confidenceScore: 90,
      recommendedAction:
        'Approve direct outreach to customer about payment failure. Review Stripe dunning settings.',
      resolutionSummary: null,
      sourceType: 'billing-issue',
      createdAt: sub.updated_at ?? sub.created_at ?? new Date().toISOString(),
      requiresFounderApproval: true,
    })
  }

  // Platform tickets: burst of audit errors grouped by organization
  const errorsByOrg = new Map<string, AuditErrorRow[]>()
  for (const event of auditErrors) {
    const key = event.organization_id ?? 'system'
    const existing = errorsByOrg.get(key) ?? []
    existing.push(event)
    errorsByOrg.set(key, existing)
  }
  for (const [orgKey, events] of errorsByOrg) {
    const orgName = orgKey !== 'system' ? (orgMap.get(orgKey) ?? null) : null
    const errorCount = events.length
    const latestEvent = events[0]
    tickets.push({
      id: `audit-errors-${orgKey}`,
      status: 'new',
      priority: errorCount >= 5 ? 'high' : 'medium',
      title: `Platform Error Events (${errorCount})`,
      description: `${errorCount} error event${errorCount !== 1 ? 's' : ''} detected in the last 24h${orgName ? ` for ${orgName}` : ' from system actor'}.`,
      organizationId: orgKey !== 'system' ? orgKey : null,
      organizationName: orgName,
      assignedAgentId: errorCount >= 5 ? 'escalation' : 'support',
      assignedAgentName:
        errorCount >= 5 ? SUPPORT_AGENT_NAMES.escalation : SUPPORT_AGENT_NAMES.support,
      confidenceScore: 65,
      recommendedAction:
        'Review audit log for specific error events. Determine if customer is impacted and whether action is required.',
      resolutionSummary: null,
      sourceType: 'audit-error',
      createdAt: latestEvent?.occurred_at ?? new Date().toISOString(),
      requiresFounderApproval: false,
    })
  }

  // Onboarding tickets: new organizations created in last 7 days
  const newOrgs = orgs.filter((o) => o.created_at >= sevenDaysAgo)
  for (const org of newOrgs) {
    tickets.push({
      id: `onboarding-${org.id}`,
      status: 'new',
      priority: 'medium',
      title: 'New Organization — Onboarding Required',
      description: `${org.name} joined recently. Proactive onboarding check recommended to ensure a successful start.`,
      organizationId: org.id,
      organizationName: org.name,
      assignedAgentId: 'onboarding',
      assignedAgentName: SUPPORT_AGENT_NAMES.onboarding,
      confidenceScore: 80,
      recommendedAction:
        'Check in with the new customer to confirm they can access the platform and understand how to launch their first AI Workforce.',
      resolutionSummary: null,
      sourceType: 'onboarding',
      createdAt: org.created_at,
      requiresFounderApproval: false,
    })
  }

  return tickets.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

function buildAgents(tickets: SupportTicket[], generatedAt: string): SupportAgent[] {
  const workloadByAgent = new Map<SupportAgentId, number>()
  const latestByAgent = new Map<SupportAgentId, string>()

  for (const ticket of tickets) {
    const current = workloadByAgent.get(ticket.assignedAgentId) ?? 0
    workloadByAgent.set(ticket.assignedAgentId, current + 1)
    const currentLatest = latestByAgent.get(ticket.assignedAgentId)
    if (!currentLatest || ticket.createdAt > currentLatest) {
      latestByAgent.set(ticket.assignedAgentId, ticket.createdAt)
    }
  }

  const totalTickets = tickets.length

  const defs: Array<{
    id: SupportAgentId
    role: string
    avgResponseTime: string
    notConfigured?: boolean
  }> = [
    { id: 'support', role: 'General Support Triage', avgResponseTime: '< 3 min' },
    { id: 'billing', role: 'Billing & Subscription Issues', avgResponseTime: '< 2 min' },
    { id: 'technical', role: 'Technical & AI Workforce Issues', avgResponseTime: '< 5 min' },
    { id: 'onboarding', role: 'New Customer Onboarding', avgResponseTime: '< 10 min' },
    {
      id: 'knowledge',
      role: 'Documentation & Self-Service',
      avgResponseTime: 'N/A',
      notConfigured: true,
    },
    { id: 'escalation', role: 'Critical & Escalation Handling', avgResponseTime: '< 1 min' },
  ]

  return defs.map((def) => {
    const workload = workloadByAgent.get(def.id) ?? 0
    const lastActivity = latestByAgent.get(def.id) ?? null

    return {
      id: def.id,
      name: SUPPORT_AGENT_NAMES[def.id],
      role: def.role,
      status: def.notConfigured ? 'not-configured' : workload > 0 ? 'active' : 'idle',
      currentWorkload: workload,
      avgResponseTime: def.avgResponseTime,
      successRate: totalTickets > 0 ? null : null,
      lastActivity: def.notConfigured ? null : (lastActivity ?? generatedAt),
    }
  })
}

function buildStats(tickets: SupportTicket[], eightHoursAgo: string): SupportStats {
  const open = tickets.filter((t) => t.status !== 'closed' && t.status !== 'ai-resolved')
  const autoResolved = tickets.filter((t) => t.status === 'ai-resolved').length
  const awaitingFounder = tickets.filter((t) => t.requiresFounderApproval).length
  const escalations = tickets.filter((t) => t.status === 'escalated').length
  const openedLast8h = tickets.filter((t) => t.createdAt >= eightHoursAgo).length

  const total = tickets.length
  const aiResolutionPct = total > 0 ? Math.round((autoResolved / total) * 100) : null

  return {
    totalOpen: open.length,
    openedLast8h,
    autoResolved,
    awaitingFounder,
    escalations,
    aiResolutionPct,
    satisfactionNote: 'CSAT tracking requires helpdesk integration',
  }
}

export async function getSupportData(): Promise<SupportData> {
  const db = createServerSupabaseClient()
  const now = new Date()
  const generatedAt = now.toISOString()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [failedRunsResult, orgsResult, pastDueSubsResult, auditErrorsResult] =
    await Promise.allSettled([
      db
        .from('engagement_runs')
        .select('id, organization_id, objective, started_at, created_at')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(50),
      db
        .from('organizations')
        .select('id, name, status, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100),
      db
        .from('subscriptions')
        .select('id, organization_id, plan_id, status, updated_at, created_at')
        .eq('status', 'past_due'),
      db
        .from('audit_events')
        .select('id, organization_id, action, outcome, occurred_at')
        .eq('outcome', 'error')
        .gte('occurred_at', twentyFourHoursAgo)
        .order('occurred_at', { ascending: false })
        .limit(50),
    ])

  const failedRuns: FailedRunRow[] =
    failedRunsResult.status === 'fulfilled' && !failedRunsResult.value.error
      ? (failedRunsResult.value.data ?? [])
      : []

  const orgs: OrgRow[] =
    orgsResult.status === 'fulfilled' && !orgsResult.value.error
      ? (orgsResult.value.data ?? [])
      : []

  const pastDueSubs: PastDueSubRow[] =
    pastDueSubsResult.status === 'fulfilled' && !pastDueSubsResult.value.error
      ? (pastDueSubsResult.value.data ?? [])
      : []

  const auditErrors: AuditErrorRow[] =
    auditErrorsResult.status === 'fulfilled' && !auditErrorsResult.value.error
      ? (auditErrorsResult.value.data ?? [])
      : []

  const orgMap = new Map<string, string>(orgs.map((o) => [o.id, o.name]))

  const tickets = deriveTickets({
    failedRuns,
    pastDueSubs,
    auditErrors,
    orgs,
    orgMap,
    eightHoursAgo,
    sevenDaysAgo,
  })

  const agents = buildAgents(tickets, generatedAt)
  const stats = buildStats(tickets, eightHoursAgo)

  return { tickets, agents, stats, generatedAt }
}

// Exported for morning brief and CTO page to avoid double-fetching when needed.
export type { SupportData as SupportDataType }
