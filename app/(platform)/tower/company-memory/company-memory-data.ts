import type { ExecutiveData } from '../executive/executive-data'
import type { SupportData } from '../support/support-data'
import type { WorkforceStatusData } from '../workforce-status/workforce-data'
import type { AgentTask } from '../agents/agent-tasks'
import type { ExecutionJob } from '../execution/execution-data'
import { getExecutiveData } from '../executive/executive-data'
import { getSupportData } from '../support/support-data'
import { getWorkforceStatusData } from '../workforce-status/workforce-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { buildExecutionJobs } from '../execution/execution-data'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoryCategory =
  | 'success'
  | 'failure'
  | 'decision'
  | 'execution'
  | 'support'
  | 'engineering'
  | 'growth'
  | 'revenue'
  | 'automation'
  | 'agent'

export type MemorySignal = 'positive' | 'negative' | 'neutral' | 'warning'

export type LearningTrend = 'improving' | 'stable' | 'declining' | 'insufficient-data'

export interface MemoryObject {
  id: string
  title: string
  summary: string
  confidence: number
  evidence: string[]
  businessImpact: string
  recommendedNextAction: string
  category: MemoryCategory
  signal: MemorySignal
}

export interface AgentLearningRecord {
  agentId: string
  agentName: string
  domain: string
  historicalSuccessPct: number | null
  historicalFailurePct: number | null
  learningScore: number
  avgConfidence: number
  avgResolutionTime: string
  trend: LearningTrend
  lastImprovement: string | null
  note: string
}

export interface BusinessPattern {
  id: string
  title: string
  pattern: string
  frequency: 'recurring' | 'one-time' | 'trend'
  impact: 'positive' | 'negative' | 'neutral'
  confidence: number
  evidence: string
  recommendation: string
}

export interface CompanyIntelligenceScore {
  overall: number
  platformHealth: number
  revenueHealth: number
  supportHealth: number
  growthHealth: number
  executionHealth: number
  automationHealth: number
  learningProgress: number
  founderDecisionBacklog: number
  note: string
}

export interface LearningObjective {
  id: string
  objective: string
  currentState: string
  targetState: string
  blockedBy: string | null
  priority: 'critical' | 'high' | 'medium' | 'low'
}

