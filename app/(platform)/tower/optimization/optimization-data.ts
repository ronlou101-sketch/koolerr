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

export type OptimizationCategory =
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

export type OptimizationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface OptimizationRecommendation {
  id: string
  title: string
  description: string
  category: OptimizationCategory
  priority: OptimizationPriority
  businessImpact: string
  estimatedROI: string
  estimatedTimeSaved: string
  confidence: number
  suggestedAgent: string
  dependencies: string[]
  risk: string
  requiresFounderApproval: boolean
  recommendedNextStep: string
}

export interface AgentEfficiency {
  agentId: string
  agentName: string
  domain: string
  currentEfficiency: number
  estimatedCapacity: number
  recommendedWorkload: 'increase' | 'maintain' | 'reduce'
  optimizationSuggestions: string[]
  delegationOpportunities: string[]
  improvementTrend: 'improving' | 'stable' | 'declining' | 'insufficient-data'
}

export interface OptimizationData {
  topOpportunities: OptimizationRecommendation[]
  highestROI: OptimizationRecommendation[]
  automationCandidates: OptimizationRecommendation[]
  timeSavings: OptimizationRecommendation[]
  revenueOpportunities: OptimizationRecommendation[]
  costReduction: OptimizationRecommendation[]
  supportImprovements: OptimizationRecommendation[]
  engineeringImprovements: OptimizationRecommendation[]
  marketingImprovements: OptimizationRecommendation[]
  billingImprovements: OptimizationRecommendation[]
  growthImprovements: OptimizationRecommendation[]
  customerSuccessImprovements: OptimizationRecommendation[]
  agentOptimization: OptimizationRecommendation[]
  riskReduction: OptimizationRecommendation[]
  agentEfficiency: AgentEfficiency[]
  optimizationScore: number
  dailyImprovementGoal: string
  weeklyImprovementGoal: string
  highestROIRecommendation: OptimizationRecommendation | null
  mostExpensiveBottleneck: OptimizationRecommendation | null
  mostValuableAutomation: OptimizationRecommendation | null
  mostUnderutilizedAgent: string | null
  mostOverloadedAgent: string | null
  predictedCompanyImprovement: string
  founderTimeSaved: string
  delegationOpportunities: OptimizationRecommendation[]
  generatedAt: string
}

// ─── Priority sort weight ──────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<OptimizationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function safeInt(s: string): number {
  const n = parseInt(s, 10)
  return isNaN(n) ? 0 : n
}

// ─── Revenue Opportunities ────────────────────────────────────────────────────

export function deriveRevenueOpportunities(
  executiveData: ExecutiveData
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const { revenue, newCustomers } = executiveData
  const orgCount = safeInt(executiveData.health.activeOrganizations.value)

  if (!revenue.stripeConnected) {
    recs.push({
      id: 'rev-stripe-connect',
      title: 'Connect Stripe to enable revenue collection',
      description:
        'Stripe is not connected. The platform cannot collect payments, track MRR, or execute billing workflows until Stripe is live.',
      category: 'revenue',
      priority: 'critical',
      businessImpact: 'Unlocks all monetization — directly on the critical path to first revenue',
      estimatedROI: 'High — no revenue is possible without this',
      estimatedTimeSaved: '2–4 hours of manual billing coordination per week',
      confidence: 98,
      suggestedAgent: 'CFO Agent',
      dependencies: [],
      risk: 'Low — additive integration, no existing data affected',
      requiresFounderApproval: true,
      recommendedNextStep:
        'Open Stripe dashboard, create a restricted API key, add to environment variables, test webhook endpoint',
    })
  }

  if (revenue.stripeConnected && revenue.pastDue > 0) {
    recs.push({
      id: 'rev-past-due-recovery',
      title: `Recover ${revenue.pastDue} delinquent subscription${revenue.pastDue !== 1 ? 's' : ''}`,
      description:
        'Past-due subscriptions represent recoverable revenue. Automated dunning sequences recover 20–40% of failed payments within 7 days.',
      category: 'billing',
      priority: 'high',
      businessImpact: `${revenue.pastDue} subscription${revenue.pastDue !== 1 ? 's' : ''} at risk — potential churn if not recovered`,
      estimatedROI: '20–40% recovery rate on delinquent ARR',
      estimatedTimeSaved: '30 min/week of manual payment follow-up',
      confidence: 90,
      suggestedAgent: 'CFO Agent',
      dependencies: ['Stripe connected'],
      risk: 'Low — automated outreach, customer data unchanged',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Enable Stripe Smart Retries and configure dunning email sequence via Stripe billing settings',
    })
  }

  if (revenue.stripeConnected && revenue.trialing > 0) {
    recs.push({
      id: 'rev-trial-conversion',
      title: `Convert ${revenue.trialing} active trial${revenue.trialing !== 1 ? 's' : ''} to paid`,
      description:
        'Trial customers have demonstrated intent. A targeted conversion sequence during the trial window is the highest-ROI growth action available.',
      category: 'growth',
      priority: 'high',
      businessImpact: 'Each converted trial is recurring ARR — compounding value over lifetime',
      estimatedROI: 'Direct MRR increase — no acquisition cost',
      estimatedTimeSaved: '1 hour/week of manual follow-up per trial',
      confidence: 85,
      suggestedAgent: 'CMO Agent',
      dependencies: ['Stripe connected', 'Email integration'],
      risk: 'Low — nurture-only, no account modification',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Create trial conversion email sequence: day 3 value proof, day 7 ROI summary, day 10 urgency',
    })
  }

  if (orgCount === 0) {
    recs.push({
      id: 'rev-first-customer',
      title: 'Acquire first paying customer',
      description:
        'No organizations on the platform. All revenue, retention, and growth metrics are blocked until the first customer signs up.',
      category: 'growth',
      priority: 'critical',
      businessImpact: 'Unlocks product-market fit validation and the entire revenue model',
      estimatedROI: 'Foundational — all downstream revenue depends on this',
      estimatedTimeSaved: 'N/A — this is the starting condition',
      confidence: 95,
      suggestedAgent: 'CMO Agent',
      dependencies: revenue.stripeConnected ? [] : ['Stripe connected'],
      risk: 'Low — outbound and marketing campaigns carry no platform risk',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Launch direct outreach to 20 warm leads; activate CMO Agent to generate ICP-targeted messaging',
    })
  }

  if (revenue.stripeConnected && orgCount > 0 && newCustomers.orgsLast24h === 0) {
    recs.push({
      id: 'rev-growth-stall',
      title: 'Reactivate growth engine — no new customers in 24h',
      description:
        'Acquisition has stalled. Flat top-of-funnel signals indicate marketing or outbound needs attention.',
      category: 'growth',
      priority: 'medium',
      businessImpact:
        'Flat growth compounds into declining growth rate — act before the stall extends',
      estimatedROI: 'Each new customer is full recurring ARR from first payment',
      estimatedTimeSaved: '2 hours/week on manual prospecting if automated',
      confidence: 72,
      suggestedAgent: 'CMO Agent',
      dependencies: [],
      risk: 'Low — marketing campaigns are reversible',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Activate CMO Agent to audit top-of-funnel sources and generate new outbound sequences',
    })
  }

  return recs
}

