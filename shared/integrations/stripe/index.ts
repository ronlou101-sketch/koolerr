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
  return {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
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
 * Returns null if STRIPE_SECRET_KEY is not set or the request fails.
 */
export async function createCheckoutSession(params: {
  priceId: string
  customerId?: string
  organizationId: string
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

/**
 * Verify a Stripe webhook signature using Web Crypto API (HMAC-SHA-256).
 * Returns true if the signature is valid, false otherwise.
 */
export async function verifyStripeWebhook(payload: string, sigHeader: string): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return false

  const parts = sigHeader.split(',')
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)
  if (!timestamp || !v1) return false

  // Reject webhooks older than 5 minutes to prevent replay attacks
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10))
  if (age > 300) return false

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

    // Constant-time comparison
    if (computed.length !== v1.length) return false
    let diff = 0
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
