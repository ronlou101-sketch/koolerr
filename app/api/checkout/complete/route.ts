/**
 * POST /api/checkout/complete
 *
 * Public route — no authentication required.
 * Body: { sessionId: string }
 *
 * Called by /checkout/success immediately after Stripe redirects the customer.
 * Verifies payment, provisions the platform account (idempotent), upgrades the
 * subscription to the paid plan, and patches the Stripe subscription metadata
 * with organization_id so future webhook events route correctly.
 *
 * Retry safety: this route is fully idempotent. The client may call it multiple
 * times with the same sessionId — each call produces the same outcome.
 * Internal retry: up to 3 attempts with 1-second backoff before returning an
 * error. The client Retry button may call the route again for additional attempts.
 *
 * On success, sets a short-lived httpOnly cookie (pending_password_setup) so
 * /api/checkout/set-password can authorize the password-creation step without
 * requiring the client to handle internal user IDs.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'
import { provisionPlatformAccount } from '@/infrastructure/auth'
import { identityService } from '@/domains/identity'
import { billingService, PLAN_ENTITLEMENTS } from '@/domains/billing'
import { bootstrapPlatform, isPlatformBootstrapped } from '@/infrastructure/platform'
import {
  retrieveCheckoutSession,
  updateStripeSubscriptionMetadata,
} from '@/shared/integrations/stripe'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'
import type { TenantId } from '@/shared/types'
import type { PlanId } from '@/domains/billing/plans'
import { PLAN_IDS } from '@/domains/billing/plans'

export const runtime = 'nodejs'

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function attemptProvisioning(
  email: string,
  tenantId: TenantId,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planId: string
): Promise<{ authUserId: string; isNewAccount: boolean }> {
  const adminClient = createServerSupabaseClient()

  // Create the Supabase auth user. If they already exist (retry or pre-existing
  // account), proceed without authUserId — provisionPlatformAccount is idempotent.
  let newAuthUserId: string | undefined
  const { data: createData } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (createData?.user) {
    newAuthUserId = createData.user.id
  } else {
    logger.info('[CHECKOUT_COMPLETE] Auth user already exists, proceeding idempotently', { email })
  }

  // Provision platform account (org, brain, membership, workforce, subscription).
  // Idempotent — safe to call multiple times for the same email.
  const provisionResult = await provisionPlatformAccount(email, 'My Organization', newAuthUserId)
  if (!provisionResult.success) {
    throw new Error(`Provisioning failed: ${provisionResult.error}`)
  }

  // Resolve the organization created (or already existing) for this user.
  const userResult = await identityService.getUserByEmail(email, tenantId)
  if (!userResult.ok) throw new Error('Could not find user record after provisioning')

  const platformUser = userResult.value
  const membershipsResult = await identityService.getMemberships(platformUser.id)
  if (!membershipsResult.ok || membershipsResult.value.length === 0) {
    throw new Error('Could not find organization membership after provisioning')
  }

  const organizationId = membershipsResult.value[0].organizationId

  // Upgrade the subscription from unpaid to the purchased plan.
  const updateResult = await billingService.updateSubscriptionStripeData({
    organizationId,
    stripeCustomerId,
    stripeSubscriptionId,
    planId,
    status: 'active',
  })
  if (!updateResult.ok) {
    throw new Error(`Subscription upgrade failed: ${updateResult.error.message}`)
  }

  // Update entitlements to match the paid plan limits.
  const planKey = (PLAN_IDS[planId as PlanId] ? planId : 'build') as PlanId
  const planLimits = PLAN_ENTITLEMENTS[planKey]
  for (const [feature, limit] of Object.entries(planLimits)) {
    await billingService.setEntitlement({ organizationId, feature, limit })
  }

  // Patch organization_id onto the Stripe subscription metadata so future
  // webhook events (subscription.updated, invoice.payment_failed) can route
  // to the correct organization. Non-fatal if Stripe is unreachable.
  await updateStripeSubscriptionMetadata(stripeSubscriptionId, {
    organization_id: organizationId,
    tenant_id: tenantId,
  })

  logger.info('[CHECKOUT_COMPLETE] Provisioning complete', {
    email,
    organizationId,
    planId,
    isNewAccount: !!newAuthUserId,
  })

  const authUserId = newAuthUserId ?? platformUser.authUserId
  if (!authUserId) throw new Error('Auth user ID could not be resolved after provisioning')

  return { authUserId, isNewAccount: !!newAuthUserId }
}

export async function POST(request: Request) {
  // Bootstrap the platform so billingService and identityService use Supabase.
  if (!isPlatformBootstrapped()) await bootstrapPlatform()

  let body: { sessionId?: unknown }
  try {
    body = (await request.json()) as { sessionId?: unknown }
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { sessionId } = body
  if (typeof sessionId !== 'string' || !sessionId) {
    return NextResponse.json({ error: 'sessionId_required' }, { status: 400 })
  }

  // Verify the Stripe checkout session and confirm payment.
  const stripeSession = await retrieveCheckoutSession(sessionId)
  if (!stripeSession) {
    return NextResponse.json({ error: 'stripe_unavailable' }, { status: 503 })
  }

  if (stripeSession.payment_status !== 'paid') {
    return NextResponse.json(
      { error: 'payment_not_confirmed', paymentStatus: stripeSession.payment_status },
      { status: 402 }
    )
  }

  const email = stripeSession.customer_details?.email
  if (!email) {
    return NextResponse.json({ error: 'missing_email' }, { status: 422 })
  }

  const stripeCustomerId = stripeSession.customer
  const stripeSubscriptionId = stripeSession.subscription
  const planId = stripeSession.metadata?.plan_id ?? 'build'
  const tenantId = env.platform.tenantId()

  // Attempt provisioning with internal retry (3 attempts, 1-second backoff).
  const MAX_ATTEMPTS = 3
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { authUserId, isNewAccount } = await attemptProvisioning(
        email,
        tenantId,
        stripeCustomerId,
        stripeSubscriptionId,
        planId
      )

      const response = NextResponse.json({ email, isNewAccount })
      // Short-lived httpOnly cookie authorizes the set-password step.
      response.cookies.set('pending_password_setup', authUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 30, // 30 minutes
        path: '/',
      })
      return response
    } catch (e) {
      lastError = e
      logger.warn('[CHECKOUT_COMPLETE] Provisioning attempt failed', {
        attempt,
        email,
        error: String(e),
      })
      if (attempt < MAX_ATTEMPTS) await delay(1000)
    }
  }

  logger.error('[CHECKOUT_COMPLETE] All provisioning attempts failed', {
    email,
    error: String(lastError),
  })
  return NextResponse.json(
    { error: 'provisioning_failed', message: String(lastError) },
    { status: 500 }
  )
}