export interface CompanyMemoryData {
  executiveMemory: MemoryObject[]
  recentWins: MemoryObject[]
  recentFailures: MemoryObject[]
  supportMemory: MemoryObject[]
  engineeringMemory: MemoryObject[]
  growthMemory: MemoryObject[]
  revenueMemory: MemoryObject[]
  automationMemory: MemoryObject[]
  agentMemory: MemoryObject[]
  patterns: BusinessPattern[]
  agentLearning: AgentLearningRecord[]
  intelligenceScore: CompanyIntelligenceScore
  learningObjectives: LearningObjective[]
  lessonsLearned: string[]
  recurringProblems: string[]
  pendingLessons: string[]
  topLearning: string
  biggestPattern: string | null
  generatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeInt(s: string): number {
  const n = parseInt(s, 10)
  return isNaN(n) ? 0 : n
}

// ─── Wins ─────────────────────────────────────────────────────────────────────

export function deriveRecentWins(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): MemoryObject[] {
  const wins: MemoryObject[] = []
  const { revenue, newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const completedRuns = workforceData.workforces.reduce((s, w) => s + w.completedRuns, 0)
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)

  if (newCustomers.orgsLast24h > 0) {
    wins.push({
      id: 'win-new-orgs',
      title: 'New Customer Acquisition',
      summary: `${newCustomers.orgsLast24h} new organization${newCustomers.orgsLast24h !== 1 ? 's' : ''} joined in the last 24 hours`,
      confidence: 92,
      evidence: [
        `${newCustomers.orgsLast24h} orgs onboarded`,
        `${newCustomers.usersLast24h} new users`,
        `${orgCount} total orgs`,
      ],
      businessImpact: 'Active acquisition funnel — growth trajectory positive',
      recommendedNextAction:
        'Ensure onboarding flow delivers first value quickly to maximize retention',
      category: 'growth',
      signal: 'positive',
    })
  }

  if (supportData.stats.autoResolved > 0) {
    wins.push({
      id: 'win-ai-resolution',
      title: 'AI Self-Resolution Working',
      summary: `${supportData.stats.autoResolved} support ticket${supportData.stats.autoResolved !== 1 ? 's' : ''} auto-resolved without founder involvement`,
      confidence: 88,
      evidence: [
        `${supportData.stats.autoResolved} tickets resolved autonomously`,
        supportData.stats.aiResolutionPct !== null
          ? `${supportData.stats.aiResolutionPct}% AI resolution rate`
          : 'Resolution tracking active',
      ],
      businessImpact: 'Reduced founder support burden — operations scaling without headcount',
      recommendedNextAction:
        'Monitor resolution quality and expand high-confidence resolution policies',
      category: 'automation',
      signal: 'positive',
    })
  }

  if (completedRuns > 0 && failedRuns === 0) {
    wins.push({
      id: 'win-workforce-clean',
      title: 'AI Workforce Clean Record',
      summary: `${completedRuns} completed run${completedRuns !== 1 ? 's' : ''} with zero failures`,
      confidence: 85,
      evidence: [
        `${completedRuns} completed runs`,
        '0 failed runs',
        `${workforceData.workforces.length} active workforces`,
      ],
      businessImpact: 'AI automation operating reliably — customer delivery consistent',
      recommendedNextAction: 'Maintain reliability while expanding automation coverage',
      category: 'automation',
      signal: 'positive',
    })
  }

  if (health.overall === 'healthy') {
    wins.push({
      id: 'win-platform-health',
      title: 'Platform Fully Operational',
      summary: 'All monitored systems reporting healthy status',
      confidence: 90,
      evidence: ['Database: healthy', 'Authentication: healthy', 'AI Workforce: no failures'],
      businessImpact: 'Zero platform downtime — customer operations uninterrupted',
      recommendedNextAction: 'Connect optional integrations to close monitoring blind spots',
      category: 'engineering',
      signal: 'positive',
    })
  }

  if (revenue.stripeConnected && revenue.active > 0 && revenue.pastDue === 0) {
    wins.push({
      id: 'win-revenue-healthy',
      title: 'Revenue Collection Clean',
      summary: `${revenue.active} active subscription${revenue.active !== 1 ? 's' : ''} with no payment failures`,
      confidence: 88,
      evidence: [`${revenue.active} active`, `${revenue.trialing} trialing`, '0 past-due'],
      businessImpact: 'Predictable MRR — no revenue leakage from payment failures',
      recommendedNextAction: 'Focus on converting trials and expanding MRR',
      category: 'revenue',
      signal: 'positive',
    })
  }

  if (wins.length === 0) {
    wins.push({
      id: 'win-baseline',
      title: 'Platform Operational',
      summary: 'Platform is running — no critical wins or failures in current data window',
      confidence: 50,
      evidence: [
        `${orgCount} organization${orgCount !== 1 ? 's' : ''} on platform`,
        'Generating live data snapshots on each page load',
      ],
      businessImpact:
        'Baseline operations established — growth signals will appear as platform usage increases',
      recommendedNextAction:
        'Connect additional integrations to unlock richer intelligence signals',
      category: 'execution',
      signal: 'neutral',
    })
  }

  return wins
}

// ─── Failures ─────────────────────────────────────────────────────────────────

export function deriveRecentFailures(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): MemoryObject[] {
  const failures: MemoryObject[] = []
  const { revenue, health, recentActivity } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length
  const auditErrors = recentActivity.events.filter((e) => e.outcome === 'error').length

  if (failedRuns > 0) {
    const failingCount = workforceData.workforces.filter((w) => w.failedRuns > 0).length
    failures.push({
      id: 'fail-workforce-runs',
      title: 'AI Workforce Run Failures',
      summary: `${failedRuns} AI Workforce run${failedRuns !== 1 ? 's' : ''} failed`,
      confidence: 90,
      evidence: [
        `${failedRuns} failed across ${failingCount} workforce${failingCount !== 1 ? 's' : ''}`,
        `${workforceData.totalRunsAllWorkforces} total runs`,
      ],
      businessImpact: 'AI delivery failures may surface as support tickets and customer complaints',
      recommendedNextAction:
        'Investigate failed runs in AI Workforce dashboard and resolve root cause',
      category: 'automation',
      signal: 'negative',
    })
  }

  if (revenue.pastDue > 0) {
    failures.push({
      id: 'fail-past-due',
      title: 'Payment Collection Failures',
      summary: `${revenue.pastDue} subscription${revenue.pastDue !== 1 ? 's' : ''} past due`,
      confidence: 92,
      evidence: [
        `${revenue.pastDue} past-due subscription${revenue.pastDue !== 1 ? 's' : ''}`,
        revenue.stripeConnected
          ? 'Stripe connected — payment retry active'
          : 'Stripe not connected',
      ],
      businessImpact: 'Revenue at risk — past-due accounts may churn without recovery outreach',
      recommendedNextAction: 'Initiate payment recovery outreach for past-due accounts immediately',
      category: 'revenue',
      signal: 'negative',
    })
  }

  if (billingTickets > 0) {
    failures.push({
      id: 'fail-billing-tickets',
      title: 'Billing Support Incidents',
      summary: `${billingTickets} open billing incident${billingTickets !== 1 ? 's' : ''}`,
      confidence: 85,
      evidence: [
        `${billingTickets} billing-source ticket${billingTickets !== 1 ? 's' : ''}`,
        `${supportData.stats.awaitingFounder} awaiting founder action`,
      ],
      businessImpact: 'Unresolved billing issues increase churn risk and customer dissatisfaction',
      recommendedNextAction:
        'Review billing tickets and approve resolution actions in the approval queue',
      category: 'support',
      signal: 'negative',
    })
  }

  if (supportData.stats.escalations > 0) {
    failures.push({
      id: 'fail-escalations',
      title: 'Support Escalations',
      summary: `${supportData.stats.escalations} ticket${supportData.stats.escalations !== 1 ? 's' : ''} escalated beyond AI resolution`,
      confidence: 82,
      evidence: [
        `${supportData.stats.escalations} escalated`,
        `Total open: ${supportData.stats.totalOpen}`,
      ],
      businessImpact: 'Escalations indicate AI agents could not resolve issues autonomously',
      recommendedNextAction:
        'Review escalated ticket categories and expand AI agent knowledge coverage',
      category: 'support',
      signal: 'warning',
    })
  }

  if (auditErrors > 0) {
    failures.push({
      id: 'fail-platform-errors',
      title: 'Platform Errors Detected',
      summary: `${auditErrors} platform error${auditErrors !== 1 ? 's' : ''} in last 24h audit log`,
      confidence: 80,
      evidence: [
        `${auditErrors} error event${auditErrors !== 1 ? 's' : ''}`,
        `${recentActivity.total24h} total audit events (24h)`,
      ],
      businessImpact: 'Platform errors may indicate system instability or unexpected behavior',
      recommendedNextAction: 'Review audit log and investigate error patterns',
      category: 'engineering',
      signal: auditErrors >= 5 ? 'negative' : 'warning',
    })
  }

  if (health.overall === 'critical') {
    failures.push({
      id: 'fail-critical-health',
      title: 'Critical Platform Health Issues',
      summary: 'Platform reporting critical status — immediate action required',
      confidence: 95,
      evidence: ['Health status: critical', 'One or more core systems failing'],
      businessImpact:
        'Platform instability directly impacts customer operations and AI Workforce delivery',
      recommendedNextAction:
        'Navigate to System Health dashboard and resolve critical issues immediately',
      category: 'engineering',
      signal: 'negative',
    })
  }

  return failures
}

// ─── Domain memory ────────────────────────────────────────────────────────────

export function deriveSupportMemory(supportData: SupportData): MemoryObject[] {
  const objects: MemoryObject[] = []
  const { tickets, stats } = supportData
  const billingTickets = tickets.filter((t) => t.sourceType === 'billing-issue').length

  if (stats.aiResolutionPct !== null) {
    objects.push({
      id: 'support-ai-resolution',
      title: 'AI Resolution Capability',
      summary: `AI agents resolving ${stats.aiResolutionPct}% of support incidents autonomously`,
      confidence: 85,
      evidence: [
        `${stats.autoResolved} auto-resolved`,
        `${stats.totalOpen} still open`,
        `${stats.aiResolutionPct}% resolution rate`,
      ],
      businessImpact:
        stats.aiResolutionPct >= 50
          ? 'AI support reduces founder workload significantly'
          : 'Low AI resolution rate — manual oversight still required',
      recommendedNextAction:
        stats.aiResolutionPct >= 50
          ? 'Maintain high-confidence resolution policies'
          : 'Review agent confidence thresholds and expand AI resolution coverage',
      category: 'support',
      signal: stats.aiResolutionPct >= 50 ? 'positive' : 'warning',
    })
  }

  if (stats.escalations > 0) {
    objects.push({
      id: 'support-escalation-pattern',
      title: 'Escalation Pattern',
      summary: `${stats.escalations} ticket${stats.escalations !== 1 ? 's' : ''} required human escalation`,
      confidence: 80,
      evidence: [
        `${stats.escalations} escalated out of ${stats.totalOpen} open`,
        'Escalation indicates AI confidence below resolution threshold',
      ],
      businessImpact:
        'Escalation rate signals gaps in AI knowledge coverage or confidence calibration',
      recommendedNextAction:
        'Analyze escalated ticket categories and improve agent training coverage',
      category: 'support',
      signal: 'warning',
    })
  }

  if (stats.awaitingFounder > 0) {
    objects.push({
      id: 'support-founder-backlog',
      title: 'Support Approval Backlog',
      summary: `${stats.awaitingFounder} support ticket${stats.awaitingFounder !== 1 ? 's' : ''} require founder approval`,
      confidence: 88,
      evidence: [
        `${stats.awaitingFounder} tickets waiting`,
        'Agents have completed analysis but cannot act without approval',
      ],
      businessImpact: 'Delayed approvals increase resolution time and customer dissatisfaction',
      recommendedNextAction: 'Review and approve pending support tickets in the approval queue',
      category: 'decision',
      signal: 'warning',
    })
  }

  if (billingTickets > 0) {
    objects.push({
      id: 'support-billing-pattern',
      title: 'Recurring Billing Support Pattern',
      summary: `${billingTickets} billing-related ticket${billingTickets !== 1 ? 's' : ''} in the support queue`,
      confidence: 82,
      evidence: [
        `${billingTickets} billing-source incidents`,
        'Customers experiencing billing friction',
      ],
      businessImpact: 'Billing friction leads to payment failures and increased churn risk',
      recommendedNextAction: 'Proactively communicate with customers experiencing billing issues',
      category: 'support',
      signal: 'negative',
    })
  }

  if (objects.length === 0) {
    objects.push({
      id: 'support-clean',
      title: 'Support Queue Clear',
      summary: 'No active support incidents detected',
      confidence: 75,
      evidence: ['0 open tickets', '0 escalations', '0 founder approvals needed'],
      businessImpact:
        'Clean support state — platform and AI agents operating without customer incidents',
      recommendedNextAction:
        'Build knowledge base proactively to handle future incident categories',
      category: 'support',
      signal: 'positive',
    })
  }

  return objects
}

export function deriveEngineeringMemory(
  executiveData: ExecutiveData,
  workforceData: WorkforceStatusData
): MemoryObject[] {
  const objects: MemoryObject[] = []
  const { health } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)

