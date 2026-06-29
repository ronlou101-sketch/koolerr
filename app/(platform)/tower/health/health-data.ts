import { createServerSupabaseClient } from '@/shared/lib/supabase-server'

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'not-configured'

export interface HealthMetric {
  status: HealthStatus
  value: string
  detail: string
}

export interface PlatformHealthData {
  database: HealthMetric
  authentication: HealthMetric
  activeOrganizations: HealthMetric
  activeUsers: HealthMetric
  subscriptions: HealthMetric
  billingHealth: HealthMetric
  engagementRuns: HealthMetric
  auditLog: HealthMetric
  apiHealth: HealthMetric
  backgroundJobs: HealthMetric
  deployments: HealthMetric
  overall: HealthStatus
  fetchedAt: string
}

function notConfigured(detail: string): HealthMetric {
  return { status: 'not-configured', value: 'Not Configured', detail }
}

const QUERY_FAILED: HealthMetric = {
  status: 'critical',
  value: '—',
  detail: 'Query failed — check database connection',
}

export async function getPlatformHealth(): Promise<PlatformHealthData> {
  const db = createServerSupabaseClient()
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const fetchedAt = new Date().toISOString()

  const [orgsResult, usersResult, subsResult, runsResult, auditResult] = await Promise.allSettled([
    db.from('organizations').select('id, status'),
    db.from('users').select('id', { count: 'exact', head: true }),
    db.from('subscriptions').select('status, stripe_subscription_id'),
    db.from('engagement_runs').select('status'),
    db.from('audit_events').select('outcome').gte('occurred_at', twentyFourHoursAgo),
  ])

  // Database + Organizations (same query, two metrics)
  let database: HealthMetric
  let activeOrganizations: HealthMetric

  if (orgsResult.status === 'fulfilled' && !orgsResult.value.error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgs: any[] = orgsResult.value.data ?? []
    const active = orgs.filter((o) => o.status === 'active').length
    const total = orgs.length
    database = {
      status: 'healthy',
      value: 'Connected',
      detail: `${total} organization${total !== 1 ? 's' : ''} in database`,
    }
    activeOrganizations = {
      status: 'healthy',
      value: String(active),
      detail: `${active} active · ${total - active} inactive · ${total} total`,
    }
  } else {
    database = { status: 'critical', value: 'Error', detail: 'Database connection failed' }
    activeOrganizations = QUERY_FAILED
  }

  // Users
  let activeUsers: HealthMetric
  if (usersResult.status === 'fulfilled' && !usersResult.value.error) {
    const total = usersResult.value.count ?? 0
    activeUsers = {
      status: 'healthy',
      value: String(total),
      detail: 'Total users provisioned across all organizations',
    }
  } else {
    activeUsers = QUERY_FAILED
  }

  // Subscriptions + Billing (same query, two metrics)
  let subscriptions: HealthMetric
  let billingHealth: HealthMetric
  if (subsResult.status === 'fulfilled' && !subsResult.value.error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subs: any[] = subsResult.value.data ?? []
    const active = subs.filter((s) => s.status === 'active').length
    const trialing = subs.filter((s) => s.status === 'trialing').length
    const pastDue = subs.filter((s) => s.status === 'past_due').length
    const canceled = subs.filter((s) => s.status === 'canceled').length
    const stripeConnected = subs.some((s) => s.stripe_subscription_id != null)

    subscriptions = {
      status: pastDue > 0 ? 'warning' : 'healthy',
      value: String(active + trialing),
      detail: `${active} active · ${trialing} trialing · ${pastDue} past_due · ${canceled} canceled`,
    }
    billingHealth = {
      status: !stripeConnected ? 'not-configured' : pastDue > 0 ? 'warning' : 'healthy',
      value: stripeConnected ? 'Connected' : 'Not Configured',
      detail: stripeConnected
        ? `Stripe live · ${pastDue > 0 ? `${pastDue} past_due` : 'No payment issues'}`
        : 'No Stripe subscriptions detected',
    }
  } else {
    subscriptions = QUERY_FAILED
    billingHealth = QUERY_FAILED
  }

  // Engagement Runs
  let engagementRuns: HealthMetric
  if (runsResult.status === 'fulfilled' && !runsResult.value.error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runs: any[] = runsResult.value.data ?? []
    const total = runs.length
    const running = runs.filter((r) => r.status === 'running').length
    const failed = runs.filter((r) => r.status === 'failed').length
    const pending = runs.filter((r) => r.status === 'pending').length
    const completed = runs.filter((r) => r.status === 'completed').length
    engagementRuns = {
      status: failed > 0 ? 'warning' : 'healthy',
      value: String(total),
      detail: `${running} running · ${pending} pending · ${failed} failed · ${completed} completed`,
    }
  } else {
    engagementRuns = QUERY_FAILED
  }

  // Audit Log (last 24h)
  let auditLog: HealthMetric
  if (auditResult.status === 'fulfilled' && !auditResult.value.error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = auditResult.value.data ?? []
    const total = events.length
    const errors = events.filter((e) => e.outcome === 'error').length
    auditLog = {
      status: errors > 0 ? 'warning' : 'healthy',
      value: String(total),
      detail: `${total} event${total !== 1 ? 's' : ''} in last 24h · ${errors} error${errors !== 1 ? 's' : ''}`,
    }
  } else {
    auditLog = QUERY_FAILED
  }

  // Authentication — always healthy if we reached here (tower layout validated founder email)
  const authentication: HealthMetric = {
    status: 'healthy',
    value: 'Active',
    detail: 'Supabase Auth verified · Founder session active',
  }

  // Not Configured — no existing data source in current platform
  const apiHealth = notConfigured('No API monitoring service connected')
  const backgroundJobs = notConfigured('No background job queue table configured')
  const deployments = notConfigured('Connect Vercel API to enable deployment tracking')

  // Overall: worst status across all tracked metrics (excludes not-configured)
  const tracked = [
    database,
    authentication,
    activeOrganizations,
    activeUsers,
    subscriptions,
    billingHealth,
    engagementRuns,
    auditLog,
  ]
  const overall: HealthStatus = tracked.some((m) => m.status === 'critical')
    ? 'critical'
    : tracked.some((m) => m.status === 'warning')
      ? 'warning'
      : 'healthy'

  return {
    database,
    authentication,
    activeOrganizations,
    activeUsers,
    subscriptions,
    billingHealth,
    engagementRuns,
    auditLog,
    apiHealth,
    backgroundJobs,
    deployments,
    overall,
    fetchedAt,
  }
}

