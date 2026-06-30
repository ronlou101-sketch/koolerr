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

export type PredictionCategory =
  | 'platform'
  | 'revenue'
  | 'growth'
  | 'support'
  | 'engineering'
  | 'marketing'
  | 'billing'
  | 'customer-success'
  | 'automation'
  | 'ai-workforce'
  | 'founder-productivity'
  | 'execution'
  | 'risk'
  | 'knowledge'

export type PredictionPriority = 'critical' | 'high' | 'medium' | 'low'

export type TimeHorizon =
  | 'today'
  | 'this-week'
  | 'next-week'
  | 'this-month'
  | 'next-month'
  | 'next-quarter'

export type TrendDirection =
  | 'accelerating'
  | 'improving'
  | 'stable'
  | 'declining'
  | 'decelerating'
  | 'volatile'

export type CompanyMomentum = 'accelerating' | 'growing' | 'stable' | 'slowing' | 'declining'

export type ForecastedWorkload = 'light' | 'moderate' | 'heavy' | 'overloaded'

export type FounderWorkload = 'light' | 'moderate' | 'heavy' | 'overwhelming'

export type TrendForecast = 'expanding' | 'stable' | 'contracting' | 'insufficient-data'

export interface Prediction {
  id: string
  title: string
  description: string
  category: PredictionCategory
  priority: PredictionPriority
  businessImpact: string
  confidence: number
  timeHorizon: TimeHorizon
  suggestedAgent: string
  dependencies: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresFounderApproval: boolean
  recommendedNextStep: string
  supportingSignals: string[]
}

export interface AgentForecast {
  agentId: string
  agentName: string
  domain: string
  predictedCapacity: number
  forecastedWorkload: ForecastedWorkload
  expectedBottlenecks: string[]
  predictionConfidence: number
  futureDelegationOpportunities: string[]
  trendForecast: TrendForecast
}

export interface ForecastTimelineEvent {
  timeHorizon: TimeHorizon
  label: string
  predictions: Prediction[]
  confidence: number
}

