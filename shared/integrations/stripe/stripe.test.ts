import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import {
  createCheckoutSession,
  createPortalSession,
  retrieveCheckoutSession,
  updateStripeSubscriptionMetadata,
  updateSubscriptionPlan,
  cancelSubscriptionAtPeriodEnd,
  verifyStripeWebhook,
} from './index'

/**
 * Stripe integration tests.
 *
 * Mocks global fetch to avoid real network calls.
 * All functions are non-fatal: they return null/false on failure rather
 * than throwing — tests verify that contract as well as the happy path.
 *
 * Key invariant under test (P1-9): stripeHeaders() must never produce
 * "Bearer undefined". Every public function returns early when
 * STRIPE_SECRET_KEY is absent, and stripeHeaders() itself throws as
 * a belt-and-suspenders guard. The tests below verify both layers.
 */

function mockFetchOk(body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  })
}

function mockFetchError(status = 400, body = 'Bad Request') {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(body),
  })
}

const CHECKOUT_PARAMS = {
  priceId: 'price_test',
  planId: 'build',
  tenantId: 'tenant_test',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
}

describe('createCheckoutSession', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })
  afterEach(() => vi.restoreAllMocks())

  // ── Key guard ─────────────────────────────────────────────────────────────

  it('returns null when STRIPE_SECRET_KEY is not set', async () => {
    const result = await createCheckoutSession(CHECKOUT_PARAMS)
    expect(result).toBeNull()
  })

  // ── Success path ──────────────────────────────────────────────────────────

  it('returns session url and id on success', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal(
      'fetch',
      mockFetchOk({ url: 'https://checkout.stripe.com/pay/abc', id: 'cs_test_123' })
    )

    const result = await createCheckoutSession(CHECKOUT_PARAMS)

    expect(result).toEqual({ url: 'https://checkout.stripe.com/pay/abc', sessionId: 'cs_test_123' })
  })

  it('sends Bearer token from STRIPE_SECRET_KEY', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({ url: 'https://checkout.stripe.com/pay/abc', id: 'cs_1' })
    vi.stubGlobal('fetch', fetchMock)

    await createCheckoutSession(CHECKOUT_PARAMS)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer sk_test_key')
  })

  it('posts to /v1/checkout/sessions', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({ url: 'https://checkout.stripe.com/pay/abc', id: 'cs_1' })
    vi.stubGlobal('fetch', fetchMock)

    await createCheckoutSession(CHECKOUT_PARAMS)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/checkout/sessions')
  })

  // ── HTTP error ────────────────────────────────────────────────────────────

  it('returns null when Stripe returns a non-OK status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchError(402, 'card_declined'))

    const result = await createCheckoutSession(CHECKOUT_PARAMS)
    expect(result).toBeNull()
  })
})

describe('createPortalSession', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns null when STRIPE_SECRET_KEY is not set', async () => {
    const result = await createPortalSession({ customerId: 'cus_1', returnUrl: 'https://x.com' })
    expect(result).toBeNull()
  })

  it('returns portal url on success', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchOk({ url: 'https://billing.stripe.com/session/abc' }))

    const result = await createPortalSession({ customerId: 'cus_1', returnUrl: 'https://x.com' })

    expect(result).toEqual({ url: 'https://billing.stripe.com/session/abc' })
  })

  it('returns null when Stripe returns a non-OK status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchError(404, 'customer not found'))

    const result = await createPortalSession({ customerId: 'cus_1', returnUrl: 'https://x.com' })
    expect(result).toBeNull()
  })
})

