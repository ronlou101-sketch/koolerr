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
