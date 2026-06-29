import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function SystemHealthPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">System Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform infrastructure status and service availability monitoring.
        </p>
      </div>

      <TowerSection title="Core Services">
        <TowerCard
          title="API Health"
          description="Response times, error rates, and endpoint availability across all routes."
        />
        <TowerCard
          title="Database Health"
          description="Query latency, connection pool depth, and migration state."
        />
        <TowerCard
          title="Authentication Status"
          description="Supabase Auth availability, session health, and RLS coverage."
        />
        <TowerCard
          title="Webhook Status"
          description="Stripe webhook endpoint registration and event delivery."
        />
      </TowerSection>

      <TowerSection title="Supporting Services">
        <TowerCard
          title="Email Status"
          description="Transactional email delivery health via Supabase Auth."
        />
        <TowerCard
          title="Error Monitoring"
          description="Unhandled errors and exceptions across all platform routes."
        />
        <TowerCard
          title="Background Jobs"
          description="Async task execution status, queue depth, and failure rates."
        />
        <TowerCard
          title="Deployments"
          description="Vercel production deployment history and rollback status."
          badge="External"
        />
      </TowerSection>

      <TowerSection title="Configuration">
        <TowerCard
          title="Feature Flags"
          description="Enable or disable platform features per organization or globally."
          badge="Config"
        />
        <TowerCard
          title="Environment Status"
          description="Active environment variables and configuration drift detection."
          badge="Config"
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="System health data will appear here once monitoring integrations are configured."
      />
    </div>
  )
}