// ─── Automation Candidates ────────────────────────────────────────────────────

export function deriveAutomationCandidates(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const billingTickets = supportData.tickets.filter((t) => t.sourceType === 'billing-issue').length

  if (supportData.stats.escalations > 0 && supportData.stats.autoResolved === 0) {
    recs.push({
      id: 'auto-support-resolution',
      title: 'Automate common support ticket resolution',
      description:
        'Support tickets are escalating without AI self-resolution. Training the Support Agent on common patterns eliminates manual triage.',
      category: 'automation',
      priority: 'high',
      businessImpact: 'Each auto-resolved ticket saves 15–30 min of founder or agent time',
      estimatedROI: `~${supportData.stats.escalations * 20} min/week recovered at current escalation rate`,
      estimatedTimeSaved: `${supportData.stats.escalations * 20} min/week`,
      confidence: 82,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'Low — expand AI authority incrementally, with fallback to escalation',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Review escalated ticket categories; expand Support Agent authority for high-confidence patterns',
    })
  }

  if (billingTickets > 0) {
    recs.push({
      id: 'auto-billing-notifications',
      title: 'Automate proactive billing communications',
      description:
        'Billing issues are generating support tickets. Proactive billing status notifications prevent customer confusion before it becomes a ticket.',
      category: 'automation',
      priority: 'medium',
      businessImpact: 'Reduces billing support volume — each prevented ticket saves ~20 min',
      estimatedROI: `~${billingTickets * 20} min/week at current billing ticket rate`,
      estimatedTimeSaved: `${billingTickets * 20} min/week`,
      confidence: 80,
      suggestedAgent: 'CFO Agent',
      dependencies: ['Stripe connected'],
      risk: 'Low — notifications only, no account changes',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Configure Stripe billing email notifications; add CFO Agent billing status briefing to morning brief',
    })
  }

  if (failedRuns > 0) {
    recs.push({
      id: 'auto-workforce-retry',
      title: 'Automate failed AI Workforce run recovery',
      description:
        'Failed engagement runs create support tickets and require manual investigation. Automated retry logic with error classification eliminates manual triage.',
      category: 'automation',
      priority: 'high',
      businessImpact: 'Each automated recovery saves 30–60 min of manual investigation',
      estimatedROI: `~${failedRuns * 45} min recovered on current ${failedRuns} failed run${failedRuns !== 1 ? 's' : ''}`,
      estimatedTimeSaved: `${failedRuns * 45} min`,
      confidence: 78,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'Low — retry logic does not modify customer data',
      requiresFounderApproval: false,
      recommendedNextStep:
        'CTO Agent to implement exponential backoff retry policy for transient workforce failures',
    })
  }

  if (workforceData.totalRunsAllWorkforces > 0) {
    recs.push({
      id: 'auto-workforce-scheduling',
      title: 'Implement automated AI Workforce scheduling',
      description:
        'Workforces running on demand can be scheduled during off-peak hours to improve throughput and reduce latency for customer-facing actions.',
      category: 'automation',
      priority: 'low',
      businessImpact: 'Improves AI delivery speed and consistency for customers',
      estimatedROI: 'Qualitative — better customer experience with the same infrastructure',
      estimatedTimeSaved: '1–2 hours/week of manual run initiation',
      confidence: 68,
      suggestedAgent: 'CTO Agent',
      dependencies: ['AI Workforce stable'],
      risk: 'Low — scheduling does not change run logic',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Define peak and off-peak windows; configure workforce run schedules in Workforce Management',
    })
  }

  // Approval batching
  recs.push({
    id: 'auto-batch-approvals',
    title: 'Batch low-risk agent approvals to reduce decision fatigue',
    description:
      'High-confidence, low-risk agent recommendations can be grouped into a weekly approval batch rather than individual decisions, saving founder time.',
    category: 'founder-productivity',
    priority: 'medium',
    businessImpact: 'Reduces founder time in approval queue by up to 60%',
    estimatedROI: '1–2 hours/week of approval workflow time recovered',
    estimatedTimeSaved: '1–2 hours/week',
    confidence: 75,
    suggestedAgent: 'CTO Agent',
    dependencies: [],
    risk: 'Low — high-confidence items only; critical items still require individual approval',
    requiresFounderApproval: true,
    recommendedNextStep:
      'Identify agent recommendations with confidence ≥80% and no irreversibility — route to weekly batch',
  })

  if (!executiveData.revenue.stripeConnected) {
    recs.push({
      id: 'auto-revenue-tracking',
      title: 'Automate revenue tracking and forecasting',
      description:
        'Manual revenue oversight is currently required. Stripe integration enables fully automated MRR tracking, churn alerts, and revenue forecasting.',
      category: 'automation',
      priority: 'critical',
      businessImpact:
        'Eliminates all manual revenue tracking — automated alerts replace daily monitoring',
      estimatedROI: '3–5 hours/week of manual financial monitoring recovered',
      estimatedTimeSaved: '3–5 hours/week',
      confidence: 92,
      suggestedAgent: 'CFO Agent',
      dependencies: ['Stripe connected'],
      risk: 'None — read-only monitoring integration',
      requiresFounderApproval: true,
      recommendedNextStep: 'Connect Stripe to unlock CFO Agent revenue automation',
    })
  }

  return recs
}

// ─── Time Savings / Founder Productivity ──────────────────────────────────────

