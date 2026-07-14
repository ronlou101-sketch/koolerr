import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/infrastructure/platform', () => ({ bootstrapPlatform: vi.fn() }))
vi.mock('@/domains/billing', () => ({ billingService: { getSubscription: vi.fn() } }))
vi.mock('@/shared/integrations/stripe', () => ({ updateSubscriptionPlan: vi.fn() }))
vi.mock('@/domains/billing/plans', () => ({
  stripePriceId: vi.fn(),
  PLAN_IDS: { unpaid: 'unpaid', build: 'build', grow: 'grow', scale: 'scale' },
}))

import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import { updateSubscriptionPlan } from '@/shared/integrations/stripe'
import { stripePriceId } from '@/domains/billing/plans'
import type { OrganizationId, TenantId } from '@/shared/types'

// ── Test helpers ──────────────────────────────────────────────────────────────

const ORG_ID = 'org_test_123' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId

function makeCtx() {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    actor: {
      type: 'user' as const,
      userId: 'user_1' as import('@/shared/types').UserId,
      sessionId: 'session_test',
      role: 'owner' as const,
    },
    requestId: 'req_test_1',
  }
}

function makeSubscription(
  overrides: Partial<{
    planId: string
    stripeSubscriptionId: string | undefined
    status: string
  }> = {}
) {
  return {
    id: 'sub_db_1',
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    planId: overrides.planId ?? 'build',
    status: (overrides.status ?? 'active') as import('@/domains/billing/types').BillingStatus,
    stripeSubscriptionId:
      'stripeSubscriptionId' in overrides ? overrides.stripeSubscriptionId : 'sub_stripe_abc',
    stripeCustomerId: 'cus_abc',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function request(body: unknown) {
  return new Request('http://localhost/api/billing/upgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/billing/upgrade', () => {
  beforeEach(() => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' as never, message: 'not found' },
    })
    vi.mocked(updateSubscriptionPlan).mockResolvedValue(null)
    vi.mocked(stripePriceId).mockReturnValue(undefined)
  })

  // ── Authorization ──────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await POST(request({ planId: 'grow' }))
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Unauthorized')
  })

  // ── Input validation ───────────────────────────────────────────────────────

  it('returns 400 for an invalid planId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    const res = await POST(request({ planId: 'enterprise' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is not valid JSON', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    const badReq = new Request('http://localhost/api/billing/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(badReq)
    expect(res.status).toBe(400)
  })

  // ── Subscription lookup (never trusts client-supplied subscription ID) ─────

  it('returns 404 when no subscription exists for the authenticated org', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' as never, message: 'not found' },
    })
    const res = await POST(request({ planId: 'grow' }))
    expect(res.status).toBe(404)
  })

  it('looks up subscription by authenticated organizationId, not by client-supplied ID', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'build' }),
    })
    vi.mocked(stripePriceId).mockReturnValue('price_grow_123')
    vi.mocked(updateSubscriptionPlan).mockResolvedValue({
      id: 'sub_stripe_abc',
      status: 'active',
      current_period_end: 0,
      items: { data: [] },
    })
    // Request body contains only planId — no subscriptionId from client
    await POST(request({ planId: 'grow' }))
    // Verify lookup used orgId from auth context
    expect(billingService.getSubscription).toHaveBeenCalledWith(ORG_ID)
    // Verify Stripe call used subscriptionId from DB
    expect(updateSubscriptionPlan).toHaveBeenCalledWith(
      'sub_stripe_abc', // from DB, not from client
      'price_grow_123',
      expect.stringContaining('upgrade-org_test_123-to-grow')
    )
  })

  // ── Same-plan rejection ────────────────────────────────────────────────────

  it('returns 409 "You are already on this plan." when planId matches current plan', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'build' }),
    })
    const res = await POST(request({ planId: 'build' }))
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('You are already on this plan.')
  })

  // ── No Stripe subscription ─────────────────────────────────────────────────

  it('returns 422 when the subscription has no stripeSubscriptionId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ stripeSubscriptionId: undefined }),
    })
    const res = await POST(request({ planId: 'grow' }))
    expect(res.status).toBe(422)
  })

  // ── Stripe not configured ──────────────────────────────────────────────────

  it('returns 503 when the Stripe price is not configured for the target plan', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'build' }),
    })
    vi.mocked(stripePriceId).mockReturnValue(undefined)
    const res = await POST(request({ planId: 'grow' }))
    expect(res.status).toBe(503)
  })

  // ── Upgrade paths ──────────────────────────────────────────────────────────

  it('returns 200 on successful BUILD → GROW upgrade', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'build' }),
    })
    vi.mocked(stripePriceId).mockReturnValue('price_grow_123')
    vi.mocked(updateSubscriptionPlan).mockResolvedValue({
      id: 'sub_stripe_abc',
      status: 'active',
      current_period_end: 1800000000,
      items: { data: [{ price: { id: 'price_grow_123' } }] },
    })
    const res = await POST(request({ planId: 'grow' }))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean }
    expect(body.success).toBe(true)
  })

  it('returns 200 on successful GROW → SCALE upgrade', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'grow' }),
    })
    vi.mocked(stripePriceId).mockReturnValue('price_scale_456')
    vi.mocked(updateSubscriptionPlan).mockResolvedValue({
      id: 'sub_stripe_abc',
      status: 'active',
      current_period_end: 1800000000,
      items: { data: [{ price: { id: 'price_scale_456' } }] },
    })
    const res = await POST(request({ planId: 'scale' }))
    expect(res.status).toBe(200)
  })

  it('returns 200 on successful SCALE → BUILD downgrade', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'scale' }),
    })
    vi.mocked(stripePriceId).mockReturnValue('price_build_789')
    vi.mocked(updateSubscriptionPlan).mockResolvedValue({
      id: 'sub_stripe_abc',
      status: 'active',
      current_period_end: 1800000000,
      items: { data: [{ price: { id: 'price_build_789' } }] },
    })
    const res = await POST(request({ planId: 'build' }))
    expect(res.status).toBe(200)
  })

  // ── Stripe failure ─────────────────────────────────────────────────────────

  it('returns 502 when Stripe rejects the subscription update', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'build' }),
    })
    vi.mocked(stripePriceId).mockReturnValue('price_grow_123')
    vi.mocked(updateSubscriptionPlan).mockResolvedValue(null)
    const res = await POST(request({ planId: 'grow' }))
    expect(res.status).toBe(502)
  })

  // ── Idempotency key ────────────────────────────────────────────────────────

  it('passes an idempotency key scoped to org and target plan', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ planId: 'build' }),
    })
    vi.mocked(stripePriceId).mockReturnValue('price_grow_123')
    vi.mocked(updateSubscriptionPlan).mockResolvedValue({
      id: 'sub_stripe_abc',
      status: 'active',
      current_period_end: 0,
      items: { data: [] },
    })
    await POST(request({ planId: 'grow' }))
    const [, , idempotencyKey] = vi.mocked(updateSubscriptionPlan).mock.calls[0]!
    expect(idempotencyKey).toMatch(/^upgrade-org_test_123-to-grow-\d{4}-\d{2}-\d{2}$/)
  })
})
