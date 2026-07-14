import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/infrastructure/platform', () => ({ bootstrapPlatform: vi.fn() }))
vi.mock('@/domains/billing', () => ({ billingService: { getSubscription: vi.fn() } }))
vi.mock('@/shared/integrations/stripe', () => ({ cancelSubscriptionAtPeriodEnd: vi.fn() }))

import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import { cancelSubscriptionAtPeriodEnd } from '@/shared/integrations/stripe'
import type { OrganizationId, TenantId } from '@/shared/types'

// ── Test helpers ──────────────────────────────────────────────────────────────

const ORG_ID = 'org_cancel_test' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId
const PERIOD_END = new Date('2026-08-15T00:00:00.000Z')

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
    stripeSubscriptionId: string | undefined
    status: string
  }> = {}
) {
  return {
    id: 'sub_db_1',
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    planId: 'grow',
    status: (overrides.status ?? 'active') as import('@/domains/billing/types').BillingStatus,
    stripeSubscriptionId:
      'stripeSubscriptionId' in overrides ? overrides.stripeSubscriptionId : 'sub_stripe_abc',
    stripeCustomerId: 'cus_abc',
    currentPeriodStart: new Date(),
    currentPeriodEnd: PERIOD_END,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function request() {
  return new Request('http://localhost/api/billing/cancel', { method: 'POST' })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/billing/cancel', () => {
  beforeEach(() => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' as never, message: 'not found' },
    })
    vi.mocked(cancelSubscriptionAtPeriodEnd).mockResolvedValue(false)
  })

  // ── Authorization ──────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await POST(request())
    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('Unauthorized')
  })

  // ── Subscription lookup ────────────────────────────────────────────────────

  it('returns 404 when no subscription exists', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' as never, message: 'not found' },
    })
    const res = await POST(request())
    expect(res.status).toBe(404)
  })

  it('looks up subscription by authenticated organizationId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription(),
    })
    vi.mocked(cancelSubscriptionAtPeriodEnd).mockResolvedValue(true)
    await POST(request())
    expect(billingService.getSubscription).toHaveBeenCalledWith(ORG_ID)
    // Stripe is called with subscription ID from DB, not from client
    expect(cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith('sub_stripe_abc', expect.any(String))
  })

  // ── No Stripe subscription ─────────────────────────────────────────────────

  it('returns 422 when the subscription has no stripeSubscriptionId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ stripeSubscriptionId: undefined }),
    })
    const res = await POST(request())
    expect(res.status).toBe(422)
  })

  // ── Already canceled ───────────────────────────────────────────────────────

  it('returns 409 when the subscription is already canceled', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription({ status: 'canceled' }),
    })
    const res = await POST(request())
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string }
    expect(body.error).toMatch(/already canceled/i)
  })

  // ── Cancel at period end ───────────────────────────────────────────────────

  it('returns 200 with cancelAt on successful cancel at period end', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription(),
    })
    vi.mocked(cancelSubscriptionAtPeriodEnd).mockResolvedValue(true)
    const res = await POST(request())
    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; cancelAt: string }
    expect(body.success).toBe(true)
    expect(body.cancelAt).toBe(PERIOD_END.toISOString())
  })

  // ── Stripe failure ─────────────────────────────────────────────────────────

  it('returns 502 when Stripe rejects the cancellation request', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription(),
    })
    vi.mocked(cancelSubscriptionAtPeriodEnd).mockResolvedValue(false)
    const res = await POST(request())
    expect(res.status).toBe(502)
  })

  // ── Idempotency key ────────────────────────────────────────────────────────

  it('passes an idempotency key scoped to the org', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(billingService.getSubscription).mockResolvedValue({
      ok: true,
      value: makeSubscription(),
    })
    vi.mocked(cancelSubscriptionAtPeriodEnd).mockResolvedValue(true)
    await POST(request())
    const [, idempotencyKey] = vi.mocked(cancelSubscriptionAtPeriodEnd).mock.calls[0]!
    expect(idempotencyKey).toMatch(/^cancel-org_cancel_test-\d{4}-\d{2}-\d{2}$/)
  })
})