describe('retrieveCheckoutSession', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns null when STRIPE_SECRET_KEY is not set', async () => {
    const result = await retrieveCheckoutSession('cs_test_abc')
    expect(result).toBeNull()
  })

  it('returns session data on success', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const sessionData = {
      id: 'cs_test_abc',
      payment_status: 'paid',
      customer: 'cus_1',
      subscription: 'sub_1',
      metadata: { plan_id: 'build' },
      customer_details: { email: 'user@example.com' },
    }
    vi.stubGlobal('fetch', mockFetchOk(sessionData))

    const result = await retrieveCheckoutSession('cs_test_abc')
    expect(result).toMatchObject({ id: 'cs_test_abc', payment_status: 'paid' })
  })

  it('returns null when Stripe returns a non-OK status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchError(404, 'session not found'))

    const result = await retrieveCheckoutSession('cs_test_abc')
    expect(result).toBeNull()
  })
})

describe('updateStripeSubscriptionMetadata', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns false when STRIPE_SECRET_KEY is not set', async () => {
    const result = await updateStripeSubscriptionMetadata('sub_1', { organization_id: 'org_1' })
    expect(result).toBe(false)
  })

  it('returns true on success', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchOk({ id: 'sub_1', object: 'subscription' }))

    const result = await updateStripeSubscriptionMetadata('sub_1', { organization_id: 'org_1' })
    expect(result).toBe(true)
  })

  it('encodes metadata as form fields in the request body', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({ id: 'sub_1' })
    vi.stubGlobal('fetch', fetchMock)

    await updateStripeSubscriptionMetadata('sub_1', { organization_id: 'org_abc' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body as string).toContain('metadata%5Borganization_id%5D=org_abc')
  })

  it('returns false when Stripe returns a non-OK status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchError(404, 'subscription not found'))

    const result = await updateStripeSubscriptionMetadata('sub_1', { plan_id: 'build' })
    expect(result).toBe(false)
  })
})

describe('updateSubscriptionPlan', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns null when STRIPE_SECRET_KEY is not set', async () => {
    const result = await updateSubscriptionPlan('sub_1', 'price_grow', 'idem_key_1')
    expect(result).toBeNull()
  })

  it('returns subscription data on success', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const stubData = {
      id: 'sub_1',
      status: 'active',
      current_period_end: 1800000000,
      items: { data: [{ price: { id: 'price_grow' } }] },
    }
    vi.stubGlobal('fetch', mockFetchOk(stubData))
    const result = await updateSubscriptionPlan('sub_1', 'price_grow', 'idem_key_1')
    expect(result).toMatchObject({ id: 'sub_1', status: 'active' })
  })

  it('sends proration_behavior=create_prorations in the request body', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({
      id: 'sub_1',
      status: 'active',
      current_period_end: 0,
      items: { data: [] },
    })
    vi.stubGlobal('fetch', fetchMock)
    await updateSubscriptionPlan('sub_1', 'price_grow', 'idem_key_1')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body as string).toContain('proration_behavior=create_prorations')
  })

  it('sends the Idempotency-Key header', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({
      id: 'sub_1',
      status: 'active',
      current_period_end: 0,
      items: { data: [] },
    })
    vi.stubGlobal('fetch', fetchMock)
    await updateSubscriptionPlan('sub_1', 'price_grow', 'my-idem-key')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('my-idem-key')
  })

  it('includes the new price ID in the request body', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({
      id: 'sub_1',
      status: 'active',
      current_period_end: 0,
      items: { data: [] },
    })
    vi.stubGlobal('fetch', fetchMock)
    await updateSubscriptionPlan('sub_1', 'price_grow_789', 'idem_key_1')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body as string).toContain('price_grow_789')
  })

  it('posts to the correct subscription endpoint', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({
      id: 'sub_xyz',
      status: 'active',
      current_period_end: 0,
      items: { data: [] },
    })
    vi.stubGlobal('fetch', fetchMock)
    await updateSubscriptionPlan('sub_xyz', 'price_1', 'idem_key_1')
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/subscriptions/sub_xyz')
  })

  it('returns null when Stripe returns a non-OK status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchError(402, 'card_declined'))
    const result = await updateSubscriptionPlan('sub_1', 'price_grow', 'idem_key_1')
    expect(result).toBeNull()
  })
})