  if (failedRuns > 0) {
    const failingCount = workforceData.workforces.filter((w) => w.failedRuns > 0).length
    objects.push({
      id: 'eng-workforce-failures',
      title: 'AI Workforce Failures',
      summary: `${failedRuns} failed run${failedRuns !== 1 ? 's' : ''} across ${failingCount} workforce${failingCount !== 1 ? 's' : ''}`,
      confidence: 88,
      evidence: [
        `${failedRuns} failed runs`,
        `${workforceData.totalRunsAllWorkforces} total runs`,
        `${failingCount} affected workforces`,
      ],
      businessImpact:
        'AI delivery failures reduce automation ROI and may surface as support tickets',
      recommendedNextAction:
        'Investigate failed runs in the workforce detail view and fix root cause',
      category: 'engineering',
      signal: 'negative',
    })
  }

  const notConfigured: string[] = []
  if (health.apiHealth.status === 'not-configured') notConfigured.push('API Health monitoring')
  if (health.backgroundJobs.status === 'not-configured')
    notConfigured.push('Background Jobs monitoring')
  if (health.deployments.status === 'not-configured') notConfigured.push('Deployment tracking')

  if (notConfigured.length > 0) {
    objects.push({
      id: 'eng-not-configured',
      title: 'Engineering Blind Spots',
      summary: `${notConfigured.length} monitoring integration${notConfigured.length !== 1 ? 's' : ''} not configured`,
      confidence: 70,
      evidence: notConfigured,
      businessImpact:
        'Missing monitoring means failures may go undetected until customers report them',
      recommendedNextAction: 'Connect monitoring integrations to eliminate engineering blind spots',
      category: 'engineering',
      signal: 'warning',
    })
  }

  if (health.overall === 'warning') {
    const warningCount = [
      health.database,
      health.authentication,
      health.subscriptions,
      health.billingHealth,
      health.engagementRuns,
      health.auditLog,
    ].filter((m) => m.status === 'warning').length
    objects.push({
      id: 'eng-warnings',
      title: 'Platform Warning State',
      summary: `${warningCount} system${warningCount !== 1 ? 's' : ''} reporting warning state`,
      confidence: 85,
      evidence: [
        `${warningCount} warning-state service${warningCount !== 1 ? 's' : ''}`,
        'Review System Health for details',
      ],
      businessImpact: 'Warning-state systems may degrade further before alerts are triggered',
      recommendedNextAction: 'Review System Health dashboard and resolve warning-state services',
      category: 'engineering',
      signal: 'warning',
    })
  }

  if (objects.length === 0) {
    objects.push({
      id: 'eng-healthy',
      title: 'Engineering Systems Nominal',
      summary: 'No engineering issues detected in current platform snapshot',
      confidence: 80,
      evidence: [
        `Platform health: ${health.overall}`,
        'No workforce failures',
        'Monitoring active',
      ],
      businessImpact: 'Clean engineering state — AI Workforce operating without technical blockers',
      recommendedNextAction: 'Consider adding optional integrations for deeper observability',
      category: 'engineering',
      signal: 'positive',
    })
  }

  return objects
}

