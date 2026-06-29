import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Founder alerts and system-generated action items requiring attention.
        </p>
      </div>

      <TowerSection title="Alerts">
        <TowerCard
          title="Founder Notifications"
          description="Action items requiring founder attention: new customers, failed payments, blockers."
        />
        <TowerCard
          title="System Alerts"
          description="Platform-level alerts: error spikes, health degradation, job failures."
        />
      </TowerSection>

      <TowerSection title="Configuration">
        <TowerCard
          title="Alert Thresholds"
          description="Configure when and how the platform generates founder alerts."
          badge="Config"
        />
        <TowerCard
          title="Notification Delivery"
          description="Delivery channels and routing rules for founder notifications."
          badge="Config"
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Notification data will appear here once the founder notification system is integrated."
      />
    </div>
  )
}