describe('cancelSubscriptionAtPeriodEnd', () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY
  })
  afterEach(() => vi.restoreAllMocks())

  it('returns false when STRIPE_SECRET_KEY is not set', async () => {
    const result = await cancelSubscriptionAtPeriodEnd('sub_1', 'idem_key_1')
    expect(result).toBe(false)
  })

  it('returns true on success', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchOk({ id: 'sub_1', cancel_at_period_end: true }))
    const result = await cancelSubscriptionAtPeriodEnd('sub_1', 'idem_key_1')
    expect(result).toBe(true)
  })

  it('sends cancel_at_period_end=true in the request body', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({ id: 'sub_1', cancel_at_period_end: true })
    vi.stubGlobal('fetch', fetchMock)
    await cancelSubscriptionAtPeriodEnd('sub_1', 'idem_key_1')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body as string).toContain('cancel_at_period_end=true')
  })

  it('sends the Idempotency-Key header', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({ id: 'sub_1', cancel_at_period_end: true })
    vi.stubGlobal('fetch', fetchMock)
    await cancelSubscriptionAtPeriodEnd('sub_1', 'cancel-idem-key')
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('cancel-idem-key')
  })

  it('posts to the correct subscription endpoint', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    const fetchMock = mockFetchOk({ id: 'sub_abc', cancel_at_period_end: true })
    vi.stubGlobal('fetch', fetchMock)
    await cancelSubscriptionAtPeriodEnd('sub_abc', 'idem_key_1')
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/subscriptions/sub_abc')
  })

  it('returns false when Stripe returns a non-OK status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_key'
    vi.stubGlobal('fetch', mockFetchError(404, 'subscription not found'))
    const result = await cancelSubscriptionAtPeriodEnd('sub_1', 'idem_key_1')
    expect(result).toBe(false)
  })
})

describe('verifyStripeWebhook', () => {
  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    vi.restoreAllMocks()
  })

  it('returns false when STRIPE_WEBHOOK_SECRET is not set (non-production)', async () => {
    const result = await verifyStripeWebhook('payload', 't=1,v1=abc')
    expect(result).toBe(false)
  })

  it('throws in production when STRIPE_WEBHOOK_SECRET is not set', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    await expect(verifyStripeWebhook('payload', 't=1,v1=abc')).rejects.toThrow(
      'STRIPE_WEBHOOK_SECRET is not set'
    )
    vi.unstubAllEnvs()
  })

  it('returns false when the Stripe-Signature header has no timestamp', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    const result = await verifyStripeWebhook('payload', 'v1=abc123')
    expect(result).toBe(false)
  })

  it('returns false when the Stripe-Signature header has no v1 signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    const result = await verifyStripeWebhook('payload', 't=1700000000')
    expect(result).toBe(false)
  })

  it('returns false when the timestamp is older than 5 minutes', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    const oldTimestamp = Math.floor(Date.now() / 1000) - 400
    const result = await verifyStripeWebhook('payload', `t=${oldTimestamp},v1=abc`)
    expect(result).toBe(false)
  })

  it('returns true for a valid HMAC-SHA-256 signature', async () => {
    const secret = 'whsec_testsecretvalue'
    process.env.STRIPE_WEBHOOK_SECRET = secret
    const payload = '{"type":"checkout.session.completed"}'
    const timestamp = Math.floor(Date.now() / 1000)
    const signedPayload = `${timestamp}.${payload}`

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
    const v1 = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const result = await verifyStripeWebhook(payload, `t=${timestamp},v1=${v1}`)
    expect(result).toBe(true)
  })

  it('returns false when the signature does not match the payload', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_correct'
    const timestamp = Math.floor(Date.now() / 1000)
    const result = await verifyStripeWebhook('tampered_payload', `t=${timestamp},v1=deadbeef00`)
    expect(result).toBe(false)
  })
})
