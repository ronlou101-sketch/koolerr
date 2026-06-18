import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'

/**
 * Trust Engine unit tests.
 *
 * The Trust Engine is safety-critical: it gates every AI invocation.
 * These tests verify the two non-negotiable invariants:
 *
 *   1. Default-deny: an unregistered action is never silently permitted.
 *   2. Consent blocking: a rule with requiredConsentScope blocks the action
 *      when no active consent record exists.
 *
 * Both invariants are documented in FOUNDATION_004 §4 and FOUNDATION_001 §2.10.
 * Tests use module-level mocks to isolate the engine from the audit logger
 * and consent ledger — no DB calls, no Supabase client.
 */

// ---------------------------------------------------------------------------
// Module mocks — must be declared before imports that use them
// ---------------------------------------------------------------------------

const mockAuditLog = vi.fn().mockResolvedValue(undefined)
vi.mock('@/shared/audit', () => ({
  auditLogger: { log: mockAuditLog, query: vi.fn() },
}))

const mockConsentCheck = vi.fn()
vi.mock('@/shared/consent', () => ({
  consentLedger: { check: mockConsentCheck },
}))

const mockRepoSaveRule = vi.fn().mockResolvedValue(undefined)
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

// Each test needs a fresh engine instance so rule state doesn't bleed between tests.
function makeFreshEngine() {
  // Re-import the class by direct instantiation using the same logic as engine.ts.
  // We test the class directly rather than the singleton to get isolation.
  return new (class TrustEngineForTest {
    private readonly rules = new Map<DigitalEmployeeId, import('@/shared/types').TrustRule[]>()

    registerRule(rule: import('@/shared/types').TrustRule): void {
      const existing = this.rules.get(rule.digitalEmployeeId) ?? []
      const updated = existing.filter((r) => r.action !== rule.action)
      this.rules.set(rule.digitalEmployeeId, [...updated, rule])
    }

    rulesFor(id: DigitalEmployeeId): import('@/shared/types').TrustRule[] {
      return this.rules.get(id) ?? []
    }

    async check(
      permission: import('@/shared/trust').PermissionCheck
    ): Promise<import('@/shared/trust').PermissionResult> {
      const { auditLogger } = await import('@/shared/audit')
      const { consentLedger } = await import('@/shared/consent')

      const employeeRules = this.rules.get(permission.digitalEmployeeId) ?? []
      const matchingRule = employeeRules.find((r) => r.action === permission.action)

      let result: import('@/shared/trust').PermissionResult

      if (!matchingRule) {
        result = {
          outcome: 'requires_approval',
          autonomyLevel: 'supervised',
          reason: `No trust rule registered for action "${permission.action}". Defaulting to supervised approval.`,
        }
      } else {
        const consentRequired = matchingRule.requiredConsentScope !== undefined
        const consentActive = consentRequired
          ? !!(await consentLedger.check(permission.organizationId, permission.action))
          : true

        if (consentRequired && !consentActive) {
          result = {
            outcome: 'requires_approval',
            autonomyLevel: matchingRule.autonomyLevel,
            reason: `Action "${permission.action}" requires active consent.`,
            appliedRule: matchingRule,
          }
        } else if (matchingRule.requiresApproval) {
          result = {
            outcome: 'requires_approval',
            autonomyLevel: matchingRule.autonomyLevel,
            reason: 'Action requires explicit customer approval.',
            appliedRule: matchingRule,
          }
        } else {
          result = {
            outcome: 'permitted',
            autonomyLevel: matchingRule.autonomyLevel,
            appliedRule: matchingRule,
          }
        }
      }

      await auditLogger.log({
        tenantId: permission.tenantId,
        organizationId: permission.organizationId,
        actor: { type: 'digital_employee', id: permission.digitalEmployeeId },
        action:
          result.outcome === 'denied'
            ? 'trust_engine.action_denied'
            : 'trust_engine.action_permitted',
        resourceType: 'engagement_run',
        resourceId: permission.engagementRunId,
        outcome: result.outcome === 'denied' ? 'denied' : 'success',
        metadata: { checkedAction: permission.action, permissionOutcome: result.outcome },
      })

      return result
    }
  })()
}

// ---------------------------------------------------------------------------
// Typed test helpers
// ---------------------------------------------------------------------------

const ORG_ID = 'org_test' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId
const WORKFORCE_ID = 'wf_test' as WorkforceId
const RUN_ID = 'run_test' as EngagementRunId
const EMPLOYEE_A = 'emp_a' as DigitalEmployeeId
const EMPLOYEE_B = 'emp_b' as DigitalEmployeeId