// ── Detail Data Types ──────────────────────────────────────────────────────────

export interface DatabaseHealthDetail {
  tables: Array<{ name: string; count: number | null; accessible: boolean }>
  overall: HealthStatus
  fetchedAt: string
}

export interface AuthHealthDetail {
  userCount: number
  overall: HealthStatus
  fetchedAt: string
}

export interface OrgHealthDetail {
  active: number
  inactive: number
  recentlyCreated: number
  total: number
  overall: HealthStatus
  fetchedAt: string
}

export interface UserHealthDetail {
  total: number
  overall: HealthStatus
  fetchedAt: string
}

export interface SubscriptionHealthDetail {
  active: number
  trialing: number
  pastDue: number
  canceled: number
  total: number
  planBreakdown: Array<{ planId: string; count: number }>
  overall: HealthStatus
  fetchedAt: string
}

export interface BillingHealthDetail {
  stripeConnected: boolean
  stripeActiveCount: number
  pastDueCount: number
  totalSubscriptions: number
  overall: HealthStatus
  fetchedAt: string
}

export interface RunsHealthDetail {
  pending: number
  running: number
  awaitingApproval: number
  approved: number
  rejected: number
  completed: number
  failed: number
  total: number
  overall: HealthStatus
  fetchedAt: string
}

export interface AuditHealthDetail {
  total24h: number
  success24h: number
  denied24h: number
  errors24h: number
  recentEvents: Array<{
    action: string
    outcome: string
    actorType: string
    occurredAt: string
  }>
  overall: HealthStatus
  fetchedAt: string
}

// ── Detail Data Functions ──────────────────────────────────────────────────────

export async function getDatabaseHealthDetail(): Promise<DatabaseHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const tableNames = ['organizations', 'users', 'subscriptions', 'engagement_runs', 'audit_events']

  const results = await Promise.allSettled(
    tableNames.map((name) => db.from(name).select('id', { count: 'exact', head: true }))
  )

  const tables = tableNames.map((name, i) => {
    const result = results[i]!
    if (result.status === 'rejected' || result.value.error) {
      return { name, count: null, accessible: false }
    }
    return { name, count: result.value.count ?? 0, accessible: true }
  })

  const hasError = tables.some((t) => !t.accessible)
  return { tables, overall: hasError ? 'critical' : 'healthy', fetchedAt }
}

export async function getAuthHealthDetail(): Promise<AuthHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const { count, error } = await db.from('users').select('id', { count: 'exact', head: true })
  return { userCount: error ? 0 : (count ?? 0), overall: 'healthy', fetchedAt }
}

export async function getOrganizationsHealthDetail(): Promise<OrgHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await db.from('organizations').select('id, status, created_at')
  if (error || !data) {
    return { active: 0, inactive: 0, recentlyCreated: 0, total: 0, overall: 'critical', fetchedAt }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgs: any[] = data
  const active = orgs.filter((o) => o.status === 'active').length
  const inactive = orgs.filter((o) => o.status !== 'active').length
  const recentlyCreated = orgs.filter((o) => o.created_at >= sevenDaysAgo).length
  return { active, inactive, recentlyCreated, total: orgs.length, overall: 'healthy', fetchedAt }
}