export function deriveGrowthMemory(executiveData: ExecutiveData): MemoryObject[] {
  const objects: MemoryObject[] = []
  const { newCustomers, revenue, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)

  if (newCustomers.orgsLast24h > 0) {
    objects.push({
      id: 'growth-new-orgs',
      title: 'Active Customer Acquisition',
      summary: `${newCustomers.orgsLast24h} new organization${newCustomers.orgsLast24h !== 1 ? 's' : ''} in 24h`,
      confidence: 90,
      evidence: [
        `${newCustomers.orgsLast24h} new orgs`,
        `${newCustomers.usersLast24h} new users`,
        `${orgCount} total orgs`,
      ],
      businessImpact: 'Growth funnel active — acquisition is working',
      recommendedNextAction:
        'Optimize onboarding to ensure new customers reach first value quickly',
      category: 'growth',
      signal: 'positive',
    })
  }

  if (orgCount === 0) {
    objects.push({
      id: 'growth-no-customers',
      title: 'First Customer Acquisition Pending',
      summary: 'No organizations on platform — growth phase has not started',
      confidence: 92,
      evidence: [
        '0 organizations',
        '0 active subscriptions',
        'Acquisition funnel not yet producing results',
      ],
      businessImpact:
        'Cannot validate product-market fit without customers — all growth metrics are blocked',
      recommendedNextAction: 'Focus all growth resources on acquiring the first paying customer',
      category: 'growth',
      signal: 'warning',
    })
  } else if (newCustomers.orgsLast24h === 0) {
    objects.push({
      id: 'growth-flat',
      title: 'Growth Signals Flat',
      summary: `${orgCount} organization${orgCount !== 1 ? 's' : ''} active — no new signups in last 24h`,
      confidence: 75,
      evidence: [`${orgCount} existing orgs`, '0 new orgs (24h)', '0 new users (24h)'],
      businessImpact: 'Flat acquisition may indicate marketing or top-of-funnel gap',
      recommendedNextAction: 'Review marketing campaigns and outbound sequences with CMO Agent',
      category: 'growth',
      signal: 'neutral',
    })
  }

  if (revenue.stripeConnected && revenue.trialing > 0) {
    objects.push({
      id: 'growth-trials',
      title: 'Trial Conversion Opportunity',
      summary: `${revenue.trialing} customer${revenue.trialing !== 1 ? 's' : ''} in trial — conversion window active`,
      confidence: 80,
      evidence: [
        `${revenue.trialing} trialing`,
        `${revenue.active} already converted`,
        'Trial window active',
      ],
      businessImpact: 'Converting trials to paid subscriptions is the highest-ROI growth action',
      recommendedNextAction:
        'Ensure trial users experience full product value; prepare conversion outreach',
      category: 'growth',
      signal: 'positive',
    })
  }

  return objects
}

export function deriveRevenueMemory(
  executiveData: ExecutiveData,
  supportData: SupportData
): MemoryObject[] {
  const objects: MemoryObject[] = []
  const { revenue } = executiveData
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length

  if (!revenue.stripeConnected) {
    objects.push({
      id: 'rev-no-stripe',
      title: 'Billing Infrastructure Not Connected',
      summary: 'Stripe integration not configured — revenue cannot be tracked or collected',
      confidence: 95,
      evidence: [
        'Stripe disconnected',
        'MRR cannot be calculated',
        'Payment processing unavailable',
      ],
      businessImpact: 'Cannot monetize customers or track revenue growth until Stripe is connected',
      recommendedNextAction: 'Connect Stripe immediately — this is the critical path to revenue',
      category: 'revenue',
      signal: 'negative',
    })
  } else {
    if (revenue.pastDue > 0) {
      objects.push({
        id: 'rev-past-due',
        title: 'Revenue at Risk',
        summary: `${revenue.pastDue} subscription${revenue.pastDue !== 1 ? 's' : ''} past due`,
        confidence: 90,
        evidence: [
          `${revenue.pastDue} past-due`,
          `${revenue.active} active`,
          `${revenue.trialing} trialing`,
        ],
        businessImpact: 'Past-due subscriptions represent immediate revenue loss and churn risk',
        recommendedNextAction: 'Initiate payment recovery sequence for all past-due accounts',
        category: 'revenue',
        signal: 'negative',
      })
    }

    if (revenue.active > 0) {
      objects.push({
        id: 'rev-active-base',
        title: 'Revenue Base Established',
        summary: `${revenue.active + revenue.trialing} paying or trialing customer${revenue.active + revenue.trialing !== 1 ? 's' : ''}`,
        confidence: 88,
        evidence: [
          `${revenue.active} active subscriptions`,
          `${revenue.trialing} trialing`,
          revenue.pastDue === 0 ? 'No payment failures' : `${revenue.pastDue} past due`,
        ],
        businessImpact: 'MRR baseline established — focus on expansion and retention',
        recommendedNextAction:
          revenue.trialing > 0
            ? 'Accelerate trial-to-paid conversion'
            : 'Focus on new acquisition to grow MRR',
        category: 'revenue',
        signal: revenue.pastDue === 0 ? 'positive' : 'warning',
      })
    } else {
      objects.push({
        id: 'rev-no-active',
        title: 'No Active Revenue',
        summary: 'Stripe connected but no active paying subscriptions',
        confidence: 90,
        evidence: ['Stripe connected', '0 active subscriptions', `${revenue.trialing} trialing`],
        businessImpact: 'MRR = 0 — platform is not yet monetized',
        recommendedNextAction: 'Convert trials or acquire first paying customer',
        category: 'revenue',
        signal: 'warning',
      })
    }
  }

  if (billingTickets > 0) {
    objects.push({
      id: 'rev-billing-friction',
      title: 'Customer Billing Friction',
      summary: `${billingTickets} billing support ticket${billingTickets !== 1 ? 's' : ''} open`,
      confidence: 82,
      evidence: [`${billingTickets} billing tickets`, 'Customers experiencing payment problems'],
      businessImpact: 'Billing friction increases churn probability and support load',
      recommendedNextAction:
        'Resolve billing incidents promptly and investigate root cause patterns',
      category: 'revenue',
      signal: 'warning',
    })
  }

  return objects
}

