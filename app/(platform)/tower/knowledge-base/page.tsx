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

export default function KnowledgeBasePage() {
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
            <span className="text-foreground">Knowledge Base</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Knowledge Base</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer-facing documentation, help articles, and product guides
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
          Knowledge base platform is not yet connected
        </p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Connect a knowledge base platform to surface article analytics, search coverage gaps, and
          documentation health from Tower Control. The knowledge base also feeds the AI Support
          Desk.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Priority: Create core product documentation before acquiring customers.
        </p>
      </div>

      {/* Content */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Content Overview</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlaceholderCard
            title="Total Articles"
            description="Total number of published, draft, and archived knowledge base articles."
          />
          <PlaceholderCard
            title="Article Coverage"
            description="Percentage of incoming support ticket categories covered by existing articles."
          />
          <PlaceholderCard
            title="Top Articles"
            description="Most viewed articles by customers in the last 7 and 30 days."
          />
          <PlaceholderCard
            title="Search Gaps"
            description="Search queries that returned no results — identifying documentation gaps."
          />
          <PlaceholderCard
            title="Article Health"
            description="Articles that are outdated, have low helpfulness ratings, or have not been reviewed recently."
          />
          <PlaceholderCard
            title="AI Support Coverage"
            description="Articles actively used by the AI Support Desk to answer customer questions."
          />
        </div>
      </section>

      {/* Setup Guide */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Setup Guide</h2>
        <div className="rounded-lg border border-border bg-card p-5">
          <ol className="space-y-3">
            {[
              {
                step: '1',
                title: 'Choose a knowledge base platform',
                detail:
                  'Recommended: Intercom Articles (if using Intercom for support), Mintlify (developer-friendly), Notion (flexible), or GitBook (structured docs).',
              },
              {
                step: '2',
                title: 'Write core product documentation',
                detail:
                  'Start with: Getting Started, Creating your first Workforce, Approving deliverables, Billing and subscriptions, Common issues and FAQ.',
              },
              {
                step: '3',
                title: 'Connect to Tower Control',
                detail:
                  'Add the knowledge base platform API key to enable article analytics, search gap reporting, and coverage metrics in this dashboard.',
              },
              {
                step: '4',
                title: 'Link to AI Support Desk',
                detail:
                  'Configure the AI Support Desk to pull answers from published articles before escalating tickets to human review.',
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