export interface PredictionData {
  executiveForecast: Prediction[]
  revenueForecast: Prediction[]
  growthForecast: Prediction[]
  operationalForecast: Prediction[]
  supportForecast: Prediction[]
  engineeringForecast: Prediction[]
  workforceForecast: Prediction[]
  approvalForecast: Prediction[]
  riskForecast: Prediction[]
  upcomingBottlenecks: Prediction[]
  upcomingOpportunities: Prediction[]
  forecastTimeline: ForecastTimelineEvent[]
  agentForecasts: AgentForecast[]
  businessTrajectory: string
  companyMomentum: CompanyMomentum
  forecastConfidence: number
  emergingRisks: Prediction[]
  emergingOpportunities: Prediction[]
  predictedWeeklyFocus: string
  predictedMonthlyFocus: string
  predictedQuarterOutlook: string
  upcomingDecisions: Prediction[]
  expectedFounderWorkload: FounderWorkload
  decisionForecast: string
  upcomingStrategicPriorities: string[]
  expectedDelegationDemand: string
  executiveReadiness: string
  overallForecastConfidence: number
  confidenceDistribution: { high: number; medium: number; low: number }
  generatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeInt(s: string): number {
  const n = parseInt(s, 10)
  return isNaN(n) ? 0 : n
}

function dedupe(preds: Prediction[]): Prediction[] {
  const seen = new Set<string>()
  return preds.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

function confDistribution(preds: Prediction[]): { high: number; medium: number; low: number } {
  const high = preds.filter((p) => p.confidence >= 75).length
  const medium = preds.filter((p) => p.confidence >= 50 && p.confidence < 75).length
  const low = preds.filter((p) => p.confidence < 50).length
  return { high, medium, low }
}

// ─── Executive Forecast ───────────────────────────────────────────────────────

export function deriveExecutiveForecast(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): Prediction[] {
  const preds: Prediction[] = []
  const { health, revenue, newCustomers, summary } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const userCount = safeInt(health.activeUsers.value)

  if (!revenue.stripeConnected) {
    preds.push({
      id: 'exec-no-revenue-path',
      title: 'Revenue collection will remain blocked without Stripe',
      description:
        'The platform has no payment processor connected. Without action this week, all growth milestones will be delayed indefinitely.',
      category: 'revenue',
      priority: 'critical',
      businessImpact: 'Zero revenue path — all monetization blocked',
      confidence: 97,
      timeHorizon: 'today',
      suggestedAgent: 'CFO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Connect Stripe today — takes less than 30 minutes',
      supportingSignals: ['Stripe not connected', 'No subscription data available'],
    })
  }

  if (orgCount === 0) {
    preds.push({
      id: 'exec-no-customers',
      title: 'No customers = no feedback loop, no growth signal',
      description:
        'With zero organizations, the platform has no signal for product-market fit, churn prediction, or growth forecasting.',
      category: 'growth',
      priority: 'critical',
      businessImpact: 'All growth and retention forecasts are blocked until first customer',
      confidence: 95,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: revenue.stripeConnected ? [] : ['Stripe connection'],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Activate CMO Agent to begin outreach — prioritize warm leads',
      supportingSignals: [`${orgCount} organizations`, `${userCount} users`],
    })
  }

  if (newCustomers.orgsLast24h === 0 && orgCount > 0) {
    preds.push({
      id: 'exec-growth-stall-forecast',
      title: 'Growth stall likely to continue without active top-of-funnel',
      description:
        'No new organizations in the last 24 hours. If this pattern continues, MRR will plateau and churn will eventually exceed acquisition.',
      category: 'growth',
      priority: 'high',
      businessImpact: 'MRR growth stalls — churn eventually dominates',
      confidence: 72,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Activate growth campaigns and re-engage warm pipeline',
      supportingSignals: ['0 orgs in last 24h', `${orgCount} total orgs`],
    })
  }

  if (summary.statusLevel === 'critical') {
    preds.push({
      id: 'exec-critical-state-persistence',
      title: 'Platform critical state will compound if not resolved today',
      description:
        'The platform is in a critical health state. Unresolved critical issues tend to compound — each hour increases risk of cascading failures.',
      category: 'platform',
      priority: 'critical',
      businessImpact: 'Customer trust and platform reliability at risk',
      confidence: 88,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Review and resolve all critical platform health signals immediately',
      supportingSignals: [summary.headline],
    })
  }

  const criticalWorkforces = workforceData.workforces.filter((w) => w.health === 'critical').length
  if (criticalWorkforces > 0) {
    preds.push({
      id: 'exec-workforce-degradation',
      title: `${criticalWorkforces} AI workforce${criticalWorkforces !== 1 ? 's' : ''} predicted to remain degraded`,
      description:
        'Critical workforce health without intervention will persist and affect all downstream customer deliverables.',
      category: 'ai-workforce',
      priority: 'high',
      businessImpact: 'AI deliverable quality and throughput at risk',
      confidence: 82,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Investigate and restore failed workforce runs',
      supportingSignals: [`${criticalWorkforces} workforces in critical state`],
    })
  }

  if (supportData.stats.awaitingFounder > 2) {
    preds.push({
      id: 'exec-approval-backlog-growth',
      title: 'Approval backlog predicted to grow without founder action',
      description:
        'Current approval queue is building. If not cleared, agents will begin queuing further tasks, creating compounding delays.',
      category: 'execution',
      priority: 'high',
      businessImpact: 'Agent throughput throttled — all downstream execution delayed',
      confidence: 80,
      timeHorizon: 'today',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: true,
      recommendedNextStep: 'Clear approval queue to unblock agent operations',
      supportingSignals: [`${supportData.stats.awaitingFounder} items awaiting founder approval`],
    })
  }

  return preds
}

// ─── Revenue Forecast ─────────────────────────────────────────────────────────

export function deriveRevenueForecast(executiveData: ExecutiveData): Prediction[] {
  const preds: Prediction[] = []
  const { revenue, newCustomers } = executiveData
  const orgCount = safeInt(executiveData.health.activeOrganizations.value)

  if (!revenue.stripeConnected) {
    preds.push({
      id: 'rev-forecast-blocked',
      title: 'MRR will remain $0 until Stripe is connected',
      description:
        'No payment processor means no subscription revenue. Every day without Stripe is a day of uncollected value.',
      category: 'revenue',
      priority: 'critical',
      businessImpact: 'All revenue blocked — MRR trajectory cannot begin',
      confidence: 98,
      timeHorizon: 'today',
      suggestedAgent: 'CFO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Connect Stripe — this single action unblocks all revenue forecasting',
      supportingSignals: ['Stripe not connected', 'Revenue: $0'],
    })
  }

  if (revenue.stripeConnected && revenue.trialing > 0) {
    const conversionEstimate = Math.round(revenue.trialing * 0.3)
    preds.push({
      id: 'rev-trial-conversion-window',
      title: `${revenue.trialing} trials will reach decision point this week`,
      description: `Trial windows typically last 14 days. Without a conversion sequence, expect ${revenue.trialing - conversionEstimate} of ${revenue.trialing} trials to churn.`,
      category: 'revenue',
      priority: 'high',
      businessImpact: `~${conversionEstimate} potential paid conversion${conversionEstimate !== 1 ? 's' : ''} at stake`,
      confidence: 78,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: ['Stripe connected'],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Activate trial-to-paid email sequence immediately',
      supportingSignals: [`${revenue.trialing} active trials`],
    })
  }

  if (revenue.stripeConnected && revenue.pastDue > 0) {
    preds.push({
      id: 'rev-churn-risk-forecast',
      title: `${revenue.pastDue} delinquent subscription${revenue.pastDue !== 1 ? 's' : ''} will churn if not recovered this week`,
      description:
        'Past-due subscriptions without dunning sequences cancel within 7–14 days. Recovery rate drops 20% per additional week.',
      category: 'billing',
      priority: 'critical',
      businessImpact: 'Direct ARR loss — permanent without recovery action',
      confidence: 85,
      timeHorizon: 'this-week',
      suggestedAgent: 'CFO Agent',
      dependencies: ['Stripe connected'],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Enable Stripe Smart Retries and configure dunning emails',
      supportingSignals: [`${revenue.pastDue} past-due subscriptions`],
    })
  }

  if (revenue.stripeConnected && orgCount > 0 && newCustomers.orgsLast24h === 0) {
    preds.push({
      id: 'rev-mrr-flat-forecast',
      title: 'MRR predicted flat or declining without new acquisition',
      description:
        'No new organizations in 24 hours with no active acquisition campaigns. Natural churn will erode MRR over the coming weeks.',
      category: 'revenue',
      priority: 'medium',
      businessImpact: 'MRR growth stalls — churn will erode baseline if not offset',
      confidence: 68,
      timeHorizon: 'this-month',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Reactivate top-of-funnel campaigns and referral program',
      supportingSignals: ['0 new orgs in 24h', `${orgCount} total orgs`],
    })
  }

  if (
    revenue.stripeConnected &&
    revenue.active > 0 &&
    revenue.pastDue === 0 &&
    revenue.trialing === 0
  ) {
    preds.push({
      id: 'rev-stable-base-forecast',
      title: 'Revenue base is stable — expansion is the next growth lever',
      description:
        'Active subscriptions with no past-due or trial churn risk. The next revenue gain will come from expansion, upsell, or new acquisition.',
      category: 'revenue',
      priority: 'medium',
      businessImpact: 'Foundation is solid — expansion strategy unlocks next growth tier',
      confidence: 75,
      timeHorizon: 'this-month',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Design upsell and expansion playbook for existing customers',
      supportingSignals: [`${revenue.active} active subscriptions`, '0 past-due'],
    })
  }

  return preds
}

// ─── Growth Forecast ──────────────────────────────────────────────────────────

export function deriveGrowthForecast(executiveData: ExecutiveData): Prediction[] {
  const preds: Prediction[] = []
  const { newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const userCount = safeInt(health.activeUsers.value)

  if (orgCount === 0) {
    preds.push({
      id: 'growth-no-customer-base',
      title: 'Growth will remain zero until first customer is acquired',
      description:
        'All growth metrics — NPS, retention, expansion, referral — require at least one customer. Every week without acquisition extends the runway risk.',
      category: 'growth',
      priority: 'critical',
      businessImpact: 'No product-market fit signal — runway shortens with every passing week',
      confidence: 96,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Focus all outreach on converting one warm lead this week',
      supportingSignals: [`${orgCount} organizations`, `${userCount} users`],
    })
  }

  if (newCustomers.orgsLast24h > 0) {
    preds.push({
      id: 'growth-momentum-signal',
      title: 'Growth signal detected — momentum is building',
      description: `${newCustomers.orgsLast24h} new organization${newCustomers.orgsLast24h !== 1 ? 's' : ''} in 24 hours. If this rate holds, the growth engine is activating.`,
      category: 'growth',
      priority: 'medium',
      businessImpact: 'Compounding growth — sustaining this rate doubles customer base weekly',
      confidence: 65,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: "Identify what drove today's signups and double down immediately",
      supportingSignals: [`${newCustomers.orgsLast24h} new orgs in 24h`],
    })
  }

  if (orgCount > 0 && userCount > 0) {
    const usersPerOrg = Math.round(userCount / orgCount)
    if (usersPerOrg >= 3) {
      preds.push({
        id: 'growth-expansion-signal',
        title: 'Seat expansion pattern detected — existing accounts are growing',
        description: `Average of ${usersPerOrg} users per organization suggests seat expansion is occurring. This is a strong retention and upsell signal.`,
        category: 'customer-success',
        priority: 'medium',
        businessImpact:
          'Seat expansion typically indicates high retention — invest in expansion playbook',
        confidence: 68,
        timeHorizon: 'this-month',
        suggestedAgent: 'Customer Success Agent',
        dependencies: [],
        riskLevel: 'low',
        requiresFounderApproval: false,
        recommendedNextStep: 'Build expansion playbook targeting accounts with 2+ users',
        supportingSignals: [
          `${usersPerOrg} avg users/org`,
          `${orgCount} orgs`,
          `${userCount} users`,
        ],
      })
    }
  }

  preds.push({
    id: 'growth-content-gap',
    title: 'No content engine means organic growth is capped',
    description:
      'Without a content and SEO strategy, all acquisition is paid or direct. Organic channels typically generate 40–60% of SaaS leads at lower CAC.',
    category: 'marketing',
    priority: 'medium',
    businessImpact: 'CAC stays high without organic — limits scalable growth',
    confidence: 72,
    timeHorizon: 'next-month',
    suggestedAgent: 'Content Director Agent',
    dependencies: [],
    riskLevel: 'medium',
    requiresFounderApproval: false,
    recommendedNextStep: 'Activate Content Director to begin SEO and thought leadership strategy',
    supportingSignals: ['No content strategy detected', 'Organic signals absent'],
  })

  return preds
}

// ─── Support Forecast ─────────────────────────────────────────────────────────

export function deriveSupportForecast(supportData: SupportData): Prediction[] {
  const preds: Prediction[] = []
  const { stats, tickets } = supportData

  if (stats.totalOpen > 5) {
    preds.push({
      id: 'support-volume-surge',
      title: 'Support volume trending toward agent capacity limit',
      description: `${stats.totalOpen} open tickets. If volume continues at current pace, the Support Manager Agent will hit capacity within the current period.`,
      category: 'support',
      priority: 'high',
      businessImpact: 'Agent overload leads to delayed resolutions and increased escalations',
      confidence: 74,
      timeHorizon: 'this-week',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Review open ticket load and increase automation thresholds',
      supportingSignals: [
        `${stats.totalOpen} open tickets`,
        `${stats.openedLast8h} opened in last 8h`,
      ],
    })
  }

  if (stats.escalations > 0) {
    preds.push({
      id: 'support-escalation-growth',
      title: 'Escalation pattern suggests knowledge gap or policy ambiguity',
      description: `${stats.escalations} escalation${stats.escalations !== 1 ? 's' : ''} indicate that the AI is encountering cases outside its confidence boundary. Without expanding agent authority, escalations will grow.`,
      category: 'support',
      priority: 'high',
      businessImpact:
        'Each unresolved escalation increases founder workload and decreases response speed',
      confidence: 78,
      timeHorizon: 'this-week',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Review escalated tickets for common patterns and expand agent authority',
      supportingSignals: [
        `${stats.escalations} escalations`,
        `${stats.awaitingFounder} awaiting founder`,
      ],
    })
  }

  if (stats.awaitingFounder > 1) {
    preds.push({
      id: 'support-approval-queue-growth',
      title: 'Support approval queue will grow as platform scales',
      description: `Currently ${stats.awaitingFounder} items awaiting founder approval. Without delegation policy changes, this queue grows linearly with ticket volume.`,
      category: 'founder-productivity',
      priority: 'medium',
      businessImpact: 'Founder bottleneck in support loop — each approval costs strategic time',
      confidence: 82,
      timeHorizon: 'this-week',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: true,
      recommendedNextStep: 'Define auto-approval thresholds for routine support decisions',
      supportingSignals: [
        `${stats.awaitingFounder} awaiting approval`,
        `${stats.escalations} escalations`,
      ],
    })
  }

  if (stats.aiResolutionPct !== null && stats.aiResolutionPct < 50) {
    preds.push({
      id: 'support-low-ai-resolution',
      title: 'AI resolution rate below 50% — manual load will increase',
      description: `AI is resolving ${stats.aiResolutionPct}% of tickets. As volume grows, the gap between what AI handles and what humans need to review will compound.`,
      category: 'automation',
      priority: 'high',
      businessImpact: 'Support costs rise linearly with volume instead of remaining fixed',
      confidence: 80,
      timeHorizon: 'this-month',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Expand training signals and increase confidence threshold for AI resolution',
      supportingSignals: [
        `${stats.aiResolutionPct}% AI resolution rate`,
        `${stats.autoResolved} auto-resolved`,
      ],
    })
  }

  const criticalOpenCount = tickets.filter(
    (t) => t.priority === 'critical' && t.status !== 'ai-resolved' && t.status !== 'closed'
  ).length

  if (criticalOpenCount > 0) {
    preds.push({
      id: 'support-critical-churn-risk',
      title: `${criticalOpenCount} critical ticket${criticalOpenCount !== 1 ? 's' : ''} at risk of causing customer churn`,
      description:
        'Unresolved critical support issues are the highest predictor of customer churn. Each hour increases defection probability.',
      category: 'customer-success',
      priority: 'critical',
      businessImpact:
        'Direct churn risk — each critical ticket costs an estimated 30–90 days of LTV',
      confidence: 87,
      timeHorizon: 'today',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Escalate all critical tickets for immediate resolution',
      supportingSignals: [`${criticalOpenCount} critical tickets open`],
    })
  }

  if (stats.totalOpen === 0 && stats.autoResolved === 0) {
    preds.push({
      id: 'support-pre-customer-capacity',
      title: 'Support capacity is high — ready for first customer',
      description:
        'No open tickets means the support system is fully available. When first customers arrive, resolution speed will be a key first impression.',
      category: 'support',
      priority: 'low',
      businessImpact: 'High capacity = fast first-impression resolution = strong retention signal',
      confidence: 90,
      timeHorizon: 'this-week',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Prepare support playbooks before first customer arrives',
      supportingSignals: ['0 open tickets', '0 auto-resolved'],
    })
  }

  return preds
}

// ─── Engineering Forecast ─────────────────────────────────────────────────────

export function deriveEngineeringForecast(
  executiveData: ExecutiveData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[]
): Prediction[] {
  const preds: Prediction[] = []
  const { health } = executiveData

  const ctoTasks = agentTasks.filter((t) => t.agentId === 'cto')
  const criticalCtoTasks = ctoTasks.filter((t) => t.priority === 'critical')

  if (health.database.status === 'critical') {
    preds.push({
      id: 'eng-db-failure-compounding',
      title: 'Database failure will compound — customer operations blocked',
      description:
        'A database in critical state will cause all read/write operations to fail. If unresolved, AI workflows, billing, and customer access are all affected.',
      category: 'platform',
      priority: 'critical',
      businessImpact: 'Total platform outage risk — all customer operations blocked',
      confidence: 95,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Restore database connection immediately',
      supportingSignals: ['Database health: critical'],
    })
  }

  if (health.apiHealth.status === 'critical') {
    preds.push({
      id: 'eng-api-degradation',
      title: 'API critical status will degrade all platform integrations',
      description:
        'API failures affect AI agent operations, billing, and all external integrations. Compound failure risk increases every hour.',
      category: 'engineering',
      priority: 'critical',
      businessImpact: 'Integrations offline — AI agents cannot execute external actions',
      confidence: 90,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Diagnose API health and restore service',
      supportingSignals: ['API health: critical'],
    })
  }

  const failedWorkforces = workforceData.workforces.filter((w) => w.health === 'critical')
  if (failedWorkforces.length > 0) {
    preds.push({
      id: 'eng-workforce-failure-spread',
      title: `${failedWorkforces.length} AI workforce failure${failedWorkforces.length !== 1 ? 's' : ''} will spread if root cause not addressed`,
      description:
        'Critical workforce health often stems from shared infrastructure failures. If the root cause is systemic, additional workforces will be affected.',
      category: 'ai-workforce',
      priority: 'high',
      businessImpact: 'AI delivery capability degrading — customer deliverables at risk',
      confidence: 76,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Check shared infrastructure (DB, API, Model Gateway) for root cause',
      supportingSignals: failedWorkforces.map(
        (w) => `${w.workforceName}: ${w.lastError ?? 'critical'}`
      ),
    })
  }

  if (criticalCtoTasks.length > 0) {
    preds.push({
      id: 'eng-technical-debt-accumulation',
      title: `${criticalCtoTasks.length} critical engineering task${criticalCtoTasks.length !== 1 ? 's' : ''} will compound if deferred`,
      description:
        'Critical CTO tasks compound — each deferral creates downstream dependencies that take 2–5x longer to resolve later.',
      category: 'engineering',
      priority: 'high',
      businessImpact: 'Technical debt compounds — each week of deferral increases resolution cost',
      confidence: 80,
      timeHorizon: 'this-week',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Address critical CTO tasks before adding new infrastructure',
      supportingSignals: criticalCtoTasks.map((t) => t.description).slice(0, 3),
    })
  }

  preds.push({
    id: 'eng-monitoring-gap',
    title: 'Absence of monitoring means issues will be detected late',
    description:
      'Without observability and alerting, engineering failures are discovered by customers before the team. MTTD (mean time to detect) stays high.',
    category: 'engineering',
    priority: 'medium',
    businessImpact: 'Customer-reported bugs erode trust faster than proactively detected ones',
    confidence: 70,
    timeHorizon: 'next-month',
    suggestedAgent: 'CTO Agent',
    dependencies: [],
    riskLevel: 'medium',
    requiresFounderApproval: false,
    recommendedNextStep: 'Set up uptime monitoring, error tracking, and alerting this sprint',
    supportingSignals: ['No monitoring configuration detected'],
  })

  return preds
}

// ─── Workforce Forecast ───────────────────────────────────────────────────────

export function deriveWorkforceForecast(
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): Prediction[] {
  const preds: Prediction[] = []
  const { workforces, totalRunsAllWorkforces } = workforceData

  const healthyCount = workforces.filter((w) => w.health === 'healthy').length
  const criticalCount = workforces.filter((w) => w.health === 'critical').length
  const warningCount = workforces.filter((w) => w.health === 'warning').length
  const notConfiguredCount = workforces.filter((w) => w.health === 'not-configured').length

  const waitingApprovalJobs = execJobs.filter((j) => j.stage === 'waiting_approval')
  const pendingApprovalTasks = agentTasks.filter((t) => t.requiresApproval)

  if (criticalCount > 1) {
    preds.push({
      id: 'wf-multiple-critical',
      title: 'Multiple critical workforces signal systemic infrastructure issue',
      description:
        'When more than one workforce enters critical state simultaneously, the root cause is usually shared infrastructure, not individual workflow failures.',
      category: 'platform',
      priority: 'critical',
      businessImpact: 'All AI delivery streams at risk — customer deliverables will fail',
      confidence: 85,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Audit Model Gateway, database, and shared services for systemic failures',
      supportingSignals: [
        `${criticalCount} critical workforces`,
        `${warningCount} warning workforces`,
      ],
    })
  }

  if (notConfiguredCount > 0 && totalRunsAllWorkforces === 0) {
    preds.push({
      id: 'wf-no-runs-forecast',
      title: 'AI workforce will have zero output until first run is triggered',
      description:
        'No workforce has run yet. The AI delivery system is deployed but idle. Each day without runs delays the feedback loop for improvement.',
      category: 'ai-workforce',
      priority: 'medium',
      businessImpact: 'Zero AI output = no value delivered = no learning signal',
      confidence: 88,
      timeHorizon: 'today',
      suggestedAgent: 'Customer Success Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Trigger first workforce run to begin the learning cycle',
      supportingSignals: [`${notConfiguredCount} unconfigured workforces`, '0 total runs'],
    })
  }

  if (waitingApprovalJobs.length > 3) {
    preds.push({
      id: 'wf-approval-choke-predicted',
      title: `Execution chokepoint predicted — ${waitingApprovalJobs.length} jobs awaiting approval`,
      description:
        'The approval queue is building. If not cleared, newly generated jobs will stack behind existing approvals and agent throughput will drop.',
      category: 'execution',
      priority: 'high',
      businessImpact: 'Agent throughput drops — all queued work stacks behind founder bottleneck',
      confidence: 84,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: true,
      recommendedNextStep: 'Review and process the approval queue',
      supportingSignals: [
        `${waitingApprovalJobs.length} jobs waiting approval`,
        `${pendingApprovalTasks.length} tasks pending approval`,
      ],
    })
  }

  if (healthyCount > 0 && criticalCount === 0 && warningCount === 0) {
    preds.push({
      id: 'wf-healthy-trajectory',
      title: 'AI workforce is healthy — scale is the next bottleneck',
      description:
        'All active workforces are healthy. As customer volume grows, workforce capacity will become the constraint. Plan scaling before it is needed.',
      category: 'ai-workforce',
      priority: 'low',
      businessImpact: 'Current capacity supports growth — plan for 10x before it is needed',
      confidence: 72,
      timeHorizon: 'next-month',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Document workforce capacity thresholds for scaling planning',
      supportingSignals: [`${healthyCount} healthy workforces`],
    })
  }

  return preds
}

// ─── Approval Forecast ────────────────────────────────────────────────────────

export function deriveApprovalForecast(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): Prediction[] {
  const preds: Prediction[] = []
  const pendingTasks = agentTasks.filter((t) => t.requiresApproval)
  const waitingJobs = execJobs.filter((j) => j.stage === 'waiting_approval')
  const criticalWaiting = execJobs.filter(
    (j) => j.stage === 'waiting_approval' && j.priority === 'critical'
  )

  const totalPending = pendingTasks.length + waitingJobs.length

  if (totalPending > 5) {
    preds.push({
      id: 'approval-queue-critical-mass',
      title: `Approval queue at critical mass — ${totalPending} items blocked`,
      description:
        'When the approval queue exceeds ~5 items, founders shift from strategic work to queue management. This pattern will worsen as agent activity increases.',
      category: 'founder-productivity',
      priority: 'high',
      businessImpact: 'Founder time shifting from strategy to queue management',
      confidence: 85,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: true,
      recommendedNextStep:
        'Set auto-approval thresholds for low-risk, high-confidence agent actions',
      supportingSignals: [
        `${pendingTasks.length} pending agent tasks`,
        `${waitingJobs.length} waiting execution jobs`,
      ],
    })
  }

  if (criticalWaiting.length > 0) {
    preds.push({
      id: 'approval-critical-blocking',
      title: `${criticalWaiting.length} critical item${criticalWaiting.length !== 1 ? 's' : ''} will block execution until approved`,
      description:
        'Critical-priority jobs in the waiting_approval stage are time-sensitive. Every hour of delay increases downstream execution lag.',
      category: 'execution',
      priority: 'critical',
      businessImpact: 'Critical business actions are blocked — compounding delay',
      confidence: 90,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Review and approve critical-priority items immediately',
      supportingSignals: [`${criticalWaiting.length} critical jobs waiting approval`],
    })
  }

  if (totalPending === 0) {
    preds.push({
      id: 'approval-queue-clear',
      title: 'Approval queue is clear — agents will queue new items as they detect signals',
      description:
        'No approvals currently pending. Next round of agent analysis will generate new recommendations based on platform signals.',
      category: 'execution',
      priority: 'low',
      businessImpact: 'Agents operating at full throughput',
      confidence: 88,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Review agent registry to confirm all agents are active',
      supportingSignals: ['0 pending approvals', '0 waiting jobs'],
    })
  }

  preds.push({
    id: 'approval-growth-forecast',
    title: 'Approval load will grow linearly with platform scale',
    description:
      'As more customers sign up and generate activity, agent task generation will increase proportionally. Without auto-approval policies, founder approval time grows unbounded.',
    category: 'founder-productivity',
    priority: 'medium',
    businessImpact: 'Founder bottleneck will emerge at scale — plan delegation before it is needed',
    confidence: 76,
    timeHorizon: 'next-quarter',
    suggestedAgent: 'CTO Agent',
    dependencies: [],
    riskLevel: 'medium',
    requiresFounderApproval: true,
    recommendedNextStep: 'Design tiered approval policy: auto-approve below confidence threshold',
    supportingSignals: [`${totalPending} current pending items`],
  })

  return preds
}

// ─── Risk Forecast ────────────────────────────────────────────────────────────

export function deriveRiskForecast(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): Prediction[] {
  const preds: Prediction[] = []
  const { health, revenue } = executiveData
  const criticalWorkforces = workforceData.workforces.filter((w) => w.health === 'critical').length

  if (health.database.status !== 'healthy' && health.database.status !== 'not-configured') {
    preds.push({
      id: 'risk-data-integrity',
      title: 'Database instability poses data integrity risk',
      description:
        'Non-healthy database states increase the probability of incomplete writes, orphaned records, and inconsistent state under load.',
      category: 'risk',
      priority: 'high',
      businessImpact: 'Data integrity violations are extremely costly to remediate after the fact',
      confidence: 82,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Restore database health and verify data consistency',
      supportingSignals: [`Database health: ${health.database.status}`],
    })
  }

  if (revenue.stripeConnected && revenue.pastDue > 0 && revenue.active > 0) {
    const churnPct = Math.round((revenue.pastDue / revenue.active) * 100)
    if (churnPct > 20) {
      preds.push({
        id: 'risk-revenue-concentration',
        title: `${churnPct}% of active subscriptions at churn risk`,
        description:
          'A high ratio of past-due to active subscriptions signals payment failure — which may be a sign of dissatisfaction or financial stress in the customer base.',
        category: 'risk',
        priority: 'critical',
        businessImpact: 'Revenue cliff risk — rapid MRR decline if delinquency worsens',
        confidence: 80,
        timeHorizon: 'this-week',
        suggestedAgent: 'CFO Agent',
        dependencies: [],
        riskLevel: 'critical',
        requiresFounderApproval: true,
        recommendedNextStep:
          'Investigate root cause of payment failures — product vs payment issue',
        supportingSignals: [
          `${revenue.pastDue} past-due`,
          `${revenue.active} active`,
          `${churnPct}% at risk`,
        ],
      })
    }
  }

  if (criticalWorkforces > 0 && supportData.stats.totalOpen > 0) {
    preds.push({
      id: 'risk-compounding-failure',
      title: 'Critical workforce + open support tickets = compounding failure risk',
      description:
        'When AI workforces fail while support tickets are open, the system cannot auto-resolve. This creates a feedback loop of degraded response and increasing customer frustration.',
      category: 'risk',
      priority: 'critical',
      businessImpact: 'Simultaneous failure modes compound — customer churn risk multiplies',
      confidence: 83,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Restore workforce health before addressing open tickets',
      supportingSignals: [
        `${criticalWorkforces} critical workforces`,
        `${supportData.stats.totalOpen} open tickets`,
      ],
    })
  }

  const auditStatus = health.auditLog?.status ?? 'not-configured'
  if (auditStatus !== 'healthy') {
    preds.push({
      id: 'risk-audit-gap',
      title: 'Audit logging gap creates compliance and forensics risk',
      description:
        'Without complete audit coverage, you cannot reconstruct what happened if a security or compliance incident occurs. This gap will grow as the platform scales.',
      category: 'risk',
      priority: 'medium',
      businessImpact: 'Compliance violations and inability to investigate security events',
      confidence: 75,
      timeHorizon: 'this-month',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Audit current logging coverage and close the most critical gaps',
      supportingSignals: [`Audit logging health: ${auditStatus}`],
    })
  }

  return preds
}

// ─── Operational Forecast ─────────────────────────────────────────────────────

export function deriveOperationalForecast(
  executiveData: ExecutiveData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[]
): Prediction[] {
  const preds: Prediction[] = []
  const { health, recentActivity } = executiveData
  const totalAgentTasks = agentTasks.length
  const criticalTasks = agentTasks.filter((t) => t.priority === 'critical').length

  if (recentActivity.total24h === 0) {
    preds.push({
      id: 'ops-no-activity-forecast',
      title: 'Zero platform activity predicts continued dormancy',
      description:
        'No AI runs, no billing events, no user actions in 24 hours. Platform is idle. Unless triggered, this state will persist.',
      category: 'execution',
      priority: 'medium',
      businessImpact: 'No platform activity = no value delivered = no learning signal',
      confidence: 88,
      timeHorizon: 'today',
      suggestedAgent: 'Customer Success Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Trigger a workforce run or test the onboarding flow',
      supportingSignals: ['0 platform events in 24h'],
    })
  }

  if (criticalTasks > 2) {
    preds.push({
      id: 'ops-agent-overload-forecast',
      title: `${criticalTasks} critical agent tasks predict agent overload this week`,
      description:
        'Multiple critical tasks across agents creates contention for founder attention. Agents will slow throughput while waiting for resolutions.',
      category: 'ai-workforce',
      priority: 'high',
      businessImpact: 'Agent throughput drops while critical items remain unresolved',
      confidence: 78,
      timeHorizon: 'this-week',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Triage and sequence critical tasks by business impact',
      supportingSignals: [
        `${criticalTasks} critical agent tasks`,
        `${totalAgentTasks} total tasks`,
      ],
    })
  }

  const warningWorkforces = workforceData.workforces.filter((w) => w.health === 'warning')
  if (warningWorkforces.length > 0) {
    preds.push({
      id: 'ops-warning-to-critical',
      title: `${warningWorkforces.length} workforce${warningWorkforces.length !== 1 ? 's' : ''} in warning state — predicted to enter critical without intervention`,
      description:
        'Warning health states precede critical failures in 60–70% of cases. Early intervention prevents escalation and customer impact.',
      category: 'ai-workforce',
      priority: 'medium',
      businessImpact:
        'Preventable critical failure — intervene now at low cost vs later at high cost',
      confidence: 65,
      timeHorizon: 'this-week',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Investigate warning workforces and address underlying issues',
      supportingSignals: warningWorkforces.map((w) => `${w.workforceName}: warning`),
    })
  }

  if (health.deployments?.status === 'not-configured') {
    preds.push({
      id: 'ops-deployment-visibility',
      title: 'No deployment monitoring = invisible release risk',
      description:
        'Without deployment health tracking, releases that introduce regressions will not be detected until customers report them.',
      category: 'engineering',
      priority: 'medium',
      businessImpact: 'Silent regression risk grows with each release',
      confidence: 72,
      timeHorizon: 'next-month',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Connect deployment monitoring to Vercel or CI/CD pipeline',
      supportingSignals: ['Deployment health: not-configured'],
    })
  }

  return preds
}

// ─── Upcoming Bottlenecks ─────────────────────────────────────────────────────

export function deriveUpcomingBottlenecks(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): Prediction[] {
  const preds: Prediction[] = []
  const { health, revenue } = executiveData
  const waitingApproval = execJobs.filter((j) => j.stage === 'waiting_approval').length
  const pendingApprovals = agentTasks.filter((t) => t.requiresApproval).length
  const criticalWorkforces = workforceData.workforces.filter((w) => w.health === 'critical').length
  const orgCount = safeInt(health.activeOrganizations.value)

  if (waitingApproval + pendingApprovals > 4) {
    preds.push({
      id: 'bottleneck-approval-queue',
      title: 'Approval queue is the primary bottleneck',
      description: `${waitingApproval + pendingApprovals} items pending approval. This single chokepoint is limiting all agent operations and execution throughput.`,
      category: 'founder-productivity',
      priority: 'critical',
      businessImpact: 'Every other improvement is downstream of this — clear the queue first',
      confidence: 90,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: true,
      recommendedNextStep: 'Process all pending approvals, then design auto-approval policy',
      supportingSignals: [
        `${waitingApproval} waiting execution jobs`,
        `${pendingApprovals} pending agent tasks`,
      ],
    })
  }

  if (!revenue.stripeConnected) {
    preds.push({
      id: 'bottleneck-payment',
      title: 'Payment processing is blocking all revenue',
      description:
        'Stripe not connected is the top-of-funnel bottleneck. No other revenue optimization is possible until this is resolved.',
      category: 'revenue',
      priority: 'critical',
      businessImpact: 'Zero revenue — the entire monetization pipeline is blocked',
      confidence: 98,
      timeHorizon: 'today',
      suggestedAgent: 'CFO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: true,
      recommendedNextStep: 'Connect Stripe — highest-ROI action available right now',
      supportingSignals: ['Stripe: not connected'],
    })
  }

  if (orgCount === 0) {
    preds.push({
      id: 'bottleneck-no-customers',
      title: 'Zero customers is the growth bottleneck',
      description:
        'Every other bottleneck is secondary to this. No customers means no signal, no retention, no expansion, no feedback.',
      category: 'growth',
      priority: 'critical',
      businessImpact: 'All downstream growth metrics are blocked until first customer',
      confidence: 96,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'critical',
      requiresFounderApproval: false,
      recommendedNextStep: 'Prioritize one warm lead conversion above everything else this week',
      supportingSignals: ['0 organizations on platform'],
    })
  }

  if (criticalWorkforces > 0) {
    preds.push({
      id: 'bottleneck-ai-delivery',
      title: 'AI delivery is the execution bottleneck',
      description:
        'Critical workforce health means the AI delivery engine is degraded. All agent output quality and volume is affected.',
      category: 'ai-workforce',
      priority: 'high',
      businessImpact: 'AI throughput reduced — all delivery promises at risk',
      confidence: 85,
      timeHorizon: 'today',
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      riskLevel: 'high',
      requiresFounderApproval: false,
      recommendedNextStep: 'Restore workforce health before accepting new customer commitments',
      supportingSignals: [`${criticalWorkforces} critical workforces`],
    })
  }

  if (supportData.stats.escalations > 2) {
    preds.push({
      id: 'bottleneck-support-escalation',
      title: 'Support escalation path is a bottleneck',
      description:
        'High escalation rates mean agent authority is too narrow. The human escalation path creates a queue that grows with volume.',
      category: 'support',
      priority: 'medium',
      businessImpact: 'Support throughput capped by human escalation capacity',
      confidence: 75,
      timeHorizon: 'this-week',
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      riskLevel: 'medium',
      requiresFounderApproval: false,
      recommendedNextStep: 'Expand Support Manager authority to reduce escalation rate',
      supportingSignals: [`${supportData.stats.escalations} escalations`],
    })
  }

  return dedupe(preds)
}

// ─── Upcoming Opportunities ───────────────────────────────────────────────────

export function deriveUpcomingOpportunities(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): Prediction[] {
  const preds: Prediction[] = []
  const { revenue, newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const userCount = safeInt(health.activeUsers.value)

  if (revenue.stripeConnected && revenue.trialing > 0) {
    preds.push({
      id: 'opp-trial-conversion',
      title: `${revenue.trialing} trial${revenue.trialing !== 1 ? 's' : ''} are your highest-ROI opportunity right now`,
      description:
        'Trial customers have already passed the acquisition hurdle. Converting them costs less than acquiring new leads.',
      category: 'revenue',
      priority: 'high',
      businessImpact: 'Direct MRR expansion with no additional acquisition cost',
      confidence: 82,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Send personalized conversion sequence to all active trials today',
      supportingSignals: [`${revenue.trialing} active trials`],
    })
  }

  if (newCustomers.orgsLast24h > 0) {
    preds.push({
      id: 'opp-growth-momentum',
      title: 'Active growth momentum — now is the time to double down',
      description:
        'New customers are arriving. This is the optimal moment to increase marketing spend, activate referral programs, and expand content production.',
      category: 'growth',
      priority: 'high',
      businessImpact:
        'Compounding growth when momentum is already present costs less than starting from zero',
      confidence: 70,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Identify the acquisition source for recent signups and invest more there',
      supportingSignals: [`${newCustomers.orgsLast24h} new orgs today`],
    })
  }

  if (orgCount > 0 && userCount > orgCount) {
    preds.push({
      id: 'opp-expansion-revenue',
      title: 'Multi-user accounts are an expansion revenue opportunity',
      description:
        'Accounts with multiple users have already expanded. Seat-based pricing or usage tiers can capture value from high-activity accounts.',
      category: 'billing',
      priority: 'medium',
      businessImpact: 'Expansion MRR from existing customers — no acquisition cost',
      confidence: 68,
      timeHorizon: 'this-month',
      suggestedAgent: 'CFO Agent',
      dependencies: ['Stripe connected'],
      riskLevel: 'low',
      requiresFounderApproval: true,
      recommendedNextStep: 'Model expansion pricing tiers based on current usage patterns',
      supportingSignals: [`${userCount} users across ${orgCount} orgs`],
    })
  }

  const healthyWorkforces = workforceData.workforces.filter((w) => w.health === 'healthy')
  if (healthyWorkforces.length > 0) {
    preds.push({
      id: 'opp-ai-capacity',
      title: `${healthyWorkforces.length} healthy AI workforce${healthyWorkforces.length !== 1 ? 's' : ''} ready for increased load`,
      description:
        'Healthy workforces represent unused capacity. Adding more customers or triggering more runs will generate immediate value with existing infrastructure.',
      category: 'ai-workforce',
      priority: 'medium',
      businessImpact:
        'Existing infrastructure can support more customers at near-zero marginal cost',
      confidence: 78,
      timeHorizon: 'this-week',
      suggestedAgent: 'Customer Success Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep: 'Increase customer acquisition to fill available AI capacity',
      supportingSignals: healthyWorkforces.map((w) => `${w.workforceName}: healthy`),
    })
  }

  if (supportData.stats.aiResolutionPct !== null && supportData.stats.aiResolutionPct >= 70) {
    preds.push({
      id: 'opp-support-excellence',
      title: 'High AI resolution rate is a competitive differentiator',
      description: `${supportData.stats.aiResolutionPct}% AI resolution rate exceeds industry average. This is a genuine product advantage worth highlighting in marketing.`,
      category: 'marketing',
      priority: 'medium',
      businessImpact: 'Differentiating marketing claim backed by live data',
      confidence: 75,
      timeHorizon: 'this-week',
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      riskLevel: 'low',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Feature AI support metrics prominently in sales and marketing materials',
      supportingSignals: [`${supportData.stats.aiResolutionPct}% AI resolution rate`],
    })
  }

  return dedupe(preds)
}

// ─── Agent Forecasts ──────────────────────────────────────────────────────────

export function deriveAgentForecasts(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[],
  workforceData: WorkforceStatusData
): AgentForecast[] {
  const AGENTS = [
    { id: 'cto', name: 'CTO Agent', domain: 'Engineering & Infrastructure' },
    { id: 'cfo', name: 'CFO Agent', domain: 'Finance & Billing' },
    { id: 'cmo', name: 'CMO Agent', domain: 'Marketing & Growth' },
    { id: 'customer-success', name: 'Customer Success Agent', domain: 'Customer Success' },
    { id: 'support-manager', name: 'Support Manager Agent', domain: 'Support Operations' },
    { id: 'content-director', name: 'Content Director Agent', domain: 'Content & SEO' },
  ]

  const criticalWorkforceCount = workforceData.workforces.filter(
    (w) => w.health === 'critical'
  ).length

  return AGENTS.map((agent) => {
    const tasks = agentTasks.filter((t) => t.agentId === agent.id)
    const jobs = execJobs.filter((j) => j.agentId === agent.id)
    const criticalTasks = tasks.filter((t) => t.priority === 'critical').length
    const highTasks = tasks.filter((t) => t.priority === 'high').length
    const waitingJobs = jobs.filter((j) => j.stage === 'waiting_approval').length
    const totalLoad = tasks.length + jobs.length

    let forecastedWorkload: ForecastedWorkload = 'light'
    if (totalLoad === 0) forecastedWorkload = 'light'
    else if (totalLoad <= 2 && criticalTasks === 0) forecastedWorkload = 'moderate'
    else if (totalLoad <= 5 && criticalTasks <= 1) forecastedWorkload = 'heavy'
    else forecastedWorkload = 'overloaded'

    const capacityReduction = agent.id === 'cto' && criticalWorkforceCount > 0 ? 30 : 0
    const predictedCapacity = Math.max(
      10,
      Math.min(95, 80 - totalLoad * 5 - criticalTasks * 15 - capacityReduction)
    )

    const bottlenecks: string[] = []
    if (waitingJobs > 0) bottlenecks.push(`${waitingJobs} jobs waiting founder approval`)
    if (criticalTasks > 0) bottlenecks.push(`${criticalTasks} critical tasks unresolved`)
    if (highTasks > 2) bottlenecks.push(`${highTasks} high-priority tasks queued`)
    if (agent.id === 'cto' && criticalWorkforceCount > 0)
      bottlenecks.push(
        `${criticalWorkforceCount} workforce${criticalWorkforceCount !== 1 ? 's' : ''} in critical state`
      )
    if (bottlenecks.length === 0) bottlenecks.push('No predicted bottlenecks')

    const delegationOpportunities: string[] = []
    if (waitingJobs > 1) delegationOpportunities.push('Auto-approve routine low-risk jobs')
    if (tasks.filter((t) => t.priority === 'low').length > 0)
      delegationOpportunities.push('Delegate low-priority tasks without founder review')
    if (delegationOpportunities.length === 0)
      delegationOpportunities.push('No delegation gaps identified')

    let trendForecast: TrendForecast = 'stable'
    if (criticalTasks > 0 || criticalWorkforceCount > 0) trendForecast = 'contracting'
    else if (totalLoad > 5) trendForecast = 'expanding'
    else if (totalLoad === 0) trendForecast = 'insufficient-data'

    const predictionConfidence = totalLoad > 0 ? 72 : 55

    return {
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      predictedCapacity,
      forecastedWorkload,
      expectedBottlenecks: bottlenecks,
      predictionConfidence,
      futureDelegationOpportunities: delegationOpportunities,
      trendForecast,
    }
  })
}

// ─── Forecast Timeline ────────────────────────────────────────────────────────

export function deriveForecastTimeline(allPredictions: Prediction[]): ForecastTimelineEvent[] {
  const horizons: TimeHorizon[] = [
    'today',
    'this-week',
    'next-week',
    'this-month',
    'next-month',
    'next-quarter',
  ]
  const HORIZON_LABELS: Record<TimeHorizon, string> = {
    today: 'Today',
    'this-week': 'This Week',
    'next-week': 'Next Week',
    'this-month': 'This Month',
    'next-month': 'Next Month',
    'next-quarter': 'Next Quarter',
  }

  return horizons
    .map((horizon) => {
      const predictions = allPredictions.filter((p) => p.timeHorizon === horizon)
      const avgConf =
        predictions.length > 0
          ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)
          : 0
      return {
        timeHorizon: horizon,
        label: HORIZON_LABELS[horizon],
        predictions,
        confidence: avgConf,
      }
    })
    .filter((e) => e.predictions.length > 0)
}

// ─── Confidence Distribution ──────────────────────────────────────────────────

export function derivePredictionConfidence(preds: Prediction[]): number {
  if (preds.length === 0) return 50
  return Math.round(preds.reduce((s, p) => s + p.confidence, 0) / preds.length)
}

// ─── Business Trajectory ──────────────────────────────────────────────────────

export function deriveBusinessTrajectory(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): string {
  const { health, revenue, newCustomers } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)
  const criticalWorkforces = workforceData.workforces.filter((w) => w.health === 'critical').length

  if (!revenue.stripeConnected && orgCount === 0) {
    return 'Pre-revenue, pre-customer — platform is built and ready; first revenue depends on Stripe connection and first customer acquisition.'
  }
  if (!revenue.stripeConnected && orgCount > 0) {
    return 'Customers exist but revenue is blocked — Stripe connection is the single most important action to unlock monetization.'
  }
  if (revenue.stripeConnected && orgCount === 0) {
    return 'Revenue infrastructure ready but no customers to charge — growth campaigns are the critical path.'
  }
  if (criticalWorkforces > 0 && supportData.stats.totalOpen > 0) {
    return 'Platform in degraded state — AI delivery and support are both under pressure. Stabilization is the priority before growth.'
  }
  if (newCustomers.orgsLast24h > 0 && revenue.stripeConnected) {
    return 'Growth engine activating — new customers arriving and payment infrastructure ready. Scale acquisition to capture momentum.'
  }
  if (revenue.stripeConnected && revenue.pastDue > 0) {
    return 'Revenue base at risk — churn recovery is more valuable than new acquisition until delinquent subscriptions are resolved.'
  }
  if (revenue.stripeConnected && revenue.active > 0 && revenue.pastDue === 0) {
    return 'Stable revenue base — focus on expansion, upsell, and growth campaigns to increase MRR from a healthy foundation.'
  }
  return 'Platform operational — monitor key signals and continue building toward first meaningful revenue milestone.'
}

export function deriveTrendAcceleration(executiveData: ExecutiveData): TrendDirection {
  const { revenue, newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)

  if (health.database.status === 'critical') return 'declining'
  if (!revenue.stripeConnected && orgCount === 0) return 'stable'
  if (newCustomers.orgsLast24h > 1) return 'accelerating'
  if (newCustomers.orgsLast24h > 0) return 'improving'
  if (revenue.pastDue > 0) return 'decelerating'
  if (orgCount > 0 && newCustomers.orgsLast24h === 0) return 'stable'
  return 'stable'
}

export function deriveCompanyMomentum(executiveData: ExecutiveData): CompanyMomentum {
  const trend = deriveTrendAcceleration(executiveData)
  if (trend === 'accelerating') return 'accelerating'
  if (trend === 'improving') return 'growing'
  if (trend === 'decelerating') return 'slowing'
  if (trend === 'declining') return 'declining'
  return 'stable'
}

// ─── Build function ───────────────────────────────────────────────────────────

export function buildPredictionData(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): PredictionData {
  const executiveForecast = deriveExecutiveForecast(executiveData, supportData, workforceData)
  const revenueForecast = deriveRevenueForecast(executiveData)
  const growthForecast = deriveGrowthForecast(executiveData)
  const supportForecast = deriveSupportForecast(supportData)
  const engineeringForecast = deriveEngineeringForecast(executiveData, workforceData, agentTasks)
  const workforceForecast = deriveWorkforceForecast(workforceData, agentTasks, execJobs)
  const approvalForecast = deriveApprovalForecast(agentTasks, execJobs)
  const riskForecast = deriveRiskForecast(executiveData, supportData, workforceData)
  const operationalForecast = deriveOperationalForecast(executiveData, workforceData, agentTasks)
  const upcomingBottlenecks = deriveUpcomingBottlenecks(
    executiveData,
    supportData,
    workforceData,
    agentTasks,
    execJobs
  )
  const upcomingOpportunities = deriveUpcomingOpportunities(
    executiveData,
    supportData,
    workforceData
  )
  const agentForecasts = deriveAgentForecasts(agentTasks, execJobs, workforceData)

  const allPredictions = dedupe([
    ...executiveForecast,
    ...revenueForecast,
    ...growthForecast,
    ...supportForecast,
    ...engineeringForecast,
    ...workforceForecast,
    ...approvalForecast,
    ...riskForecast,
    ...operationalForecast,
    ...upcomingBottlenecks,
    ...upcomingOpportunities,
  ])

  const forecastTimeline = deriveForecastTimeline(allPredictions)
  const overallForecastConfidence = derivePredictionConfidence(allPredictions)
  const confidenceDistribution = confDistribution(allPredictions)

  const emergingRisks = allPredictions
    .filter((p) => p.riskLevel === 'critical' || p.riskLevel === 'high')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)

  const emergingOpportunities = upcomingOpportunities
    .filter((p) => p.priority === 'high' || p.priority === 'critical')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4)