export function deriveTimeSavings(
  supportData: SupportData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const approvalCount = agentTasks.filter((t) => t.requiresApproval).length
  const supportApprovals = supportData.stats.awaitingFounder
  const totalWaiting = approvalCount + supportApprovals
  const waitingJobs = execJobs.filter((j) => j.stage === 'waiting_approval').length

  if (totalWaiting > 5) {
    recs.push({
      id: 'time-approval-overload',
      title: `Clear ${totalWaiting}-item approval backlog`,
      description: `${totalWaiting} items are waiting on founder approval, blocking agent execution and creating a decision bottleneck.`,
      category: 'founder-productivity',
      priority: 'high',
      businessImpact: 'Unblocks agent execution — every queued item is a delayed business outcome',
      estimatedROI: `${totalWaiting * 5} min of agent time currently blocked`,
      estimatedTimeSaved: `${totalWaiting * 3} min to clear the queue`,
      confidence: 92,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'None — reviewing and approving/deferring items',
      requiresFounderApproval: true,
      recommendedNextStep: 'Schedule 20-minute approval session to clear the backlog',
    })
  }

  if (supportApprovals > 0) {
    recs.push({
      id: 'time-support-delegation',
      title: `Delegate ${supportApprovals} support decision${supportApprovals !== 1 ? 's' : ''} to Support Manager`,
      description:
        'Support tickets requiring founder approval could be handled autonomously by the Support Manager Agent with expanded authority.',
      category: 'founder-productivity',
      priority: 'medium',
      businessImpact: 'Removes founder from routine support decisions — frees strategic time',
      estimatedROI: `${supportApprovals * 15} min/cycle recovered`,
      estimatedTimeSaved: `${supportApprovals * 15} min`,
      confidence: 75,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'Low — expand agent authority incrementally, retain escalation path',
      requiresFounderApproval: true,
      recommendedNextStep:
        'Review which support categories can be resolved without founder sign-off; update agent authority policy',
    })
  }

  if (waitingJobs > 3) {
    recs.push({
      id: 'time-execution-backlog',
      title: 'Reduce execution engine backlog',
      description: `${waitingJobs} jobs are waiting in the execution queue. Clearing this backlog allows agents to operate at full capacity.`,
      category: 'execution',
      priority: 'medium',
      businessImpact: 'Each waiting job is a delayed business action — compounding delivery lag',
      estimatedROI: 'Direct execution throughput improvement',
      estimatedTimeSaved: `${waitingJobs * 10} min of delayed execution time`,
      confidence: 80,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'None — reviewing pending jobs',
      requiresFounderApproval: true,
      recommendedNextStep: 'Review and approve or defer pending execution jobs',
    })
  }

  recs.push({
    id: 'time-delegation-strategy',
    title: 'Increase agent delegation to reclaim founder strategic time',
    description:
      'Founders spend disproportionate time on tactical decisions that agents are qualified to handle. A structured delegation policy recovers 5–10 hours/week.',
    category: 'founder-productivity',
    priority: 'medium',
    businessImpact:
      'More founder time on strategy, fundraising, and product — highest-leverage activities',
    estimatedROI: '5–10 hours/week of high-leverage time recovered',
    estimatedTimeSaved: '5–10 hours/week',
    confidence: 70,
    suggestedAgent: 'CTO Agent',
    dependencies: [],
    risk: 'Low — structured delegation with defined boundaries and escalation paths',
    requiresFounderApproval: true,
    recommendedNextStep:
      'Define which agent recommendation categories can be auto-approved below a confidence threshold',
  })

  return recs
}

// ─── Support Optimization ─────────────────────────────────────────────────────

export function deriveSupportOptimization(supportData: SupportData): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const { stats, tickets } = supportData

  if (stats.escalations > 0) {
    recs.push({
      id: 'support-reduce-escalations',
      title: `Eliminate ${stats.escalations} escalation${stats.escalations !== 1 ? 's' : ''} through Knowledge Agent expansion`,
      description:
        'Escalated tickets indicate AI knowledge gaps. Each escalation is a signal to train the Knowledge Agent on a new resolution pattern.',
      category: 'support',
      priority: 'high',
      businessImpact: 'Reduces founder and senior agent time on routine escalations',
      estimatedROI: `${stats.escalations * 25} min/cycle saved at current escalation rate`,
      estimatedTimeSaved: `${stats.escalations * 25} min/cycle`,
      confidence: 85,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'Low — knowledge expansion, not authority expansion',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Categorize escalated tickets; add resolution patterns to Knowledge Agent training set',
    })
  }

  const lowConfidenceTickets = tickets.filter((t) => t.confidenceScore < 65)
  if (lowConfidenceTickets.length > 0) {
    recs.push({
      id: 'support-confidence-calibration',
      title: `Calibrate Support Agent on ${lowConfidenceTickets.length} low-confidence ticket${lowConfidenceTickets.length !== 1 ? 's' : ''}`,
      description:
        'Low-confidence tickets indicate the Support Agent is operating outside its training data. Calibration improves resolution accuracy.',
      category: 'knowledge',
      priority: 'medium',
      businessImpact: 'Higher confidence → more autonomous resolution → less founder review',
      estimatedROI: `${lowConfidenceTickets.length * 15} min/cycle recovered from manual review`,
      estimatedTimeSaved: `${lowConfidenceTickets.length * 15} min/cycle`,
      confidence: 78,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'Low — calibration improves accuracy without changing resolution authority',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Review low-confidence ticket categories and supplement Support Agent with additional context',
    })
  }

  if (stats.aiResolutionPct !== null && stats.aiResolutionPct < 50) {
    recs.push({
      id: 'support-ai-resolution-rate',
      title: 'Improve AI resolution rate — currently below 50%',
      description: `Only ${stats.aiResolutionPct}% of tickets are resolved autonomously. Target is 70%+ for efficient operation.`,
      category: 'support',
      priority: 'high',
      businessImpact: 'Doubling AI resolution rate halves support labor cost',
      estimatedROI: `${Math.round((70 - stats.aiResolutionPct) / 10)} additional tickets auto-resolved per batch`,
      estimatedTimeSaved: '2–4 hours/week at target resolution rate',
      confidence: 82,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'Low — incremental authority expansion with confidence thresholds',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Identify the ticket categories currently requiring human review and build resolution templates for each',
    })
  }

  const billingTickets = tickets.filter((t) => t.sourceType === 'billing-issue').length
  if (billingTickets > 0) {
    recs.push({
      id: 'support-billing-prevention',
      title: 'Prevent billing tickets through proactive communication',
      description: `${billingTickets} billing-sourced ticket${billingTickets !== 1 ? 's' : ''} in queue. Proactive billing status notifications prevent 60–80% of billing inquiries.`,
      category: 'billing',
      priority: 'medium',
      businessImpact: 'Reduces billing support volume and customer billing confusion',
      estimatedROI: `Prevention of ~${Math.round(billingTickets * 0.7)} tickets/cycle`,
      estimatedTimeSaved: `${Math.round(billingTickets * 0.7) * 20} min/cycle`,
      confidence: 76,
      suggestedAgent: 'CFO Agent',
      dependencies: [],
      risk: 'None — outbound notifications only',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Implement billing status notification emails at payment due date, 3 days before, and on failure',
    })
  }

  recs.push({
    id: 'support-knowledge-base',
    title: 'Build self-service knowledge base to deflect repeat tickets',
    description:
      'Repeat ticket categories indicate customers cannot self-resolve. A knowledge base deflects 20–40% of inbound volume.',
    category: 'knowledge',
    priority: 'medium',
    businessImpact: 'Reduces inbound ticket volume — compounding deflection over time',
    estimatedROI: '20–40% ticket deflection at full knowledge base coverage',
    estimatedTimeSaved: `${Math.round(stats.totalOpen * 0.3) * 20} min/cycle at 30% deflection rate`,
    confidence: 70,
    suggestedAgent: 'Support Manager Agent',
    dependencies: [],
    risk: 'None — additive resource, no existing workflow changes',
    requiresFounderApproval: false,
    recommendedNextStep:
      'Identify top 5 recurring ticket types; Knowledge Agent to draft resolution articles for each',
  })

  return recs
}