export function deriveAutomationMemory(workforceData: WorkforceStatusData): MemoryObject[] {
  const objects: MemoryObject[] = []
  const { workforces, totalRunsAllWorkforces } = workforceData

  if (totalRunsAllWorkforces === 0) {
    objects.push({
      id: 'auto-no-runs',
      title: 'AI Automation Not Yet Running',
      summary: 'No AI Workforce runs recorded — automation has not started',
      confidence: 90,
      evidence: [
        `${workforces.length} workforces configured`,
        '0 total runs',
        'Awaiting first execution',
      ],
      businessImpact: 'Zero automation ROI until first workforce runs execute',
      recommendedNextAction: 'Trigger first workforce run and monitor execution quality',
      category: 'automation',
      signal: 'neutral',
    })
    return objects
  }

  const completedRuns = workforces.reduce((s, w) => s + w.completedRuns, 0)
  const failedRuns = workforces.reduce((s, w) => s + w.failedRuns, 0)
  const runningRuns = workforces.reduce((s, w) => s + w.runningRuns, 0)
  const successRate =
    totalRunsAllWorkforces > 0 ? Math.round((completedRuns / totalRunsAllWorkforces) * 100) : 0

  objects.push({
    id: 'auto-run-summary',
    title: 'AI Automation Performance',
    summary: `${completedRuns} completed · ${failedRuns} failed · ${successRate}% success rate`,
    confidence: 85,
    evidence: [
      `${totalRunsAllWorkforces} total runs`,
      `${completedRuns} completed (${successRate}%)`,
      failedRuns > 0 ? `${failedRuns} failed` : 'No failures',
      runningRuns > 0 ? `${runningRuns} running now` : 'None active currently',
    ],
    businessImpact:
      successRate >= 80
        ? 'AI automation delivering reliable results — scalable operations'
        : 'Automation failures reducing efficiency and reliability',
    recommendedNextAction:
      failedRuns > 0
        ? 'Investigate and resolve failed workforce runs'
        : 'Expand automation coverage to additional workflows',
    category: 'automation',
    signal: successRate >= 80 ? 'positive' : failedRuns > 0 ? 'negative' : 'neutral',
  })

  workforces
    .filter((w) => w.failedRuns > 0)
    .forEach((wf, i) => {
      objects.push({
        id: `auto-wf-fail-${i}`,
        title: `${wf.workforceName} Failures`,
        summary: `${wf.failedRuns} failed run${wf.failedRuns !== 1 ? 's' : ''} in ${wf.workforceName}`,
        confidence: 82,
        evidence: [
          `${wf.failedRuns} failed`,
          `${wf.completedRuns} completed`,
          `Health: ${wf.health}`,
        ],
        businessImpact:
          'Workforce failures mean AI-delivered content or actions were not completed',
        recommendedNextAction: `Review ${wf.workforceName} in the Workforce Status dashboard`,
        category: 'automation',
        signal: 'negative',
      })
    })

  return objects
}

export function deriveAgentMemory(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): MemoryObject[] {
  const objects: MemoryObject[] = []

  if (agentTasks.length === 0) {
    objects.push({
      id: 'agent-no-tasks',
      title: 'All Agents Clear',
      summary: 'No active agent tasks — all agents idle',
      confidence: 70,
      evidence: ['0 agent tasks', '0 execution jobs'],
      businessImpact: 'Agents in idle state — no actions to take or approve',
      recommendedNextAction:
        'Verify data connections are active so agents can generate new recommendations',
      category: 'agent',
      signal: 'neutral',
    })
    return objects
  }

  const waitingApproval = execJobs.filter((j) => j.stage === 'waiting_approval')
  if (waitingApproval.length > 0) {
    objects.push({
      id: 'agent-awaiting-approval',
      title: 'Agents Blocked on Approval',
      summary: `${waitingApproval.length} recommendation${waitingApproval.length !== 1 ? 's' : ''} waiting for founder approval`,
      confidence: 88,
      evidence: [
        `${waitingApproval.length} waiting`,
        'Agents have completed analysis',
        'Execution paused pending founder sign-off',
      ],
      businessImpact: 'Delayed approvals slow execution velocity',
      recommendedNextAction: 'Review and approve pending recommendations in the approval queue',
      category: 'decision',
      signal: 'warning',
    })
  }

  const avgConfidence =
    execJobs.length > 0
      ? Math.round(execJobs.reduce((s, j) => s + j.confidenceScore, 0) / execJobs.length)
      : 0

  if (avgConfidence > 0) {
    objects.push({
      id: 'agent-confidence',
      title: 'Agent Confidence Level',
      summary: `Average agent confidence: ${avgConfidence}%`,
      confidence: 75,
      evidence: [
        `${avgConfidence}% average across ${execJobs.length} execution job${execJobs.length !== 1 ? 's' : ''}`,
        `${agentTasks.length} total agent recommendations`,
      ],
      businessImpact:
        avgConfidence >= 80
          ? 'High-confidence agents need less oversight'
          : 'Lower confidence means more recommendations need careful founder review',
      recommendedNextAction:
        avgConfidence < 70
          ? 'Review low-confidence recommendations carefully before approving'
          : 'High confidence — consider approving batches with spot-checks',
      category: 'agent',
      signal: avgConfidence >= 80 ? 'positive' : avgConfidence >= 65 ? 'neutral' : 'warning',
    })
  }

  return objects
}

// ─── Patterns ─────────────────────────────────────────────────────────────────

