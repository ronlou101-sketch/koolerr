import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function AuditPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Audit Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cross-organization event stream for compliance, security, and platform monitoring.
        </p>
      </div>

      <TowerSection title="Event Stream">
        <TowerCard
          title="Audit Log"
          description="Cross-org event stream: user actions, AI invocations, and consent events."
        />
        <TowerCard
          title="Error Events"
          description="Events with outcome=error across all organizations."
        />
        <TowerCard
          title="Security Events"
          description="Authentication events, permission changes, and access control actions."
        />
      </TowerSection>

      <TowerSection title="Compliance">
        <TowerCard
          title="Consent Events"
          description="Consent granted and revoked events across all organizations."
        />
        <TowerCard
          title="Data Access Events"
          description="Events involving access to sensitive customer data."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Audit event data will appear here once the cross-org audit query integration is complete."
      />
    </div>
  )
}
