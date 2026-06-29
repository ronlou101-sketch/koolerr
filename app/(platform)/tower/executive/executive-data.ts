import { createServerSupabaseClient } from '@/shared/lib/supabase-server'
import { getPlatformHealth } from '../health/health-data'
import type { PlatformHealthData } from '../health/health-data'

export type { PlatformHealthData }
export type { HealthStatus } from '../health/health-data'

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low'

export interface ActionItem {
  id: string
  priority: ActionPriority
  title: string
  reason: string
  recommendedAction: string
  href: string
}

export interface ExecutiveSummary {
  headline: string
  statusLevel: 'good' | 'attention' | 'critical'
  bullets: string[]
  priorities: string[]
}

export interface RevenueSnapshot {
  active: number
  trialing: number
  pastDue: number
  canceled: number
  total: number
  planBreakdown: Array<{ planId: string; count: number }>
  stripeConnected: boolean
  mrrNote: string
}

export interface RecentActivityData {
  events: Array<{
    action: string
    outcome: string
    actorType: string
    occurredAt: string
  }>
  total24h: number
}

export interface ExecutiveData {
  health: PlatformHealthData
  summary: ExecutiveSummary
  actionQueue: ActionItem[]
  revenue: RevenueSnapshot
  recentActivity: RecentActivityData
  newCustomers: { orgsLast24h: number; usersLast24h: number }
  generatedAt: string
}

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function buildActionQueue(p: {
  health: PlatformHealthData
  stripeConnected: boolean
  pastDueSubs: number
  failedRuns: number
  auditErrors: number
  orgCount: number
}): ActionItem[] {
  const items: ActionItem[] = []

  if (p.health.database.status === 'critical') {
    items.push({
      id: 'db-critical',
      priority: 'critical',
      title: 'Database Connection Failure',
      reason: 'The platform database is unreachable. All customer operations are blocked.',
      recommendedAction:
        'Check Supabase project status and verify connection credentials immediately.',
      href: '/tower/health/database',
    })
  }

  if (!p.stripeConnected) {
    items.push({
      id: 'stripe-not-configured',
      priority: 'high',
      title: 'Stripe Not Configured',
      reason: 'No Stripe subscription IDs exist. Billing cannot process customer payments.',
      recommendedAction:
        'Complete Stripe integration and link existing subscriptions to Stripe IDs.',
      href: '/tower/health/billing',
    })
  }

  if (p.pastDueSubs > 0) {
    items.push({
      id: 'past-due-subs',
      priority: 'high',
      title: `${p.pastDueSubs} Past Due Subscription${p.pastDueSubs !== 1 ? 's' : ''}`,
      reason: `${p.pastDueSubs} customer${p.pastDueSubs !== 1 ? 's have' : ' has'} a failed payment. Revenue at risk and service may be suspended.`,
      recommendedAction:
        'Review Stripe dunning settings and follow up directly with affected customers.',
      href: '/tower/health/billing',
    })
  }

  if (p.orgCount === 0) {
    items.push({
      id: 'no-customers',
      priority: 'high',
      title: 'No Customers Onboarded',
      reason:
        'The platform has no provisioned organizations. The end-to-end customer journey has not been validated.',
      recommendedAction:
        'Onboard your first customer to validate provisioning, billing, and AI Workforce end-to-end.',
      href: '/tower/orgs',
    })
  }

  if (p.failedRuns > 0) {
    items.push({
      id: 'failed-runs',
      priority: 'medium',
      title: `${p.failedRuns} Failed Engagement Run${p.failedRuns !== 1 ? 's' : ''}`,
      reason: `${p.failedRuns} AI Workforce task${p.failedRuns !== 1 ? 's' : ''} did not complete. Affected customers may be impacted.`,
      recommendedAction:
        'Review failed runs, identify the root cause, and re-trigger or contact affected customers.',
      href: '/tower/health/runs',
    })
  }

  if (p.auditErrors > 0) {
    items.push({
      id: 'audit-errors',
      priority: 'medium',
      title: `${p.auditErrors} Audit Error${p.auditErrors !== 1 ? 's' : ''} in Last 24h`,
      reason: `${p.auditErrors} error-outcome event${p.auditErrors !== 1 ? 's were' : ' was'} recorded in the platform audit log.`,
      recommendedAction:
        'Review error events in the audit log to identify and resolve the underlying cause.',
      href: '/tower/health/audit',
    })
  }

  if (p.health.apiHealth.status === 'not-configured') {
    items.push({
      id: 'api-monitoring',
      priority: 'low',
      title: 'API Monitoring Not Connected',
      reason: 'Platform is operating without visibility into API response times or error rates.',
      recommendedAction:
        'Connect a monitoring service (Datadog, New Relic, or Sentry) to enable API health tracking.',
      href: '/tower/health/api',
    })
  }

  if (p.health.deployments.status === 'not-configured') {
    items.push({
      id: 'deployment-tracking',
      priority: 'low',
      title: 'Deployment Tracking Not Connected',
      reason: 'Production deployment history is not visible from Tower Control.',
      recommendedAction:
        'Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID environment variables to enable deployment tracking.',
      href: '/tower/health/deployments',
    })
  }

  items.push({
    id: 'marketing-not-configured',
    priority: 'low',
    title: 'Marketing Funnel Not Connected',
    reason:
      'Website traffic, lead funnel, and conversion metrics are not yet connected to Tower Control.',
    recommendedAction:
      'Configure marketing integrations (Google Analytics, CRM, email platform) to unlock growth visibility.',
    href: '/tower/marketing',
  })

  return items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
}

