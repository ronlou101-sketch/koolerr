import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function RecommendationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Founder Recommendations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-generated strategic insights and action items for the Koolerr founder.
        </p>
      </div>

      <TowerSection title="Strategic Intelligence">
        <TowerCard
          title="AI Recommendations"
          description="Atlas-generated strategic recommendations based on current platform data."
        />
        <TowerCard
          title="Daily Executive Summary"
          description="Morning briefing: yesterday's metrics, today's priorities, and open items."
        />
        <TowerCard
          title="Weekly Growth Report"
          description="Week-over-week growth analysis and next-week playbook."
        />
        <TowerCard
          title="Action Items"
          description="Specific tasks and decisions surfaced from AI recommendations."
        />
      </TowerSection>

      <TowerSection title="Insights Archive">
        <TowerCard
          title="Historical Summaries"
          description="Archive of past executive summaries and weekly growth reports."
        />
        <TowerCard
          title="Recommendation History"
          description="Log of all AI recommendations and their implementation status."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Founder recommendations will appear here once the AI recommendations integration is configured."
      />
    </div>
  )
}
