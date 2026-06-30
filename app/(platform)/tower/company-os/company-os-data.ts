import { getExecutiveData } from '../executive/executive-data'
import { getSupportData } from '../support/support-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import type { ExecutiveData } from '../executive/executive-data'
import type { SupportData } from '../support/support-data'
import type { WorkforceStatusData } from '../workforce-status/workforce-data'
import type { AgentTask, AgentId } from '../agents/agent-tasks'
import type { SupportTicket } from '../support/support-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MissionState =
  | 'queued'
  | 'planning'
  | 'waiting'
  | 'executing'
  | 'blocked'
  | 'awaiting_founder'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'archived'

export type MissionDomain =
  | 'revenue'
  | 'growth'
  | 'support'
  | 'engineering'
  | 'marketing'
  | 'billing'
  | 'customer-success'
  | 'automation'
  | 'content'

export interface Mission {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  state: MissionState
  agentId: string
  agentName: string
  domain: MissionDomain
  businessImpact: string
  confidence: number
  requiresFounderApproval: boolean
  dependencies: string[]
  reason: string
  href: string
}

export interface AgentWorkload {
  agentId: string
  agentName: string
  domain: MissionDomain
  totalMissions: number
  criticalMissions: number
  awaitingFounder: number
  blockedMissions: number
  avgConfidence: number
  primaryMission: string | null
  estimatedBusinessImpact: string
}

export interface MissionConflict {
  missionIds: [string, string]
  description: string
  resolution: string
}

export interface CompanyMemory {
  recentWins: string[]
  recentFailures: string[]
  repeatedProblems: string[]
  pendingDecisions: string[]
  lessonsLearned: string[]
  frequentlyEscalated: string[]
}