// ─── Engineering Optimization ─────────────────────────────────────────────────

export function deriveEngineeringOptimization(
  executiveData: ExecutiveData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[]
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const { health } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const criticalWorkforces = workforceData.workforces.filter((w) => w.health === 'critical')
  const ctoTasks = agentTasks.filter((t) => t.agentId === 'cto')

  if (failedRuns > 0) {
    recs.push({
      id: 'eng-workforce-reliability',
      title: `Fix ${failedRuns} AI Workforce failure${failedRuns !== 1 ? 's' : ''} to restore reliability`,
      description:
        'Failed AI Workforce runs create downstream support tickets and reduce customer trust. Root cause analysis and fixes prevent recurrence.',
      category: 'engineering',
      priority: failedRuns > 5 ? 'critical' : 'high',
      businessImpact: 'Each unresolved failure compounds into support cost and customer churn risk',
      estimatedROI: `${failedRuns * 30} min of downstream support time eliminated per cycle`,
      estimatedTimeSaved: `${failedRuns * 30} min/cycle`,
      confidence: 88,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'Low — investigation and fix, not feature work',
      requiresFounderApproval: false,
      recommendedNextStep:
        'CTO Agent to review lastError logs across failing workforces and produce root-cause report',
    })
  }

  if (criticalWorkforces.length > 0) {
    recs.push({
      id: 'eng-critical-workforces',
      title: `Restore ${criticalWorkforces.length} critically degraded AI Workforce${criticalWorkforces.length !== 1 ? 's' : ''}`,
      description: `${criticalWorkforces.map((w) => w.workforceName).join(', ')} ${criticalWorkforces.length === 1 ? 'is' : 'are'} in critical health. Immediate attention required.`,
      category: 'ai-workforce',
      priority: 'critical',
      businessImpact: 'Critical workforces directly degrade customer-facing AI delivery',
      estimatedROI: 'Restoration of full AI delivery capacity',
      estimatedTimeSaved: 'Prevents further failure escalation',
      confidence: 95,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'Investigation only — no changes without approval',
      requiresFounderApproval: false,
      recommendedNextStep:
        'CTO Agent to diagnose critical workforce errors and produce remediation plan within 1 hour',
    })
  }

  const missingMonitoring = [
    health.apiHealth.status === 'not-configured' ? 'API health' : null,
    health.backgroundJobs.status === 'not-configured' ? 'background jobs' : null,
    health.deployments.status === 'not-configured' ? 'deployments' : null,
  ].filter(Boolean)

  if (missingMonitoring.length > 0) {
    recs.push({
      id: 'eng-monitoring-gaps',
      title: `Connect ${missingMonitoring.length} missing monitoring integration${missingMonitoring.length !== 1 ? 's' : ''}`,
      description: `${missingMonitoring.join(', ')} monitoring is not configured. Blind spots prevent early detection of platform degradation.`,
      category: 'platform',
      priority: 'medium',
      businessImpact: 'Monitoring prevents outages from becoming customer-visible incidents',
      estimatedROI: 'Prevention of undetected downtime — value compounds at scale',
      estimatedTimeSaved: '2–4 hours per incident detected and resolved early vs late',
      confidence: 80,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'None — additive integrations',
      requiresFounderApproval: false,
      recommendedNextStep: `Connect ${missingMonitoring[0]} monitoring first — highest visibility gap`,
    })
  }

  if (ctoTasks.length > 3) {
    recs.push({
      id: 'eng-cto-backlog',
      title: `Clear ${ctoTasks.length}-item CTO Agent backlog`,
      description:
        'CTO Agent has a growing task backlog. Clearing high-priority items first reduces technical debt accumulation.',
      category: 'engineering',
      priority: 'medium',
      businessImpact: 'Technical debt compounds — addressing backlog now is cheaper than later',
      estimatedROI: 'Prevention of compounding technical debt cost',
      estimatedTimeSaved: '30 min/cycle for each cleared task',
      confidence: 72,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'Low — task review and prioritization only',
      requiresFounderApproval: false,
      recommendedNextStep: 'Review CTO Agent task queue; approve or defer items by priority',
    })
  }

  return recs
}

// ─── Growth Optimization ──────────────────────────────────────────────────────