  const businessTrajectory = deriveBusinessTrajectory(executiveData, supportData, workforceData)
  const companyMomentum = deriveCompanyMomentum(executiveData)

  const { revenue, newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)

  const predictedWeeklyFocus = !revenue.stripeConnected
    ? 'Connect Stripe and acquire first customer — revenue infrastructure is the critical path'
    : orgCount === 0
      ? 'First customer acquisition — all other metrics are dependent on this milestone'
      : revenueForecast.some((p) => p.category === 'billing' && p.priority === 'critical')
        ? 'Recover delinquent subscriptions before they churn permanently'
        : newCustomers.orgsLast24h > 0
          ? 'Amplify current growth momentum — double down on what is driving signups'
          : 'Reactivate top-of-funnel — no new customers in 24h indicates stalled acquisition'

  const predictedMonthlyFocus = !revenue.stripeConnected
    ? 'Full revenue infrastructure setup — Stripe, pricing, billing policies'
    : orgCount === 0
      ? 'Convert first 3–5 customers to establish product-market fit signal'
      : revenue.trialing > 0
        ? 'Trial-to-paid conversion campaign — highest ROI activity this month'
        : 'Expand existing accounts and activate referral programs'

  const predictedQuarterOutlook =
    !revenue.stripeConnected || orgCount === 0
      ? 'Foundational quarter — get to first revenue and first 5 customers'
      : revenue.active > 0
        ? 'Growth quarter — optimize CAC, improve retention, build referral flywheel'
        : 'Activation quarter — convert trials, recover delinquent accounts, expand top-of-funnel'

