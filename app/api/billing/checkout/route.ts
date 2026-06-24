import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import { createCheckoutSession } from '@/shared/integrations/stripe'
import { stripePriceId } from '@/domains/billing/plans'
import type { PlanId } from '@/domains/billing/plans'

/**
 * POST /api/billing/checkout
 *
 * Creates a Stripe Checkout Session for plan upgrade.
 * Body: { planId: 'starter' | 'growth' }
 * Returns: { url: string } — redirect the browser to this URL.
 *
 * The success URL embeds the session ID so the webhook can be correlated.
 * The webhook (not this route) is responsible for updating the subscription —
 * this route only creates the Checkout session.
 */
export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let planId: PlanId
  try {
    const formData = await request.formData()
    const raw = formData.get('planId')
    if (raw !== 'starter' && raw !== 'growth') {
      return NextResponse.json({ error: 'Invalid planId' }, { status: 400 })
    }
    planId = raw
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const priceId = stripePriceId(planId)
  if (!priceId) {
    return NextResponse.json(
      { error: `Stripe price ID for plan "${planId}" is not configured` },
      { status: 503 }
    )
  }

  const subscriptionResult = await billingService.getSubscription(ctx.tenantId)
  const existingCustomerId = subscriptionResult.ok
    ? subscriptionResult.value.stripeCustomerId
    : undefined

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const session = await createCheckoutSession({
    priceId,
    customerId: existingCustomerId,
    organizationId: ctx.organizationId,
    tenantId: ctx.tenantId,
    successUrl: `${origin}/billing?upgraded=1`,
    cancelUrl: `${origin}/billing`,
  })

  if (!session) {
    return NextResponse.json({ error: 'Stripe is not configured or unavailable' }, { status: 503 })
  }

  return NextResponse.json({ url: session.url })
}
