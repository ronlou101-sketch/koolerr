import { logger } from '@/shared/lib/logger'

/**
 * Stripe Integration — Checkout and Customer Portal
 *
 * Non-fatal, env-keyed. Returns null on any failure.
 * Uses native fetch against the Stripe REST API — no SDK dependency.
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY         — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET     — whsec_... (for webhook verification)
 *   STRIPE_BUILD_PRICE_ID     — Stripe Price ID for the BUILD plan
 *   STRIPE_GROW_PRICE_ID      — Stripe Price ID for the GROW plan
 *   STRIPE_SCALE_PRICE_ID     — Stripe Price ID for the SCALE plan
 *
 * See docs/adr/ADR-021-stripe-billing-integration.md
 */

const STRIPE_API = 'https://api.stripe.com/v1'

function stripeHeaders(): HeadersInit {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    // Belt-and-suspenders: every public function guards with an early return before
    // calling here. This throw catches any future caller that forgets that guard,
    // preventing "Bearer undefined" from being sent silently to the Stripe API.
    throw new Error(
      '[STRIPE] stripeHeaders() called without STRIPE_SECRET_KEY. ' +
        'Every call site must guard with an early return before invoking this function.'
    )
  }
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Version': '2023-10-16',
  }
}

function formEncode(data: Record<string, string | undefined>): string {
  return Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&')
}

export interface CheckoutSessionResult {
  url: string
  sessionId: string
}

export interface PortalSessionResult {
  url: string
}

/**
 * Create a Stripe Checkout Session for subscription upgrade.
 * organizationId is optional for pre-auth checkout flows where the org does
 * not yet exist. When omitted, organization metadata is excluded from the
 * session; the /api/checkout/complete route patches it onto the Stripe
 * subscription after provisioning via updateStripeSubscriptionMetadata.
 * Returns null if STRIPE_SECRET_KEY is not set or the request fails.
 */
export async function createCheckoutSession(params: {
  priceId: string
  planId: string
  customerId?: string
  organizationId?: string
  tenantId: string
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutSessionResult | null> {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.info('[STRIPE] STRIPE_SECRET_KEY not set — skipping checkout session')
    return null
  }

  try {
    const body = formEncode({
      mode: 'subscription',
      'line_items[0][price]': params.priceId,
      'line_items[0][quantity]': '1',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer: params.customerId,
      'metadata[organization_id]': params.organizationId,
      'metadata[tenant_id]': params.tenantId,
      'metadata[plan_id]': params.planId,
      'subscription_data[metadata][organization_id]': params.organizationId,
      'subscription_data[metadata][tenant_id]': params.tenantId,
    })

    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: stripeHeaders(),
      body,
    })

    if (!response.ok) {
      const text = await response.text()
      logger.warn('[STRIPE] Checkout session creation failed', {
        status: response.status,
        body: text.slice(0, 200),
      })
      return null
    }

    const data = (await response.json()) as { url: string; id: string }
    logger.info('[STRIPE] Checkout session created', { sessionId: data.id })
    return { url: data.url, sessionId: data.id }
  } catch (error) {
    logger.warn('[STRIPE] createCheckoutSession threw', { error: String(error) })
    return null
  }
}

