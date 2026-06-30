import { getExecutiveData } from '../executive/executive-data'
import { buildAgentTasks } from '../agents/agent-tasks'
import { getSupportData } from '../support/support-data'
import type { AgentTask } from '../agents/agent-tasks'
import type { SupportTicket } from '../support/support-data'

export type ExecutionStage =
  | 'queued'
  | 'planning'
  | 'executing'
  | 'verification'
  | 'completed'
  | 'waiting_approval'
  | 'failed'

export interface ExecutionEvent {
  stage: string
  timestamp: string
  note: string
}

export interface ExecutionJob {
  id: string
  agentId: string
  agentName: string
  title: string
  description: string
  stage: ExecutionStage
  priority: 'critical' | 'high' | 'medium' | 'low'
  confidenceScore: number
  estimatedImpact: string
  estimatedCompletionTime: string
  rollbackAvailable: boolean
  requiresFounderApproval: boolean
  blockedReason: string | null
  sourceType: 'agent-task' | 'support-ticket'
  sourceId: string
  href: string
  createdAt: string
  timeline: ExecutionEvent[]
}

export interface ExecutionMetrics {
  active: number
  queued: number
  running: number
  completedToday: number
  failedToday: number
  waitingApproval: number
  avgExecutionTime: string
  successRate: number | null
  estimatedBusinessImpact: string
}

export interface AgentUtilizationRecord {
  agentId: string
  agentName: string
  domain: string
  totalJobs: number
  waitingApproval: number
  queued: number
  avgConfidence: number
}