function buildExecutiveSummary(p: {
  health: PlatformHealthData
  actionQueue: ActionItem[]
  orgCount: number
  userCount: number
  subCount: number
  totalRuns: number
  failedRuns: number
  auditErrors: number
  orgsLast24h: number
  usersLast24h: number
  stripeConnected: boolean
  pastDueSubs: number
}): ExecutiveSummary {
  const criticalCount = p.actionQueue.filter((i) => i.priority === 'critical').length
  const urgentCount = p.actionQueue.filter(
    (i) => i.priority === 'critical' || i.priority === 'high'
  ).length

  let headline: string
  let statusLevel: 'good' | 'attention' | 'critical'

  if (criticalCount > 0) {
    headline = `Critical issue${criticalCount !== 1 ? 's' : ''} detected — ${criticalCount} item${criticalCount !== 1 ? 's' : ''} require${criticalCount === 1 ? 's' : ''} immediate attention`
    statusLevel = 'critical'
  } else if (urgentCount > 0) {
    headline = `Platform operational — ${urgentCount} high-priority item${urgentCount !== 1 ? 's' : ''} require${urgentCount === 1 ? 's' : ''} attention`
    statusLevel = 'attention'
  } else if (p.actionQueue.length > 0) {
    headline = `Platform is healthy — ${p.actionQueue.length} configuration item${p.actionQueue.length !== 1 ? 's' : ''} pending`
    statusLevel = 'good'
  } else {
    headline = 'Platform is operating normally — no action required'
    statusLevel = 'good'
  }

  const bullets: string[] = []

  if (p.orgCount === 0) {
    bullets.push(
      'No customer organizations provisioned yet — platform is ready for the first customer'
    )
  } else {
    bullets.push(
      `${p.orgCount} active organization${p.orgCount !== 1 ? 's' : ''} on the platform · ${p.userCount} total user${p.userCount !== 1 ? 's' : ''}`
    )
  }

  if (p.orgsLast24h > 0 || p.usersLast24h > 0) {
    bullets.push(
      `New in last 24h: ${p.orgsLast24h} organization${p.orgsLast24h !== 1 ? 's' : ''} · ${p.usersLast24h} user${p.usersLast24h !== 1 ? 's' : ''}`
    )
  }

  if (!p.stripeConnected) {
    bullets.push(
      'Billing not yet configured — Stripe integration required before accepting payments'
    )
  } else if (p.pastDueSubs > 0) {
    bullets.push(
      `${p.pastDueSubs} subscription${p.pastDueSubs !== 1 ? 's are' : ' is'} past due — payment recovery required`
    )
  } else if (p.subCount > 0) {
    bullets.push(
      `${p.subCount} active subscription${p.subCount !== 1 ? 's' : ''} · no payment issues`
    )
  }

  if (p.totalRuns > 0) {
    if (p.failedRuns > 0) {
      bullets.push(
        `AI Workforce: ${p.totalRuns} runs total · ${p.failedRuns} failed and require investigation`
      )
    } else {
      bullets.push(
        `AI Workforce: ${p.totalRuns} engagement run${p.totalRuns !== 1 ? 's' : ''} processed · no failures`
      )
    }
  }

  if (p.auditErrors > 0) {
    bullets.push(
      `Audit log: ${p.auditErrors} error event${p.auditErrors !== 1 ? 's' : ''} detected in the last 24 hours`
    )
  } else if (p.orgCount > 0) {
    bullets.push('Audit log is clean — no error events in the last 24 hours')
  }

  const priorities = p.actionQueue
    .filter((i) => i.priority === 'critical' || i.priority === 'high')
    .slice(0, 3)
    .map((i) => i.recommendedAction)

  if (priorities.length === 0) {
    priorities.push(
      p.orgCount === 0
        ? 'Acquire your first customer to validate end-to-end platform flow'
        : 'Platform is healthy — maintain current customer focus and acquisition momentum'
    )
  }

  return { headline, statusLevel, bullets, priorities }
}

