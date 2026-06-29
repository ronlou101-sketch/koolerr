import Link from 'next/link'
import { TowerCard } from './_components/TowerCard'
import { TowerSection } from './_components/TowerSection'
import { TowerExecutiveSummary } from './_components/TowerExecutiveSummary'
import { TowerActionQueue } from './_components/TowerActionQueue'
import { getExecutiveData } from './executive/executive-data'
import type { HealthStatus } from './executive/executive-data'

export const dynamic = 'force-dynamic'

const STATUS_DOT: Record<HealthStatus, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-400',
  critical: 'bg-destructive',
  'not-configured': 'bg-muted-foreground/30',
}

const STATUS_TEXT: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
  'not-configured': '—',
}

export default async function TowerPage() {
  const data = await getExecutiveData()
  const { health } = data

  const statusStrip = [
    { label: 'Database', status: health.database.status, href: '/tower/health/database' },
    {
      label: 'Auth',
      status: health.authentication.status,
      href: '/tower/health/authentication',
    },
    { label: 'AI Runs', status: health.engagementRuns.status, href: '/tower/health/runs' },
    { label: 'Billing', status: health.billingHealth.status, href: '/tower/health/billing' },
  ] as const

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-foreground">Tower Control</h1>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              Founder Only
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Koolerr Founder Command Center · Operational hub for running and scaling Koolerr
          </p>
        </div>
        <Link
          href="/tower/health"
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground hover:border-foreground/20"
        >
          <span className={`h-2 w-2 rounded-full ${STATUS_DOT[health.overall]}`} />
          <span>
            {health.overall === 'healthy'
              ? 'All Systems Operational'
              : health.overall === 'warning'
                ? 'Degraded Performance'
                : health.overall === 'critical'
                  ? 'System Issues'
                  : 'Status Unknown'}
          </span>
          <span className="opacity-50">→</span>
        </Link>
      </div>

      {/* Platform status strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statusStrip.map(({ label, status, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground hover:border-foreground/20"
          >
            <span>{label}</span>
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
              <span>{STATUS_TEXT[status]}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Executive Summary */}
      <TowerExecutiveSummary summary={data.summary} generatedAt={data.generatedAt} />

      {/* Founder Action Queue */}
      <TowerActionQueue items={data.actionQueue} />

      {/* ── 1. System Health ── */}
      <TowerSection
        title="System Health"
        description="Platform infrastructure and service availability"
        viewAllHref="/tower/health"
      >
        <TowerCard
          title="API Health"
          description="Response times, error rates, and endpoint availability across all routes."
          href="/tower/health/api"
        />
        <TowerCard
          title="Database Health"
          description="Query latency, connection pool depth, and migration state."
          href="/tower/health/database"
        />
        <TowerCard
          title="Authentication Status"
          description="Supabase Auth availability, session health, and RLS coverage."
          href="/tower/health/authentication"
        />
        <TowerCard
          title="Webhook Status"
          description="Stripe webhook endpoint registration and event delivery status."
          href="/tower/health"
        />
        <TowerCard
          title="Email Status"
          description="Transactional email delivery health via Supabase Auth."
          href="/tower/health"
        />
        <TowerCard
          title="Error Monitoring"
          description="Unhandled errors and exceptions across all platform routes."
          href="/tower/health"
        />
        <TowerCard
          title="Background Jobs"
          description="Async task execution status, queue depth, and failure rates."
          href="/tower/health/jobs"
        />
        <TowerCard
          title="Deployments"
          description="Vercel production deployment history and rollback status."
          href="/tower/health/deployments"
          badge="External"
        />
      </TowerSection>

      {/* ── 2. Platform Operations ── */}
      <TowerSection
        title="Platform Operations"
        description="Cross-platform administrative controls and audit visibility"
      >
        <TowerCard
          title="Audit Events"
          description="Cross-organization event stream: user actions, AI invocations, consent events."
          href="/tower/audit"
        />
        <TowerCard
          title="Feature Flags"
          description="Enable or disable platform features per organization or globally."
          href="/tower/health"
        />
        <TowerCard
          title="Founder Notifications"
          description="Action items, alerts, and system events requiring founder attention."
          href="/tower/notifications"
        />
      </TowerSection>

      {/* ── 3. Customers ── */}
      <TowerSection
        title="Customers"
        description="Live view of all organizations and users on the platform"
        viewAllHref="/tower/orgs"
      >
        <TowerCard
          title="Live Organizations"
          description="All provisioned customer organizations: status, plan, and last activity."
          href="/tower/orgs"
        />
        <TowerCard
          title="Live Users"
          description="All authenticated users across all organizations."
          href="/tower/users"
        />
        <TowerCard
          title="New Signups"
          description="Organizations and users created in the last 7 days."
          href="/tower/orgs"
        />
        <TowerCard
          title="Inactive Organizations"
          description="Organizations with no activity in the past 30 days."
          href="/tower/orgs"
        />
      </TowerSection>

      {/* ── 4. Billing ── */}
      <TowerSection
        title="Billing"
        description="Subscription status and payment health across all customers"
        viewAllHref="/tower/billing"
      >
        <TowerCard
          title="Billing Overview"
          description="Subscription plan distribution across all customer organizations."
          href="/tower/billing"
        />
        <TowerCard
          title="Subscription Health"
          description="Active, trialing, past_due, and canceled subscription breakdown."
          href="/tower/health/subscriptions"
        />
        <TowerCard
          title="Active Plans"
          description="Which organizations are on which plans and their billing cycles."
          href="/tower/billing"
        />
        <TowerCard
          title="Payment Issues"
          description="Organizations with past_due, failed payments, or dunning status."
          href="/tower/health/billing"
        />
      </TowerSection>

      {/* ── 5. Revenue ── */}
      <TowerSection
        title="Revenue"
        description="Financial metrics and growth trajectory"
        viewAllHref="/tower/revenue"
      >
        <TowerCard
          title="Revenue Snapshot"
          description="Current MRR, ARR, and month-over-month growth rate."
          href="/tower/revenue"
        />
        <TowerCard
          title="Revenue Growth KPIs"
          description="MRR growth targets vs. actuals and key financial milestones."
          href="/tower/revenue"
        />
        <TowerCard
          title="Expansion Opportunities"
          description="Organizations approaching plan limits or signaling upgrade intent."
          href="/tower/revenue"
        />
      </TowerSection>

      {/* ── 6. AI Workforce ── */}
      <TowerSection
        title="AI Workforce"
        description="Agent activity and workflow execution across all organizations"
        viewAllHref="/tower/runs"
      >
        <TowerCard
          title="Agent Activity"
          description="All Engagement Runs across all organizations: pending, running, complete."
          href="/tower/runs"
        />
        <TowerCard
          title="Workflow Status"
          description="Orchestration engine status and active workflow instances."
          href="/tower/runs"
        />
        <TowerCard
          title="Run Success Rate"
          description="Platform-wide success and failure rates for AI-generated runs."
          href="/tower/health/runs"
        />
        <TowerCard
          title="Pending Approvals"
          description="Deliverables awaiting customer review across all organizations."
          href="/tower/runs"
        />
      </TowerSection>

      {/* ── 7. Marketing ── */}
      <TowerSection
        title="Marketing"
        description="Campaign performance, traffic, and top-of-funnel metrics"
        viewAllHref="/tower/marketing"
      >
        <TowerCard
          title="Website Traffic"
          description="Visitor counts, traffic sources, and landing page performance."
          href="/tower/marketing"
          badge="Not Connected"
        />
        <TowerCard
          title="Lead Funnel"
          description="Visitor → signup → trial → paid conversion rates."
          href="/tower/marketing"
          badge="Not Connected"
        />
        <TowerCard
          title="Waitlist"
          description="Waitlist signups, invitation queue, and activation rates."
          href="/tower/marketing"
          badge="Not Connected"
        />
        <TowerCard
          title="Email Campaigns"
          description="Outbound email performance: open rates, click rates, and deliverability."
          href="/tower/marketing"
          badge="Not Connected"
        />
        <TowerCard
          title="Referral Program"
          description="Referral link activity, conversions, and reward redemptions."
          href="/tower/marketing"
          badge="Not Connected"
        />
        <TowerCard
          title="Social Growth"
          description="Social channel performance and follower growth."
          href="/tower/marketing"
          badge="Not Connected"
        />
        <TowerCard
          title="Conversion Metrics"
          description="Trial-to-paid, lead-to-customer, and acquisition cost trends."
          href="/tower/marketing"
          badge="Not Connected"
        />
      </TowerSection>

      {/* ── 8. Growth Center ── */}
      <TowerSection
        title="Growth Center"
        description="Customer acquisition, retention, and expansion metrics"
        viewAllHref="/tower/growth"
      >
        <TowerCard
          title="Trial-to-Paid Conversion"
          description="Conversion rate from free trial to paid subscription."
          href="/tower/growth"
        />
        <TowerCard
          title="Customer Acquisition"
          description="New customer acquisition by channel, week, and cohort."
          href="/tower/growth"
        />
        <TowerCard
          title="Lead Management"
          description="Pipeline of inbound leads and their qualification status."
          href="/tower/growth"
        />
        <TowerCard
          title="Demo Requests"
          description="Scheduled and completed product demonstrations."
          href="/tower/growth"
        />
        <TowerCard
          title="Waitlist Management"
          description="Waitlist signups, invitation queue, and activation rates."
          href="/tower/growth"
        />
        <TowerCard
          title="Customer Feedback"
          description="Aggregated in-app feedback and NPS responses."
          href="/tower/growth"
        />
        <TowerCard
          title="Churn Analysis"
          description="Customer cancellations, reasons, and churn rate trends."
          href="/tower/growth"
        />
        <TowerCard
          title="Feature Requests"
          description="Top requested features by volume and customer weight."
          href="/tower/growth"
        />
      </TowerSection>

      {/* ── 9. Analytics ── */}
      <TowerSection
        title="Analytics"
        description="Platform-wide usage patterns and product intelligence"
        viewAllHref="/tower/analytics"
      >
        <TowerCard
          title="Usage Analytics"
          description="Platform-wide feature usage, session depth, and engagement metrics."
          href="/tower/analytics"
        />
        <TowerCard
          title="AI Usage Trends"
          description="Total AI invocations, model usage distribution, and cost trends."
          href="/tower/analytics"
        />
        <TowerCard
          title="Feature Adoption"
          description="Which platform features are adopted and by which organizations."
          href="/tower/analytics"
        />
        <TowerCard
          title="Customer Acquisition Metrics"
          description="Cost-per-acquisition, LTV, and payback period trends."
          href="/tower/analytics"
        />
      </TowerSection>

      {/* ── 10. Notifications ── */}
      <TowerSection
        title="Notifications"
        description="Founder alerts and system-generated action items"
        viewAllHref="/tower/notifications"
      >
        <TowerCard
          title="Founder Notifications"
          description="Action items requiring founder attention: new customers, failed payments, blockers."
          href="/tower/notifications"
        />
        <TowerCard
          title="System Alerts"
          description="Platform-level alerts: error spikes, health degradation, job failures."
          href="/tower/notifications"
        />
      </TowerSection>

      {/* ── 11. Founder Recommendations ── */}
      <TowerSection
        title="Founder Recommendations"
        description="AI-generated strategic insights and action items"
        viewAllHref="/tower/recommendations"
      >
        <TowerCard
          title="AI Recommendations"
          description="Atlas-generated strategic recommendations based on current platform data."
          href="/tower/recommendations"
        />
        <TowerCard
          title="Daily Executive Summary"
          description="Morning briefing: yesterday's metrics, today's priorities, and open items."
          href="/tower/morning-brief"
        />
        <TowerCard
          title="Weekly Growth Report"
          description="Week-over-week growth analysis and next-week playbook."
          href="/tower/recommendations"
        />
        <TowerCard
          title="Action Items"
          description="Specific tasks and decisions surfaced from AI recommendations."
          href="/tower/recommendations"
        />
      </TowerSection>

      {/* ── 12. Tracker Summary ── */}
      <TowerSection
        title="Tracker Summary"
        description="Live development progress from KOOLERR_MASTER_TRACKER.md"
      >
        <TowerCard
          title="Development Tracker"
          description="Live view of phase progress, active blockers, and session objectives."
          href="/tracker"
        />
        <TowerCard
          title="Phase Progress"
          description="Overall completion percentage and current phase status breakdown."
          href="/tracker"
        />
        <TowerCard
          title="Open Blockers"
          description="Active development blockers requiring founder or engineering attention."
          href="/tracker"
        />
      </TowerSection>

      {/* ── 13. Mission Control ── */}
      <TowerSection title="Mission Control" description="Platform administration and configuration">
        <TowerCard
          title="Mission Control"
          description="Platform administration tools, feature configuration, and system controls."
          href="/mission-control"
        />
      </TowerSection>
    </div>
  )
}