export function deriveGrowthOpportunities(
  executiveData: ExecutiveData
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const { revenue, newCustomers, health } = executiveData
  const orgCount = safeInt(health.activeOrganizations.value)

  recs.push({
    id: 'growth-marketing-automation',
    title: 'Automate top-of-funnel marketing with CMO Agent',
    description:
      'Manual marketing outreach does not scale. CMO Agent can generate and manage outbound sequences, content calendars, and ICP targeting at 10× the rate of manual effort.',
    category: 'marketing',
    priority: orgCount === 0 ? 'critical' : 'high',
    businessImpact: 'Automated outbound generates leads at near-zero marginal cost per prospect',
    estimatedROI: '10× outreach volume at same founder time cost',
    estimatedTimeSaved: '5–10 hours/week of manual marketing coordination',
    confidence: 80,
    suggestedAgent: 'CMO Agent',
    dependencies: [],
    risk: 'Low — outbound campaigns are fully reversible',
    requiresFounderApproval: true,
    recommendedNextStep:
      'Brief CMO Agent on ICP, value proposition, and target markets; launch first outbound sequence',
  })

  if (orgCount > 0 && !revenue.stripeConnected) {
    recs.push({
      id: 'growth-monetization-gap',
      title: 'Close the monetization gap — customers exist but billing is not configured',
      description:
        'Organizations are on the platform but cannot be billed. Every day without billing is lost revenue.',
      category: 'revenue',
      priority: 'critical',
      businessImpact: 'Direct revenue leakage — customers using the product for free',
      estimatedROI: 'Immediate: all existing customers become billable',
      estimatedTimeSaved: 'N/A — this is pure revenue recovery',
      confidence: 98,
      suggestedAgent: 'CFO Agent',
      dependencies: [],
      risk: 'None — billing infrastructure addition',
      requiresFounderApproval: true,
      recommendedNextStep: 'Connect Stripe and configure pricing for existing customer plans',
    })
  }

  if (newCustomers.orgsLast24h > 0) {
    recs.push({
      id: 'growth-onboarding-optimization',
      title: 'Optimize onboarding for new customers acquired today',
      description: `${newCustomers.orgsLast24h} new org${newCustomers.orgsLast24h !== 1 ? 's' : ''} joined in 24h. The onboarding experience in the first 48 hours determines 30-day retention.`,
      category: 'customer-success',
      priority: 'high',
      businessImpact: 'Strong onboarding increases 30-day retention by 20–40%',
      estimatedROI: `Higher retention on ${newCustomers.orgsLast24h} new customer${newCustomers.orgsLast24h !== 1 ? 's' : ''} — compounding LTV`,
      estimatedTimeSaved: '2 hours/customer of manual onboarding effort if automated',
      confidence: 88,
      suggestedAgent: 'Customer Success Agent',
      dependencies: [],
      risk: 'None — onboarding experience improvement',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Customer Success Agent to trigger onboarding sequence for all organizations joined in last 24h',
    })
  }

  recs.push({
    id: 'growth-content-engine',
    title: 'Launch content engine to build organic acquisition channel',
    description:
      'Organic content (SEO, thought leadership, product-led content) creates a compounding acquisition channel that costs less per lead than outbound over time.',
    category: 'marketing',
    priority: 'medium',
    businessImpact:
      'Organic channel compounds — each piece of content generates leads indefinitely',
    estimatedROI: 'Lower CAC over 6–12 months vs paid acquisition',
    estimatedTimeSaved:
      '3–5 hours/week of manual content production if Content Director Agent is active',
    confidence: 72,
    suggestedAgent: 'Content Director Agent',
    dependencies: [],
    risk: 'None — content production carries no platform risk',
    requiresFounderApproval: false,
    recommendedNextStep:
      'Brief Content Director Agent on product positioning and target keywords; generate first 5 articles',
  })

  return recs
}

// ─── Agent Optimization ───────────────────────────────────────────────────────

export function deriveAgentOptimization(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []

  const AGENT_DEFS = [
    { id: 'cto', name: 'CTO Agent', domain: 'Engineering' },
    { id: 'cfo', name: 'CFO Agent', domain: 'Finance' },
    { id: 'cmo', name: 'CMO Agent', domain: 'Marketing' },
    { id: 'customer-success', name: 'Customer Success Agent', domain: 'Customer Success' },
    { id: 'support-manager', name: 'Support Manager Agent', domain: 'Support' },
    { id: 'content-director', name: 'Content Director Agent', domain: 'Content' },
  ]

  const tasksByAgent = new Map<string, number>()
  const jobsByAgent = new Map<string, ExecutionJob[]>()

  for (const task of agentTasks) {
    tasksByAgent.set(task.agentId, (tasksByAgent.get(task.agentId) ?? 0) + 1)
  }
  for (const job of execJobs) {
    const jobs = jobsByAgent.get(job.agentId) ?? []
    jobs.push(job)
    jobsByAgent.set(job.agentId, jobs)
  }

  const agentLoads = AGENT_DEFS.map((a) => ({
    ...a,
    taskCount: tasksByAgent.get(a.id) ?? 0,
    jobs: jobsByAgent.get(a.id) ?? [],
  })).sort((a, b) => b.taskCount - a.taskCount)

  const mostLoaded = agentLoads[0]
  const leastLoaded = agentLoads[agentLoads.length - 1]

  if (mostLoaded && mostLoaded.taskCount > 4) {
    recs.push({
      id: `agent-overload-${mostLoaded.id}`,
      title: `Redistribute work from ${mostLoaded.name} — highest load agent`,
      description: `${mostLoaded.name} has ${mostLoaded.taskCount} active tasks — the highest of any agent. Consider redistributing lower-priority tasks or increasing delegation clarity.`,
      category: 'ai-workforce',
      priority: 'medium',
      businessImpact:
        'Overloaded agents have lower recommendation quality — distributing load improves output',
      estimatedROI: 'Higher recommendation confidence from a balanced agent workload',
      estimatedTimeSaved: '30 min/week of agent re-queuing and priority management',
      confidence: 70,
      suggestedAgent: mostLoaded.name,
      dependencies: [],
      risk: 'Low — workload redistribution, not agent removal',
      requiresFounderApproval: false,
      recommendedNextStep: `Review ${mostLoaded.name}'s task queue and defer or reassign lower-priority items`,
    })
  }

  if (leastLoaded && leastLoaded.taskCount === 0) {
    recs.push({
      id: `agent-underutil-${leastLoaded.id}`,
      title: `Activate ${leastLoaded.name} — currently idle`,
      description: `${leastLoaded.name} has no active tasks. This agent has capacity to generate value in the ${leastLoaded.domain} domain.`,
      category: 'ai-workforce',
      priority: 'medium',
      businessImpact:
        'Idle agent represents unrealized value — activation has zero incremental cost',
      estimatedROI: "New recommendations in the idle agent's domain at no additional cost",
      estimatedTimeSaved: 'N/A — this is capacity creation, not recovery',
      confidence: 72,
      suggestedAgent: leastLoaded.name,
      dependencies: [],
      risk: 'Low — recommendations still require founder approval',
      requiresFounderApproval: false,
      recommendedNextStep: `Brief ${leastLoaded.name} on current company priorities in the ${leastLoaded.domain} domain`,
    })
  }

  const lowConfidenceJobs = execJobs.filter((j) => j.confidenceScore < 65)
  if (lowConfidenceJobs.length > 0) {
    const agentIds = [...new Set(lowConfidenceJobs.map((j) => j.agentId))]
    const agentNames = agentIds
      .map((id) => AGENT_DEFS.find((a) => a.id === id)?.name ?? id)
      .join(', ')
    recs.push({
      id: 'agent-confidence-calibration',
      title: `Calibrate ${agentIds.length} agent${agentIds.length !== 1 ? 's' : ''} producing low-confidence recommendations`,
      description: `${lowConfidenceJobs.length} job${lowConfidenceJobs.length !== 1 ? 's' : ''} have confidence below 65% (${agentNames}). Low confidence indicates context gaps that calibration can fix.`,
      category: 'ai-workforce',
      priority: 'medium',
      businessImpact:
        'Higher confidence means less manual review — directly reduces founder decision time',
      estimatedROI: `${lowConfidenceJobs.length * 10} min/cycle of review time saved at target confidence`,
      estimatedTimeSaved: `${lowConfidenceJobs.length * 10} min/cycle`,
      confidence: 78,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'None — calibration improves output quality without changing authority',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Review low-confidence job descriptions; supplement agent context with platform-specific data',
    })
  }

  return recs
}

