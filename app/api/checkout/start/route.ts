/**
 * GET /api/checkout/start?plan=build|grow|scale
 *
 * Public route — no authentication required.
 * Creates a Stripe Checkout Session for a new (unauthenticated) customer and
 * redirects them to the Stripe-hosted checkout page. After payment, Stripe
 * redirects to /checkout/success?session_id={CHECKOUT_SESSION_ID}.
 *
 * organization_id is intentionally absent from the session metadata because
 * the organization does not exist until after checkout completes. The
 * /api/checkout/complete route provisions the account and patches the Stripe
 * subscription metadata with organization_id so future webhook events route
 * correctly.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/shared/integrations/stripe'
import { stripePriceId } from '@/domains/billing/plans'
import type { PlanId } from '@/domains/billing/plans'
import { env } from '@/shared/config/env'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const plan = searchParams.get('plan')

  if (plan !== 'build' && plan !== 'grow' && plan !== 'scale') {
    return NextResponse.redirect(new URL('/pricing', origin))
  }

  const planId = plan as PlanId
  const priceId = stripePriceId(planId)

  if (!priceId) {
    return NextResponse.redirect(new URL('/pricing?error=not_configured', origin))
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
  const tenantId = env.platform.tenantId()

  const session = await createCheckoutSession({
    priceId,
    planId,
    tenantId,
    successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/pricing`,
  })

  if (!session) {
    return NextResponse.redirect(new URL('/pricing?error=stripe_unavailable', origin))
  }

  return NextResponse.redirect(session.url)
}
