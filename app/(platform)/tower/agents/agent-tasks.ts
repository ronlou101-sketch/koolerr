import { getExecutiveData } from '../executive/executive-data'
import type { ExecutiveData } from '../executive/executive-data'

export type AgentId =
  | 'cto'
  | 'cfo'
  | 'cmo'
  | 'customer-success'
  | 'support-manager'
  | 'content-director'

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface AgentTask {
  id: string
  agentId: AgentId
  agentName: string
  priority: TaskPriority
  description: string
  source: string
  recommendedAction: string
  requiresApproval: boolean
  href: string
}

export interface AgentTaskSet {
  tasks: AgentTask[]
  generatedAt: string
}

export const AGENT_NAMES: Record<AgentId, string> = {
  cto: 'CTO Agent',
  cfo: 'CFO Agent',
  cmo: 'CMO Agent',
  'customer-success': 'Customer Success Agent',
  'support-manager': 'Support Manager Agent',
  'content-director': 'Content Director Agent',
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function buildAgentTasks(data: ExecutiveData): AgentTask[] {
  const { health, revenue, actionQueue } = data
  const tasks: AgentTask[] = []

  // ── CTO Agent ──────────────────────────────────────────────────────────────

  if (health.database.status === 'critical') {
    tasks.push({
      id: 'cto-db-critical',
      agentId: 'cto',
      agentName: AGENT_NAMES.cto,
      priority: 'critical',
      description: 'Database connection failure — all platform operations are blocked',
      source: 'Platform Health Monitor',
      recommendedAction:
        'Verify Supabase project status and connection credentials immediately. No other tasks can proceed until this is resolved.',
      requiresApproval: false,
      href: '/tower/health/database',
    })
  }

  if (health.engagementRuns.status === 'warning' || health.engagementRuns.status === 'critical') {
    tasks.push({
      id: 'cto-failed-runs',
      agentId: 'cto',
      agentName: AGENT_NAMES.cto,
      priority: health.engagementRuns.status === 'critical' ? 'critical' : 'high',
      description: `Failed AI Workforce runs detected — ${health.engagementRuns.detail}`,
      source: 'AI Workforce Monitor',
      recommendedAction:
        'Approve investigation and re-execution of failed runs. Review root cause before re-triggering.',
      requiresApproval: true,
      href: '/tower/health/runs',
    })
  }

  if (health.auditLog.status === 'warning') {
    tasks.push({
      id: 'cto-audit-errors',
      agentId: 'cto',
      agentName: AGENT_NAMES.cto,
      priority: 'medium',
      description: `Error events detected in audit log — ${health.auditLog.detail}`,
      source: 'Audit Log Monitor',
      recommendedAction:
        'Review error events in the audit log to identify and resolve the underlying cause.',
      requiresApproval: false,
      href: '/tower/health/audit',
    })
  }

  if (health.apiHealth.status === 'not-configured') {
    tasks.push({
      id: 'cto-api-monitoring',
      agentId: 'cto',
      agentName: AGENT_NAMES.cto,
      priority: 'high',
      description:
        'Platform is operating without API monitoring — response times and errors are invisible',
      source: 'Observability Review',
      recommendedAction:
        'Approve selection and integration of a monitoring service (Datadog, Sentry, or New Relic).',
      requiresApproval: true,
      href: '/tower/health/api',
    })
  }

  if (health.deployments.status === 'not-configured') {
    tasks.push({
      id: 'cto-deployment-tracking',
      agentId: 'cto',
      agentName: AGENT_NAMES.cto,
      priority: 'medium',
      description:
        'Deployment tracking not connected — production releases are not visible in Tower',
      source: 'Infrastructure Review',
      recommendedAction:
        'Approve adding Vercel API credentials (VERCEL_API_TOKEN + VERCEL_PROJECT_ID) to enable deployment visibility.',
      requiresApproval: true,
      href: '/tower/health/deployments',
    })
  }

  if (health.backgroundJobs.status === 'not-configured') {
    tasks.push({
      id: 'cto-job-queue',
      agentId: 'cto',
      agentName: AGENT_NAMES.cto,
      priority: 'medium',
      description:
        'No background job queue configured — long-running tasks execute synchronously on the request path',
      source: 'Architecture Review',
      recommendedAction:
        'Approve implementation of async task processing (BullMQ, Inngest, or job_queue table).',
      requiresApproval: true,
      href: '/tower/health/jobs',
    })
  }

  // ── CFO Agent ──────────────────────────────────────────────────────────────

  if (!revenue.stripeConnected) {
    tasks.push({
      id: 'cfo-stripe-not-configured',
      agentId: 'cfo',
      agentName: AGENT_NAMES.cfo,
      priority: 'high',
      description:
        'Stripe is not connected — billing cannot process customer payments or track subscriptions',
      source: 'Billing Health Monitor',
      recommendedAction:
        'Approve Stripe integration. Connect account and link existing subscription records to Stripe IDs.',
      requiresApproval: true,
      href: '/tower/health/billing',
    })
  }

  if (revenue.pastDue > 0) {
    tasks.push({
      id: 'cfo-past-due',
      agentId: 'cfo',
      agentName: AGENT_NAMES.cfo,
      priority: 'high',
      description: `${revenue.pastDue} subscription${revenue.pastDue !== 1 ? 's are' : ' is'} past due — payment failures detected, revenue at risk`,
      source: 'Subscription Health Monitor',
      recommendedAction:
        'Approve direct outreach to affected customers and review Stripe dunning configuration.',
      requiresApproval: true,
      href: '/tower/health/billing',
    })
  }

  // ── CMO Agent ──────────────────────────────────────────────────────────────

  tasks.push({
    id: 'cmo-marketing-stack',
    agentId: 'cmo',
    agentName: AGENT_NAMES.cmo,
    priority: 'medium',
    description:
      'Marketing funnel has no data source — website traffic, leads, and conversions are invisible',
    source: 'Marketing Command Center',
    recommendedAction:
      'Approve selection and configuration of a marketing analytics stack (GA4, PostHog, or Plausible).',
    requiresApproval: true,
    href: '/tower/marketing',
  })

  tasks.push({
    id: 'cmo-crm-not-configured',
    agentId: 'cmo',
    agentName: AGENT_NAMES.cmo,
    priority: 'low',
    description: 'No CRM connected — lead pipeline and customer relationships are not tracked',
    source: 'Marketing Command Center',
    recommendedAction:
      'Approve CRM selection (HubSpot, Attio, or Pipedrive) once the first customer is acquired.',
    requiresApproval: true,
    href: '/tower/marketing',
  })

  // ── Customer Success Agent ──────────────────────────────────────────────────

  const noCustomers = actionQueue.some((a) => a.id === 'no-customers')
  if (noCustomers) {
    tasks.push({
      id: 'cs-first-customer',
      agentId: 'customer-success',
      agentName: AGENT_NAMES['customer-success'],
      priority: 'high',
      description:
        'No customer organizations onboarded — the platform has not been validated end-to-end with a real customer',
      source: 'Customer Health Monitor',
      recommendedAction:
        'Approve and initiate first customer onboarding plan to validate provisioning, billing, and AI Workforce flow.',
      requiresApproval: true,
      href: '/tower/customer-success',
    })
  }

  tasks.push({
    id: 'cs-onboarding-not-configured',
    agentId: 'customer-success',
    agentName: AGENT_NAMES['customer-success'],
    priority: 'medium',
    description:
      'Customer onboarding sequence is not automated — new customers require manual setup',
    source: 'Customer Success Review',
    recommendedAction:
      'Approve design and implementation of an automated onboarding workflow before customer acquisition.',
    requiresApproval: true,
    href: '/tower/customer-success',
  })

  tasks.push({
    id: 'cs-health-scores-not-configured',
    agentId: 'customer-success',
    agentName: AGENT_NAMES['customer-success'],
    priority: 'low',
    description:
      'Customer health scores are not configured — churn signals cannot be detected automatically',
    source: 'Customer Success Review',
    recommendedAction:
      'Approve definition of health score criteria and implementation of churn signal monitoring.',
    requiresApproval: true,
    href: '/tower/customer-success',
  })

  // ── Support Manager Agent ────────────────────────────────────────────────

  tasks.push({
    id: 'support-platform-not-configured',
    agentId: 'support-manager',
    agentName: AGENT_NAMES['support-manager'],
    priority: 'low',
    description:
      'Support platform is not configured — no ticket management or AI triage available for customers',
    source: 'Support Center',
    recommendedAction:
      'Approve selection of a helpdesk platform (Intercom, Linear Issues, or Freshdesk) and configure before launch.',
    requiresApproval: true,
    href: '/tower/support',
  })

  // ── Content Director Agent ───────────────────────────────────────────────

  tasks.push({
    id: 'content-kb-not-configured',
    agentId: 'content-director',
    agentName: AGENT_NAMES['content-director'],
    priority: 'low',
    description: 'Knowledge base is not configured — customers have no self-service documentation',
    source: 'Knowledge Base',
    recommendedAction:
      'Approve selection of a knowledge base platform and creation of core product documentation.',
    requiresApproval: true,
    href: '/tower/knowledge-base',
  })

  tasks.push({
    id: 'content-feedback-not-configured',
    agentId: 'content-director',
    agentName: AGENT_NAMES['content-director'],
    priority: 'low',
    description:
      'Product feedback collection is not configured — customer feature requests and bug reports have no intake channel',
    source: 'Product Feedback',
    recommendedAction:
      'Approve feedback platform selection (Canny, Frill, or custom table) and add widget to customer dashboard.',
    requiresApproval: true,
    href: '/tower/feedback',
  })

  return tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

export async function getAgentTasks(): Promise<AgentTaskSet> {
  const data = await getExecutiveData()
  return {
    tasks: buildAgentTasks(data),
    generatedAt: data.generatedAt,
  }
}
