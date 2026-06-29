import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function GrowthPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Growth Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer acquisition, retention, marketing, and growth metrics for Koolerr.
        </p>
      </div>

      <TowerSection title="Marketing Channels">
        <TowerCard
          title="Marketing Campaigns"
          description="Active and scheduled campaigns across all marketing channels."
        />
        <TowerCard
          title="Website Traffic"
          description="Visitor counts, traffic sources, and landing page performance."
        />
        <TowerCard
          title="Conversion Funnel"
          description="Visitor → signup → trial → paid conversion rates."
        />
        <TowerCard
          title="Email Campaigns"
          description="Outbound email performance: open rates, click rates, and deliverability."
        />
        <TowerCard
          title="Social Media"
          description="Social channel performance and content calendar status."
        />
        <TowerCard
          title="Referral Program"
          description="Referral link activity, conversions, and reward redemptions."
        />
        <TowerCard
          title="Affiliate Program"
          description="Affiliate partner performance and commission tracking."
        />
      </TowerSection>

      <TowerSection title="Acquisition & Retention">
        <TowerCard
          title="Trial-to-Paid Conversion"
          description="Conversion rate from free trial to paid subscription."
        />
        <TowerCard
          title="Customer Acquisition"
          description="New customer acquisition by channel, week, and cohort."
        />
        <TowerCard
          title="Lead Management"
          description="Pipeline of inbound leads and their qualification status."
        />
        <TowerCard
          title="Demo Requests"
          description="Scheduled and completed product demonstrations."
        />
        <TowerCard
          title="Waitlist Management"
          description="Waitlist signups, invitation queue, and activation rates."
        />
        <TowerCard
          title="Churn Analysis"
          description="Customer cancellations, reasons, and churn rate trends."
        />
      </TowerSection>

      <TowerSection title="Voice of Customer">
        <TowerCard
          title="Customer Feedback"
          description="Aggregated in-app feedback and NPS responses."
        />
        <TowerCard
          title="Feature Requests"
          description="Top requested features by volume and customer weight."
        />
        <TowerCard
          title="Product Launch Checklist"
          description="Go-to-market readiness checklist for upcoming feature launches."
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Growth data will appear here once the growth analytics integrations are configured."
      />
    </div>
  )
}
