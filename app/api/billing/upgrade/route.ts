import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform'
import { billingService } from '@/domains/billing'
import { updateSubscriptionPlan } from '@/shared/integrations/stripe'
import { stripePriceId } from '@/domains/billing/plans'
import type { PlanId } from '@/domains/billing/plans'

/**
 * POST /api/billing/upgrade
 *
 * Change the plan on an existing Stripe subscription (upgrade or downgrade).
 * Body (JSON): { planId: 'build' | 'grow' | 'scale' }
 *
 * Security invariants:
 *   - The subscription ID is always read from the DB by authenticated organizationId.
 *     It is never accepted from the client body.
 *   - Changing to the current plan is rejected with 409.
 *   - An Idempotency-Key is forwarded to Stripe on every mutation.
 *
 * The webhook (customer.subscription.updated) is the source of truth for DB state.
 * This route calls Stripe and returns; it never writes billing records directly.
 */
export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let planId: PlanId
  try {
    const body = (await request.json()) as { planId?: string }
    if (body.planId !== 'build' && body.planId !== 'grow' && body.planId !== 'scale') {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }
    planId = body.planId
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  await bootstrapPlatform()

  // Subscription ID always comes from the DB, keyed by authenticated organizationId.
  // The client never supplies a subscription ID.
  const subResult = await billingService.getSubscription(ctx.organizationId)
  if (!subResult.ok) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }
  const subscription = subResult.value

  if (subscription.planId === planId) {
    return NextResponse.json({ error: 'You are already on this plan.' }, { status: 409 })
  }

  if (!subscription.stripeSubscriptionId) {
    return NextResponse.json(
      { error: 'No Stripe subscription found. Please complete checkout first.' },
      { status: 422 }
    )
  }

  const priceId = stripePriceId(planId)
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price for plan "${planId}" is not configured` },
      { status: 503 }
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const idempotencyKey = `upgrade-${ctx.organizationId}-to-${planId}-${today}`

  const result = await updateSubscriptionPlan(
    subscription.stripeSubscriptionId,
    priceId,
    idempotencyKey
  )

  if (!result) {
    return NextResponse.json(
      { error: 'Failed to update subscription. Please try again.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true })
}
