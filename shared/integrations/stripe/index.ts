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
    // Pinned Stripe API version. Stripe deprecates old versions on an ~18-month
    // rolling schedule. Before each major release cycle, verify this value in the
    // Stripe Dashboard (Developers → API versions) and follow the migration guide
    // at https://stripe.com/docs/upgrades before bumping it.
    // Last reviewed: 2026-07-02. Updated from 2023-10-16 → 2024-06-20.
    'Stripe-Version': '2024-06-20',
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

export interface UpdateSubscriptionPlanResult {
  id: string
  status: string
  current_period_end: number
  items: { data: Array<{ price: { id: string } }> }
}

/**
 * Change the price on an existing Stripe subscription (upgrade or downgrade).
 * Uses immediate proration so the customer is charged/credited on the next invoice.
 * An idempotency key must be supplied by the caller to protect against duplicate
 * submissions (e.g. double-click, network retry).
 * Returns null if STRIPE_SECRET_KEY is not set or the request fails.
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  priceId: string,
  idempotencyKey: string
): Promise<UpdateSubscriptionPlanResult | null> {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.info('[STRIPE] STRIPE_SECRET_KEY not set — skipping subscription update')
    return null
  }
  try {
    // ── TEMPORARY DIAGNOSTIC — remove after issue is resolved ─────────────────
    logger.info('[STRIPE_DIAG] updateSubscriptionPlan entry', {
      subscriptionIdQuoted: `"${subscriptionId}"`,
      length: subscriptionId.length,
      startsWithSub: subscriptionId.startsWith('sub_'),
    })
    // Verify which Stripe account this key belongs to. Skipped in test environment
    // so the extra fetch call does not invalidate existing test mock sequences.
    if (process.env.NODE_ENV !== 'test') {
      try {
        const acctRes = await fetch(`${STRIPE_API}/account`, { headers: stripeHeaders() })
        if (acctRes.ok) {
          const acct = (await acctRes.json()) as { id: string; email?: string }
          logger.info('[STRIPE_DIAG] Stripe account identity', {
            accountId: acct.id,
            email: acct.email ?? '(none)',
          })
        } else {
          logger.warn('[STRIPE_DIAG] Could not retrieve Stripe account', {
            status: acctRes.status,
          })
        }
      } catch (acctErr) {
        logger.warn('[STRIPE_DIAG] Exception retrieving Stripe account', {
          error: String(acctErr),
        })
      }
    }
    // ── END TEMPORARY DIAGNOSTIC ──────────────────────────────────────────────

    // Stripe requires items[0][id] (the subscription item ID, si_...) to modify an
    // existing item's price. Without it, Stripe interprets the payload as "add a new
    // item" rather than "change the price on the current item" and returns an error.
    // The item ID is not stored in our DB, so we retrieve the subscription first.
    const getResponse = await fetch(
      `${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { headers: stripeHeaders() }
    )
    if (!getResponse.ok) {
      const text = await getResponse.text()
      // ── TEMPORARY DIAGNOSTIC — remove after issue is resolved ───────────────
      try {
        const errObj = JSON.parse(text) as { error?: unknown }
        logger.warn('[STRIPE_DIAG] Complete Stripe error on subscription retrieve', {
          stripeError: errObj.error,
        })
      } catch {
        logger.warn('[STRIPE_DIAG] Non-JSON error on subscription retrieve', { raw: text })
      }
      // ── END TEMPORARY DIAGNOSTIC ────────────────────────────────────────────
      logger.warn('[STRIPE] updateSubscriptionPlan: retrieve failed', {
        subscriptionId,
        status: getResponse.status,
        body: text.slice(0, 200),
      })
      return null
    }
    const sub = (await getResponse.json()) as { items: { data: Array<{ id: string }> } }
    const itemId = sub.items.data[0]?.id
    if (!itemId) {
      logger.warn('[STRIPE] updateSubscriptionPlan: no subscription item found', { subscriptionId })
      return null
    }

    const body = formEncode({
      'items[0][id]': itemId,
      'items[0][price]': priceId,
      proration_behavior: 'create_prorations',
    })
    const response = await fetch(
      `${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        method: 'POST',
        headers: {
          ...(stripeHeaders() as Record<string, string>),
          'Idempotency-Key': idempotencyKey,
        },
        body,
      }
    )
    if (!response.ok) {
      const text = await response.text()
      logger.warn('[STRIPE] updateSubscriptionPlan failed', {
        subscriptionId,
        status: response.status,
        body: text.slice(0, 200),
      })
      return null
    }
    const data = (await response.json()) as UpdateSubscriptionPlanResult
    logger.info('[STRIPE] Subscription plan updated', { subscriptionId })
    return data
  } catch (error) {
    logger.warn('[STRIPE] updateSubscriptionPlan threw', { error: String(error) })
    return null
  }
}

/**
 * Schedule a Stripe subscription to cancel at the end of the current billing period.
 * Does not cancel immediately — the customer retains access until period end.
 * Stripe fires customer.subscription.updated; the webhook keeps the DB in sync.
 * An idempotency key must be supplied by the caller.
 * Returns false if STRIPE_SECRET_KEY is not set or the request fails.
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string,
  idempotencyKey: string
): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.info('[STRIPE] STRIPE_SECRET_KEY not set — skipping subscription cancel')
    return false
  }
  try {
    const body = formEncode({ cancel_at_period_end: 'true' })
    const response = await fetch(
      `${STRIPE_API}/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        method: 'POST',
        headers: {
          ...(stripeHeaders() as Record<string, string>),
          'Idempotency-Key': idempotencyKey,
        },
        body,
      }
    )
    if (!response.ok) {
      const text = await response.text()
      logger.warn('[STRIPE] cancelSubscriptionAtPeriodEnd failed', {
        subscriptionId,
        status: response.status,
        body: text.slice(0, 200),
      })
      return false
    }
    logger.info('[STRIPE] Subscription set to cancel at period end', { subscriptionId })
    return true
  } catch (error) {
    logger.warn('[STRIPE] cancelSubscriptionAtPeriodEnd threw', { error: String(error) })
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
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[STRIPE] STRIPE_WEBHOOK_SECRET is not set. ' +
          'Webhook verification requires this key in production.'
      )
    }
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