// ─── Risk Reduction ───────────────────────────────────────────────────────────

export function deriveRiskReduction(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const { revenue, health } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)

  if (revenue.pastDue > 0) {
    recs.push({
      id: 'risk-churn',
      title: `Mitigate churn risk from ${revenue.pastDue} past-due subscription${revenue.pastDue !== 1 ? 's' : ''}`,
      description:
        'Past-due subscriptions that remain unresolved for 7+ days churn at 3× the rate of healthy subscriptions.',
      category: 'risk',
      priority: 'high',
      businessImpact: 'Preventing churn is 5× cheaper than acquiring a replacement customer',
      estimatedROI: 'Full LTV of each retained customer vs. cost of churn',
      estimatedTimeSaved: '2 hours/churned customer of replacement acquisition effort',
      confidence: 88,
      suggestedAgent: 'CFO Agent',
      dependencies: ['Stripe connected'],
      risk: 'Low — outreach and payment recovery only',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Trigger dunning sequence immediately; follow up personally if automated outreach fails',
    })
  }

  if (supportData.stats.escalations > 2) {
    recs.push({
      id: 'risk-support-saturation',
      title: 'Prevent support escalation saturation',
      description: `${supportData.stats.escalations} escalations indicate the support system is approaching capacity. Unchecked growth in escalations leads to response time degradation.`,
      category: 'risk',
      priority: 'high',
      businessImpact: 'Degraded support response time increases churn probability by 15–25%',
      estimatedROI: 'Churn prevention — each retained customer saves 5× their CAC',
      estimatedTimeSaved: '3–5 hours/week of escalation management at scale',
      confidence: 80,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'None — expanding capacity reduces risk',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Analyze escalation root causes; expand Knowledge Agent coverage for top 3 escalation categories',
    })
  }

  if (failedRuns > 3) {
    recs.push({
      id: 'risk-delivery-reliability',
      title: 'Reduce AI delivery failure rate — reliability risk growing',
      description: `${failedRuns} AI Workforce failures create a pattern of unreliable delivery that, if unchecked, will damage customer trust.`,
      category: 'risk',
      priority: 'high',
      businessImpact:
        'AI delivery reliability is the core product promise — failures are direct brand risk',
      estimatedROI: 'Prevention of NPS damage and churn attributable to AI delivery failures',
      estimatedTimeSaved: 'Prevention of ~2 hours/failure of post-incident management',
      confidence: 85,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'Investigation only — no production changes without approval',
      requiresFounderApproval: false,
      recommendedNextStep:
        'CTO Agent to identify common failure modes and propose reliability improvements',
    })
  }

  if (health.overall === 'warning' || health.overall === 'critical') {
    recs.push({
      id: 'risk-platform-health',
      title: `Address platform health degradation — status is ${health.overall}`,
      description:
        'Platform health signals indicate degradation that, if unaddressed, can become a customer-visible incident.',
      category: 'platform',
      priority: health.overall === 'critical' ? 'critical' : 'high',
      businessImpact: 'Platform incidents directly impact customer trust and retention',
      estimatedROI: 'Prevention of potential downtime incident cost',
      estimatedTimeSaved: '4–8 hours of incident response avoided per prevented outage',
      confidence: 90,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'None — investigation and monitoring',
      requiresFounderApproval: false,
      recommendedNextStep:
        'CTO Agent to diagnose platform health signals and produce resolution timeline',
    })
  }

  recs.push({
    id: 'risk-single-point-founder',
    title: 'Reduce founder as single point of failure',
    description:
      'All critical decisions routing through the founder creates a bottleneck and single-point-of-failure risk. Agent delegation with clear authority boundaries reduces this dependency.',
    category: 'risk',
    priority: 'medium',
    businessImpact:
      'Business resilience improves when agents can act on routine decisions autonomously',
    estimatedROI:
      '3–5 hours/week of founder time recovered; company operates during founder unavailability',
    estimatedTimeSaved: '3–5 hours/week',
    confidence: 72,
    suggestedAgent: 'CTO Agent',
    dependencies: [],
    risk: 'Low — structured delegation with defined boundaries and escalation paths',
    requiresFounderApproval: true,
    recommendedNextStep:
      'Define agent authority matrix: what each agent can do without approval, and what always requires the founder',
  })

  return recs
}

// ─── Cost Reduction ────────────────────────────────────────────────────────────

