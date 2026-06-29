import Link from 'next/link'
import { getSubscriptionsHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function SubscriptionsHealthPage() {
  const data = await getSubscriptionsHealthDetail()

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
            <span className="text-foreground">Subscriptions</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Active Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Subscription status breakdown across all customer organizations.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Status Breakdown</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TowerHealthCard
            title="Active"
            status="healthy"
            value={String(data.active)}
            detail="Subscriptions in good standing"
          />
          <TowerHealthCard
            title="Trialing"
            status="healthy"
            value={String(data.trialing)}
            detail="Organizations on a free trial"
          />
          <TowerHealthCard
            title="Past Due"
            status={data.pastDue > 0 ? 'warning' : 'healthy'}
            value={String(data.pastDue)}
            detail={
              data.pastDue > 0
                ? `${data.pastDue} subscription${data.pastDue !== 1 ? 's' : ''} with failed payment`
                : 'No payment failures'
            }
          />
          <TowerHealthCard
            title="Canceled"
            status="healthy"
            value={String(data.canceled)}
            detail="Subscriptions that have been canceled"
          />
        </div>
      </section>

      {data.planBreakdown.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Plan Distribution</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Organizations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.planBreakdown.map((plan) => (
                  <tr key={plan.planId}>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{plan.planId}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {plan.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <TowerHealthCalc
        description="Subscription health is determined by the presence of past_due subscriptions. Past due status indicates a payment failure that may lead to service interruption."
        rules={[
          'Healthy when all subscriptions are active, trialing, or canceled with no payment failures.',
          'Warning when one or more subscriptions are past_due — these require payment recovery.',
          'Critical if the subscriptions table is inaccessible.',
        ]}
      />

      <TowerHealthAction
        label="Manage Billing"
        href="/tower/billing"
        description="View subscription details, payment status, and Stripe configuration."
      />
    </div>
  )
}
