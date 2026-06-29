import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide usage patterns, product intelligence, and customer metrics.
        </p>
      </div>

      <TowerSection title="Usage Analytics">
        <TowerCard
          title="Usage Analytics"
          description="Platform-wide feature usage, session depth, and engagement metrics."
        />
        <TowerCard
          title="AI Usage Trends"
          description="Total AI invocations, model usage distribution, and cost trends."
        />
        <TowerCard
          title="Feature Adoption"
          description="Which platform features are adopted and by which organizations."
        />
      </TowerSection>

      <TowerSection title="Customer Metrics">
        <TowerCard
          title="Customer Acquisition Metrics"
          description="Cost-per-acquisition, LTV, and payback period trends."
        />
        <TowerCard
          title="Retention Cohorts"
          description="Month-over-month retention rates broken down by acquisition cohort."
        />
        <TowerCard
          title="Expansion Metrics"
          description="Revenue expansion from upgrades and additional usage within existing customers."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Analytics data will appear here once the analytics pipeline is configured."
      />
    </div>
  )
}