export function deriveCostReduction(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[]
): OptimizationRecommendation[] {
  const recs: OptimizationRecommendation[] = []
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const approvalCount = agentTasks.filter((t) => t.requiresApproval).length

  if (failedRuns > 0) {
    recs.push({
      id: 'cost-failed-run-compute',
      title: 'Eliminate wasted compute from failed AI Workforce runs',
      description: `${failedRuns} failed run${failedRuns !== 1 ? 's' : ''} consume compute without delivering value. Fixing root causes eliminates this waste.`,
      category: 'engineering',
      priority: 'medium',
      businessImpact: 'Compute cost reduction proportional to failure rate',
      estimatedROI: `${failedRuns} run${failedRuns !== 1 ? 's' : ''} worth of compute recovered per cycle`,
      estimatedTimeSaved: 'N/A — cost reduction, not time',
      confidence: 80,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'None — fixing failures is always beneficial',
      requiresFounderApproval: false,
      recommendedNextStep:
        'CTO Agent to identify most common failure type and fix root cause first',
    })
  }

  if (approvalCount > 5) {
    recs.push({
      id: 'cost-approval-overhead',
      title: 'Reduce approval overhead through structured delegation',
      description: `${approvalCount} tasks require founder approval. High approval volume is an organizational cost — each decision consumes 5–15 minutes of founder time.`,
      category: 'founder-productivity',
      priority: 'medium',
      businessImpact: `${approvalCount * 10} min/cycle of founder decision time currently consumed`,
      estimatedROI: 'Potential 40–60% reduction with structured delegation policy',
      estimatedTimeSaved: `${Math.round(approvalCount * 0.5 * 10)} min/cycle`,
      confidence: 73,
      suggestedAgent: 'CTO Agent',
      dependencies: [],
      risk: 'Low — delegation policy defines clear boundaries',
      requiresFounderApproval: true,
      recommendedNextStep:
        'Classify approval tasks by risk level; auto-approve low-risk, high-confidence items',
    })
  }

  if (supportData.stats.totalOpen > 0 && supportData.stats.autoResolved === 0) {
    recs.push({
      id: 'cost-support-manual',
      title: 'Reduce manual support cost through AI resolution expansion',
      description:
        'Zero auto-resolved tickets means all support requires human review. Each resolved ticket costs ~20 min of agent or founder time.',
      category: 'support',
      priority: 'high',
      businessImpact: `${supportData.stats.totalOpen * 20} min of support time currently manual per cycle`,
      estimatedROI: `${Math.round(supportData.stats.totalOpen * 0.6 * 20)} min/cycle saved at 60% auto-resolution`,
      estimatedTimeSaved: `${Math.round(supportData.stats.totalOpen * 0.6 * 20)} min/cycle`,
      confidence: 82,
      suggestedAgent: 'Support Manager Agent',
      dependencies: [],
      risk: 'Low — incremental automation with confidence thresholds',
      requiresFounderApproval: false,
      recommendedNextStep:
        'Expand Support Agent auto-resolution authority for high-confidence ticket categories',
    })
  }

  return recs
}

// ─── Agent Efficiency Records ──────────────────────────────────────────────────

export function deriveAgentEfficiency(
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): AgentEfficiency[] {
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
    const waitingJobs = jobs.filter((j) => j.stage === 'waiting_approval').length
    const totalJobs = jobs.length

    let currentEfficiency = 50
    if (avgConfidence > 0) currentEfficiency = Math.min(95, avgConfidence)
    if (tasks.length === 0) currentEfficiency = 30

    const estimatedCapacity =
      totalJobs === 0 ? 90 : Math.max(20, Math.min(95, 95 - waitingJobs * 10))

    let recommendedWorkload: AgentEfficiency['recommendedWorkload']
    if (tasks.length === 0) {
      recommendedWorkload = 'increase'
    } else if (waitingJobs > 2) {
      recommendedWorkload = 'reduce'
    } else {
      recommendedWorkload = 'maintain'
    }

    const optimizationSuggestions: string[] = []
    if (avgConfidence > 0 && avgConfidence < 70) {
      optimizationSuggestions.push(
        'Supplement with more platform-specific context to improve confidence'
      )
    }
    if (waitingJobs > 1) {
      optimizationSuggestions.push(
        `Clear ${waitingJobs} waiting approval${waitingJobs !== 1 ? 's' : ''} to unblock execution`
      )
    }
    if (tasks.length === 0) {
      optimizationSuggestions.push(`Assign active tasks in the ${domain} domain`)
    }
    if (optimizationSuggestions.length === 0) {
      optimizationSuggestions.push('Operating efficiently — maintain current workload')
    }

    const delegationOpportunities: string[] = []
    if (tasks.length > 3) {
      delegationOpportunities.push(
        'Routine low-risk tasks can be auto-approved without founder review'
      )
    }
    if (avgConfidence >= 80) {
      delegationOpportunities.push(
        'High confidence — consider expanding auto-approval threshold for this agent'
      )
    }

    return {
      agentId: id,
      agentName: name,
      domain,
      currentEfficiency,
      estimatedCapacity,
      recommendedWorkload,
      optimizationSuggestions,
      delegationOpportunities,
      improvementTrend: 'insufficient-data' as const,
    }
  })
}

// ─── Optimization Score ────────────────────────────────────────────────────────

export function deriveOptimizationScore(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[]
): number {
  const { revenue, health } = executiveData
  const failedRuns = workforceData.workforces.reduce((s, w) => s + w.failedRuns, 0)
  const orgCount = safeInt(health.activeOrganizations.value)
  const approvalCount = agentTasks.filter((t) => t.requiresApproval).length

  let score = 40
  if (revenue.stripeConnected) score += 15
  if (orgCount > 0) score += 10
  if (supportData.stats.escalations === 0) score += 8
  if (failedRuns === 0) score += 8
  if (approvalCount <= 3) score += 6
  if (supportData.stats.autoResolved > 0) score += 5
  if (health.overall === 'healthy') score += 8
  if (revenue.pastDue === 0 && revenue.stripeConnected) score += 5
  if (workforceData.totalRunsAllWorkforces > 0) score += 5

  score -= Math.min(20, revenue.pastDue * 5)
  score -= Math.min(15, supportData.stats.escalations * 5)
  score -= Math.min(12, failedRuns * 3)
  score -= Math.min(10, Math.max(0, approvalCount - 3) * 2)

  return Math.max(5, Math.min(100, score))
}

