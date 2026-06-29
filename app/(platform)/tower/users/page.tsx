import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All authenticated users across all organizations on the platform.
        </p>
      </div>

      <TowerSection title="User Overview">
        <TowerCard
          title="Total Users"
          description="All authenticated users provisioned across all organizations."
        />
        <TowerCard
          title="Active Sessions"
          description="Users with an active session in the past 24 hours."
        />
        <TowerCard title="New Users" description="Users who created accounts in the past 7 days." />
        <TowerCard
          title="Authentication Status"
          description="User authentication health and session validity."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="User data will appear here once the cross-org user query integration is complete."
      />
    </div>
  )
}
