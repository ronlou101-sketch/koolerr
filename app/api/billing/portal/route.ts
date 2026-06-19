import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import { createPortalSession } from '@/shared/integrations/stripe'

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session and redirects the browser.
 * The customer must already have a stripeCustomerId on their subscription.
 * Returns 302 on success, 400/503 on error.
 */
export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscriptionResult = await billingService.getSubscription(ctx.tenantId)
  if (!subscriptionResult.ok) {
    return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
  }

  const { stripeCustomerId } = subscriptionResult.value
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer associated with this account' },
      { status: 400 }
    )
  }

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  const session = await createPortalSession({
    customerId: stripeCustomerId,
    returnUrl: `${origin}/billing`,
  })

  if (!session) {
    return NextResponse.json({ error: 'Stripe is not configured or unavailable' }, { status: 503 })
  }

  return NextResponse.redirect(session.url, { status: 303 })
}
