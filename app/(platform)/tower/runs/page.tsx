import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function RunsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">AI Workforce Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agent activity and workflow execution across all organizations.
        </p>
      </div>

      <TowerSection title="Engagement Runs">
        <TowerCard
          title="Agent Activity"
          description="All Engagement Runs across all organizations: pending, running, complete."
        />
        <TowerCard
          title="Run Success Rate"
          description="Platform-wide success and failure rates for AI-generated runs."
        />
        <TowerCard
          title="Failed Runs"
          description="Recent failed Engagement Runs and their error details."
        />
        <TowerCard
          title="Pending Approvals"
          description="Deliverables awaiting customer review across all organizations."
        />
      </TowerSection>

      <TowerSection title="Orchestration Engine">
        <TowerCard
          title="Workflow Status"
          description="Orchestration engine status and active workflow instances."
        />
        <TowerCard
          title="Queue Depth"
          description="Number of queued Engagement Runs and estimated processing times."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="AI Workforce data will appear here once the cross-org run query integration is complete."
      />
    </div>
  )
}
