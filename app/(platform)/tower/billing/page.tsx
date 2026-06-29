import { TowerCard } from '../_components/TowerCard'
import { TowerSection } from '../_components/TowerSection'
import { TowerEmptyState } from '../_components/TowerEmptyState'

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-muted-foreground">Tower Control</p>
        <h1 className="mt-0.5 text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscription status and payment health across all customer organizations.
        </p>
      </div>

      <TowerSection title="Subscription Overview">
        <TowerCard
          title="Billing Overview"
          description="Total subscriptions by status: active, trialing, past_due, canceled."
        />
        <TowerCard
          title="Active Plans"
          description="Which organizations are on which plans and their billing cycles."
        />
        <TowerCard
          title="Subscription Health"
          description="Percentage of subscriptions in healthy vs. at-risk states."
        />
      </TowerSection>

      <TowerSection title="Payment Status">
        <TowerCard
          title="Payment Issues"
          description="Organizations with failed payments or past_due subscription status."
        />
        <TowerCard
          title="Dunning Status"
          description="Stripe dunning process status for organizations with payment failures."
        />
        <TowerCard
          title="Stripe Configuration"
          description="Stripe API connection status, webhook registration, and test vs. live mode."
          badge="Config"
        />
      </TowerSection>

      <TowerEmptyState
        title="Integration pending"
        description="Billing data will appear here once the cross-org billing query integration is complete."
      />
    </div>
  )
}