export interface CompanyOSData {
  companyObjective: string
  topPriorities: Mission[]
  missions: Mission[]
  missionsByState: Record<MissionState, Mission[]>
  agentWorkloads: AgentWorkload[]
  conflicts: MissionConflict[]
  companyMemory: CompanyMemory
  stateCounts: Record<MissionState, number>
  totalMissions: number
  revenueWatch: {
    stripeConnected: boolean
    active: number
    trialing: number
    pastDue: number
    mrrNote: string
  }
  growthWatch: {
    newOrgs24h: number
    newUsers24h: number
    orgCount: number
  }
  systemTimeline: Array<{
    action: string
    outcome: string
    actorType: string
    occurredAt: string
  }>
  generatedAt: string
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const AGENT_DOMAIN: Record<AgentId, MissionDomain> = {
  cto: 'engineering',
  cfo: 'billing',
  cmo: 'marketing',
  'customer-success': 'customer-success',
  'support-manager': 'support',
  'content-director': 'content',
}

const AGENT_CONFIDENCE: Record<string, Record<string, number>> = {
  cto: { critical: 92, high: 88, medium: 78, low: 65 },
  cfo: { critical: 92, high: 88, medium: 78, low: 65 },
  'customer-success': { critical: 85, high: 80, medium: 72, low: 62 },
  'support-manager': { critical: 82, high: 75, medium: 65, low: 58 },
  cmo: { critical: 78, high: 70, medium: 62, low: 55 },
  'content-director': { critical: 75, high: 68, medium: 60, low: 52 },
}

const DOMAIN_IMPACT: Record<MissionDomain, string> = {
  engineering: 'Platform reliability and technical velocity',
  billing: 'Revenue collection and subscription health',
  marketing: 'Customer acquisition and growth pipeline',
  'customer-success': 'Customer retention and satisfaction',
  support: 'Customer experience and support efficiency',
  content: 'Self-service coverage and knowledge base',
  revenue: 'MRR growth and financial health',
  growth: 'Customer acquisition and expansion velocity',
  automation: 'Operational efficiency and AI reliability',
}

// Structural dependency graph: a mission cannot proceed until its deps are resolved.
// Dep IDs are AgentTask IDs — if the dep task still exists (active), the current mission
// is blocked.
const MISSION_DEPS: Record<string, string[]> = {
  'cs-first-customer': ['cfo-stripe-not-configured'],
  'cs-onboarding-not-configured': ['cs-first-customer'],
  'cs-health-scores-not-configured': ['cs-first-customer'],
  'cmo-crm-not-configured': ['cs-first-customer'],
  'content-feedback-not-configured': ['cs-first-customer'],
}

const STATE_URGENCY: Record<MissionState, number> = {
  executing: 0,
  awaiting_founder: 1,
  planning: 2,
  blocked: 3,
  queued: 4,
  waiting: 5,
  retrying: 6,
  failed: 7,
  completed: 8,
  archived: 9,
}

const PRIORITY_URGENCY: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// ─── Pure orchestration functions ─────────────────────────────────────────────

function deriveMissionState(task: AgentTask, taskIds: Set<string>): MissionState {
  if (task.requiresApproval) return 'awaiting_founder'
  const deps = MISSION_DEPS[task.id] ?? []
  const unresolvedDeps = deps.filter((id) => taskIds.has(id))
  if (unresolvedDeps.length > 0) return 'blocked'
  if (task.priority === 'critical') return 'executing'
  if (task.priority === 'high') return 'planning'
  return 'queued'
}

export function buildMissions(agentTasks: AgentTask[], supportTickets: SupportTicket[]): Mission[] {
  const taskIds = new Set(agentTasks.map((t) => t.id))

  const agentMissions: Mission[] = agentTasks.map((task) => {
    const domain = AGENT_DOMAIN[task.agentId] ?? 'engineering'
    const deps = MISSION_DEPS[task.id] ?? []
    const unresolvedDeps = deps.filter((id) => taskIds.has(id))
    const state = deriveMissionState(task, taskIds)
    const confidence = AGENT_CONFIDENCE[task.agentId]?.[task.priority] ?? 70

    return {
      id: task.id,
      title: task.description,
      description: task.recommendedAction,
      priority: task.priority,
      state,
      agentId: task.agentId,
      agentName: task.agentName,
      domain,
      businessImpact:
        task.priority === 'critical'
          ? 'Platform operations blocked — immediate revenue and customer impact'
          : DOMAIN_IMPACT[domain],
      confidence,
      requiresFounderApproval: task.requiresApproval,
      dependencies: unresolvedDeps,
      reason: task.source,
      href: task.href,
    }
  })

  const supportMissions: Mission[] = supportTickets
    .filter((t) => t.requiresFounderApproval)
    .map((t) => {
      const domain: MissionDomain = t.sourceType === 'billing-issue' ? 'billing' : 'support'
      return {
        id: `support-${t.id}`,
        title: t.title,
        description: t.recommendedAction,
        priority: t.priority as 'critical' | 'high' | 'medium' | 'low',
        state: 'awaiting_founder' as MissionState,
        agentId: 'support-manager',
        agentName: 'Support Manager Agent',
        domain,
        businessImpact: DOMAIN_IMPACT[domain],
        confidence: t.confidenceScore,
        requiresFounderApproval: true,
        dependencies: [],
        reason: `Support: ${t.sourceType}`,
        href: '/tower/support',
      }
    })

  return [...agentMissions, ...supportMissions]
}

export function prioritizeMissions(missions: Mission[]): Mission[] {
  return [...missions].sort((a, b) => {
    const stateA = STATE_URGENCY[a.state] ?? 5
    const stateB = STATE_URGENCY[b.state] ?? 5
    if (stateA !== stateB) return stateA - stateB
    const prioA = PRIORITY_URGENCY[a.priority] ?? 3
    const prioB = PRIORITY_URGENCY[b.priority] ?? 3
    if (prioA !== prioB) return prioA - prioB
    return b.confidence - a.confidence
  })
}

export function detectMissionConflicts(missions: Mission[]): MissionConflict[] {
  const conflicts: MissionConflict[] = []

  // Agent overload: critical + high-priority work competing for same agent
  const byAgent = new Map<string, Mission[]>()
  for (const m of missions) {
    const existing = byAgent.get(m.agentId) ?? []
    existing.push(m)
    byAgent.set(m.agentId, existing)
  }

  for (const [, agentMissions] of byAgent) {
    const critical = agentMissions.filter((m) => m.priority === 'critical')
    const high = agentMissions.filter((m) => m.priority === 'high')
    if (critical.length > 0 && high.length > 0) {
      conflicts.push({
        missionIds: [critical[0].id, high[0].id],
        description: `${critical[0].agentName} has ${critical.length} critical and ${high.length} high-priority missions simultaneously`,
        resolution:
          'Critical missions take precedence; high-priority items should be deferred until critical work clears',
      })
    }
  }

  // CFO vs CMO: investing in marketing before billing is set up
  const stripeMission = missions.find((m) => m.id === 'cfo-stripe-not-configured')
  const cmoMissions = missions.filter((m) => m.agentId === 'cmo')
  if (stripeMission && cmoMissions.length > 0) {
    conflicts.push({
      missionIds: [stripeMission.id, cmoMissions[0].id],
      description: 'Marketing investment planned before billing infrastructure is active',
      resolution: 'Connect Stripe and establish billing before allocating marketing budget',
    })
  }

  return conflicts
}

export function detectDuplicateWork(
  missions: Mission[]
): Array<{ domain: MissionDomain; missionCount: number; note: string }> {
  const byDomain = new Map<MissionDomain, number>()
  for (const m of missions) {
    byDomain.set(m.domain, (byDomain.get(m.domain) ?? 0) + 1)
  }

  const duplicates: Array<{ domain: MissionDomain; missionCount: number; note: string }> = []
  for (const [domain, count] of byDomain) {
    if (count > 2) {
      duplicates.push({
        domain,
        missionCount: count,
        note: `${count} missions in ${domain} domain — verify agents are not duplicating effort`,
      })
    }
  }

  return duplicates
}

export function deriveMissionDependencies(
  missions: Mission[]
): Array<{ missionId: string; missionTitle: string; blockedBy: string[] }> {
  return missions
    .filter((m) => m.dependencies.length > 0)
    .map((m) => ({
      missionId: m.id,
      missionTitle: m.title,
      blockedBy: m.dependencies,
    }))
}

export function deriveBlockedMissions(missions: Mission[]): Mission[] {
  return missions.filter((m) => m.state === 'blocked')
}

export function deriveNextActions(missions: Mission[]): Mission[] {
  // The most actionable missions: awaiting_founder first (founder can unblock them),
  // then executing, then planning
  return missions
    .filter(
      (m) => m.state === 'awaiting_founder' || m.state === 'executing' || m.state === 'planning'
    )
    .slice(0, 10)
}

export function deriveAgentWorkloads(missions: Mission[]): AgentWorkload[] {
  const AGENTS = [
    { id: 'cto', name: 'CTO Agent', domain: 'engineering' as MissionDomain },
    { id: 'cfo', name: 'CFO Agent', domain: 'billing' as MissionDomain },
    { id: 'cmo', name: 'CMO Agent', domain: 'marketing' as MissionDomain },
    {
      id: 'customer-success',
      name: 'Customer Success Agent',
      domain: 'customer-success' as MissionDomain,
    },
    { id: 'support-manager', name: 'Support Manager Agent', domain: 'support' as MissionDomain },
    { id: 'content-director', name: 'Content Director Agent', domain: 'content' as MissionDomain },
  ]

  return AGENTS.map(({ id, name, domain }) => {
    const agentMissions = missions.filter((m) => m.agentId === id)
    const criticalMissions = agentMissions.filter(
      (m) => m.priority === 'critical' || m.priority === 'high'
    ).length
    const awaitingFounder = agentMissions.filter((m) => m.state === 'awaiting_founder').length
    const blockedMissions = agentMissions.filter((m) => m.state === 'blocked').length
    const avgConfidence =
      agentMissions.length > 0
        ? Math.round(agentMissions.reduce((s, m) => s + m.confidence, 0) / agentMissions.length)
        : 0

    const executingMission = agentMissions.find((m) => m.state === 'executing')
    const planningMission = agentMissions.find((m) => m.state === 'planning')
    const primaryMission =
      executingMission?.title ?? planningMission?.title ?? agentMissions[0]?.title ?? null

    const estimatedBusinessImpact =
      awaitingFounder > 0
        ? `${awaitingFounder} action${awaitingFounder !== 1 ? 's' : ''} blocked on founder approval`
        : blockedMissions > 0
          ? `${blockedMissions} mission${blockedMissions !== 1 ? 's' : ''} blocked on dependencies`
          : criticalMissions > 0
            ? `${criticalMissions} high-priority mission${criticalMissions !== 1 ? 's' : ''} active`
            : agentMissions.length > 0
              ? `${agentMissions.length} mission${agentMissions.length !== 1 ? 's' : ''} queued`
              : 'No active missions'

    return {
      agentId: id,
      agentName: name,
      domain,
      totalMissions: agentMissions.length,
      criticalMissions,
      awaitingFounder,
      blockedMissions,
      avgConfidence,
      primaryMission,
      estimatedBusinessImpact,
    }
  })
}

export function buildCompanyMemory(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): CompanyMemory {
  const orgCount = parseInt(executiveData.health.activeOrganizations.value, 10) || 0
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const completedRuns = workforceData.workforces.reduce((s, w) => s + w.completedRuns, 0)
  const auditErrors = executiveData.recentActivity.events.filter(
    (e) => e.outcome === 'error'
  ).length
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length

  const recentWins: string[] = []
  if (executiveData.newCustomers.orgsLast24h > 0) {
    recentWins.push(
      `${executiveData.newCustomers.orgsLast24h} new org${executiveData.newCustomers.orgsLast24h !== 1 ? 's' : ''} acquired in last 24h`
    )
  }
  if (completedRuns > 0) {
    recentWins.push(
      `${completedRuns} AI Workforce run${completedRuns !== 1 ? 's' : ''} completed successfully`
    )
  }
  if (executiveData.revenue.active > 0) {
    recentWins.push(
      `${executiveData.revenue.active} active paying subscription${executiveData.revenue.active !== 1 ? 's' : ''}`
    )
  }
  if (orgCount > 0 && executiveData.revenue.pastDue === 0) {
    recentWins.push('No churn signals — all customers currently in good standing')
  }
  if (supportData.stats.autoResolved > 0) {
    recentWins.push(
      `${supportData.stats.autoResolved} support ticket${supportData.stats.autoResolved !== 1 ? 's' : ''} resolved automatically by AI`
    )
  }

  const recentFailures: string[] = []
  if (failedRuns > 0) {
    recentFailures.push(
      `${failedRuns} AI Workforce run${failedRuns !== 1 ? 's' : ''} failed — reliability impacted`
    )
  }
  if (executiveData.revenue.pastDue > 0) {
    recentFailures.push(
      `${executiveData.revenue.pastDue} payment failure${executiveData.revenue.pastDue !== 1 ? 's' : ''} — revenue at risk`
    )
  }
  if (auditErrors > 0) {
    recentFailures.push(
      `${auditErrors} platform error${auditErrors !== 1 ? 's' : ''} detected in last 24h audit log`
    )
  }
  if (supportData.stats.escalations > 0) {
    recentFailures.push(
      `${supportData.stats.escalations} support escalation${supportData.stats.escalations !== 1 ? 's' : ''} required manual intervention`
    )
  }

  const repeatedProblems: string[] = []
  if (!executiveData.revenue.stripeConnected) {
    repeatedProblems.push(
      'Stripe not connected — recurring configuration gap blocking all revenue tracking'
    )
  }
  if (failedRuns > 1) {
    repeatedProblems.push(
      'Multiple AI Workforce failures — indicates systematic issue, not one-off event'
    )
  }
  if (billingTickets > 0) {
    repeatedProblems.push(
      'Billing issues converting to support tickets — founder approval is a recurring bottleneck'
    )
  }
  if (executiveData.actionQueue.filter((i) => i.priority === 'high').length > 3) {
    repeatedProblems.push(
      'High volume of high-priority actions — setup gaps have not been fully addressed'
    )
  }

  const pendingDecisions = supportData.tickets
    .filter((t) => t.requiresFounderApproval)
    .map((t) => t.title)

  const lessonsLearned: string[] = []
  if (billingTickets > 0) {
    lessonsLearned.push(
      'Billing issues require founder sign-off — AI cannot resolve without explicit approval'
    )
  }
  if (failedRuns > 0) {
    lessonsLearned.push(
      'AI delivery failures create downstream support load — fix failures before they escalate'
    )
  }
  if (!executiveData.revenue.stripeConnected) {
    lessonsLearned.push(
      'Revenue tracking requires Stripe as a foundational step — all revenue objectives depend on it'
    )
  }
  if (orgCount === 0) {
    lessonsLearned.push(
      'Platform cannot be fully validated without a real customer — acquisition is the critical path'
    )
  }
  if (lessonsLearned.length === 0) {
    lessonsLearned.push(
      'Platform operating with healthy signals — maintain current configuration and operational standards'
    )
  }

  const frequentlyEscalated = supportData.tickets
    .filter((t) => t.requiresFounderApproval)
    .map((t) => `${t.title} (${t.sourceType})`)

  return {
    recentWins,
    recentFailures,
    repeatedProblems,
    pendingDecisions,
    lessonsLearned,
    frequentlyEscalated,
  }
}

export function deriveCompanyObjective(
  executiveData: ExecutiveData,
  workforceData: WorkforceStatusData
): string {
  const orgCount = parseInt(executiveData.health.activeOrganizations.value, 10) || 0
  const totalRuns = workforceData.totalRunsAllWorkforces

  if (executiveData.health.overall === 'critical') {
    return 'Restore platform stability — critical systems are blocking customer operations'
  }
  if (!executiveData.revenue.stripeConnected) {
    return 'Activate commercial operations — connect billing before pursuing growth'
  }
  if (orgCount === 0) {
    return 'Acquire first customer — validate end-to-end platform with real business activity'
  }
  if (executiveData.revenue.pastDue > 0) {
    return 'Recover at-risk revenue — resolve past-due subscriptions and prevent churn'
  }
  if (totalRuns === 0) {
    return 'Activate AI Workforce — begin delivering automated value to customers'
  }
  if (executiveData.newCustomers.orgsLast24h > 0) {
    return 'Accelerate growth — momentum is building, optimize acquisition and activation'
  }
  return 'Scale operations — maintain quality while expanding customer base'
}

function deriveMissionsByState(missions: Mission[]): Record<MissionState, Mission[]> {
  const empty: Record<MissionState, Mission[]> = {
    queued: [],
    planning: [],
    waiting: [],
    executing: [],
    blocked: [],
    awaiting_founder: [],
    completed: [],
    failed: [],
    retrying: [],
    archived: [],
  }
  for (const m of missions) {
    empty[m.state].push(m)
  }
  return empty
}

// ─── Public composition ───────────────────────────────────────────────────────

export function buildCompanyOSData(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasksOverride?: AgentTask[]
): CompanyOSData {
  const agentTasks = agentTasksOverride ?? buildAgentTasks(executiveData)
  const missions = buildMissions(agentTasks, supportData.tickets)
  const prioritized = prioritizeMissions(missions)
  const missionsByState = deriveMissionsByState(missions)
  const stateCounts = Object.fromEntries(
    (Object.keys(missionsByState) as MissionState[]).map((s) => [s, missionsByState[s].length])
  ) as Record<MissionState, number>

  const orgCount = parseInt(executiveData.health.activeOrganizations.value, 10) || 0

  return {
    companyObjective: deriveCompanyObjective(executiveData, workforceData),
    topPriorities: prioritized.slice(0, 5),
    missions: prioritized,
    missionsByState,
    agentWorkloads: deriveAgentWorkloads(missions),
    conflicts: detectMissionConflicts(missions),
    companyMemory: buildCompanyMemory(executiveData, supportData, workforceData),
    stateCounts,
    totalMissions: missions.length,
    revenueWatch: {
      stripeConnected: executiveData.revenue.stripeConnected,
      active: executiveData.revenue.active,
      trialing: executiveData.revenue.trialing,
      pastDue: executiveData.revenue.pastDue,
      mrrNote: executiveData.revenue.mrrNote,
    },
    growthWatch: {
      newOrgs24h: executiveData.newCustomers.orgsLast24h,
      newUsers24h: executiveData.newCustomers.usersLast24h,
      orgCount,
    },
    systemTimeline: executiveData.recentActivity.events.slice(0, 12),
    generatedAt: executiveData.generatedAt,
  }
}

// ─── Async entry point ────────────────────────────────────────────────────────

export async function getCompanyOSData(): Promise<CompanyOSData> {
  const [executiveData, supportData, workforceData] = await Promise.all([
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])
  return buildCompanyOSData(executiveData, supportData, workforceData)
}
