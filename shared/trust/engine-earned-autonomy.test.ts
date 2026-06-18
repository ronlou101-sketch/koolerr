import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  TrustRule,
  UserId,
  WorkforceId,
} from '@/shared/types'

/**
 * Trust Engine — Earned Autonomy tests.
 *
 * These tests verify the progressive autonomy mechanism introduced in Phase 2.
 * A Digital Employee earns autonomous permission for an action by accumulating
 * EARNED_AUTONOMY_THRESHOLD consecutive customer approvals without any rejection.
 *
 * Invariants verified:
 *   1. Approval increments the consecutive counter.
 *   2. Rejection resets the counter to zero (no partial credit).
 *   3. Reaching the threshold sets isEarned=true.
 *   4. A rejection after earning resets isEarned back to false.
 *   5. An earned action is permitted by check() at autonomy level 'autonomous'.
 *   6. Earned autonomy does not bypass consent requirements.
 *   7. An action short of the threshold still requires approval.
 *
 * See FOUNDATION_004_PRODUCT_PRINCIPLES.md §8 — Progressive Autonomy.
 * See docs/adr/ADR-013-trust-engine-earned-autonomy.md.
 */

// ---------------------------------------------------------------------------
// Module mocks — vi.hoisted() prevents temporal dead zone in vi.mock factories
// ---------------------------------------------------------------------------

const { mockAuditLog } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(undefined),
}))

const { mockConsentCheck } = vi.hoisted(() => ({
  mockConsentCheck: vi.fn(),
}))

vi.mock('@/shared/audit', () => ({
  auditLogger: { log: mockAuditLog },
}))

vi.mock('@/shared/consent', () => ({
  consentLedger: { check: mockConsentCheck },
}))

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { EARNED_AUTONOMY_THRESHOLD, TrustEngine } from '@/shared/trust/engine'
import { InMemoryTrustRuleRepository } from '@/shared/trust/in-memory-repository'

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------

const TENANT_ID = 'tenant_test' as TenantId
const ORG_ID = 'org_test' as OrganizationId
const WORKFORCE_ID = 'wf_test' as WorkforceId
const RUN_ID = 'run_test' as EngagementRunId
const EMPLOYEE_A = 'emp_a' as DigitalEmployeeId
const USER_ID = 'user_test' as UserId
const ACTION = 'publish_content'

function makeEngine() {
  const repo = new InMemoryTrustRuleRepository()
  const engine = new TrustEngine()
  engine._configureRepository(repo)
  return { engine, repo }
}

const requiresApprovalRule: TrustRule = {
  id: 'rule_publish',
  organizationId: ORG_ID,
  digitalEmployeeId: EMPLOYEE_A,
  action: ACTION,
  requiresApproval: true,
  autonomyLevel: 'supervised',
}

function permissionCheck() {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    workforceId: WORKFORCE_ID,
    digitalEmployeeId: EMPLOYEE_A,
    engagementRunId: RUN_ID,
    action: ACTION,
  }
}

function evalInput(decision: 'approved' | 'rejected') {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    digitalEmployeeId: EMPLOYEE_A,
    action: ACTION,
    engagementRunId: RUN_ID,
    decision,
    decidedBy: USER_ID,
    decidedAt: new Date(),
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TrustEngine — Earned Autonomy', () => {
  beforeEach(() => {
    mockAuditLog.mockClear()
    mockConsentCheck.mockClear()
  })

  // -------------------------------------------------------------------------
  describe('recordEvaluation — counter mechanics', () => {
    it('increments consecutiveApprovals on each approval', async () => {
      const { engine, repo } = makeEngine()
      await engine.recordEvaluation(evalInput('approved'))
      const earned = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      expect(earned?.consecutiveApprovals).toBe(1)
    })

    it('resets consecutiveApprovals to zero on rejection', async () => {
      const { engine, repo } = makeEngine()
      await engine.recordEvaluation(evalInput('approved'))
      await engine.recordEvaluation(evalInput('approved'))
      await engine.recordEvaluation(evalInput('rejected'))
      const earned = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      expect(earned?.consecutiveApprovals).toBe(0)
    })

    it(`sets isEarned=true after ${EARNED_AUTONOMY_THRESHOLD} consecutive approvals`, async () => {
      const { engine, repo } = makeEngine()
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      const earned = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      expect(earned?.isEarned).toBe(true)
      expect(earned?.earnedAt).toBeDefined()
    })

    it(`does not earn autonomy at ${EARNED_AUTONOMY_THRESHOLD - 1} approvals`, async () => {
      const { engine, repo } = makeEngine()
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD - 1; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      const earned = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      expect(earned?.isEarned).toBe(false)
    })

    it('resets isEarned to false after a rejection following earned status', async () => {
      const { engine, repo } = makeEngine()
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      await engine.recordEvaluation(evalInput('rejected'))
      const earned = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      expect(earned?.isEarned).toBe(false)
      expect(earned?.consecutiveApprovals).toBe(0)
      expect(earned?.earnedAt).toBeUndefined()
    })

    it('preserves earnedAt timestamp across additional approvals once earned', async () => {
      const { engine, repo } = makeEngine()
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      const first = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      await engine.recordEvaluation(evalInput('approved'))
      const second = await repo.getEarnedAutonomy(ORG_ID, EMPLOYEE_A, ACTION)
      expect(second?.earnedAt).toEqual(first?.earnedAt)
    })

    it('emits an audit event for each recorded evaluation', async () => {
      const { engine } = makeEngine()
      await engine.recordEvaluation(evalInput('approved'))
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'trust_engine.evaluation_approved' })
      )
      await engine.recordEvaluation(evalInput('rejected'))
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'trust_engine.evaluation_rejected' })
      )
    })
  })

  // -------------------------------------------------------------------------
  describe('check() — earned autonomy path', () => {
    it('permits an action autonomously once earned', async () => {
      const { engine } = makeEngine()
      engine.registerRule(requiresApprovalRule)
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      const result = await engine.check(permissionCheck())
      expect(result.outcome).toBe('permitted')
      expect(result.autonomyLevel).toBe('autonomous')
    })

    it('still requires approval when below threshold', async () => {
      const { engine } = makeEngine()
      engine.registerRule(requiresApprovalRule)
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD - 1; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      const result = await engine.check(permissionCheck())
      expect(result.outcome).toBe('requires_approval')
    })

    it('requires approval again after a rejection resets earned status', async () => {
      const { engine } = makeEngine()
      engine.registerRule(requiresApprovalRule)
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      await engine.recordEvaluation(evalInput('rejected'))
      const result = await engine.check(permissionCheck())
      expect(result.outcome).toBe('requires_approval')
    })

    it('blocks earned action when required consent is absent', async () => {
      mockConsentCheck.mockResolvedValue(null) // no active consent

      const { engine } = makeEngine()
      engine.registerRule({
        ...requiresApprovalRule,
        requiredConsentScope: 'content_creation',
      })
      for (let i = 0; i < EARNED_AUTONOMY_THRESHOLD; i++) {
        await engine.recordEvaluation(evalInput('approved'))
      }
      const result = await engine.check(permissionCheck())
      expect(result.outcome).toBe('requires_approval')
      expect(result.reason).toMatch(/requires active consent/)
    })
  })
})
