import Link from 'next/link'
import { getBillingHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function BillingHealthPage() {
  const data = await getBillingHealthDetail()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <Link href="/tower/health" className="hover:text-foreground">
              System Health
            </Link>
            <span>/</span>
            <span className="text-foreground">Billing Health</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Billing Health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stripe integration status and payment health across all customer subscriptions.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Contributing Factors</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <TowerHealthCard
            title="Stripe Connection"
            status={data.stripeConnected ? 'healthy' : 'not-configured'}
            value={data.stripeConnected ? 'Connected' : 'Not Configured'}
            detail={
              data.stripeConnected
                ? 'Stripe subscriptions detected in the database'
                : 'No stripe_subscription_id found on any subscription'
            }
          />
          <TowerHealthCard
            title="Active Stripe Subscriptions"
            status={data.stripeConnected ? 'healthy' : 'not-configured'}
            value={String(data.stripeActiveCount)}
            detail={`${data.stripeActiveCount} subscription${data.stripeActiveCount !== 1 ? 's' : ''} with active Stripe IDs`}
          />
          <TowerHealthCard
            title="Past Due Payments"
            status={data.pastDueCount > 0 ? 'warning' : 'healthy'}
            value={String(data.pastDueCount)}
            detail={
              data.pastDueCount > 0
                ? `${data.pastDueCount} subscription${data.pastDueCount !== 1 ? 's' : ''} with payment failures`
                : 'No payment failures detected'
            }
          />
        </div>
      </section>

      <TowerHealthCalc
        description="Billing health combines Stripe integration status with payment failure detection."
        rules={[
          'Not Configured when no subscriptions have Stripe IDs — indicates Stripe is not yet integrated.',
          'Warning when past_due subscriptions exist — payment recovery is required.',
          'Healthy when Stripe is connected and no subscriptions are past_due.',
          'Critical if the subscriptions table is inaccessible.',
        ]}
      />

      <TowerHealthAction
        label="Manage Billing"
        href="/tower/billing"
        description="View Stripe configuration, subscription details, and payment status."
      />
    </div>
  )
}
