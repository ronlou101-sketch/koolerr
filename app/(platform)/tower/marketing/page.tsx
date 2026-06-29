import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface MarketingCardProps {
  title: string
  description: string
  setupGuide: string
  integration?: string
}

function MarketingCard({ title, description, setupGuide, integration }: MarketingCardProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Not Connected
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-3 border-t border-border/50 pt-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Setup:</span> {setupGuide}
        </p>
        {integration && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium">Integrations:</span> {integration}
          </p>
        )}
      </div>
    </div>
  )
}

function MarketingSection({
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  )
}

export default function MarketingCommandCenterPage() {
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
            <span className="text-foreground">Marketing</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Marketing Command Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Top-of-funnel visibility, lead tracking, and campaign performance
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
          Marketing integrations are not yet connected
        </p>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Connect your marketing stack to unlock real-time visibility into website traffic, lead
          generation, email campaigns, and growth metrics. Each section below shows what will be
          available once the corresponding integration is configured.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Priority: Connect website analytics first, then email platform, then CRM.
        </p>
      </div>

      {/* Website & Traffic */}
      <MarketingSection
        title="Website & Traffic"
        description="Visitor behavior, traffic sources, and landing page performance"
      >
        <MarketingCard
          title="Website Traffic"
          description="Total visitors, unique sessions, and page views across koolerr.com"
          setupGuide="Add Google Analytics 4 or Plausible tracking script to the marketing site"
          integration="Google Analytics 4, Plausible, Fathom"
        />
        <MarketingCard
          title="Traffic Sources"
          description="Breakdown by organic, paid, social, direct, and referral channels"
          setupGuide="Enabled automatically with website analytics integration"
          integration="GA4, UTM parameter tracking"
        />
        <MarketingCard
          title="Landing Page Performance"
          description="Conversion rates and engagement metrics per landing page"
          setupGuide="Configure goal tracking in your analytics platform"
          integration="GA4 Goals, Hotjar, Microsoft Clarity"
        />
        <MarketingCard
          title="SEO Performance"
          description="Organic search rankings, impressions, and click-through rates"
          setupGuide="Connect Google Search Console to surface organic search data"
          integration="Google Search Console, Ahrefs, SEMrush"
        />
      </MarketingSection>

      {/* Lead Generation */}
      <MarketingSection
        title="Lead Generation"
        description="Inbound lead capture, qualification, and pipeline management"
      >
        <MarketingCard
          title="Lead Funnel"
          description="Visitor → lead → trial → customer conversion rates at each stage"
          setupGuide="Connect a CRM and configure funnel stage definitions"
          integration="HubSpot, Pipedrive, Attio, Clay"
        />
        <MarketingCard
          title="Inbound Leads"
          description="New leads captured via forms, trials, and inbound channels"
          setupGuide="Connect form submissions to CRM with webhook or native integration"
          integration="HubSpot Forms, Typeform, Cal.com"
        />
        <MarketingCard
          title="Demo Requests"
          description="Scheduled and completed product demonstrations"
          setupGuide="Connect your calendar booking tool to track demo pipeline"
          integration="Cal.com, Calendly, HubSpot Meetings"
        />
        <MarketingCard
          title="Waitlist"
          description="Waitlist signups, queue position, and invitation activation rates"
          setupGuide="Connect your waitlist tool or build a waitlist table in Supabase"
          integration="Waitlist.email, Tally, custom Supabase table"
        />
      </MarketingSection>

      {/* Email Campaigns */}
      <MarketingSection
        title="Email Campaigns"
        description="Outbound email performance, deliverability, and audience growth"
      >
        <MarketingCard
          title="Campaign Performance"
          description="Open rates, click rates, unsubscribes, and revenue per email sent"
          setupGuide="Connect your email marketing platform via API key"
          integration="Resend, Loops, Beehiiv, Mailchimp, ConvertKit"
        />
        <MarketingCard
          title="Audience Growth"
          description="Subscriber count, list growth rate, and segmentation breakdown"
          setupGuide="Enabled automatically with email platform integration"
          integration="Resend, Loops, Beehiiv"
        />
        <MarketingCard
          title="Deliverability"
          description="Bounce rate, spam complaints, and inbox placement rates"
          setupGuide="Verify sending domain and monitor reputation via email platform dashboard"
          integration="Resend, Postmark, SendGrid"
        />
      </MarketingSection>

      {/* Referral & Social */}
      <MarketingSection
        title="Referral & Social"
        description="Viral growth loops, referral tracking, and social channel performance"
      >
        <MarketingCard
          title="Referral Program"
          description="Referral link activity, successful conversions, and reward redemptions"
          setupGuide="Implement a referral program using a dedicated tool or custom referral codes"
          integration="ReferralHero, Rewardful, custom implementation"
        />
        <MarketingCard
          title="Social Growth"
          description="Follower growth, engagement rates, and top-performing content"
          setupGuide="Connect social profiles via platform APIs or a social analytics tool"
          integration="Buffer, Metricool, native platform APIs"
        />
        <MarketingCard
          title="Affiliate Program"
          description="Affiliate partner performance, clicks, and commission tracking"
          setupGuide="Configure an affiliate platform and issue tracking links to partners"
          integration="Rewardful, PartnerStack, Impact"
        />
      </MarketingSection>

      {/* Conversion & Retention */}
      <MarketingSection
        title="Conversion & Retention"
        description="Trial-to-paid conversion, customer lifetime value, and churn prevention"
      >
        <MarketingCard
          title="Trial-to-Paid Rate"
          description="Percentage of trials converting to paid subscriptions over time"
          setupGuide="Automatically available once Stripe is connected and trial subscriptions exist"
          integration="Stripe (via existing Tower Billing integration)"
        />
        <MarketingCard
          title="Customer Acquisition Cost"
          description="Total marketing spend divided by new customers acquired per period"
          setupGuide="Connect ad spend data from paid channels and link to CRM conversions"
          integration="Google Ads, Meta Ads, manual input"
        />
        <MarketingCard
          title="Churn & Retention"
          description="Monthly churn rate, net revenue retention, and at-risk customer signals"
          setupGuide="Automatically available once subscription history data grows in Stripe"
          integration="Stripe (via existing Tower Billing integration), ChurnKey"
        />
        <MarketingCard
          title="Lifetime Value (LTV)"
          description="Average revenue per customer over their subscription lifetime"
          setupGuide="Calculable once sufficient subscription and cancellation history exists in Stripe"
          integration="Stripe (via existing Tower Billing integration)"
        />
      </MarketingSection>
    </div>
  )
}