export interface ExecutionData {
  jobs: ExecutionJob[]
  metrics: ExecutionMetrics
  agentUtilization: AgentUtilizationRecord[]
  generatedAt: string
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

const AGENT_DOMAINS: Record<string, string> = {
  cto: 'Infrastructure & Technical',
  cfo: 'Billing & Revenue',
  cmo: 'Marketing & Growth',
  'customer-success': 'Customer Success',
  'support-manager': 'Support Platform',
  'content-director': 'Content & Knowledge',
  support: 'General Support Triage',
  billing: 'Billing Issues',
  technical: 'AI Workforce & Tech',
  onboarding: 'Customer Onboarding',
  knowledge: 'Documentation',
  escalation: 'Escalation Handling',
}

function taskConfidence(task: AgentTask): number {
  if (task.priority === 'critical') return 95
  switch (task.agentId) {
    case 'cfo':
      return 90
    case 'cto':
      return 82
    case 'customer-success':
      return 76
    case 'content-director':
      return 70
    case 'support-manager':
      return 65
    case 'cmo':
      return 62
    default:
      return 70
  }
}

function taskImpact(task: AgentTask): string {
  if (task.priority === 'critical') return 'Business-critical: platform operations blocked'
  if (task.agentId === 'cfo') {
    return task.id === 'cfo-past-due'
      ? 'Revenue at risk: payment recovery required'
      : 'Revenue blocked: payment processing unavailable'
  }
  if (task.agentId === 'cto' && task.priority === 'high')
    return 'Platform reliability: customer impact possible'
  if (task.agentId === 'customer-success' && task.id === 'cs-first-customer')
    return 'Growth blocked: first revenue acquisition delayed'
  if (task.priority === 'high') return 'High operational impact: action required soon'
  if (task.priority === 'medium') return 'Operational improvement: visibility and efficiency'
  return 'Low impact: platform optimization and configuration'
}

function taskCompletionTime(task: AgentTask): string {
  if (task.requiresApproval) return 'Pending founder approval'
  if (task.priority === 'critical') return '< 1 hour (urgent action required)'
  if (task.priority === 'high') return '1–4 hours once approved'
  if (task.priority === 'medium') return '4–24 hours'
  return '1–3 days'
}

function ticketImpact(ticket: SupportTicket): string {
  switch (ticket.sourceType) {
    case 'billing-issue':
      return 'Revenue impact: customer payment has failed'
    case 'failed-run':
      return 'Service impact: AI Workforce delivery degraded'
    case 'onboarding':
      return 'Growth impact: customer time-to-value delayed'
    default:
      return 'Operational impact: platform error events detected'
  }
}

function ticketCompletionTime(ticket: SupportTicket): string {
  if (ticket.requiresFounderApproval) return 'Pending founder approval'
  return '< 2 hours (agent review in progress)'
}

export function buildExecutionJobs(
  agentTasks: AgentTask[],
  supportTickets: SupportTicket[],
  generatedAt: string
): ExecutionJob[] {
  const jobs: ExecutionJob[] = []

  for (const task of agentTasks) {
    const stage: ExecutionStage = task.requiresApproval ? 'waiting_approval' : 'queued'
    const confidence = taskConfidence(task)

    jobs.push({
      id: `exec-task-${task.id}`,
      agentId: task.agentId,
      agentName: task.agentName,
      title: task.description,
      description: task.recommendedAction,
      stage,
      priority: task.priority,
      confidenceScore: confidence,
      estimatedImpact: taskImpact(task),
      estimatedCompletionTime: taskCompletionTime(task),
      rollbackAvailable: false,
      requiresFounderApproval: task.requiresApproval,
      blockedReason: task.requiresApproval
        ? 'Awaiting founder approval'
        : 'Queued — pending integration or manual action',
      sourceType: 'agent-task',
      sourceId: task.id,
      href: task.requiresApproval ? '/tower/approvals' : task.href,
      createdAt: generatedAt,
      timeline: [
        {
          stage: 'created',
          timestamp: generatedAt,
          note: `Task identified by ${task.agentName}`,
        },
        {
          stage,
          timestamp: generatedAt,
          note: task.requiresApproval
            ? 'Queued for founder approval before execution'
            : 'Queued for automatic execution — pending integration setup',
        },
      ],
    })
  }

  for (const ticket of supportTickets) {
    if (ticket.status === 'closed' || ticket.status === 'ai-resolved') continue
    const stage: ExecutionStage = ticket.requiresFounderApproval ? 'waiting_approval' : 'queued'

    jobs.push({
      id: `exec-support-${ticket.id}`,
      agentId: ticket.assignedAgentId,
      agentName: ticket.assignedAgentName,
      title: ticket.title,
      description: ticket.description,
      stage,
      priority: ticket.priority,
      confidenceScore: ticket.confidenceScore,
      estimatedImpact: ticketImpact(ticket),
      estimatedCompletionTime: ticketCompletionTime(ticket),
      rollbackAvailable: false,
      requiresFounderApproval: ticket.requiresFounderApproval,
      blockedReason: ticket.requiresFounderApproval
        ? 'Billing action requires founder approval'
        : 'Support agent reviewing — action queued',
      sourceType: 'support-ticket',
      sourceId: ticket.id,
      href: ticket.requiresFounderApproval ? '/tower/approvals' : '/tower/support',
      createdAt: ticket.createdAt,
      timeline: [
        {
          stage: 'created',
          timestamp: ticket.createdAt,
          note: `Incident detected — assigned to ${ticket.assignedAgentName}`,
        },
        {
          stage,
          timestamp: ticket.createdAt,
          note: ticket.requiresFounderApproval
            ? 'Awaiting founder approval before agent can act'
            : 'Agent reviewing — action queued',
        },
      ],
    })
  }

  return jobs.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

export function buildExecutionMetrics(jobs: ExecutionJob[]): ExecutionMetrics {
  const waitingApproval = jobs.filter((j) => j.stage === 'waiting_approval').length
  const queued = jobs.filter((j) => j.stage === 'queued').length
  const running = jobs.filter((j) => j.stage === 'executing').length
  const active = jobs.filter((j) => j.stage === 'planning' || j.stage === 'executing').length

  const criticalJobs = jobs.filter((j) => j.priority === 'critical')
  const highBillingJobs = jobs.filter((j) => j.priority === 'high' && j.agentId === 'cfo')

  let estimatedBusinessImpact: string
  if (criticalJobs.length > 0) {
    estimatedBusinessImpact = `${criticalJobs.length} critical issue${criticalJobs.length !== 1 ? 's' : ''} blocking platform operations`
  } else if (highBillingJobs.length > 0) {
    estimatedBusinessImpact = 'Payment processing unavailable — revenue impact active'
  } else if (waitingApproval > 0) {
    estimatedBusinessImpact = `${waitingApproval} task${waitingApproval !== 1 ? 's' : ''} awaiting approval to unblock progress`
  } else if (queued > 0) {
    estimatedBusinessImpact = `${queued} improvement${queued !== 1 ? 's' : ''} queued — low to medium impact`
  } else {
    estimatedBusinessImpact = 'No blocking execution items — platform healthy'
  }

  return {
    active,
    queued,
    running,
    completedToday: 0,
    failedToday: 0,
    waitingApproval,
    avgExecutionTime: 'No history',
    successRate: null,
    estimatedBusinessImpact,
  }
}

export function buildAgentUtilization(jobs: ExecutionJob[]): AgentUtilizationRecord[] {
  const byAgent = new Map<string, ExecutionJob[]>()
  for (const job of jobs) {
    const existing = byAgent.get(job.agentId) ?? []
    existing.push(job)
    byAgent.set(job.agentId, existing)
  }

  const records: AgentUtilizationRecord[] = []
  for (const [agentId, agentJobs] of byAgent) {
    if (agentJobs.length === 0) continue
    const avgConfidence = Math.round(
      agentJobs.reduce((s, j) => s + j.confidenceScore, 0) / agentJobs.length
    )
    records.push({
      agentId,
      agentName: agentJobs[0].agentName,
      domain: AGENT_DOMAINS[agentId] ?? 'Unknown',
      totalJobs: agentJobs.length,
      waitingApproval: agentJobs.filter((j) => j.stage === 'waiting_approval').length,
      queued: agentJobs.filter((j) => j.stage === 'queued').length,
      avgConfidence,
    })
  }

  return records.sort((a, b) => b.totalJobs - a.totalJobs)
}

export async function getExecutionData(): Promise<ExecutionData> {
  const [executiveData, supportData] = await Promise.all([getExecutiveData(), getSupportData()])

  const agentTasks = buildAgentTasks(executiveData)
  const generatedAt = executiveData.generatedAt

  const jobs = buildExecutionJobs(agentTasks, supportData.tickets, generatedAt)
  const metrics = buildExecutionMetrics(jobs)
  const agentUtilization = buildAgentUtilization(jobs)

  return { jobs, metrics, agentUtilization, generatedAt }
}
