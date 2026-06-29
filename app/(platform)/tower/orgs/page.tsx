import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function OrgsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Organizations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All customer organizations provisioned on the Koolerr platform.
        </p>
      </div>

      <TowerSection title="Overview">
        <TowerCard
          title="Total Organizations"
          description="All provisioned customer organizations and their current status."
        />
        <TowerCard
          title="Active Organizations"
          description="Organizations with at least one Engagement Run in the past 30 days."
        />
        <TowerCard title="New Signups" description="Organizations created in the past 7 days." />
        <TowerCard
          title="Inactive Organizations"
          description="Organizations with no activity in the past 30 days."
        />
      </TowerSection>

      <TowerSection title="Status Breakdown">
        <TowerCard
          title="Trial Organizations"
          description="Organizations currently on a free trial plan."
        />
        <TowerCard
          title="Paid Organizations"
          description="Organizations with an active paid subscription."
        />
        <TowerCard
          title="Churned Organizations"
          description="Organizations that have canceled their subscription."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Organization data will appear here once the cross-org query integration is complete."
      />
    </div>
  )
}
