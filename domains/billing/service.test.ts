import { beforeEach, describe, expect, it } from 'vitest'
import { BillingService } from './service.test-helpers'
import type { OrganizationId, TenantId } from '@/shared/types'

/**
 * Billing service unit tests.
 *
 * Covers the entitlement enforcement path — the gate that prevents
 * customers from exceeding their plan limits.
 *
 * Tests use the InMemoryBillingRepository to avoid DB calls.
 */

// ---------------------------------------------------------------------------
// Helper — expose BillingService constructor for testing
// ---------------------------------------------------------------------------

// BillingService is a class declared inside service.ts using a closure pattern
// rather than exported directly. We use a thin test-helper re-export.

describe('BillingService — entitlement enforcement', () => {
  let service: ReturnType<typeof BillingService>
  const ORG_ID = 'org_test' as OrganizationId
  const TENANT_ID = 'tenant_test' as TenantId

  beforeEach(() => {
    service = BillingService()
  })

  describe('checkEntitlement', () => {
    it('returns Infinity limit when no entitlement row exists (unlimited by default)', async () => {
      const result = await service.checkEntitlement({
        organizationId: ORG_ID,
        feature: 'engagement_run',
        quantityRequested: 1,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.limit).toBe(Infinity)
        expect(result.value.used).toBe(0)
      }
    })

    it('returns the stored limit and used count when an entitlement exists', async () => {
      await service.setEntitlement({ organizationId: ORG_ID, feature: 'engagement_run', limit: 10 })
      const result = await service.checkEntitlement({
        organizationId: ORG_ID,
        feature: 'engagement_run',
        quantityRequested: 1,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.limit).toBe(10)
        expect(result.value.used).toBe(0)
      }
    })

    it('reports used count incremented after recordUsageEvent', async () => {
      await service.setEntitlement({ organizationId: ORG_ID, feature: 'engagement_run', limit: 10 })

      await service.recordUsageEvent({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        type: 'engagement_run',
        quantity: 3,
      })

      const result = await service.checkEntitlement({
        organizationId: ORG_ID,
        feature: 'engagement_run',
        quantityRequested: 1,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.used).toBe(3)
      }
    })
  })

  describe('setEntitlement', () => {
    it('creates a new entitlement', async () => {
      const result = await service.setEntitlement({
        organizationId: ORG_ID,
        feature: 'engagement_run',
        limit: 5,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.limit).toBe(5)
        expect(result.value.used).toBe(0)
      }
    })

    it('updates an existing entitlement without resetting used', async () => {
      await service.setEntitlement({ organizationId: ORG_ID, feature: 'engagement_run', limit: 5 })
      await service.recordUsageEvent({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        type: 'engagement_run',
        quantity: 2,
      })
      // Now raise the limit.
      await service.setEntitlement({ organizationId: ORG_ID, feature: 'engagement_run', limit: 20 })

      const result = await service.checkEntitlement({
        organizationId: ORG_ID,
        feature: 'engagement_run',
        quantityRequested: 1,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.limit).toBe(20)
        expect(result.value.used).toBe(2) // preserved
      }
    })
  })

  describe('recordUsageEvent', () => {
    it('creates a usage event and increments the matching entitlement', async () => {
      await service.setEntitlement({
        organizationId: ORG_ID,
        feature: 'model_invocation',
        limit: 1000,
      })

      const result = await service.recordUsageEvent({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        type: 'model_invocation',
        quantity: 250,
      })
      expect(result.ok).toBe(true)

      const entCheck = await service.checkEntitlement({
        organizationId: ORG_ID,
        feature: 'model_invocation',
        quantityRequested: 1,
      })
      expect(entCheck.ok).toBe(true)
      if (entCheck.ok) {
        expect(entCheck.value.used).toBe(250)
      }
    })

    it('does not fail when no matching entitlement exists', async () => {
      // No setEntitlement called — usage still records but does not crash.
      const result = await service.recordUsageEvent({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        type: 'engagement_run',
        quantity: 1,
      })
      expect(result.ok).toBe(true)
    })
  })

  describe('subscription lifecycle', () => {
    it('creates a subscription with active status', async () => {
      const result = await service.createSubscription({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        planId: 'unpaid',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.status).toBe('active')
        expect(result.value.planId).toBe('unpaid')
      }
    })

    it('returns NOT_FOUND when no subscription exists', async () => {
      const result = await service.getSubscription(ORG_ID)
      expect(result.ok).toBe(false)
    })

    it('rejects duplicate subscriptions for the same organization', async () => {
      await service.createSubscription({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        planId: 'unpaid',
      })
      const second = await service.createSubscription({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        planId: 'unpaid',
      })
      expect(second.ok).toBe(false)
    })
  })
})
