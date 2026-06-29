import { getExecutiveData } from '../executive/executive-data'
import type { ExecutiveData } from '../executive/executive-data'

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface CTOIssue {
  id: string
  severity: IssueSeverity
  affectedSystem: string
  title: string
  explanation: string
  recommendedAction: string
  href: string
}

export interface CTOMaintenanceItem {
  id: string
  priority: 'high' | 'medium' | 'low'
  area: string
  title: string
  description: string
  effort: string
  href?: string
}

export interface CTODebtItem {
  id: string
  category: string
  title: string
  description: string
  impact: string
  effort: string
}

export interface CTODecision {
  id: string
  title: string
  context: string
  options: string[]
  href: string
}

export interface CTOData {
  platformIssues: CTOIssue[]
  maintenance: CTOMaintenanceItem[]
  technicalDebt: CTODebtItem[]
  pendingDecisions: CTODecision[]
  generatedAt: string
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
}

function derivePlatformIssues(data: ExecutiveData): CTOIssue[] {
  const { health } = data
  const issues: CTOIssue[] = []

  if (health.database.status === 'critical') {
    issues.push({
      id: 'db-critical',
      severity: 'critical',
      affectedSystem: 'Database',
      title: 'Database Connection Failure',
      explanation: 'The platform database is unreachable. All customer operations are blocked.',
      recommendedAction:
        'Check Supabase project status and verify connection credentials immediately.',
      href: '/tower/health/database',
    })
  }

  if (health.billingHealth.status === 'not-configured') {
    issues.push({
      id: 'stripe-not-configured',
      severity: 'high',
      affectedSystem: 'Billing',
      title: 'Stripe Integration Not Configured',
      explanation: 'No Stripe subscription IDs found. Billing cannot process customer payments.',
      recommendedAction:
        'Complete Stripe integration and link existing subscriptions before accepting payments.',
      href: '/tower/health/billing',
    })
  }

  if (health.subscriptions.status === 'warning') {
    issues.push({
      id: 'past-due-subs',
      severity: 'high',
      affectedSystem: 'Billing',
      title: 'Past Due Subscriptions',
      explanation: health.subscriptions.detail,
      recommendedAction:
        'Review Stripe dunning settings and follow up directly with affected customers.',
      href: '/tower/health/billing',
    })
  }

  if (health.engagementRuns.status === 'warning' || health.engagementRuns.status === 'critical') {
    issues.push({
      id: 'failed-runs',
      severity: health.engagementRuns.status === 'critical' ? 'high' : 'medium',
      affectedSystem: 'AI Workforce',
      title: 'Failed Engagement Runs',
      explanation: `${health.engagementRuns.detail} — affected customers may be experiencing degraded service.`,
      recommendedAction:
        'Review failed runs in the AI Activity log, identify root cause, and re-trigger or escalate.',
      href: '/tower/health/runs',
    })
  }

  if (health.auditLog.status === 'warning') {
    issues.push({
      id: 'audit-errors',
      severity: 'medium',
      affectedSystem: 'Audit / Security',
      title: 'Error Events in Audit Log',
      explanation: health.auditLog.detail,
      recommendedAction:
        'Review error events in the audit log to identify and resolve the underlying cause.',
      href: '/tower/health/audit',
    })
  }

  if (health.apiHealth.status === 'not-configured') {
    issues.push({
      id: 'api-not-monitored',
      severity: 'low',
      affectedSystem: 'Observability',
      title: 'No API Monitoring',
      explanation:
        'Platform is operating without visibility into response times, error rates, or availability.',
      recommendedAction: 'Connect Datadog, New Relic, or Sentry to enable API health tracking.',
      href: '/tower/health/api',
    })
  }

  if (health.deployments.status === 'not-configured') {
    issues.push({
      id: 'deployments-not-tracked',
      severity: 'low',
      affectedSystem: 'Infrastructure',
      title: 'Deployment Tracking Not Connected',
      explanation: 'Production deployment history is not visible from Tower Control.',
      recommendedAction:
        'Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID environment variables to enable tracking.',
      href: '/tower/health/deployments',
    })
  }

  if (health.backgroundJobs.status === 'not-configured') {
    issues.push({
      id: 'no-job-queue',
      severity: 'low',
      affectedSystem: 'Architecture',
      title: 'No Background Job Queue',
      explanation:
        'Long-running tasks execute synchronously. No persistent job queue is configured.',
      recommendedAction:
        'Implement a job_queue table or connect BullMQ / Inngest for async task processing.',
      href: '/tower/health/jobs',
    })
  }

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

function deriveMaintenance(data: ExecutiveData): CTOMaintenanceItem[] {
  const { health } = data
  const items: CTOMaintenanceItem[] = []

  if (health.apiHealth.status === 'not-configured') {
    items.push({
      id: 'api-monitoring',
      priority: 'high',
      area: 'Observability',
      title: 'Connect API Monitoring',
      description:
        'Platform has no visibility into response times, error rates, or uptime. A production incident would go undetected.',
      effort: '2–4 hours',
      href: '/tower/health/api',
    })
  }

  if (health.deployments.status === 'not-configured') {
    items.push({
      id: 'deployment-tracking',
      priority: 'medium',
      area: 'Infrastructure',
      title: 'Connect Deployment Tracking',
      description:
        'Add Vercel API credentials to surface deployment history and release status in Tower Control.',
      effort: '1–2 hours',
      href: '/tower/health/deployments',
    })
  }

  if (health.backgroundJobs.status === 'not-configured') {
    items.push({
      id: 'job-queue',
      priority: 'medium',
      area: 'Architecture',
      title: 'Implement Background Job Queue',
      description:
        'Move long-running AI Workforce tasks off the synchronous request path for resilience and scalability.',
      effort: '1–2 days',
      href: '/tower/health/jobs',
    })
  }

  items.push(
    {
      id: 'supabase-backup',
      priority: 'medium',
      area: 'Data',
      title: 'Verify Automated Database Backups',
      description:
        'Confirm Supabase Point-in-Time Recovery (PITR) is enabled and test a restore to a staging environment.',
      effort: '1–2 hours',
    },
    {
      id: 'service-key-rotation',
      priority: 'low',
      area: 'Security',
      title: 'Establish Service Role Key Rotation Schedule',
      description:
        'Document and schedule quarterly rotation of the Supabase service role key used by Tower Control.',
      effort: '2–3 hours',
    },
    {
      id: 'rate-limiting',
      priority: 'low',
      area: 'Security',
      title: 'Configure API Rate Limiting',
      description:
        'Add per-IP and per-tenant request rate limiting to public API routes to prevent abuse and resource exhaustion.',
      effort: '4–8 hours',
    }
  )

  const ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
  return items.sort((a, b) => ORDER[a.priority] - ORDER[b.priority])
}

function deriveTechnicalDebt(): CTODebtItem[] {
  return [
    {
      id: 'no-e2e-tests',
      category: 'Testing',
      title: 'No End-to-End Test Coverage',
      description:
        'Unit and integration tests exist, but no E2E tests cover critical user flows: signup, billing, AI Workforce execution, or the approval workflow.',
      impact: 'High — regressions in critical paths may reach production undetected',
      effort: '3–5 days to set up Playwright with baseline coverage',
    },
    {
      id: 'no-error-monitoring',
      category: 'Observability',
      title: 'No Error Monitoring Service',
      description:
        'Unhandled exceptions and runtime errors are not captured by an error monitoring service. Debugging production issues relies on logs only.',
      impact: 'Medium — production errors may go unnoticed until customer-reported',
      effort: '2–4 hours to integrate Sentry',
    },
    {
      id: 'no-performance-monitoring',
      category: 'Performance',
      title: 'No Performance Monitoring or Budgets',
      description:
        'Page load times, API response times, and database query latency are not tracked. No performance budgets are enforced in CI.',
      impact: 'Medium — performance regressions are invisible until customer-reported',
      effort: '4–8 hours for Core Web Vitals + API timing instrumentation',
    },
    {
      id: 'no-feature-flags',
      category: 'Release Management',
      title: 'No Feature Flag System',
      description:
        'All feature changes are released to every customer simultaneously. No kill switch or gradual rollout mechanism exists.',
      impact: 'Medium — unable to safely roll back risky changes without a full redeploy',
      effort: '1–2 days to integrate LaunchDarkly or build a simple flags table',
    },
    {
      id: 'supabase-type-gen',
      category: 'Code Quality',
      title: 'TypeScript any in Service-Role DB Queries',
      description:
        'Service-role Supabase queries in Tower Control use eslint-disable-next-line to suppress @typescript-eslint/no-explicit-any. Should be replaced with generated Supabase types.',
      impact: 'Low — type errors in DB query results are not caught at compile time',
      effort: '4–8 hours to run supabase gen types and eliminate any usages',
    },
    {
      id: 'no-csp',
      category: 'Security',
      title: 'Content Security Policy Not Configured',
      description:
        'No CSP headers are set on any platform routes. XSS attack surface is not minimized.',
      impact: 'Low to Medium depending on whether deliverable output is rendered as HTML',
      effort: '4–8 hours to configure a strict CSP via Next.js headers config',
    },
  ]
}

export function derivePendingDecisions(data: ExecutiveData): CTODecision[] {
  const { health, revenue } = data
  const decisions: CTODecision[] = []

  if (health.billingHealth.status === 'not-configured') {
    decisions.push({
      id: 'billing-stack',
      title: 'Connect and Configure Stripe Billing',
      context:
        'Subscriptions exist in the database but no Stripe IDs are present. Revenue cannot flow until Stripe is connected and subscription records are linked.',
      options: [
        'Connect existing Stripe account and back-fill subscription IDs',
        'Set up a new Stripe account and re-create subscription records',
        'Defer — no paying customers yet, configure before first paid signup',
      ],
      href: '/tower/health/billing',
    })
  }

  if (health.apiHealth.status === 'not-configured') {
    decisions.push({
      id: 'monitoring-stack',
      title: 'Choose Monitoring and Observability Stack',
      context:
        'No API monitoring, error tracking, or performance observability is configured. Choose a stack before acquiring customers.',
      options: [
        'Datadog — full-stack observability, infrastructure + APM (premium)',
        'Sentry + Vercel Analytics — error monitoring + lightweight performance (mid-tier)',
        'New Relic — APM and distributed tracing (mid-tier)',
        'Defer monitoring until first paying customer',
      ],
      href: '/tower/health/api',
    })
  }

  decisions.push({
    id: 'marketing-stack',
    title: 'Choose Marketing and Analytics Stack',
    context:
      'Marketing Command Center has no data source. Growth metrics are invisible. Choose and connect a stack before starting customer acquisition.',
    options: [
      'Google Analytics 4 — free, comprehensive, integrates with Google Ads',
      'Plausible Analytics — privacy-first, GDPR-compliant, paid',
      'PostHog — product analytics + feature flags + session replay (generous free tier)',
      'Fathom Analytics — privacy-first, simple, paid',
    ],
    href: '/tower/marketing',
  })

  if (!revenue.stripeConnected || revenue.total === 0) {
    decisions.push({
      id: 'pricing-strategy',
      title: 'Finalize Pricing Tiers and Go-to-Market Timeline',
      context:
        'No subscriptions are linked to Stripe. Pricing tiers should be confirmed and go-to-market timing set before customer acquisition.',
      options: [
        'Launch with current plan configuration and acquire first customer now',
        'Revise pricing tiers before acquiring first customer',
        'Start with invite-only free access, convert to paid after product-market fit signals',
      ],
      href: '/tower/billing',
    })
  }

  return decisions
}

export async function getCTOData(): Promise<CTOData> {
  const data = await getExecutiveData()

  return {
    platformIssues: derivePlatformIssues(data),
    maintenance: deriveMaintenance(data),
    technicalDebt: deriveTechnicalDebt(),
    pendingDecisions: derivePendingDecisions(data),
    generatedAt: data.generatedAt,
  }
}
