import { auditLogger } from '@/shared/audit'
import type { DigitalEmployeeId, TrustRule } from '@/shared/types'
import type { ITrustEngine, PermissionCheck, PermissionResult } from './types'

/**
 * Trust Engine — stub implementation.
 *
 * Evaluates PermissionChecks against registered TrustRules.
 * If no matching rule is found, the default is 'requires_approval' —
 * never 'permitted'. This enforces the principle from
 * FOUNDATION_004_PRODUCT_PRINCIPLES.md §4: trust before automation.
 *
 * The engine always audits its decision. Whether the action is permitted,
 * denied, or requires approval, the Trust Engine's reasoning is on record.
 *
 * Rules are stored in memory in this stub. The production implementation
 * will load rules from Supabase scoped by Organization and Digital Employee.
 */
class TrustEngine implements ITrustEngine {
  /** Rules indexed by DigitalEmployeeId for O(1) lookup. */
  private readonly rules = new Map<DigitalEmployeeId, TrustRule[]>()

  registerRule(rule: TrustRule): void {
    const existing = this.rules.get(rule.digitalEmployeeId) ?? []
    this.rules.set(rule.digitalEmployeeId, [...existing, rule])
  }

  rulesFor(digitalEmployeeId: DigitalEmployeeId): TrustRule[] {
    return this.rules.get(digitalEmployeeId) ?? []
  }

  async check(permission: PermissionCheck): Promise<PermissionResult> {
    const employeeRules = this.rules.get(permission.digitalEmployeeId) ?? []
    const matchingRule = employeeRules.find((r) => r.action === permission.action)

    let result: PermissionResult

    if (!matchingRule) {
      // No rule registered for this action — default to requires_approval.
      // This is intentional: unlisted actions are not silently permitted.
      result = {
        outcome: 'requires_approval',
        autonomyLevel: 'supervised',
        reason: `No trust rule registered for action "${permission.action}". Defaulting to supervised approval.`,
      }
    } else if (matchingRule.requiresApproval) {
      result = {
        outcome: 'requires_approval',
        autonomyLevel: matchingRule.autonomyLevel,
        reason: 'Action requires explicit customer approval per registered trust rule.',
        appliedRule: matchingRule,
      }
    } else {
      result = {
        outcome: 'permitted',
        autonomyLevel: matchingRule.autonomyLevel,
        appliedRule: matchingRule,
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
      metadata: {
        checkedAction: permission.action,
        permissionOutcome: result.outcome,
        autonomyLevel: result.autonomyLevel,
        reason: result.reason,
        workforceId: permission.workforceId,
      },
    })

    return result
  }
}

export const trustEngine: ITrustEngine = new TrustEngine()
