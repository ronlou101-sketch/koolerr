import { getExecutiveData } from '../executive/executive-data'
import { getSupportData } from '../support/support-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { buildExecutionJobs } from '../execution/execution-data'
import type { ExecutiveData } from '../executive/executive-data'
import type { SupportData, SupportTicket } from '../support/support-data'
import type { WorkforceStatusData } from '../workforce-status/workforce-data'
import type { AgentTask } from '../agents/agent-tasks'
import type { ExecutionJob } from '../execution/execution-data'

export type ScoreTrend = 'up' | 'down' | 'stable' | 'unknown'
export type ObjectiveStatus = 'on-track' | 'at-risk' | 'blocked' | 'insufficient-data'
export type ObjectiveId =
  | 'grow-mrr'
  | 'reduce-churn'
  | 'improve-onboarding'
  | 'increase-automation'
  | 'reduce-support-load'
  | 'increase-satisfaction'

export interface BrainScore {
  score: number
  trend: ScoreTrend
  note: string
}

export interface CompanyScores {
  overall: BrainScore
  growth: BrainScore
  operational: BrainScore
  customerSuccess: BrainScore
  financial: BrainScore
  aiEfficiency: BrainScore
  risk: BrainScore
  confidence: BrainScore
}

export interface ExecutiveReasoning {
  belief: string
  why: string
  evidence: string[]
  recommendedActions: string[]
  estimatedImpact: string
  confidenceLevel: 'high' | 'medium' | 'low'
}

export interface CompanyObjective {
  id: ObjectiveId
  title: string
  status: ObjectiveStatus
  score: number
  signal: string
  blockingIssue: string | null
  relatedAgents: string[]
}

export interface AgentCoordinationRecord {
  agentId: string
  agentName: string
  currentPriority: string | null
  pendingTasks: number
  waitingApproval: number
  blockedBy: string | null
  collaboratingWith: string[]
}

export interface LearningSignal {
  signal: string
  count: number
  type: 'pattern' | 'trend' | 'anomaly'
}

