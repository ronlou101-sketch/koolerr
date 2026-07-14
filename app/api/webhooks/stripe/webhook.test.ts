import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/platform', () => ({
  bootstrapPlatform: vi.fn(),
  isPlatformBootstrapped: vi.fn().mockReturnValue(true),
}))
vi.mock('@/domains/billing', () => ({
  billingService: {
    updateSubscriptionStripeData: vi.fn().mockResolvedValue({ ok: true, value: {} }),
    updateSubscriptionStatus: vi.fn().mockResolvedValue({ ok: true, value: {} }),
  },
}))
vi.mock('@/shared/integrations/stripe', () => ({
  verifyStripeWebhook: vi.fn().mockResolvedValue(true),
}))

import { POST } from './route'
import { billingService } from '@/domains/billing'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSubscriptionUpdatedPayload(overrides: {
  organizationId: string
  priceId: string
  subscriptionId?: string
  status?: string
  currentPeriodEnd?: number
}) {
  return {
    type: 'customer.subscription.updated',
    data: {
      object: {
        object: 'subscription',
        id: overrides.subscriptionId ?? 'sub_123',
        customer: 'cus_abc',
        status: overrides.status ?? 'active',
        current_period_end: overrides.currentPeriodEnd ?? 1800000000,
        items: {
          data: [{ price: { id: overrides.priceId, product: 'prod_1' } }],
        },
        metadata: { organization_id: overrides.organizationId },
      },
    },
  }
}

function webhookRequest(payload: unknown) {
  const body = JSON.stringify(payload)
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=fakesig`,
      'Content-Type': 'application/json',
    },
    body,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/webhooks/stripe — planId synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(billingService.updateSubscriptionStripeData).mockResolvedValue({
      ok: true,
      value: {} as never,
    })
    delete process.env.STRIPE_BUILD_PRICE_ID
    delete process.env.STRIPE_GROW_PRICE_ID
    delete process.env.STRIPE_SCALE_PRICE_ID
  })
  afterEach(() => {
    delete process.env.STRIPE_BUILD_PRICE_ID
    delete process.env.STRIPE_GROW_PRICE_ID
    delete process.env.STRIPE_SCALE_PRICE_ID
  })

  it('includes resolved planId="build" in updateSubscriptionStripeData when price matches BUILD', async () => {
    process.env.STRIPE_BUILD_PRICE_ID = 'price_build_live'
    const payload = makeSubscriptionUpdatedPayload({
      organizationId: 'org_abc',
      priceId: 'price_build_live',
    })
    const res = await POST(webhookRequest(payload))
    expect(res.status).toBe(200)
    const call = vi.mocked(billingService.updateSubscriptionStripeData).mock.calls[0]![0]
    expect(call.planId).toBe('build')
  })

  it('includes resolved planId="grow" in updateSubscriptionStripeData when price matches GROW', async () => {
    process.env.STRIPE_GROW_PRICE_ID = 'price_grow_live'
    const payload = makeSubscriptionUpdatedPayload({
      organizationId: 'org_abc',
      priceId: 'price_grow_live',
    })
    const res = await POST(webhookRequest(payload))
    expect(res.status).toBe(200)
    const call = vi.mocked(billingService.updateSubscriptionStripeData).mock.calls[0]![0]
    expect(call.planId).toBe('grow')
  })

  it('includes resolved planId="scale" in updateSubscriptionStripeData when price matches SCALE', async () => {
    process.env.STRIPE_SCALE_PRICE_ID = 'price_scale_live'
    const payload = makeSubscriptionUpdatedPayload({
      organizationId: 'org_abc',
      priceId: 'price_scale_live',
    })
    const res = await POST(webhookRequest(payload))
    expect(res.status).toBe(200)
    const call = vi.mocked(billingService.updateSubscriptionStripeData).mock.calls[0]![0]
    expect(call.planId).toBe('scale')
  })

  it('omits planId from updateSubscriptionStripeData when price ID is unknown', async () => {
    // No env vars set — planIdFromStripePriceId returns null
    const payload = makeSubscriptionUpdatedPayload({
      organizationId: 'org_abc',
      priceId: 'price_unknown_xyz',
    })
    const res = await POST(webhookRequest(payload))
    expect(res.status).toBe(200)
    const call = vi.mocked(billingService.updateSubscriptionStripeData).mock.calls[0]![0]
    expect(call.planId).toBeUndefined()
  })

  it('skips the DB update when organization_id is missing from metadata', async () => {
    process.env.STRIPE_GROW_PRICE_ID = 'price_grow_live'
    const payload = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          object: 'subscription',
          id: 'sub_123',
          customer: 'cus_abc',
          status: 'active',
          current_period_end: 1800000000,
          items: { data: [{ price: { id: 'price_grow_live', product: 'prod_1' } }] },
          metadata: {}, // no organization_id
        },
      },
    }
    const res = await POST(webhookRequest(payload))
    expect(res.status).toBe(200)
    expect(billingService.updateSubscriptionStripeData).not.toHaveBeenCalled()
  })
})
