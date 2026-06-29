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

export default function ProductFeedbackPage() {
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
            <span className="text-foreground">Product Feedback</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Product Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer feature requests, bug reports, and product sentiment
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
          Product feedback collection is not yet configured
        </p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Connect a feedback platform to centralize feature requests, bug reports, and customer
          sentiment. Tower Control will surface top requests, emerging themes, and feedback volume
          by customer segment.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Priority: Configure feedback collection before acquiring the first batch of customers.
        </p>
      </div>

      {/* Feedback Overview */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Feedback Overview</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PlaceholderCard
            title="Top Feature Requests"
            description="Most upvoted or frequently requested features, ranked by customer demand."
          />
          <PlaceholderCard
            title="Open Bug Reports"
            description="Confirmed bugs reported by customers with severity and reproduction status."
          />
          <PlaceholderCard
            title="Feedback Volume"
            description="Total feedback submissions over time — trend by week or month."
          />
          <PlaceholderCard
            title="Sentiment Analysis"
            description="Positive, neutral, and negative sentiment across all feedback submissions."
          />
          <PlaceholderCard
            title="Feedback by Plan"
            description="Which customer segments are submitting the most feedback and requests."
          />
          <PlaceholderCard
            title="Recently Shipped"
            description="Features that were requested by customers and have since been shipped."
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
                title: 'Choose a feedback platform',
                detail:
                  'Recommended: Canny (structured feature requests), Linear (dev-integrated bug tracking), Frill (lightweight), or a custom Supabase table for full control.',
              },
              {
                step: '2',
                title: 'Add a feedback widget to the customer dashboard',
                detail:
                  'Embed a feedback collection widget or link to the feedback portal from the customer-facing product UI.',
              },
              {
                step: '3',
                title: 'Connect to Tower Control',
                detail:
                  'Add the feedback platform API key to surface top requests, volume trends, and sentiment in this dashboard.',
              },
              {
                step: '4',
                title: 'Link to your roadmap',
                detail:
                  'Cross-reference feedback volume with planned roadmap items to validate prioritization decisions.',
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
