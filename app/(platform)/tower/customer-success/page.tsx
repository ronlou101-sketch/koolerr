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

export default function CustomerSuccessPage() {
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
            <span className="text-foreground">Customer Success</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Customer Success</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Health scores, churn signals, onboarding progress, and retention metrics
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
          Customer success data sources are not yet connected
        </p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Connect engagement tracking, onboarding milestones, and health score calculations to
          surface customer health, churn signals, and success metrics across your customer base.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Priority: Define health score criteria, then instrument onboarding milestones.
        </p>
      </div>

      {/* Customer Health */}
      <PlaceholderSection
        title="Customer Health"
        description="Composite health scores and risk signals across all organizations"
      >
        <PlaceholderCard
          title="Health Score Distribution"
          description="Number of customers in each health tier: healthy, at-risk, and critical."
        />
        <PlaceholderCard
          title="At-Risk Customers"
          description="Customers showing churn signals: low engagement, elevated support contact, or declining AI Workforce usage."
        />
        <PlaceholderCard
          title="NPS / CSAT Trend"
          description="Net Promoter Score and Customer Satisfaction scores collected at regular intervals."
        />
      </PlaceholderSection>

      {/* Onboarding */}
      <PlaceholderSection
        title="Onboarding Progress"
        description="Completion rates for each onboarding milestone across new customers"
      >
        <PlaceholderCard
          title="Onboarding Completion Rate"
          description="Percentage of customers who have completed all onboarding milestones."
        />
        <PlaceholderCard
          title="Time to First Value"
          description="Average time from signup to first completed AI Workforce engagement run."
        />
        <PlaceholderCard
          title="Stuck Customers"
          description="Customers who signed up but have not completed key onboarding steps after 7 days."
        />
      </PlaceholderSection>

      {/* Retention & Expansion */}
      <PlaceholderSection
        title="Retention & Expansion"
        description="Churn rate, renewal forecasting, and expansion revenue signals"
      >
        <PlaceholderCard
          title="Monthly Churn Rate"
          description="Percentage of customers who canceled or did not renew in the current month."
        />
        <PlaceholderCard
          title="Net Revenue Retention"
          description="Revenue retained plus expansion revenue from existing customers, net of churn."
        />
        <PlaceholderCard
          title="Renewal Forecast"
          description="Subscriptions coming up for renewal in the next 30 and 90 days with health signals."
        />
        <PlaceholderCard
          title="Expansion Signals"
          description="Customers showing signals of readiness to expand usage or upgrade their plan."
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
                title: 'Define customer health score criteria',
                detail:
                  'Choose which signals constitute a healthy customer: AI Workforce run frequency, deliverable acceptance rate, login recency, support ticket volume.',
              },
              {
                step: '2',
                title: 'Instrument onboarding milestones',
                detail:
                  'Add milestone tracking to the customer dashboard — profile complete, first workforce configured, first run completed, first approval granted.',
              },
              {
                step: '3',
                title: 'Connect an engagement tracking tool',
                detail:
                  'Recommended: PostHog (product analytics), Mixpanel, or Amplitude. These provide the usage signals needed to compute health scores.',
              },
              {
                step: '4',
                title: 'Configure churn risk alerts',
                detail:
                  'Set thresholds for at-risk signals (e.g., no login in 7 days, zero runs in 14 days) and route alerts to the Founder Action Queue.',
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
