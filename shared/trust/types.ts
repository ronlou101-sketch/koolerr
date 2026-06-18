import type {
  AutonomyLevel,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  TrustRule,
  WorkforceId,
} from '@/shared/types'

/**
 * Trust Engine Types
 *
 * The Trust Engine governs what Digital Employees are permitted to do,
 * under what conditions, and at what level of autonomy. Every AI invocation
 * passes through the Trust Engine before reaching the Model Gateway.
 *
 * No AI invocation bypasses the Trust Engine — ever.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 * See FOUNDATION_004_PRODUCT_PRINCIPLES.md §4 — Trust Before Automation.
 * See FOUNDATION_004_PRODUCT_PRINCIPLES.md §8 — Progressive Autonomy.
 */

// ---------------------------------------------------------------------------
// Permission check
// What the Trust Engine evaluates before any AI action proceeds.
// ---------------------------------------------------------------------------

export interface PermissionCheck {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  digitalEmployeeId: DigitalEmployeeId
  engagementRunId: EngagementRunId
  /** The action being requested — must match a registered TrustRule action. */
  action: string
  /** Contextual data used to evaluate conditional rules. */
  context?: Record<string, unknown>
}

export type PermissionOutcome = 'permitted' | 'denied' | 'requires_approval'

export interface PermissionResult {
  outcome: PermissionOutcome
  autonomyLevel: AutonomyLevel
  /** Present when outcome is 'denied' or 'requires_approval'. */
  reason?: string
  /** The matching rule, if one was found. */
  appliedRule?: TrustRule
}

// ---------------------------------------------------------------------------
// Trust Engine interface
// ---------------------------------------------------------------------------

export interface ITrustEngine {
  /**
   * Evaluate whether a Digital Employee is permitted to take an action.
   *
   * Returns the outcome and the autonomy level under which the action
   * is permitted. Callers must check the outcome before proceeding.
   * Every check is logged to the audit trail regardless of outcome.
   */
  check(permission: PermissionCheck): Promise<PermissionResult>

  /**
   * Register a trust rule for a Digital Employee.
   * Rules are evaluated in registration order; first match wins.
   */
  registerRule(rule: TrustRule): void

  /** Returns all rules registered for a given Digital Employee. */
  rulesFor(digitalEmployeeId: DigitalEmployeeId): TrustRule[]
}
