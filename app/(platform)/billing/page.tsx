import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import { PLAN_LABELS, PLAN_PRICES_CENTS } from '@/domains/billing/plans'
import type { PlanId } from '@/domains/billing/plans'

/**
 * Billing Management page.
 *
 * Shows current plan, subscription status, and upgrade/manage actions.
 * Upgrades redirect to Stripe Checkout via /api/billing/checkout.
 * Existing subscribers with a Stripe Customer ID are redirected to the
 * Stripe Customer Portal via /api/billing/portal.
 *
 * See docs/adr/ADR-021-stripe-billing-integration.md
 */

const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    '10 Engagement Runs / month',
    '50,000 model tokens / month',
    'All Workforces',
    'Business Brain',
  ],
  starter: [
    '250 Engagement Runs / month',
    '500,000 model tokens / month',
    'All Workforces',
    'Business Brain',
    'CTO Agent (Atlas)',
    'GitHub integration',
    'Priority support',
  ],
  growth: [
    'Unlimited Engagement Runs',
    '5,000,000 model tokens / month',
    'All Workforces',
    'Business Brain',
    'CTO Agent (Atlas)',
    'All platform integrations',
    'Mission Control',
    'Dedicated support',
  ],
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'Free'
  return `$${cents / 100}/mo`
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { upgraded } = await searchParams
  const subscriptionResult = await billingService.getSubscription(ctx.tenantId)
  const subscription = subscriptionResult.ok ? subscriptionResult.value : null
  const currentPlanId = (subscription?.planId ?? 'free') as PlanId
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY

  const plans: PlanId[] = ['free', 'starter', 'growth']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your Koolerr subscription and payment method.
        </p>
      </div>

      {upgraded && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Subscription updated. Your new plan will be active shortly.
        </div>
      )}

      {!stripeEnabled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
          Stripe is not configured. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
          STRIPE_STARTER_PRICE_ID, and STRIPE_GROWTH_PRICE_ID to enable payment collection.
        </div>
      )}

      {/* Current plan summary */}
      {subscription && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {PLAN_LABELS[currentPlanId] ?? currentPlanId}
              </p>
              <p className="text-sm capitalize text-muted-foreground">{subscription.status}</p>
              {subscription.currentPeriodEnd && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Period ends {subscription.currentPeriodEnd.toLocaleDateString()}
                </p>
              )}
            </div>
            {subscription.stripeCustomerId && (
              <form action="/api/billing/portal" method="POST">
                <button
                  type="submit"
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Manage Billing →
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((planId) => {
          const isCurrent = planId === currentPlanId
          const isUpgrade = plans.indexOf(planId) > plans.indexOf(currentPlanId)
          return (
            <div
              key={planId}
              className={`rounded-lg border p-4 ${
                isCurrent ? 'border-foreground bg-card' : 'border-border bg-card opacity-90'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{PLAN_LABELS[planId]}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {formatPrice(PLAN_PRICES_CENTS[planId])}
                  </p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
                    Current
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-1.5">
                {PLAN_FEATURES[planId].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="mt-0.5 text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              {isUpgrade && stripeEnabled && !isCurrent && (
                <form
                  action="/api/billing/checkout"
                  method="POST"
                  className="mt-4"
                  onSubmit={undefined}
                >
                  <input type="hidden" name="planId" value={planId} />
                  <button
                    type="submit"
                    className="w-full rounded-md bg-foreground py-2 text-sm font-medium text-background hover:opacity-90"
                  >
                    Upgrade to {PLAN_LABELS[planId]}
                  </button>
                </form>
              )}
              {isUpgrade && !stripeEnabled && (
                <p className="mt-4 text-xs text-muted-foreground">Stripe not configured</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Questions?{' '}
        <Link href="/cto" className="underline hover:text-foreground">
          Ask Atlas
        </Link>{' '}
        for billing strategy advice.
      </div>
    </div>
  )
}
