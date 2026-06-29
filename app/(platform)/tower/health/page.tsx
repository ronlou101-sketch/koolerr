import { getPlatformHealth } from './health-data'
import { TowerHealthCard } from '../_components/TowerHealthCard'
import { TowerSection } from '../_components/TowerSection'

export const dynamic = 'force-dynamic'

const OVERALL_CONFIG = {
  healthy: {
    dot: 'bg-emerald-500',
    label: 'All Systems Operational',
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  warning: {
    dot: 'bg-amber-400',
    label: 'Degraded Performance',
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-800 dark:text-amber-200',
  },
  critical: {
    dot: 'bg-destructive',
    label: 'System Issues Detected',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-800 dark:text-red-200',
  },
  'not-configured': {
    dot: 'bg-muted-foreground/40',
    label: 'Status Unknown',
    border: 'border-border',
    bg: 'bg-muted/20',
    text: 'text-muted-foreground',
  },
}

export default async function SystemHealthPage() {
  const health = await getPlatformHealth()
  const cfg = OVERALL_CONFIG[health.overall]

  const fetchedAt = new Date(health.fetchedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Tower Control</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-foreground">System Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live platform status · Refreshes on every page load
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 ${cfg.border} ${cfg.bg}`}
        >
          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
          <span className={`text-xs ${cfg.text} opacity-60`}>· {fetchedAt}</span>
        </div>
      </div>

      {/* Core Infrastructure */}
      <TowerSection
        title="Core Infrastructure"
        description="Database, authentication, and API availability"
      >
        <TowerHealthCard
          title="Database"
          status={health.database.status}
          value={health.database.value}
          detail={health.database.detail}
        />
        <TowerHealthCard
          title="Authentication"
          status={health.authentication.status}
          value={health.authentication.value}
          detail={health.authentication.detail}
        />
        <TowerHealthCard
          title="API Health"
          status={health.apiHealth.status}
          value={health.apiHealth.value}
          detail={health.apiHealth.detail}
        />
        <TowerHealthCard
          title="Background Jobs"
          status={health.backgroundJobs.status}
          value={health.backgroundJobs.value}
          detail={health.backgroundJobs.detail}
        />
      </TowerSection>

      {/* Platform Data */}
      <TowerSection
        title="Platform Data"
        description="Customer organizations, users, and subscriptions"
      >
        <TowerHealthCard
          title="Active Organizations"
          status={health.activeOrganizations.status}
          value={health.activeOrganizations.value}
          detail={health.activeOrganizations.detail}
          href="/tower/orgs"
        />
        <TowerHealthCard
          title="Active Users"
          status={health.activeUsers.status}
          value={health.activeUsers.value}
          detail={health.activeUsers.detail}
          href="/tower/users"
        />
        <TowerHealthCard
          title="Active Subscriptions"
          status={health.subscriptions.status}
          value={health.subscriptions.value}
          detail={health.subscriptions.detail}
          href="/tower/billing"
        />
        <TowerHealthCard
          title="Billing Health"
          status={health.billingHealth.status}
          value={health.billingHealth.value}
          detail={health.billingHealth.detail}
          href="/tower/billing"
        />
      </TowerSection>

      {/* Activity */}
      <TowerSection
        title="Activity"
        description="AI Workforce runs, audit events, and deployment history"
      >
        <TowerHealthCard
          title="Engagement Runs"
          status={health.engagementRuns.status}
          value={health.engagementRuns.value}
          detail={health.engagementRuns.detail}
          href="/tower/runs"
        />
        <TowerHealthCard
          title="Audit Log (24h)"
          status={health.auditLog.status}
          value={health.auditLog.value}
          detail={health.auditLog.detail}
          href="/tower/audit"
        />
        <TowerHealthCard
          title="Recent Deployments"
          status={health.deployments.status}
          value={health.deployments.value}
          detail={health.deployments.detail}
        />
      </TowerSection>
    </div>
  )
}