export function deriveBusinessPatterns(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): BusinessPattern[] {
  const patterns: BusinessPattern[] = []
  const { revenue, health, recentActivity, newCustomers } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length
  const failedRunTickets = supportData.tickets.filter((t) => t.sourceType === 'failed-run').length
  const auditErrors = recentActivity.events.filter((e) => e.outcome === 'error').length
  const failingWorkforceCount = workforceData.workforces.filter((w) => w.failedRuns > 0).length

  if (!revenue.stripeConnected) {
    patterns.push({
      id: 'pat-no-stripe',
      title: 'Billing Configuration Gap',
      pattern: 'Stripe is not connected despite platform being operationally ready',
      frequency: 'recurring',
      impact: 'negative',
      confidence: 95,
      evidence: 'Stripe integration pending across all Tower Control revenue views',
      recommendation:
        'Connect Stripe immediately — unlocks MRR tracking, payment recovery, and CFO Agent capability',
    })
  }

  if (failedRuns > 2) {
    patterns.push({
      id: 'pat-wf-failures',
      title: 'Recurring AI Delivery Failures',
      pattern: `Multiple AI Workforce failures (${failedRuns}) indicating systemic issue`,
      frequency: 'recurring',
      impact: 'negative',
      confidence: 85,
      evidence: `${failedRuns} failed runs across ${failingWorkforceCount} workforce(s)`,
      recommendation:
        'Investigate workforce configuration and data pipeline for common failure points',
    })
  }

  if (revenue.pastDue > 0) {
    patterns.push({
      id: 'pat-past-due',
      title: 'Payment Delinquency Pattern',
      pattern: `Subscriptions going past-due without recovery (${revenue.pastDue} affected)`,
      frequency: revenue.pastDue > 1 ? 'recurring' : 'one-time',
      impact: 'negative',
      confidence: 88,
      evidence: `${revenue.pastDue} past-due subscription(s) — recovery sequence not yet triggered`,
      recommendation: 'Enable automated payment recovery sequences via CFO Agent',
    })
  }

  if (billingTickets > 0) {
    patterns.push({
      id: 'pat-billing-tickets',
      title: 'Billing Support Escalation Pattern',
      pattern: 'Customers escalating billing issues to support channel',
      frequency: billingTickets > 1 ? 'recurring' : 'one-time',
      impact: 'negative',
      confidence: 82,
      evidence: `${billingTickets} billing-source ticket(s) in active support queue`,
      recommendation:
        'Proactive billing communication reduces support escalations — automate billing status notifications',
    })
  }

  if (failedRunTickets > 1) {
    patterns.push({
      id: 'pat-failed-run-tickets',
      title: 'AI Failure → Support Ticket Pattern',
      pattern: 'AI Workforce failures converting into customer-facing support incidents',
      frequency: 'recurring',
      impact: 'negative',
      confidence: 80,
      evidence: `${failedRunTickets} support ticket(s) sourced from AI delivery failures`,
      recommendation: 'Fix AI Workforce reliability to reduce downstream support load',
    })
  }

  if (auditErrors >= 5) {
    patterns.push({
      id: 'pat-audit-errors',
      title: 'Platform Error Spike',
      pattern: 'Elevated platform error rate detected in audit log',
      frequency: 'recurring',
      impact: 'negative',
      confidence: 78,
      evidence: `${auditErrors} error events in 24h audit log`,
      recommendation:
        'Investigate audit error sources and determine if they represent a systematic issue',
    })
  }

  if (newCustomers.orgsLast24h > 0) {
    patterns.push({
      id: 'pat-acquisition-active',
      title: 'Active Acquisition Trend',
      pattern: 'New organizations joining platform — top-of-funnel working',
      frequency: 'trend',
      impact: 'positive',
      confidence: 88,
      evidence: `${newCustomers.orgsLast24h} new org(s) in 24h`,
      recommendation: 'Maximize trial-to-paid conversion by delivering immediate product value',
    })
  }

  if (supportData.stats.autoResolved >= 2) {
    patterns.push({
      id: 'pat-ai-resolution',
      title: 'AI Self-Resolution Trend',
      pattern: 'AI agents successfully resolving multiple incidents autonomously',
      frequency: 'trend',
      impact: 'positive',
      confidence: 82,
      evidence: `${supportData.stats.autoResolved} ticket(s) auto-resolved without founder involvement`,
      recommendation:
        'Reinforce high-confidence resolution policies and expand to new ticket categories',
    })
  }

  const notConfiguredCount = [
    health.apiHealth.status === 'not-configured',
    health.backgroundJobs.status === 'not-configured',
    health.deployments.status === 'not-configured',
  ].filter(Boolean).length

  if (notConfiguredCount >= 2) {
    patterns.push({
      id: 'pat-monitoring-gaps',
      title: 'Monitoring Coverage Gaps',
      pattern: 'Multiple optional monitoring integrations not connected',
      frequency: 'recurring',
      impact: 'neutral',
      confidence: 72,
      evidence: `${notConfiguredCount} optional monitoring integration(s) not configured`,
      recommendation:
        'Connect monitoring integrations to eliminate blind spots before issues escalate',
    })
  }

  return patterns
}

// ─── Agent Learning ────────────────────────────────────────────────────────────

export function deriveAgentLearning(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): AgentLearningRecord[] {
  const AGENT_DEFS = [
    { id: 'cto', name: 'CTO Agent', domain: 'Engineering & Infrastructure' },
    { id: 'cfo', name: 'CFO Agent', domain: 'Finance & Revenue' },
    { id: 'cmo', name: 'CMO Agent', domain: 'Marketing & Growth' },
    { id: 'customer-success', name: 'Customer Success Agent', domain: 'Customer Success' },
    { id: 'support-manager', name: 'Support Manager Agent', domain: 'Support & Resolution' },
    { id: 'content-director', name: 'Content Director Agent', domain: 'Content & SEO' },
  ]

  return AGENT_DEFS.map(({ id, name, domain }) => {
    const tasks = agentTasks.filter((t) => t.agentId === id)
    const jobs = execJobs.filter((j) => j.agentId === id)
    const avgConfidence =
      jobs.length > 0
        ? Math.round(jobs.reduce((s, j) => s + j.confidenceScore, 0) / jobs.length)
        : 0

    const learningScore =
      tasks.length === 0
        ? 30
        : Math.min(90, Math.round(avgConfidence * 0.9 + (Math.min(tasks.length, 5) / 5) * 10))

    let note: string
    if (tasks.length === 0) {
      note = 'No active tasks — agent idle or context not triggering recommendations'
    } else if (avgConfidence >= 80) {
      note = 'High confidence across recommendations — agent well-calibrated to platform context'
    } else if (avgConfidence >= 65) {
      note = 'Moderate confidence — producing useful recommendations with some uncertainty'
    } else if (avgConfidence > 0) {
      note = 'Lower confidence — recommendations should be carefully reviewed before approval'
    } else {
      note = 'No execution jobs yet — confidence data will appear after first task is processed'
    }

    return {
      agentId: id,
      agentName: name,
      domain,
      historicalSuccessPct: null,
      historicalFailurePct: null,
      learningScore,
      avgConfidence,
      avgResolutionTime: '< 5 min',
      trend: 'insufficient-data' as LearningTrend,
      lastImprovement: null,
      note,
    }
  })
}

// ─── Intelligence Score ────────────────────────────────────────────────────────

