import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function RevenuePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Financial metrics, growth trajectory, and expansion opportunities.
        </p>
      </div>

      <TowerSection title="Financial Metrics">
        <TowerCard
          title="Revenue Snapshot"
          description="Current MRR, ARR, and month-over-month growth rate."
        />
        <TowerCard
          title="Revenue Growth KPIs"
          description="MRR growth targets vs. actuals and key financial milestones."
        />
        <TowerCard
          title="Revenue by Plan"
          description="Revenue contribution broken down by subscription plan tier."
        />
      </TowerSection>

      <TowerSection title="Growth Opportunities">
        <TowerCard
          title="Expansion Opportunities"
          description="Organizations approaching usage limits or signaling upgrade intent."
        />
        <TowerCard
          title="Upsell Candidates"
          description="Organizations on lower tiers with high usage and upgrade potential."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Revenue data will appear here once the Stripe revenue integration is complete."
      />
    </div>
  )
}
