import Link from 'next/link'

export const dynamic = 'force-dynamic'

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Not Configured
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}

function PlaceholderSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  )
}

export default function SupportCenterPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Support</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Support Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer support operations and AI-powered support desk
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/20 px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          <span className="text-sm font-medium text-muted-foreground">Not Configured</span>
        </div>
      </div>

      {/* Setup notice */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-5">
        <p className="text-sm font-medium text-foreground">
          Support infrastructure is not yet configured
        </p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Connect a helpdesk platform and configure the AI Support Desk to enable customer ticket
          management, automated responses, and support analytics from Tower Control.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Priority: Configure a helpdesk first, then enable AI triage.
        </p>
      </div>

      {/* Support Center */}
      <PlaceholderSection
        title="Support Center"
        description="Customer ticket volume, resolution times, and satisfaction scores"
      >
        <PlaceholderCard
          title="Open Tickets"
          description="Count of open, pending, and unassigned support tickets across all customers."
        />
        <PlaceholderCard
          title="Resolution Time"
          description="Average first response time and time to resolution across ticket categories."
        />
        <PlaceholderCard
          title="Customer Satisfaction"
          description="CSAT scores, NPS responses, and satisfaction trends over time."
        />
        <PlaceholderCard
          title="Ticket Volume by Category"
          description="Breakdown of support requests by category — billing, feature requests, bugs, onboarding."
        />
        <PlaceholderCard
          title="At-Risk Customers"
          description="Customers with elevated ticket volume or low CSAT who may be at churn risk."
        />
        <PlaceholderCard
          title="Recent Tickets"
          description="Latest support tickets with status, priority, and assigned agent."
        />
      </PlaceholderSection>

      {/* AI Support Desk */}
      <PlaceholderSection
        title="AI Support Desk"
        description="Automated customer support powered by AI — triage, response drafts, and escalation"
      >
        <PlaceholderCard
          title="AI Triage Queue"
          description="Tickets classified by AI with suggested priority, category, and routing."
        />
        <PlaceholderCard
          title="Auto-Resolution Rate"
          description="Percentage of tickets fully resolved by the AI without human escalation."
        />
        <PlaceholderCard
          title="Draft Response Quality"
          description="Human review rate and acceptance rate for AI-drafted responses."
        />
        <PlaceholderCard
          title="Escalations to Founder"
          description="Tickets flagged by AI as requiring founder-level attention or sensitive handling."
        />
        <PlaceholderCard
          title="Knowledge Base Coverage"
          description="Percentage of incoming ticket types covered by existing knowledge base articles."
        />
        <PlaceholderCard
          title="AI Confidence Distribution"
          description="Distribution of AI confidence scores across triaged tickets — high, medium, low."
        />
      </PlaceholderSection>

      {/* Setup Guide */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Setup Guide</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <ol className="space-y-3">
            {[
              {
                step: '1',
                title: 'Choose a helpdesk platform',
                detail:
                  'Recommended: Intercom (full-stack), Linear Issues (dev-focused), or Freshdesk (lightweight). Connect via API key.',
              },
              {
                step: '2',
                title: 'Connect to Tower Control',
                detail:
                  'Add the helpdesk API key to platform environment variables and configure the webhook endpoint for real-time ticket sync.',
              },
              {
                step: '3',
                title: 'Configure AI Support Desk',
                detail:
                  'Train the AI on your product documentation and FAQ content. Set escalation thresholds and auto-response rules.',
              },
              {
                step: '4',
                title: 'Connect to Knowledge Base',
                detail:
                  'Link to the Knowledge Base module so the AI can pull answers from documented product behavior.',
              },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {item.step}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
