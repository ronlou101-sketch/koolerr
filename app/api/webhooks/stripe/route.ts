import { NextResponse } from 'next/server'
import { billingService } from '@/domains/billing'
import { verifyStripeWebhook } from '@/shared/integrations/stripe'
import { bootstrapPlatform, isPlatformBootstrapped } from '@/infrastructure/platform'
import { logger } from '@/shared/lib/logger'
import type { TenantId } from '@/shared/types'
import type { BillingStatus } from '@/domains/billing/types'

/**
 * Stripe Webhook Handler
 *
 * Receives and verifies Stripe lifecycle events, then updates the
 * billing domain accordingly. The webhook endpoint URL must be registered
 * in the Stripe Dashboard.
 *
 * Events handled:
 *   checkout.session.completed       — records Stripe IDs, upgrades plan
 *   customer.subscription.updated    — syncs status and period end
 *   customer.subscription.deleted    — marks subscription canceled
 *   invoice.payment_failed           — marks subscription past_due
 *
 * Authentication: Stripe-Signature header verified via HMAC-SHA-256.
 * STRIPE_WEBHOOK_SECRET must be set in environment.
 *
 * Bootstrap is handled by instrumentation.ts at server startup.
 * Do not call bootstrapPlatform() here — top-level await in route modules
 * runs during Next.js build's page-data collection phase, which fails when
 * server-only env vars (SUPABASE_SERVICE_ROLE_KEY) are not set at build time.
 *
 * See docs/adr/ADR-021-stripe-billing-integration.md
 */

// Stripe event shapes (subset of fields we use)
interface StripeCheckoutSession {
  object: 'checkout.session'
  customer: string
  subscription: string
  metadata: { tenant_id?: string; organization_id?: string }
}

interface StripeSubscription {
  object: 'subscription'
  id: string
  customer: string
  status: string
  current_period_end: number
  items: { data: Array<{ price: { id: string; product: string } }> }
  metadata: { tenant_id?: string }
}

interface StripeInvoice {
  object: 'invoice'
  subscription: string
  customer: string
  metadata: { tenant_id?: string }
}

interface StripeEvent {
  type: string
  data: { object: StripeCheckoutSession | StripeSubscription | StripeInvoice }
}

function statusFromStripe(stripeStatus: string): BillingStatus {
  const map: Record<string, BillingStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
    paused: 'past_due',
  }
  return map[stripeStatus] ?? 'active'
}

export async function POST(request: Request) {
  // Each Next.js webpack bundle is isolated. instrumentation.ts bootstraps its
  // own bundle — it does not configure the billingService reference this route
  // uses. Without this guard, billingService stays as InMemoryBillingRepository
  // and all DB writes are silently discarded. See infrastructure/auth/resolve.ts
  // for the same pattern used by authenticated routes.
  if (!isPlatformBootstrapped()) await bootstrapPlatform()

  const sigHeader = request.headers.get('stripe-signature')
  if (!sigHeader) {
    return NextResponse.json({ error: 'Missing Stripe-Signature' }, { status: 400 })
  }

  const payload = await request.text()
  const valid = await verifyStripeWebhook(payload, sigHeader)
  if (!valid) {
    logger.warn('[STRIPE_WEBHOOK] Signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  logger.info('[STRIPE_WEBHOOK] Event received', { type: event.type })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSession
        const tenantId = session.metadata?.tenant_id as TenantId | undefined
        if (!tenantId) {
          logger.warn('[STRIPE_WEBHOOK] checkout.session.completed missing tenant_id in metadata')
          break
        }
        const updateResult = await billingService.updateSubscriptionStripeData({
          tenantId,
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          status: 'active',
        })
        if (!updateResult.ok) {
          logger.error('[STRIPE_WEBHOOK] Failed to persist Stripe subscription data', {
            tenantId,
            error: updateResult.error.message,
            code: updateResult.error.code,
          })
          return NextResponse.json({ error: 'Internal error' }, { status: 500 })
        }
        logger.info('[STRIPE_WEBHOOK] Subscription activated via checkout', { tenantId })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as StripeSubscription
        const tenantId = sub.metadata?.tenant_id as TenantId | undefined
        if (!tenantId) {
          logger.warn('[STRIPE_WEBHOOK] subscription.updated missing tenant_id in metadata')
          break
        }
        const priceId = sub.items.data[0]?.price?.id
        await billingService.updateSubscriptionStripeData({
          tenantId,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          status: statusFromStripe(sub.status),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as StripeSubscription
        const tenantId = sub.metadata?.tenant_id as TenantId | undefined
        if (!tenantId) break
        await billingService.updateSubscriptionStripeData({
          tenantId,
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          status: 'canceled',
        })
        logger.info('[STRIPE_WEBHOOK] Subscription canceled', { tenantId })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as StripeInvoice
        const tenantId = invoice.metadata?.tenant_id as TenantId | undefined
        if (!tenantId) break
        await billingService.updateSubscriptionStatus(tenantId, 'past_due')
        logger.warn('[STRIPE_WEBHOOK] Payment failed — subscription past_due', { tenantId })
        break
      }

      default:
        // Unhandled event type — acknowledge receipt to prevent Stripe retries
        break
    }
  } catch (error) {
    logger.error('[STRIPE_WEBHOOK] Handler error', { type: event.type, error: String(error) })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
