import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform'
import { billingService } from '@/domains/billing'
import { cancelSubscriptionAtPeriodEnd } from '@/shared/integrations/stripe'

/**
 * POST /api/billing/cancel
 *
 * Schedule the authenticated organization's subscription to cancel at the end
 * of the current billing period. Access continues until then.
 *
 * Security invariants:
 *   - The subscription ID is always read from the DB by authenticated organizationId.
 *     It is never accepted from the client.
 *   - An Idempotency-Key is forwarded to Stripe on every mutation.
 *
 * The webhook (customer.subscription.updated) is the source of truth for DB state.
 * This route calls Stripe and returns; it never writes billing records directly.
 *
 * Returns: { success: true, cancelAt: ISO string } on success.
 */
export async function POST(request: Request) {
  // Satisfy Next.js's requirement that POST handlers reference the request
  void request

  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  // Subscription ID always comes from the DB, keyed by authenticated organizationId.
  const subResult = await billingService.getSubscription(ctx.organizationId)
  if (!subResult.ok) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }
  const subscription = subResult.value

  if (!subscription.stripeSubscriptionId) {
    return NextResponse.json({ error: 'No Stripe subscription found' }, { status: 422 })
  }

  if (subscription.status === 'canceled') {
    return NextResponse.json({ error: 'Subscription is already canceled.' }, { status: 409 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const idempotencyKey = `cancel-${ctx.organizationId}-${today}`

  const success = await cancelSubscriptionAtPeriodEnd(
    subscription.stripeSubscriptionId,
    idempotencyKey
  )

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again.' },
      { status: 502 }
    )
  }

  return NextResponse.json({
    success: true,
    cancelAt: subscription.currentPeriodEnd.toISOString(),
  })
}