// ─── Priority sort ────────────────────────────────────────────────────────────

export function deriveOptimizationPriority(
  candidates: OptimizationRecommendation[]
): OptimizationRecommendation[] {
  return [...candidates].sort(
    (a, b) =>
      PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority] || b.confidence - a.confidence
  )
}

// ─── Build function ───────────────────────────────────────────────────────────

export function buildOptimizationData(
  executiveData: ExecutiveData,
  supportData: SupportData,
  workforceData: WorkforceStatusData,
  agentTasks: AgentTask[],
  execJobs: ExecutionJob[]
): OptimizationData {
  const revenueOpportunities = deriveRevenueOpportunities(executiveData)
  const automationCandidates = deriveAutomationCandidates(executiveData, supportData, workforceData)
  const timeSavings = deriveTimeSavings(supportData, agentTasks, execJobs)
  const supportImprovements = deriveSupportOptimization(supportData)
  const engineeringImprovements = deriveEngineeringOptimization(
    executiveData,
    workforceData,
    agentTasks
  )
  const growthImprovements = deriveGrowthOpportunities(executiveData)
  const agentOptimization = deriveAgentOptimization(agentTasks, execJobs)
  const riskReduction = deriveRiskReduction(executiveData, supportData, workforceData)
  const costReduction = deriveCostReduction(executiveData, supportData, workforceData, agentTasks)
  const agentEfficiency = deriveAgentEfficiency(agentTasks, execJobs)

  // Category slices for specific sections
  const billingImprovements = [
    ...revenueOpportunities.filter((r) => r.category === 'billing'),
    ...supportImprovements.filter((r) => r.category === 'billing'),
  ]
  const marketingImprovements = growthImprovements.filter((r) => r.category === 'marketing')
  const customerSuccessImprovements = growthImprovements.filter(
    (r) => r.category === 'customer-success'
  )

  // Top opportunities: union of all, sorted by priority
  const allRecs: OptimizationRecommendation[] = [
    ...revenueOpportunities,
    ...automationCandidates,
    ...timeSavings,
    ...supportImprovements,
    ...engineeringImprovements,
    ...growthImprovements,
    ...agentOptimization,
    ...riskReduction,
    ...costReduction,
  ]

  // Deduplicate by id
  const seen = new Set<string>()
  const unique = allRecs.filter((r) => {
    if (seen.has(r.id)) return false
    seen.add(r.id)
    return true
  })

  const topOpportunities = deriveOptimizationPriority(unique).slice(0, 8)
  const highestROI = deriveOptimizationPriority(unique)
    .filter((r) => r.priority === 'critical' || r.priority === 'high')
    .slice(0, 5)

  const delegationOpportunities = unique.filter((r) => r.category === 'founder-productivity')

  const highestROIRecommendation = highestROI[0] ?? null
  const mostExpensiveBottleneck =
    unique.find((r) => r.category === 'execution' || r.category === 'founder-productivity') ?? null
  const mostValuableAutomation =
    automationCandidates.find((r) => r.priority === 'critical' || r.priority === 'high') ?? null

  const sortedByLoad = agentEfficiency
    .slice()
    .sort((a, b) => a.estimatedCapacity - b.estimatedCapacity)
  const mostOverloadedAgent = sortedByLoad[0]?.agentName ?? null
  const mostUnderutilizedAgent =
    agentEfficiency.find((a) => a.recommendedWorkload === 'increase')?.agentName ?? null

  const optimizationScore = deriveOptimizationScore(
    executiveData,
    supportData,
    workforceData,
    agentTasks
  )

  const criticalCount = unique.filter((r) => r.priority === 'critical').length
  const dailyImprovementGoal =
    criticalCount > 0
      ? `Resolve ${criticalCount} critical optimization${criticalCount !== 1 ? 's' : ''} today`
      : highestROIRecommendation
        ? `Start: ${highestROIRecommendation.title}`
        : 'No immediate critical optimizations — maintain current trajectory'

  const highCount = unique.filter((r) => r.priority === 'high').length
  const weeklyImprovementGoal =
    highCount > 0
      ? `Clear ${highCount} high-priority optimization${highCount !== 1 ? 's' : ''} this week`
      : 'Focus on medium-priority optimizations and agent calibration this week'

  const predictedCompanyImprovement =
    optimizationScore >= 80
      ? 'Company is operating near peak efficiency — marginal gains available'
      : optimizationScore >= 55
        ? `Addressing top opportunities could raise Intelligence Score by 10–20 points`
        : `Resolving critical optimizations could raise Intelligence Score by 20–35 points`

  const totalTimeSavedMin = timeSavings.reduce((s, r) => {
    const match = r.estimatedTimeSaved.match(/(\d+)/)
    return s + (match ? parseInt(match[1], 10) : 0)
  }, 0)
  const founderTimeSaved =
    totalTimeSavedMin > 0
      ? `~${totalTimeSavedMin} min/cycle recoverable with recommended changes`
      : 'Baseline — connect more integrations to identify time savings'

  return {
    topOpportunities,
    highestROI,
    automationCandidates,
    timeSavings,
    revenueOpportunities,
    costReduction,
    supportImprovements,
    engineeringImprovements,
    marketingImprovements,
    billingImprovements,
    growthImprovements,
    customerSuccessImprovements,
    agentOptimization,
    riskReduction,
    agentEfficiency,
    optimizationScore,
    dailyImprovementGoal,
    weeklyImprovementGoal,
    highestROIRecommendation,
    mostExpensiveBottleneck,
    mostValuableAutomation,
    mostUnderutilizedAgent,
    mostOverloadedAgent,
    predictedCompanyImprovement,
    founderTimeSaved,
    delegationOpportunities,
    generatedAt: executiveData.generatedAt,
  }
}

// ─── Async entry point ────────────────────────────────────────────────────────

export async function getOptimizationData(): Promise<OptimizationData> {
  const [executiveData, supportData, workforceData] = await Promise.all([
    getExecutiveData(),
    getSupportData(),
    getWorkforceStatusData(),
  ])
  const agentTasks = buildAgentTasks(executiveData)
  const execJobs = buildExecutionJobs(agentTasks, supportData.tickets, executiveData.generatedAt)
  return buildOptimizationData(executiveData, supportData, workforceData, agentTasks, execJobs)
}