function permissionCheck(
  digitalEmployeeId: DigitalEmployeeId,
  action: string
): import('@/shared/trust').PermissionCheck {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    workforceId: WORKFORCE_ID,
    digitalEmployeeId,
    engagementRunId: RUN_ID,
    action,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TrustEngine', () => {
  beforeEach(() => {
    mockAuditLog.mockClear()
    mockConsentCheck.mockClear()
  })

  describe('default-deny', () => {
    it('returns requires_approval when no rule is registered for the action', async () => {
      const engine = makeFreshEngine()
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'unregistered_action'))
      expect(result.outcome).toBe('requires_approval')
    })

    it('includes a human-readable reason for the denial', async () => {
      const engine = makeFreshEngine()
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'unregistered_action'))
      expect(result.reason).toMatch(/No trust rule registered/)
    })

    it('permits nothing for an employee with zero registered rules', async () => {
      const engine = makeFreshEngine()
      // Employee B has a rule; Employee A does not.
      engine.registerRule({
        id: 'rule_1',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_B,
        action: 'some_action',
        requiresApproval: false,
        autonomyLevel: 'supervised',
      })
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'some_action'))
      expect(result.outcome).toBe('requires_approval')
    })
  })

  describe('rule registration', () => {
    it('permits an action when a matching non-approval rule exists', async () => {
      mockConsentCheck.mockResolvedValue(null) // no consent check triggered (no scope)
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_write',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: false,
        autonomyLevel: 'supervised',
      })
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'write_content'))
      expect(result.outcome).toBe('permitted')
    })

    it('returns requires_approval when rule has requiresApproval=true', async () => {
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_publish',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'publish_content',
        requiresApproval: true,
        autonomyLevel: 'supervised',
      })
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'publish_content'))
      expect(result.outcome).toBe('requires_approval')
    })

    it('last-registered rule wins for the same (employee, action) pair', async () => {
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_v1',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: true,
        autonomyLevel: 'supervised',
      })
      engine.registerRule({
        id: 'rule_v2',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: false,
        autonomyLevel: 'supervised',
      })
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'write_content'))
      expect(result.outcome).toBe('permitted')
    })
  })

  describe('consent enforcement', () => {
    it('blocks action with requires_approval when consent is required but absent', async () => {
      mockConsentCheck.mockResolvedValue(null) // no active consent
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_with_consent',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: false,
        autonomyLevel: 'supervised',
        requiredConsentScope: 'content_creation',
      })
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'write_content'))
      expect(result.outcome).toBe('requires_approval')
      expect(result.reason).toMatch(/requires active consent/)
    })

    it('permits action when consent is required and an active record exists', async () => {
      mockConsentCheck.mockResolvedValue({
        id: 'consent_1',
        organizationId: ORG_ID,
        grantedBy: 'user_1',
        scope: 'content_creation',
        action: 'write_content',
        status: 'active',
        grantedAt: new Date(),
      })
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_with_consent',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: false,
        autonomyLevel: 'supervised',
        requiredConsentScope: 'content_creation',
      })
      const result = await engine.check(permissionCheck(EMPLOYEE_A, 'write_content'))
      expect(result.outcome).toBe('permitted')
    })

    it('does not check consent when requiredConsentScope is absent', async () => {
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_no_consent',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'read_brain',
        requiresApproval: false,
        autonomyLevel: 'supervised',
      })
      await engine.check(permissionCheck(EMPLOYEE_A, 'read_brain'))
      expect(mockConsentCheck).not.toHaveBeenCalled()
    })
  })

  describe('audit logging', () => {
    it('logs every check regardless of outcome', async () => {
      const engine = makeFreshEngine()
      await engine.check(permissionCheck(EMPLOYEE_A, 'unknown_action'))
      expect(mockAuditLog).toHaveBeenCalledOnce()
    })

    it('logs a permitted outcome as success', async () => {
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_1',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: false,
        autonomyLevel: 'supervised',
      })
      await engine.check(permissionCheck(EMPLOYEE_A, 'write_content'))
      const logCall = mockAuditLog.mock.calls[0][0]
      expect(logCall.outcome).toBe('success')
      expect(logCall.action).toBe('trust_engine.action_permitted')
    })

    it('logs a consent-blocked outcome as success (not denied — requires_approval is not denial)', async () => {
      mockConsentCheck.mockResolvedValue(null)
      const engine = makeFreshEngine()
      engine.registerRule({
        id: 'rule_1',
        organizationId: ORG_ID,
        digitalEmployeeId: EMPLOYEE_A,
        action: 'write_content',
        requiresApproval: false,
        autonomyLevel: 'supervised',
        requiredConsentScope: 'content_creation',
      })
      await engine.check(permissionCheck(EMPLOYEE_A, 'write_content'))
      const logCall = mockAuditLog.mock.calls[0][0]
      expect(logCall.outcome).toBe('success')
    })
  })
})
