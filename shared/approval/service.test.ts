import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  ApprovalRequestId,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  UserId,
  WorkforceId,
} from '@/shared/types'

/**
 * Approval Workflow Service unit tests.
 *
 * Covers:
 *   1. createRequest — creates a pending request with correct fields
 *   2. getRequest — tenant isolation guard
 *   3. listPending — only returns pending requests for the owning org
 *   4. resolveRequest — approved / rejected → updates status, calls trustEngine.recordEvaluation
 *   5. resolveRequest — VALIDATION_ERROR when not pending
 *   6. resolveRequest — TENANT_ISOLATION_VIOLATION for wrong org
 *   7. cancelRequest — pending → cancelled
 *   8. cancelRequest — VALIDATION_ERROR when already resolved
 *
 * The trustEngine and audit logger are mocked — no real Trust Engine state is
 * modified and no DB calls are made.
 */

// ---------------------------------------------------------------------------
// Module mocks — vi.hoisted() prevents TDZ in vi.mock factories
// (service.ts uses static imports of trustEngine and auditLogger)
// ---------------------------------------------------------------------------

const { mockRecordEvaluation } = vi.hoisted(() => ({
  mockRecordEvaluation: vi.fn().mockResolvedValue(undefined),
}))

const { mockAuditLog } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/shared/trust', () => ({
  trustEngine: { recordEvaluation: mockRecordEvaluation },
}))

vi.mock('@/shared/audit', () => ({
  auditLogger: { log: mockAuditLog },
}))

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { makeApprovalService } from './service.test-helpers'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant_test' as TenantId
const ORG_A = 'org_a' as OrganizationId
const ORG_B = 'org_b' as OrganizationId
const WORKFORCE_ID = 'wf_test' as WorkforceId
const EMPLOYEE_A = 'emp_a' as DigitalEmployeeId
const RUN_ID = 'run_test' as EngagementRunId
const USER_ID = 'user_test' as UserId