/**
 * Create a Stripe Customer Portal session for subscription management.
 * Returns null if STRIPE_SECRET_KEY is not set or the request fails.
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}): Promise<PortalSessionResult | null> {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.info('[STRIPE] STRIPE_SECRET_KEY not set — skipping portal session')
    return null
  }

  try {
    const body = formEncode({
      customer: params.customerId,
      return_url: params.returnUrl,
    })

    const response = await fetch(`${STRIPE_API}/billing_portal/sessions`, {
      method: 'POST',
      headers: stripeHeaders(),
      body,
    })

    if (!response.ok) {
      const text = await response.text()
      logger.warn('[STRIPE] Portal session creation failed', {
        status: response.status,
        body: text.slice(0, 200),
      })
      return null
    }

    const data = (await response.json()) as { url: string }
    return { url: data.url }
  } catch (error) {
    logger.warn('[STRIPE] createPortalSession threw', { error: String(error) })
    return null
  }
}

export interface StripeCheckoutSessionData {
  id: string
  payment_status: string
  customer: string
  subscription: string
  metadata: Record<string, string>
  customer_details: { email: string | null } | null
}

/**
 * Retrieve a Stripe Checkout Session by ID.
 * Used by /api/checkout/complete to verify payment and extract session data.
 * Returns null if STRIPE_SECRET_KEY is not set or the request fails.
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<StripeCheckoutSessionData | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null
  try {
    const response = await fetch(
      `${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: stripeHeaders(),
      }
    )
    if (!response.ok) {
      const text = await response.text()
      logger.warn('[STRIPE] retrieveCheckoutSession failed', {
        status: response.status,
        body: text.slice(0, 200),
      })
      return null
    }
    return (await response.json()) as StripeCheckoutSessionData
  } catch (error) {
    logger.warn('[STRIPE] retrieveCheckoutSession threw', { error: String(error) })
    return null
  }
}

/**
 * Patch metadata onto an existing Stripe Subscription.
 * Called after pre-auth checkout provisioning to set organization_id so that
 * future webhook events (subscription.updated, invoice.payment_failed) can
 * route correctly to the now-provisioned organization.
 * Returns false (non-fatal) on any failure.
 */
export async function updateStripeSubscriptionMetadata(
  subscriptionId: string,
  metadata: Record<string, string>
): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) return false
  try {
    const fields: Record<string, string> = {}
    for (const [k, v] of Object.entries(metadata)) {
      fields[`metadata[${k}]`] = v
    }
    const response = await fetch(
      `${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        method: 'POST',
        headers: stripeHeaders(),
        body: formEncode(fields),
      }
    )
    if (!response.ok) {
      const text = await response.text()
      logger.warn('[STRIPE] updateStripeSubscriptionMetadata failed', {
        subscriptionId,
        status: response.status,
        body: text.slice(0, 200),
      })
      return false
    }
    logger.info('[STRIPE] Subscription metadata updated', { subscriptionId })
    return true
  } catch (error) {
    logger.warn('[STRIPE] updateStripeSubscriptionMetadata threw', { error: String(error) })
    return false
  }
}

/**
 * Verify a Stripe webhook signature using Web Crypto API (HMAC-SHA-256).
 * Returns true if the signature is valid, false otherwise.
 */
export async function verifyStripeWebhook(payload: string, sigHeader: string): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    logger.warn('[STRIPE_VERIFY] STRIPE_WEBHOOK_SECRET is not set — rejecting webhook')
    return false
  }

  logger.info('[STRIPE_VERIFY] Secret loaded', {
    secretLength: secret.length,
    secretPrefix: secret.startsWith('whsec_') ? 'whsec_' : secret.slice(0, 4) + '…',
  })

  const parts = sigHeader.split(',')
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)

  logger.info('[STRIPE_VERIFY] Header parsed', {
    partCount: parts.length,
    hasTimestamp: !!timestamp,
    hasV1Signature: !!v1,
    v1Length: v1?.length ?? 0,
  })

  if (!timestamp || !v1) {
    logger.warn('[STRIPE_VERIFY] Missing timestamp or v1 signature in Stripe-Signature header', {
      rawHeader: sigHeader.slice(0, 80),
    })
    return false
  }

  // Reject webhooks older than 5 minutes to prevent replay attacks
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10))
  logger.info('[STRIPE_VERIFY] Timestamp age', { ageSeconds: Math.round(age), valid: age <= 300 })
  if (age > 300) {
    logger.warn('[STRIPE_VERIFY] Webhook timestamp too old — replay attack protection triggered', {
      ageSeconds: Math.round(age),
    })
    return false
  }

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signedPayload = `${timestamp}.${payload}`
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
    const computed = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const match = computed === v1
    logger.info('[STRIPE_VERIFY] HMAC comparison', {
      computedPrefix: computed.slice(0, 8),
      expectedPrefix: v1.slice(0, 8),
      computedLength: computed.length,
      expectedLength: v1.length,
      match,
    })

    if (!match) {
      logger.warn('[STRIPE_VERIFY] HMAC mismatch — wrong secret or payload mutation')
      return false
    }

    return true
  } catch (error) {
    logger.warn('[STRIPE_VERIFY] Exception during HMAC computation', {
      error: String(error),
    })
    return false
  }
}
