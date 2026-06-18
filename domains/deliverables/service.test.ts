import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DeliverablesService } from './service.test-helpers'
import type {
  DeliverableId,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  UserId,
} from '@/shared/types'

/**
 * Deliverables service unit tests.
 *
 * Covers:
 *   1. Deliverable creation (initial state invariants)
 *   2. Approval workflow state machine:
 *        draft → pending_review → approved | rejected
 *        pending_review → draft (via requestRevision)
 *   3. Tenant / organization isolation — cross-org access is rejected
 *   4. Invalid-state transitions return structured errors (VALIDATION_ERROR)
 *
 * All tests use fresh in-memory state; no DB calls, no Supabase client.
 */

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant_test' as TenantId
const ORG_ID = 'org_test' as OrganizationId
const ORG_OTHER = 'org_other' as OrganizationId
const RUN_ID = 'run_test' as EngagementRunId
const USER_ID = 'user_test' as UserId
const EMP_A = 'emp_a' as DigitalEmployeeId

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function storeOneDraft(service: ReturnType<typeof DeliverablesService>) {
  const result = await service.storeDeliverable({
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    engagementRunId: RUN_ID,
    type: 'blog_post',
    title: 'Test Post',
    content: { body: 'hello' },
    attributedTo: [EMP_A],
  })
  if (!result.ok) throw new Error('fixture setup failed')
  return result.value
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeliverablesService', () => {
  let service: ReturnType<typeof DeliverablesService>

  beforeEach(() => {
    service = DeliverablesService()
  })

  // -------------------------------------------------------------------------
  describe('storeDeliverable', () => {
    it('creates a deliverable in draft status at version 1', async () => {
      const result = await service.storeDeliverable({
        tenantId: TENANT_ID,
        organizationId: ORG_ID,
        engagementRunId: RUN_ID,
        type: 'blog_post',
        title: 'My Post',
        content: { body: 'content here' },
        attributedTo: [EMP_A],
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.status).toBe('draft')
        expect(result.value.version).toBe(1)
        expect(result.value.organizationId).toBe(ORG_ID)
        expect(result.value.title).toBe('My Post')
      }
    })
  })

  // -------------------------------------------------------------------------
  describe('getDeliverable', () => {
    it('returns a deliverable for the owning organization', async () => {
      const d = await storeOneDraft(service)
      const result = await service.getDeliverable(d.id, ORG_ID)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.id).toBe(d.id)
    })

    it('returns NOT_FOUND for an unknown deliverable id', async () => {
      const result = await service.getDeliverable('deliverable_unknown' as DeliverableId, ORG_ID)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })

    it('returns TENANT_ISOLATION_VIOLATION when the deliverable belongs to a different organization', async () => {
      const d = await storeOneDraft(service)
      const result = await service.getDeliverable(d.id, ORG_OTHER)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('TENANT_ISOLATION_VIOLATION')
    })
  })

  // -------------------------------------------------------------------------
  describe('submitForReview', () => {
    it('transitions a draft deliverable to pending_review', async () => {
      const d = await storeOneDraft(service)
      const result = await service.submitForReview(d.id, ORG_ID, TENANT_ID)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.status).toBe('pending_review')
    })

    it('returns VALIDATION_ERROR when the deliverable is not in draft status', async () => {
      const d = await storeOneDraft(service)
      await service.submitForReview(d.id, ORG_ID, TENANT_ID)
      // Calling again after already pending_review
      const second = await service.submitForReview(d.id, ORG_ID, TENANT_ID)
      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns NOT_FOUND for an unknown deliverable', async () => {
      const result = await service.submitForReview(
        'deliverable_unknown' as DeliverableId,
        ORG_ID,
        TENANT_ID
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })
  })

  // -------------------------------------------------------------------------
  describe('recordApprovalDecision', () => {
    async function getPendingDeliverable() {
      const d = await storeOneDraft(service)
      await service.submitForReview(d.id, ORG_ID, TENANT_ID)
      return d
    }

    it('transitions pending_review to approved', async () => {
      const d = await getPendingDeliverable()
      const result = await service.recordApprovalDecision(
        { deliverableId: d.id, reviewedBy: USER_ID, decision: 'approved', decidedAt: new Date() },
        TENANT_ID
      )
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.status).toBe('approved')
    })

    it('transitions pending_review to rejected', async () => {
      const d = await getPendingDeliverable()
      const result = await service.recordApprovalDecision(
        { deliverableId: d.id, reviewedBy: USER_ID, decision: 'rejected', decidedAt: new Date() },
        TENANT_ID
      )
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.status).toBe('rejected')
    })

    it('returns VALIDATION_ERROR when deliverable is not in pending_review status', async () => {
      const d = await storeOneDraft(service) // still draft, not submitted
      const result = await service.recordApprovalDecision(
        { deliverableId: d.id, reviewedBy: USER_ID, decision: 'approved', decidedAt: new Date() },
        TENANT_ID
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns NOT_FOUND for an unknown deliverable id', async () => {
      const result = await service.recordApprovalDecision(
        {
          deliverableId: 'deliverable_unknown' as DeliverableId,
          reviewedBy: USER_ID,
          decision: 'approved',
          decidedAt: new Date(),
        },
        TENANT_ID
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })
  })

  // -------------------------------------------------------------------------
  describe('requestRevision', () => {
    it('resets deliverable to draft and increments the version', async () => {
      const d = await storeOneDraft(service)
      await service.submitForReview(d.id, ORG_ID, TENANT_ID)
      await service.requestRevision(
        {
          deliverableId: d.id,
          requestedBy: USER_ID,
          instructions: 'Make it shorter',
          requestedAt: new Date(),
        },
        TENANT_ID
      )
      const updated = await service.getDeliverable(d.id, ORG_ID)
      expect(updated.ok).toBe(true)
      if (updated.ok) {
        expect(updated.value.status).toBe('draft')
        expect(updated.value.version).toBe(2)
      }
    })

    it('returns NOT_FOUND for an unknown deliverable', async () => {
      const result = await service.requestRevision(
        {
          deliverableId: 'deliverable_unknown' as DeliverableId,
          requestedBy: USER_ID,
          instructions: 'change it',
          requestedAt: new Date(),
        },
        TENANT_ID
      )
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })
  })
})