function createInput() {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_A,
    workforceId: WORKFORCE_ID,
    digitalEmployeeId: EMPLOYEE_A,
    engagementRunId: RUN_ID,
    action: 'publish_content',
    description: 'Alex wants to publish the blog post to the company website.',
    context: { title: 'Q3 Product Update', targetUrl: 'https://example.com/blog' },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApprovalWorkflowService', () => {
  let service: ReturnType<typeof makeApprovalService>['service']

  beforeEach(() => {
    const h = makeApprovalService()
    service = h.service
    mockRecordEvaluation.mockClear()
    mockAuditLog.mockClear()
  })

  // -------------------------------------------------------------------------
  describe('createRequest', () => {
    it('creates a request in pending status', async () => {
      const result = await service.createRequest(createInput())
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.status).toBe('pending')
        expect(result.value.action).toBe('publish_content')
        expect(result.value.organizationId).toBe(ORG_A)
        expect(result.value.digitalEmployeeId).toBe(EMPLOYEE_A)
      }
    })

    it('assigns a prefixed id', async () => {
      const result = await service.createRequest(createInput())
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.id).toMatch(/^approval_/)
    })

    it('emits an audit event on creation', async () => {
      await service.createRequest(createInput())
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'engagement_run.approval_requested' })
      )
    })
  })

  // -------------------------------------------------------------------------
  describe('getRequest', () => {
    it('returns the request for the owning organization', async () => {
      const created = await service.createRequest(createInput())
      if (!created.ok) throw new Error('fixture')
      const result = await service.getRequest(created.value.id, ORG_A)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.id).toBe(created.value.id)
    })

    it('returns NOT_FOUND for an unknown id', async () => {
      const result = await service.getRequest('approval_unknown' as ApprovalRequestId, ORG_A)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })

    it('returns TENANT_ISOLATION_VIOLATION when org does not own the request', async () => {
      const created = await service.createRequest(createInput())
      if (!created.ok) throw new Error('fixture')
      const result = await service.getRequest(created.value.id, ORG_B)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('TENANT_ISOLATION_VIOLATION')
    })
  })

  // -------------------------------------------------------------------------
  describe('listPending', () => {
    it('returns only pending requests for the given org', async () => {
      await service.createRequest(createInput())
      await service.createRequest(createInput())
      const result = await service.listPending(ORG_A, TENANT_ID)
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toHaveLength(2)
        expect(result.value.every((r) => r.status === 'pending')).toBe(true)
      }
    })

    it('does not return requests belonging to a different org', async () => {
      await service.createRequest(createInput()) // ORG_A
      const result = await service.listPending(ORG_B, TENANT_ID)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toHaveLength(0)
    })

    it('excludes resolved requests', async () => {
      const created = await service.createRequest(createInput())
      if (!created.ok) throw new Error('fixture')
      await service.resolveRequest({
        id: created.value.id,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      const result = await service.listPending(ORG_A, TENANT_ID)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value).toHaveLength(0)
    })
  })

  // -------------------------------------------------------------------------
  describe('resolveRequest', () => {
    async function createPending() {
      const r = await service.createRequest(createInput())
      if (!r.ok) throw new Error('fixture')
      return r.value
    }

    it('transitions pending to approved', async () => {
      const req = await createPending()
      const result = await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.status).toBe('approved')
        expect(result.value.resolvedBy).toBe(USER_ID)
        expect(result.value.resolvedAt).toBeDefined()
      }
    })

    it('transitions pending to rejected', async () => {
      const req = await createPending()
      const result = await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'rejected',
        resolvedBy: USER_ID,
        resolutionNote: 'Tone is off-brand',
      })
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.status).toBe('rejected')
        expect(result.value.resolutionNote).toBe('Tone is off-brand')
      }
    })

    it('calls trustEngine.recordEvaluation with the correct decision', async () => {
      const req = await createPending()
      await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      expect(mockRecordEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          digitalEmployeeId: EMPLOYEE_A,
          action: 'publish_content',
          decision: 'approved',
          decidedBy: USER_ID,
        })
      )
    })

    it('calls trustEngine.recordEvaluation on rejection', async () => {
      const req = await createPending()
      await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'rejected',
        resolvedBy: USER_ID,
      })
      expect(mockRecordEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({ decision: 'rejected' })
      )
    })

    it('emits an approved audit event', async () => {
      const req = await createPending()
      mockAuditLog.mockClear()
      await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'engagement_run.approved' })
      )
    })

    it('emits a rejected audit event', async () => {
      const req = await createPending()
      mockAuditLog.mockClear()
      await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'rejected',
        resolvedBy: USER_ID,
      })
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'engagement_run.rejected' })
      )
    })

    it('returns VALIDATION_ERROR when the request is not pending', async () => {
      const req = await createPending()
      await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      // Second resolve on the same request
      const second = await service.resolveRequest({
        id: req.id,
        organizationId: ORG_A,
        decision: 'rejected',
        resolvedBy: USER_ID,
      })
      expect(second.ok).toBe(false)
      if (!second.ok) expect(second.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns TENANT_ISOLATION_VIOLATION for a different org', async () => {
      const req = await createPending()
      const result = await service.resolveRequest({
        id: req.id,
        organizationId: ORG_B,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('TENANT_ISOLATION_VIOLATION')
    })

    it('returns NOT_FOUND for an unknown request id', async () => {
      const result = await service.resolveRequest({
        id: 'approval_ghost' as ApprovalRequestId,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })
  })

  // -------------------------------------------------------------------------
  describe('cancelRequest', () => {
    it('transitions a pending request to cancelled', async () => {
      const created = await service.createRequest(createInput())
      if (!created.ok) throw new Error('fixture')
      const result = await service.cancelRequest(created.value.id, ORG_A)
      expect(result.ok).toBe(true)
      if (result.ok) expect(result.value.status).toBe('cancelled')
    })

    it('returns VALIDATION_ERROR when the request is already resolved', async () => {
      const created = await service.createRequest(createInput())
      if (!created.ok) throw new Error('fixture')
      await service.resolveRequest({
        id: created.value.id,
        organizationId: ORG_A,
        decision: 'approved',
        resolvedBy: USER_ID,
      })
      const result = await service.cancelRequest(created.value.id, ORG_A)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns NOT_FOUND for an unknown id', async () => {
      const result = await service.cancelRequest('approval_ghost' as ApprovalRequestId, ORG_A)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.code).toBe('NOT_FOUND')
    })

    it('does not call trustEngine.recordEvaluation on cancel', async () => {
      const created = await service.createRequest(createInput())
      if (!created.ok) throw new Error('fixture')
      mockRecordEvaluation.mockClear()
      await service.cancelRequest(created.value.id, ORG_A)
      expect(mockRecordEvaluation).not.toHaveBeenCalled()
    })
  })
})