const FALLBACK_HEALTH: PlatformHealthData = {
  database: { status: 'critical', value: 'Error', detail: 'Health check failed' },
  authentication: { status: 'healthy', value: 'Active', detail: 'Founder session active' },
  activeOrganizations: { status: 'critical', value: '0', detail: 'Query failed' },
  activeUsers: { status: 'critical', value: '0', detail: 'Query failed' },
  subscriptions: { status: 'critical', value: '0', detail: 'Query failed' },
  billingHealth: { status: 'critical', value: 'Error', detail: 'Query failed' },
  engagementRuns: { status: 'critical', value: '0', detail: 'Query failed' },
  auditLog: { status: 'critical', value: '0', detail: 'Query failed' },
  apiHealth: {
    status: 'not-configured',
    value: 'Not Configured',
    detail: 'No API monitoring configured',
  },
  backgroundJobs: {
    status: 'not-configured',
    value: 'Not Configured',
    detail: 'No job queue configured',
  },
  deployments: {
    status: 'not-configured',
    value: 'Not Configured',
    detail: 'Vercel API not connected',
  },
  overall: 'critical',
  fetchedAt: new Date().toISOString(),
}

export async function getExecutiveData(): Promise<ExecutiveData> {
  const db = createServerSupabaseClient()
  const now = new Date()
  const generatedAt = now.toISOString()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const [healthResult, orgsResult, usersResult, subsResult, runsResult, auditResult] =
    await Promise.allSettled([
      getPlatformHealth(),
      db.from('organizations').select('id, status, created_at'),
      db.from('users').select('id, created_at'),
      db.from('subscriptions').select('status, plan_id, stripe_subscription_id'),
      db.from('engagement_runs').select('id, status'),
      db
        .from('audit_events')
        .select('action, outcome, actor_type, occurred_at')
        .gte('occurred_at', twentyFourHoursAgo)
        .order('occurred_at', { ascending: false })
        .limit(50),
    ])

  const health = healthResult.status === 'fulfilled' ? healthResult.value : FALLBACK_HEALTH

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgs: any[] =
    orgsResult.status === 'fulfilled' && !orgsResult.value.error
      ? (orgsResult.value.data ?? [])
      : []
  const orgsLast24h = orgs.filter((o) => o.created_at >= twentyFourHoursAgo).length
  const orgCount = orgs.filter((o) => o.status === 'active').length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: any[] =
    usersResult.status === 'fulfilled' && !usersResult.value.error
      ? (usersResult.value.data ?? [])
      : []
  const usersLast24h = users.filter((u) => u.created_at >= twentyFourHoursAgo).length
  const userCount = users.length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] =
    subsResult.status === 'fulfilled' && !subsResult.value.error
      ? (subsResult.value.data ?? [])
      : []
  const activeSubs = subs.filter((s) => s.status === 'active').length
  const trialingSubs = subs.filter((s) => s.status === 'trialing').length
  const pastDueSubs = subs.filter((s) => s.status === 'past_due').length
  const canceledSubs = subs.filter((s) => s.status === 'canceled').length
  const stripeConnected = subs.some((s) => s.stripe_subscription_id != null)
  const planCounts = new Map<string, number>()
  subs.forEach((s) => planCounts.set(s.plan_id, (planCounts.get(s.plan_id) ?? 0) + 1))
  const planBreakdown = Array.from(planCounts.entries())
    .map(([planId, count]) => ({ planId, count }))
    .sort((a, b) => b.count - a.count)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runs: any[] =
    runsResult.status === 'fulfilled' && !runsResult.value.error
      ? (runsResult.value.data ?? [])
      : []
  const totalRuns = runs.length
  const failedRuns = runs.filter((r) => r.status === 'failed').length

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditEvents: any[] =
    auditResult.status === 'fulfilled' && !auditResult.value.error
      ? (auditResult.value.data ?? [])
      : []
  const auditErrors = auditEvents.filter((e) => e.outcome === 'error').length

  const revenue: RevenueSnapshot = {
    active: activeSubs,
    trialing: trialingSubs,
    pastDue: pastDueSubs,
    canceled: canceledSubs,
    total: subs.length,
    planBreakdown,
    stripeConnected,
    mrrNote: stripeConnected
      ? 'MRR calculation requires plan pricing configuration in Stripe'
      : 'Connect Stripe to enable revenue tracking and MRR calculation',
  }

  const recentActivity: RecentActivityData = {
    events: auditEvents.slice(0, 10).map((e) => ({
      action: e.action,
      outcome: e.outcome,
      actorType: e.actor_type,
      occurredAt: e.occurred_at,
    })),
    total24h: auditEvents.length,
  }

  const actionQueue = buildActionQueue({
    health,
    stripeConnected,
    pastDueSubs,
    failedRuns,
    auditErrors,
    orgCount,
  })

  const summary = buildExecutiveSummary({
    health,
    actionQueue,
    orgCount,
    userCount,
    subCount: activeSubs + trialingSubs,
    totalRuns,
    failedRuns,
    auditErrors,
    orgsLast24h,
    usersLast24h,
    stripeConnected,
    pastDueSubs,
  })

  return {
    health,
    summary,
    actionQueue,
    revenue,
    recentActivity,
    newCustomers: { orgsLast24h, usersLast24h },
    generatedAt,
  }
}