export function deriveCompanyIntelligenceScore(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): CompanyIntelligenceScore {
  const { health, revenue, newCustomers, recentActivity } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const totalRuns = workforceData.totalRunsAllWorkforces
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length

  // Platform Health
  let platformHealth: number
  if (health.overall === 'critical') {
    platformHealth = 20
  } else if (health.overall === 'warning') {
    platformHealth = 55
  } else {
    const notConfigured = [health.apiHealth, health.backgroundJobs, health.deployments].filter(
      (m) => m.status === 'not-configured'
    ).length
    platformHealth = Math.max(72, 93 - notConfigured * 4)
  }

  // Revenue Health
  let revenueHealth: number
  if (!revenue.stripeConnected) {
    revenueHealth = 40
  } else {
    const totalActive = revenue.active + revenue.trialing
    if (totalActive === 0) {
      revenueHealth = 45
    } else if (revenue.pastDue > 0) {
      const ratio = revenue.pastDue / (totalActive + revenue.pastDue)
      revenueHealth = Math.max(35, Math.round(76 - ratio * 40))
    } else {
      revenueHealth = Math.min(88, 74 + Math.min(totalActive * 2, 14))
    }
  }

  // Support Health
  let supportHealth = 85
  supportHealth -= supportData.stats.escalations * 10
  supportHealth -= supportData.stats.awaitingFounder * 5
  supportHealth -= billingTickets * 12
  if (supportData.stats.aiResolutionPct !== null && supportData.stats.aiResolutionPct >= 50) {
    supportHealth += 5
  }
  supportHealth = Math.max(20, Math.min(95, supportHealth))

  // Growth Health
  let growthHealth: number
  if (orgCount === 0) {
    growthHealth = 15
  } else {
    growthHealth = 40
    if (newCustomers.orgsLast24h > 0) growthHealth += 20
    if (newCustomers.usersLast24h > 0) growthHealth += 8
    if (revenue.active > 0) growthHealth += 10
    if (revenue.stripeConnected) growthHealth += 5
    if (revenue.trialing > 0) growthHealth += 5
    growthHealth = Math.min(82, growthHealth)
  }

  // Execution Health
  let executionHealth: number
  if (execJobs.length === 0) {
    executionHealth = 50
  } else {
    const waitingCount = execJobs.filter((j) => j.stage === 'waiting_approval').length
    const waitRatio = waitingCount / execJobs.length
    executionHealth = Math.max(30, Math.round(85 - waitRatio * 50))
  }

  // Automation Health
  let automationHealth: number
  if (totalRuns === 0) {
    automationHealth = 50
  } else {
    const completedRuns = workforceData.workforces.reduce((s, w) => s + w.completedRuns, 0)
    automationHealth = Math.max(15, Math.round((completedRuns / totalRuns) * 90))
  }

  // Learning Progress (data coverage)
  let learningProgress = 30
  if (revenue.stripeConnected) learningProgress += 15
  if (orgCount > 0) learningProgress += 10
  if (totalRuns > 0) learningProgress += 10
  if (recentActivity.total24h > 0) learningProgress += 10
  if (health.apiHealth.status !== 'not-configured') learningProgress += 10
  if (health.deployments.status !== 'not-configured') learningProgress += 5
  learningProgress = Math.min(90, learningProgress)

  // Founder Decision Backlog (higher = better = fewer items waiting)
  const awaitingCount =
    agentTasks.filter((t) => t.requiresApproval).length + supportData.stats.awaitingFounder
  let founderDecisionBacklog: number
  if (awaitingCount === 0) founderDecisionBacklog = 90
  else if (awaitingCount <= 3) founderDecisionBacklog = 70
  else if (awaitingCount <= 6) founderDecisionBacklog = 55
  else founderDecisionBacklog = 40

  const overall = Math.round(
    platformHealth * 0.15 +
      revenueHealth * 0.2 +
      supportHealth * 0.15 +
      growthHealth * 0.2 +
      executionHealth * 0.12 +
      automationHealth * 0.1 +
      learningProgress * 0.05 +
      founderDecisionBacklog * 0.03
  )

  const note =
    overall >= 75
      ? 'Company operating effectively — intelligence coverage strong'
      : overall >= 50
        ? 'Company operational — key intelligence gaps reducing score'
        : 'Intelligence gaps critical — connect integrations and resolve blockers'

  return {
    overall,
    platformHealth,
    revenueHealth,
    supportHealth,
    growthHealth,
    executionHealth,
    automationHealth,
    learningProgress,
    founderDecisionBacklog,
    note,
  }
}

// ─── Learning Objectives ──────────────────────────────────────────────────────

export function deriveLearningObjectives(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): LearningObjective[] {
  const objectives: LearningObjective[] = []
  const { revenue, health, newCustomers } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)

  if (!revenue.stripeConnected) {
    objectives.push({
      id: 'obj-stripe',
      objective: 'Connect Stripe to unlock revenue intelligence',
      currentState: 'Billing not configured — revenue data unavailable',
      targetState: 'Full MRR tracking, payment recovery, and revenue forecasting active',
      blockedBy: null,
      priority: 'critical',
    })
  }

  if (orgCount === 0) {
    objectives.push({
      id: 'obj-first-customer',
      objective: 'Acquire first customer to validate onboarding flow',
      currentState: 'No organizations on platform — onboarding untested at scale',
      targetState: 'First customer onboarded and reaching first value milestone',
      blockedBy: !revenue.stripeConnected ? 'Stripe must be connected first' : null,
      priority: 'critical',
    })
  }

  if (failedRuns > 0) {
    objectives.push({
      id: 'obj-workforce-reliability',
      objective: 'Resolve AI Workforce failures to improve automation reliability',
      currentState: `${failedRuns} failed run${failedRuns !== 1 ? 's' : ''} reducing automation confidence`,
      targetState: '95%+ success rate across all AI Workforce runs',
      blockedBy: null,
      priority: 'high',
    })
  }

  if (
    health.apiHealth.status === 'not-configured' ||
    health.deployments.status === 'not-configured'
  ) {
    objectives.push({
      id: 'obj-monitoring',
      objective: 'Connect optional monitoring integrations',
      currentState: 'Platform monitoring has blind spots in optional integrations',
      targetState: 'Full observability across API health, background jobs, and deployments',
      blockedBy: null,
      priority: 'medium',
    })
  }

  if (supportData.stats.escalations > 0) {
    objectives.push({
      id: 'obj-reduce-escalations',
      objective: 'Reduce support escalation rate through AI knowledge expansion',
      currentState: `${supportData.stats.escalations} ticket${supportData.stats.escalations !== 1 ? 's' : ''} requiring human escalation`,
      targetState: 'All common ticket categories resolved by AI agents without escalation',
      blockedBy: null,
      priority: 'high',
    })
  }

  if (newCustomers.orgsLast24h > 0 && revenue.trialing > 0) {
    objectives.push({
      id: 'obj-trial-conversion',
      objective: 'Maximize trial-to-paid conversion rate',
      currentState: `${revenue.trialing} trial${revenue.trialing !== 1 ? 's' : ''} in progress — conversion rate not yet measured`,
      targetState: '>60% trial conversion rate with automated nurture sequences',
      blockedBy: null,
      priority: 'high',
    })
  }

  objectives.push({
    id: 'obj-growth-velocity',
    objective: 'Establish repeatable customer acquisition process',
    currentState:
      orgCount === 0
        ? 'No customers — acquisition velocity unknown'
        : `${orgCount} customer${orgCount !== 1 ? 's' : ''} — acquisition velocity not yet predictable`,
    targetState: 'Predictable weekly new customer acquisition from multiple channels',
    blockedBy: orgCount === 0 ? 'Acquire first customer before optimizing acquisition' : null,
    priority: orgCount === 0 ? 'critical' : 'medium',
  })

  return objectives
}