export interface BrainData {
  scores: CompanyScores
  reasoning: ExecutiveReasoning
  objectives: CompanyObjective[]
  agentCoordination: AgentCoordinationRecord[]
  learningSignals: LearningSignal[]
  generatedAt: string
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function safeInt(s: string): number {
  const n = parseInt(s, 10)
  return isNaN(n) ? 0 : n
}

function scoreOperational(data: ExecutiveData): BrainScore {
  const { health } = data
  let score: number
  let note: string

  if (health.overall === 'critical') {
    const criticals = [health.database, health.engagementRuns, health.subscriptions].filter(
      (m) => m.status === 'critical'
    ).length
    score = Math.max(5, 30 - criticals * 7)
    note = 'Critical platform issues — immediate action required'
  } else if (health.overall === 'warning') {
    const warnings = [
      health.database,
      health.authentication,
      health.subscriptions,
      health.billingHealth,
      health.engagementRuns,
      health.auditLog,
    ].filter((m) => m.status === 'warning').length
    score = Math.max(45, 82 - warnings * 8)
    note = 'Platform operational with warnings — monitoring recommended'
  } else {
    const notConfigured = [health.apiHealth, health.backgroundJobs, health.deployments].filter(
      (m) => m.status === 'not-configured'
    ).length
    score = Math.max(72, 93 - notConfigured * 4)
    note =
      notConfigured > 0
        ? 'Platform healthy — optional monitoring integrations not connected'
        : 'Platform operating at full health'
  }

  return { score, trend: 'unknown', note }
}

function scoreFinancial(data: ExecutiveData): BrainScore {
  const { revenue } = data
  let score: number
  let note: string

  if (!revenue.stripeConnected) {
    score = 40
    note = 'Stripe not connected — billing health cannot be assessed'
  } else {
    const totalActive = revenue.active + revenue.trialing
    if (totalActive === 0) {
      score = 45
      note = 'Stripe connected but no active subscriptions'
    } else if (revenue.pastDue > 0) {
      const ratio = revenue.pastDue / (totalActive + revenue.pastDue)
      score = Math.max(35, Math.round(76 - ratio * 40))
      note = `${revenue.pastDue} past-due subscription${revenue.pastDue !== 1 ? 's' : ''} — payment recovery needed`
    } else {
      score = Math.min(88, 74 + Math.min(totalActive * 2, 14))
      note = `${totalActive} active subscription${totalActive !== 1 ? 's' : ''} — no payment issues`
    }
  }

  return { score, trend: 'unknown', note }
}

function scoreAIEfficiency(workforceData: WorkforceStatusData): BrainScore {
  const total = workforceData.totalRunsAllWorkforces
  if (total === 0) {
    return { score: 50, trend: 'unknown', note: 'No AI Workforce runs yet — insufficient data' }
  }

  const failed = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const completed = workforceData.workforces.reduce((s, w) => s + w.completedRuns, 0)
  const successRate = completed / total
  const score = Math.max(15, Math.round(successRate * 90))
  const pct = Math.round(successRate * 100)
  const note =
    failed > 0
      ? `${failed} failed run${failed !== 1 ? 's' : ''} · ${pct}% success rate`
      : `${completed} completed run${completed !== 1 ? 's' : ''} · ${pct}% success rate`

  return { score, trend: failed > 0 ? 'down' : 'stable', note }
}

function scoreGrowth(data: ExecutiveData): BrainScore {
  const orgCount = safeInt(data.health.activeOrganizations.value)
  const { newCustomers, revenue } = data

  if (orgCount === 0) {
    return {
      score: 15,
      trend: 'unknown',
      note: 'No customers yet — growth pipeline not established',
    }
  }

  let score = 40
  if (newCustomers.orgsLast24h > 0) score += 20
  if (newCustomers.usersLast24h > 0) score += 8
  if (revenue.active > 0) score += 10
  if (revenue.stripeConnected) score += 5
  if (revenue.trialing > 0) score += 5
  score = Math.min(82, score)

  const note =
    newCustomers.orgsLast24h > 0
      ? `${newCustomers.orgsLast24h} new org${newCustomers.orgsLast24h !== 1 ? 's' : ''} in 24h — active acquisition`
      : `${orgCount} org${orgCount !== 1 ? 's' : ''} on platform · no new signups (24h)`

  return { score, trend: newCustomers.orgsLast24h > 0 ? 'up' : 'unknown', note }
}

function scoreCustomerSuccess(tickets: SupportTicket[]): BrainScore {
  let score = 82
  const billing = tickets.filter((t) => t.sourceType === 'billing-issue').length
  const failedRun = tickets.filter((t) => t.sourceType === 'failed-run').length
  const auditErr = tickets.filter((t) => t.sourceType === 'audit-error').length

  score -= billing * 12
  score -= failedRun * 8
  score -= auditErr * 4
  score = Math.max(20, score)

  const total = billing + failedRun + auditErr
  const note =
    total === 0
      ? 'No active customer incidents detected'
      : `${total} incident${total !== 1 ? 's' : ''} active (${[
          billing > 0 && `${billing} billing`,
          failedRun > 0 && `${failedRun} AI delivery`,
          auditErr > 0 && `${auditErr} platform error`,
        ]
          .filter(Boolean)
          .join(', ')})`

  return { score, trend: total > 0 ? 'down' : 'stable', note }
}

function scoreRisk(data: ExecutiveData, supportData: SupportData): BrainScore {
  const criticals = data.actionQueue.filter((i) => i.priority === 'critical').length
  const highs = data.actionQueue.filter((i) => i.priority === 'high').length
  const mediums = data.actionQueue.filter((i) => i.priority === 'medium').length

  let score: number
  if (criticals > 0) {
    score = Math.max(8, 28 - criticals * 8)
  } else if (highs > 0) {
    score = Math.max(35, 68 - highs * 8)
  } else {
    score = Math.max(60, 88 - mediums * 5)
  }

  score = Math.max(12, score - supportData.stats.awaitingFounder * 3)

  const riskLabel = score < 30 ? 'Critical risk' : score < 55 ? 'Elevated risk' : 'Managed risk'
  const note =
    criticals > 0
      ? `${criticals} critical issue${criticals !== 1 ? 's' : ''} — ${riskLabel}`
      : highs > 0
        ? `${highs} high-priority gap${highs !== 1 ? 's' : ''} — ${riskLabel}`
        : `No critical issues — ${riskLabel}`

  return { score, trend: criticals > 0 ? 'down' : 'unknown', note }
}

function scoreConfidence(data: ExecutiveData, workforceData: WorkforceStatusData): BrainScore {
  let score = 50
  if (data.revenue.stripeConnected) score += 12
  if (safeInt(data.health.activeOrganizations.value) > 0) score += 10
  if (workforceData.totalRunsAllWorkforces > 0) score += 10
  if (data.health.apiHealth.status !== 'not-configured') score += 8
  if (data.health.deployments.status !== 'not-configured') score += 5
  if (data.recentActivity.total24h > 0) score += 5
  score = Math.min(90, score)

  const note =
    score >= 75
      ? 'High confidence — multiple data sources connected'
      : score >= 60
        ? 'Medium confidence — core data available; optional integrations missing'
        : 'Limited confidence — connect additional integrations for full intelligence'

  return { score, trend: 'unknown', note }
}

function buildOverallScore(s: Omit<CompanyScores, 'overall'>): BrainScore {
  const weighted =
    s.operational.score * 0.18 +
    s.financial.score * 0.2 +
    s.aiEfficiency.score * 0.15 +
    s.growth.score * 0.2 +
    s.customerSuccess.score * 0.15 +
    s.risk.score * 0.12
  const confidenceAdj = (s.confidence.score - 50) * 0.05
  const score = Math.round(Math.min(95, Math.max(5, weighted + confidenceAdj)))

  const note =
    score >= 75
      ? 'Business operating effectively — focus on growth'
      : score >= 50
        ? 'Business operational — key gaps need attention'
        : 'Business needs intervention — critical issues blocking progress'

  const trend: ScoreTrend =
    s.risk.trend === 'down' || s.growth.trend === 'down'
      ? 'down'
      : s.growth.trend === 'up'
        ? 'up'
        : 'unknown'

  return { score, trend, note }
}

// ─── Public pure functions ────────────────────────────────────────────────────

export function buildBrainScores(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): CompanyScores {
  const operational = scoreOperational(executiveData)
  const financial = scoreFinancial(executiveData)
  const aiEfficiency = scoreAIEfficiency(workforceData)
  const growth = scoreGrowth(executiveData)
  const customerSuccess = scoreCustomerSuccess(supportData.tickets)
  const risk = scoreRisk(executiveData, supportData)
  const confidence = scoreConfidence(executiveData, workforceData)
  const overall = buildOverallScore({
    operational,
    financial,
    aiEfficiency,
    growth,
    customerSuccess,
    risk,
    confidence,
  })
  return {
    overall,
    growth,
    operational,
    customerSuccess,
    financial,
    aiEfficiency,
    risk,
    confidence,
  }
}

export function buildBrainReasoning(
  data: ExecutiveData,
  scores: CompanyScores
): ExecutiveReasoning {
  const orgCount = safeInt(data.health.activeOrganizations.value)
  let belief: string
  let why: string
  let estimatedImpact: string
  let confidenceLevel: 'high' | 'medium' | 'low'

  if (data.health.overall === 'critical') {
    belief = 'The platform has critical infrastructure issues that are blocking operations'
    why = 'Core platform systems are reporting failure states that prevent normal customer activity'
    estimatedImpact = 'Customer operations blocked — immediate revenue and retention risk'
    confidenceLevel = 'high'
  } else if (!data.revenue.stripeConnected) {
    belief = 'The platform is operationally ready but not commercially activated'
    why = 'No Stripe integration means payments cannot be processed and MRR cannot be tracked'
    estimatedImpact =
      'Revenue growth blocked — billing configuration is the critical path to monetization'
    confidenceLevel = 'high'
  } else if (orgCount === 0) {
    belief = 'The platform has no customers — validation and acquisition are primary objectives'
    why = 'No organizations provisioned; end-to-end customer experience is untested at scale'
    estimatedImpact = 'First customer acquisition is the highest-leverage action available'
    confidenceLevel = 'high'
  } else if (data.revenue.pastDue > 0) {
    belief = 'Active customers are present but payment health needs immediate attention'
    why = `${data.revenue.pastDue} subscription${data.revenue.pastDue !== 1 ? 's are' : ' is'} past due, putting revenue and customer relationships at risk`
    estimatedImpact = 'Revenue recovery and customer retention at risk without intervention'
    confidenceLevel = 'high'
  } else if (scores.growth.score < 50) {
    belief = 'Platform is stable but growth signals are weak'
    why = 'No new customer acquisition signals in the last 24 hours'
    estimatedImpact = 'Flat growth trajectory — marketing activation needed to accelerate'
    confidenceLevel = 'medium'
  } else {
    belief = 'Platform is healthy and showing positive growth signals'
    why = 'Core systems operational, customers active, and acquisition continuing'
    estimatedImpact = 'Current trajectory supports continued MRR growth'
    confidenceLevel = 'high'
  }

  confidenceLevel =
    scores.confidence.score < 55 ? 'low' : scores.confidence.score < 72 ? 'medium' : confidenceLevel

  const totalRuns = safeInt(data.health.engagementRuns.value)
  const evidence: string[] = [
    `Platform health: ${data.health.overall} — ${data.summary.headline}`,
    `Organizations: ${orgCount} active · ${data.newCustomers.orgsLast24h} new (24h)`,
    data.revenue.stripeConnected
      ? `Revenue: ${data.revenue.active} active · ${data.revenue.trialing} trialing · ${data.revenue.pastDue} past due`
      : 'Revenue: Stripe not connected — billing health unavailable',
    `AI Workforce: ${totalRuns} total run${totalRuns !== 1 ? 's' : ''} · ${data.health.engagementRuns.status === 'warning' ? 'failures detected' : 'no failures'}`,
    `Audit activity: ${data.recentActivity.total24h} events in last 24h`,
  ]

  const recommendedActions = data.actionQueue
    .filter((i) => i.priority === 'critical' || i.priority === 'high')
    .slice(0, 3)
    .map((i) => i.recommendedAction)

  if (recommendedActions.length === 0) {
    recommendedActions.push(
      orgCount === 0
        ? 'Onboard first customer to validate end-to-end platform flow'
        : 'Maintain operational focus — no critical actions needed'
    )
  }

  return { belief, why, evidence, recommendedActions, estimatedImpact, confidenceLevel }
}

export function buildBrainObjectives(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): CompanyObjective[] {
  const { revenue, newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const totalRuns = workforceData.totalRunsAllWorkforces
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const completedRuns = workforceData.workforces.reduce((s, w) => s + w.completedRuns, 0)
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length
  const failedRunTickets = supportData.tickets.filter((t) => t.sourceType === 'failed-run').length
  const totalOpenTickets = supportData.stats.totalOpen

  return [
    {
      id: 'grow-mrr',
      title: 'Grow MRR',
      status: !revenue.stripeConnected
        ? 'blocked'
        : revenue.active === 0 && revenue.trialing === 0
          ? 'at-risk'
          : newCustomers.orgsLast24h > 0 || revenue.active > 0
            ? 'on-track'
            : 'at-risk',
      score: !revenue.stripeConnected
        ? 20
        : revenue.active === 0
          ? 35
          : newCustomers.orgsLast24h > 0
            ? 70
            : 52,
      signal: !revenue.stripeConnected
        ? 'Stripe not connected — MRR cannot be tracked'
        : revenue.active === 0
          ? 'No active paying customers'
          : `${revenue.active} active subscription${revenue.active !== 1 ? 's' : ''} · ${newCustomers.orgsLast24h > 0 ? `${newCustomers.orgsLast24h} new org${newCustomers.orgsLast24h !== 1 ? 's' : ''} (24h)` : 'no new signups today'}`,
      blockingIssue: !revenue.stripeConnected
        ? 'Stripe integration required before revenue can be tracked'
        : revenue.pastDue > 0
          ? `${revenue.pastDue} past-due subscription${revenue.pastDue !== 1 ? 's' : ''} reducing effective MRR`
          : null,
      relatedAgents: ['CFO Agent', 'CMO Agent'],
    },
    {
      id: 'reduce-churn',
      title: 'Reduce Churn',
      status: !revenue.stripeConnected
        ? 'insufficient-data'
        : revenue.pastDue > 0 || revenue.canceled > 0
          ? 'at-risk'
          : 'on-track',
      score: !revenue.stripeConnected
        ? 50
        : revenue.pastDue > 0
          ? Math.max(30, 65 - revenue.pastDue * 12)
          : revenue.canceled > 0
            ? Math.max(45, 72 - revenue.canceled * 5)
            : 80,
      signal: !revenue.stripeConnected
        ? 'Billing not connected — churn signals unavailable'
        : revenue.pastDue > 0
          ? `${revenue.pastDue} past-due subscription${revenue.pastDue !== 1 ? 's' : ''} at churn risk`
          : revenue.canceled > 0
            ? `${revenue.canceled} canceled subscription${revenue.canceled !== 1 ? 's' : ''}`
            : 'No churn signals detected',
      blockingIssue:
        revenue.pastDue > 0 ? 'Past-due accounts need outreach before they churn' : null,
      relatedAgents: ['CFO Agent', 'Customer Success Agent'],
    },
    {
      id: 'improve-onboarding',
      title: 'Improve Onboarding',
      status: orgCount === 0 ? 'blocked' : newCustomers.orgsLast24h > 0 ? 'on-track' : 'at-risk',
      score: orgCount === 0 ? 10 : newCustomers.orgsLast24h > 0 ? 65 : 42,
      signal:
        orgCount === 0
          ? 'No customers to onboard — first acquisition required'
          : newCustomers.orgsLast24h > 0
            ? `${newCustomers.orgsLast24h} new org${newCustomers.orgsLast24h !== 1 ? 's' : ''} onboarding today`
            : `${orgCount} org${orgCount !== 1 ? 's' : ''} active · no new signups in 24h`,
      blockingIssue:
        orgCount === 0 ? 'Acquire first customer before onboarding optimization applies' : null,
      relatedAgents: ['Customer Success Agent', 'Support Agent'],
    },
    {
      id: 'increase-automation',
      title: 'Increase AI Automation',
      status:
        totalRuns === 0
          ? 'insufficient-data'
          : failedRuns > completedRuns
            ? 'at-risk'
            : completedRuns > 0
              ? 'on-track'
              : 'at-risk',
      score: totalRuns === 0 ? 50 : Math.max(20, Math.round((completedRuns / totalRuns) * 85)),
      signal:
        totalRuns === 0
          ? 'No AI Workforce runs yet — automation not started'
          : `${completedRuns} completed · ${failedRuns} failed out of ${totalRuns} total runs`,
      blockingIssue:
        failedRuns > 0
          ? `${failedRuns} failed run${failedRuns !== 1 ? 's' : ''} reducing automation reliability`
          : null,
      relatedAgents: ['CTO Agent', 'Support Manager Agent'],
    },
    {
      id: 'reduce-support-load',
      title: 'Reduce Support Load',
      status:
        totalOpenTickets === 0
          ? 'on-track'
          : billingTickets > 0 || failedRunTickets > 2
            ? 'at-risk'
            : 'on-track',
      score: totalOpenTickets === 0 ? 82 : Math.max(30, 80 - totalOpenTickets * 6),
      signal:
        totalOpenTickets === 0
          ? 'No open support tickets — support load minimal'
          : `${totalOpenTickets} open ticket${totalOpenTickets !== 1 ? 's' : ''} · ${supportData.stats.autoResolved} auto-resolved`,
      blockingIssue:
        billingTickets > 0
          ? `${billingTickets} billing issue${billingTickets !== 1 ? 's' : ''} require manual founder action`
          : null,
      relatedAgents: ['Support Manager Agent', 'Content Director Agent'],
    },
    {
      id: 'increase-satisfaction',
      title: 'Increase Customer Satisfaction',
      status:
        orgCount === 0
          ? 'insufficient-data'
          : failedRunTickets > 0 || billingTickets > 0
            ? 'at-risk'
            : 'on-track',
      score: orgCount === 0 ? 50 : Math.max(25, 80 - failedRunTickets * 8 - billingTickets * 10),
      signal:
        orgCount === 0
          ? 'No customers yet — satisfaction tracking not started'
          : failedRunTickets > 0 || billingTickets > 0
            ? 'Active incidents affecting customer experience'
            : 'No customer-impacting incidents detected',
      blockingIssue:
        failedRunTickets > 0 ? 'AI delivery failures are the top satisfaction risk' : null,
      relatedAgents: ['Customer Success Agent', 'Support Manager Agent', 'CTO Agent'],
    },
  ]
}

export function buildBrainCoordination(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): AgentCoordinationRecord[] {
  const AGENT_DEFS = [
    { id: 'cto', name: 'CTO Agent' },
    { id: 'cfo', name: 'CFO Agent' },
    { id: 'cmo', name: 'CMO Agent' },
    { id: 'customer-success', name: 'Customer Success Agent' },
    { id: 'support-manager', name: 'Support Manager Agent' },
    { id: 'content-director', name: 'Content Director Agent' },
  ]

  const hasCFOHigh = agentTasks.some((t) => t.agentId === 'cfo' && t.priority === 'high')
  const hasCSHigh = agentTasks.some(
    (t) => t.agentId === 'customer-success' && t.priority === 'high'
  )
  const hasCTOHigh = agentTasks.some((t) => t.agentId === 'cto' && t.priority === 'high')
  const hasSupportTasks = agentTasks.some((t) => t.agentId === 'support-manager')

  return AGENT_DEFS.map(({ id, name }) => {
    const tasks = agentTasks.filter((t) => t.agentId === id)
    const jobs = execJobs.filter((j) => j.agentId === id)
    const waitingApproval = jobs.filter((j) => j.stage === 'waiting_approval').length

    const collaborating: string[] = []
    if (id === 'cfo' && hasCSHigh) collaborating.push('Customer Success Agent')
    if (id === 'customer-success' && hasCFOHigh) collaborating.push('CFO Agent')
    if (id === 'cto' && hasSupportTasks) collaborating.push('Support Manager Agent')
    if (id === 'support-manager' && hasCTOHigh) collaborating.push('CTO Agent')

    return {
      agentId: id,
      agentName: name,
      currentPriority: tasks[0]?.description ?? null,
      pendingTasks: tasks.length,
      waitingApproval,
      blockedBy: waitingApproval > 0 ? 'Awaiting founder approval' : null,
      collaboratingWith: collaborating,
    }
  })
}

export function buildLearningSignals(
  executiveData: ExecutiveData,
  workforceData: WorkforceStatusData,
  supportData: SupportData
): LearningSignal[] {
  const signals: LearningSignal[] = []

  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  if (failedRuns > 0) {
    signals.push({
      signal: `${failedRuns} failed AI Workforce run${failedRuns !== 1 ? 's' : ''} detected`,
      count: failedRuns,
      type: failedRuns > 2 ? 'pattern' : 'anomaly',
    })
  }

  if (executiveData.revenue.pastDue > 0) {
    signals.push({
      signal: `Payment failures detected — ${executiveData.revenue.pastDue} past-due subscription${executiveData.revenue.pastDue !== 1 ? 's' : ''}`,
      count: executiveData.revenue.pastDue,
      type: 'pattern',
    })
  }

  if (!executiveData.revenue.stripeConnected) {
    signals.push({
      signal: 'Stripe integration pending — recurring configuration gap',
      count: 1,
      type: 'pattern',
    })
  }

  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length
  if (billingTickets > 0) {
    signals.push({
      signal: `${billingTickets} billing incident${billingTickets !== 1 ? 's' : ''} — recurring financial risk signal`,
      count: billingTickets,
      type: 'pattern',
    })
  }

  const auditErrors = executiveData.recentActivity.events.filter(
    (e) => e.outcome === 'error'
  ).length
  if (auditErrors > 0) {
    signals.push({
      signal: `${auditErrors} platform error${auditErrors !== 1 ? 's' : ''} in last 24h`,
      count: auditErrors,
      type: auditErrors >= 5 ? 'pattern' : 'anomaly',
    })
  }

  if (executiveData.newCustomers.orgsLast24h > 0) {
    signals.push({
      signal: `${executiveData.newCustomers.orgsLast24h} new organization${executiveData.newCustomers.orgsLast24h !== 1 ? 's' : ''} joined in 24h — growth signal`,
      count: executiveData.newCustomers.orgsLast24h,
      type: 'trend',
    })
  }

  if (signals.length === 0) {
    signals.push({
      signal: 'No recurring patterns detected — platform signals normal',
      count: 0,
      type: 'trend',
    })
  }

  return signals
}

// ─── Async entry point ────────────────────────────────────────────────────────

export async function getBrainData(): Promise<BrainData> {
  const [executiveData, supportData, workforceData] = await Promise.all([
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])

  const agentTasks = buildAgentTasks(executiveData)
  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, executiveData.generatedAt)

  const scores = buildBrainScores(executiveData, supportData, workforceData)
  const reasoning = buildBrainReasoning(executiveData, scores)
  const objectives = buildBrainObjectives(executiveData, supportData, workforceData)
  const agentCoordination = buildBrainCoordination(agentTasks, execJobs)
  const learningSignals = buildLearningSignals(executiveData, workforceData, supportData)

  return {
    scores,
    reasoning,
    objectives,
    agentCoordination,
    learningSignals,
    generatedAt: executiveData.generatedAt,
  }
}