export async function getUsersHealthDetail(): Promise<UserHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const { count, error } = await db.from('users').select('id', { count: 'exact', head: true })
  if (error) return { total: 0, overall: 'critical', fetchedAt }
  return { total: count ?? 0, overall: 'healthy', fetchedAt }
}

export async function getSubscriptionsHealthDetail(): Promise<SubscriptionHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const { data, error } = await db.from('subscriptions').select('status, plan_id')
  if (error || !data) {
    return {
      active: 0,
      trialing: 0,
      pastDue: 0,
      canceled: 0,
      total: 0,
      planBreakdown: [],
      overall: 'critical',
      fetchedAt,
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = data
  const active = subs.filter((s) => s.status === 'active').length
  const trialing = subs.filter((s) => s.status === 'trialing').length
  const pastDue = subs.filter((s) => s.status === 'past_due').length
  const canceled = subs.filter((s) => s.status === 'canceled').length
  const planCounts = new Map<string, number>()
  subs.forEach((s) => planCounts.set(s.plan_id, (planCounts.get(s.plan_id) ?? 0) + 1))
  const planBreakdown = Array.from(planCounts.entries())
    .map(([planId, count]) => ({ planId, count }))
    .sort((a, b) => b.count - a.count)
  return {
    active,
    trialing,
    pastDue,
    canceled,
    total: subs.length,
    planBreakdown,
    overall: pastDue > 0 ? 'warning' : 'healthy',
    fetchedAt,
  }
}

export async function getBillingHealthDetail(): Promise<BillingHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const { data, error } = await db.from('subscriptions').select('status, stripe_subscription_id')
  if (error || !data) {
    return {
      stripeConnected: false,
      stripeActiveCount: 0,
      pastDueCount: 0,
      totalSubscriptions: 0,
      overall: 'critical',
      fetchedAt,
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subs: any[] = data
  const stripeConnected = subs.some((s) => s.stripe_subscription_id != null)
  const stripeActiveCount = subs.filter(
    (s) => s.stripe_subscription_id != null && s.status === 'active'
  ).length
  const pastDueCount = subs.filter((s) => s.status === 'past_due').length
  return {
    stripeConnected,
    stripeActiveCount,
    pastDueCount,
    totalSubscriptions: subs.length,
    overall: !stripeConnected ? 'not-configured' : pastDueCount > 0 ? 'warning' : 'healthy',
    fetchedAt,
  }
}

export async function getRunsHealthDetail(): Promise<RunsHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const { data, error } = await db.from('engagement_runs').select('status')
  if (error || !data) {
    return {
      pending: 0,
      running: 0,
      awaitingApproval: 0,
      approved: 0,
      rejected: 0,
      completed: 0,
      failed: 0,
      total: 0,
      overall: 'critical',
      fetchedAt,
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runs: any[] = data
  const cnt = (s: string) => runs.filter((r) => r.status === s).length
  const failed = cnt('failed')
  return {
    pending: cnt('pending'),
    running: cnt('running'),
    awaitingApproval: cnt('awaiting_approval'),
    approved: cnt('approved'),
    rejected: cnt('rejected'),
    completed: cnt('completed'),
    failed,
    total: runs.length,
    overall: failed > 0 ? 'warning' : 'healthy',
    fetchedAt,
  }
}

export async function getAuditHealthDetail(): Promise<AuditHealthDetail> {
  const db = createServerSupabaseClient()
  const fetchedAt = new Date().toISOString()
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await db
    .from('audit_events')
    .select('action, outcome, actor_type, occurred_at')
    .gte('occurred_at', twentyFourHoursAgo)
    .order('occurred_at', { ascending: false })
    .limit(100)
  if (error || !data) {
    return {
      total24h: 0,
      success24h: 0,
      denied24h: 0,
      errors24h: 0,
      recentEvents: [],
      overall: 'critical',
      fetchedAt,
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: any[] = data
  const success24h = events.filter((e) => e.outcome === 'success').length
  const denied24h = events.filter((e) => e.outcome === 'denied').length
  const errors24h = events.filter((e) => e.outcome === 'error').length
  return {
    total24h: events.length,
    success24h,
    denied24h,
    errors24h,
    recentEvents: events.slice(0, 10).map((e) => ({
      action: e.action,
      outcome: e.outcome,
      actorType: e.actor_type,
      occurredAt: e.occurred_at,
    })),
    overall: errors24h > 0 ? 'warning' : 'healthy',
    fetchedAt,
  }
}