  const pendingApprovals = agentTasks.filter((t) => t.requiresApproval).length
  const waitingExecJobs = execJobs.filter((j) => j.stage === 'waiting_approval').length
  const criticalTasks = agentTasks.filter((t) => t.priority === 'critical').length

  const totalApprovalLoad = pendingApprovals + waitingExecJobs
  let expectedFounderWorkload: FounderWorkload = 'light'
  if (totalApprovalLoad > 10 || criticalTasks > 3) expectedFounderWorkload = 'overwhelming'
  else if (totalApprovalLoad > 5 || criticalTasks > 1) expectedFounderWorkload = 'heavy'
  else if (totalApprovalLoad > 2 || criticalTasks > 0) expectedFounderWorkload = 'moderate'

  const decisionForecast =
    totalApprovalLoad === 0
      ? 'No immediate decisions required — agents are operating within auto-approval authority'
      : criticalTasks > 0
        ? `${criticalTasks} critical decision${criticalTasks !== 1 ? 's' : ''} required today — delay increases downstream risk`
        : `${totalApprovalLoad} approval${totalApprovalLoad !== 1 ? 's' : ''} pending — clear the queue to unblock agents`

  const upcomingDecisions = allPredictions
    .filter((p) => p.requiresFounderApproval)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 5)

  const upcomingStrategicPriorities: string[] = []
  if (!revenue.stripeConnected)
    upcomingStrategicPriorities.push('Connect Stripe — unblocks revenue')
  if (orgCount === 0)
    upcomingStrategicPriorities.push('Acquire first customer — unlocks all growth metrics')
  if (revenue.trialing > 0)
    upcomingStrategicPriorities.push('Convert active trials before window closes')
  if (revenue.pastDue > 0) upcomingStrategicPriorities.push('Recover delinquent subscriptions')
  if (totalApprovalLoad > 3)
    upcomingStrategicPriorities.push('Clear approval queue to restore agent throughput')
  if (upcomingStrategicPriorities.length === 0) {
    upcomingStrategicPriorities.push('Sustain growth momentum and optimize existing metrics')
  }

  const expectedDelegationDemand =
    totalApprovalLoad === 0
      ? 'Low — no immediate delegation demand'
      : totalApprovalLoad <= 3
        ? 'Moderate — manageable approval volume expected'
        : `High — ${totalApprovalLoad} items need founder decision; consider expanding auto-approval policy`

  const executiveReadiness =
    criticalTasks > 0
      ? 'Action required — critical items need founder attention before strategic work can proceed'
      : totalApprovalLoad > 5
        ? 'Approval backlog — clear queue to restore strategic focus'
        : 'Ready — platform is operational and no blocking decisions required'

  const forecastConfidence = overallForecastConfidence

  return {
    executiveForecast,
    revenueForecast,
    growthForecast,
    operationalForecast,
    supportForecast,
    engineeringForecast,
    workforceForecast,
    approvalForecast,
    riskForecast,
    upcomingBottlenecks,
    upcomingOpportunities,
    forecastTimeline,
    agentForecasts,
    businessTrajectory,
    companyMomentum,
    forecastConfidence,
    emergingRisks,
    emergingOpportunities,
    predictedWeeklyFocus,
    predictedMonthlyFocus,
    predictedQuarterOutlook,
    upcomingDecisions,
    expectedFounderWorkload,
    decisionForecast,
    upcomingStrategicPriorities,
    expectedDelegationDemand,
    executiveReadiness,
    overallForecastConfidence,
    confidenceDistribution,
    generatedAt: executiveData.generatedAt,
  }
}

export async function getPredictionData(): Promise<PredictionData> {
  const [executiveData, supportData, workforceData] = await Promise.all([
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])
  const agentTasks = buildAgentTasks(executiveData)
  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, executiveData.generatedAt)
  return buildPredictionData(executiveData, supportData, workforceData, agentTasks, execJobs)
}