// ─── Internal derivations ─────────────────────────────────────────────────────

function deriveLessonsLearned(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): string[] {
  const lessons: string[] = []
  const { revenue } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length

  if (failedRuns > 0) {
    lessons.push(
      `AI Workforce failures (${failedRuns} failed runs) increase support load — run quality monitoring is critical`
    )
  }
  if (billingTickets > 0) {
    lessons.push(
      'Billing issues escalate quickly to support — proactive payment communication reduces founder workload'
    )
  }
  if (supportData.stats.autoResolved > 0) {
    lessons.push(
      `AI self-resolution is working (${supportData.stats.autoResolved} tickets) — invest in higher-confidence resolutions to reduce escalations`
    )
  }
  if (!revenue.stripeConnected) {
    lessons.push(
      'Stripe must be connected before MRR can be tracked or revenue optimized — delay compounds opportunity cost'
    )
  }
  if (supportData.stats.escalations > 0) {
    lessons.push(
      `Escalations (${supportData.stats.escalations}) indicate AI confidence gaps — review ticket categories for training opportunities`
    )
  }
  if (lessons.length === 0) {
    lessons.push(
      'Platform operating within normal parameters — connect additional integrations to generate richer learning signals'
    )
  }

  return lessons
}

function deriveRecurringProblems(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): string[] {
  const problems: string[] = []
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length

  if (failedRuns > 2) {
    problems.push(
      `Repeated AI Workforce run failures (${failedRuns}) — pattern indicates systemic issue, not isolated event`
    )
  }
  if (executiveData.revenue.pastDue > 0) {
    problems.push(
      `Payment delinquency recurring (${executiveData.revenue.pastDue} past-due) — automated recovery not yet triggered`
    )
  }
  if (billingTickets > 0) {
    problems.push(
      `Billing support tickets recurring (${billingTickets}) — customers experiencing billing friction`
    )
  }
  if (supportData.stats.escalations > 0) {
    problems.push(
      `Support escalations recurring (${supportData.stats.escalations}) — AI agents lack coverage for these ticket types`
    )
  }

  return problems
}

function derivePendingLessons(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): string[] {
  const pending: string[] = []
  const { revenue, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)

  if (!revenue.stripeConnected) {
    pending.push(
      'What happens to conversion rate when Stripe is connected? — will confirm once billing is live'
    )
  }
  if (orgCount === 0) {
    pending.push(
      'How do first customers onboard? — friction points unknown until first org signs up'
    )
  }
  if (supportData.stats.autoResolved === 0 && supportData.stats.totalOpen > 0) {
    pending.push(
      'Why are open tickets not being auto-resolved? — investigate agent confidence thresholds'
    )
  }
  if (workforceData.totalRunsAllWorkforces === 0) {
    pending.push(
      'What is the AI Workforce baseline performance? — will be known after first runs complete'
    )
  }
  if (revenue.stripeConnected && revenue.active === 0) {
    pending.push(
      'What is the trial-to-paid conversion rate? — will be measurable once first trial completes'
    )
  }
  if (pending.length === 0) {
    pending.push(
      'No pending lessons — all major unknowns have data signals. Expand integrations for deeper intelligence.'
    )
  }

  return pending
}

// ─── Public build function ────────────────────────────────────────────────────

export function buildCompanyMemoryData(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): CompanyMemoryData {
  const recentWins = deriveRecentWins(executiveData, supportData, workforceData)
  const recentFailures = deriveRecentFailures(executiveData, supportData, workforceData)
  const supportMemory = deriveSupportMemory(supportData)
  const engineeringMemory = deriveEngineeringMemory(executiveData, workforceData)
  const growthMemory = deriveGrowthMemory(executiveData)
  const revenueMemory = deriveRevenueMemory(executiveData, supportData)
  const automationMemory = deriveAutomationMemory(workforceData)
  const agentMemory = deriveAgentMemory(agentTasks, execJobs)
  const patterns = deriveBusinessPatterns(executiveData, supportData, workforceData)
  const agentLearning = deriveAgentLearning(agentTasks, execJobs)
  const intelligenceScore = deriveCompanyIntelligenceScore(
    executiveData,
    supportData,
    workforceData,
    agentTasks,
    execJobs
  )
  const learningObjectives = deriveLearningObjectives(executiveData, supportData, workforceData)
  const lessonsLearned = deriveLessonsLearned(executiveData, supportData, workforceData)
  const recurringProblems = deriveRecurringProblems(executiveData, supportData, workforceData)
  const pendingLessons = derivePendingLessons(executiveData, supportData, workforceData)

  const executiveMemory: MemoryObject[] = [...recentWins.slice(0, 2), ...recentFailures.slice(0, 2)]

  const topPattern =
    patterns.find((p) => p.impact === 'negative' && p.frequency === 'recurring') ?? null
  const topLearning =
    lessonsLearned[0] ?? 'Connect additional data sources to unlock platform intelligence'

  return {
    executiveMemory,
    recentWins,
    recentFailures,
    supportMemory,
    engineeringMemory,
    growthMemory,
    revenueMemory,
    automationMemory,
    agentMemory,
    patterns,
    agentLearning,
    intelligenceScore,
    learningObjectives,
    lessonsLearned,
    recurringProblems,
    pendingLessons,
    topLearning,
    biggestPattern: topPattern?.title ?? null,
    generatedAt: executiveData.generatedAt,
  }
}

// ─── Async entry point ────────────────────────────────────────────────────────

export async function getCompanyMemoryData(): Promise<CompanyMemoryData> {
  const [executiveData, supportData, workforceData] = await Promise.all([
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])

  const agentTasks = buildAgentTasks(executiveData)
  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, executiveData.generatedAt)

  return buildCompanyMemoryData(executiveData, supportData, workforceData, agentTasks, execJobs)
}
