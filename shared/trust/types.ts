import type {
  AutonomyLevel,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  TrustRule,
  UserId,
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

  /**
   * Record a customer's approval or rejection of a Digital Employee action.
   *
   * Each recorded evaluation updates the EarnedAutonomy tracker for the
   * (organization, digitalEmployee, action) tuple. Consecutive approvals
   * accumulate toward the earned-autonomy threshold; any rejection resets
   * the counter to zero so trust must be re-earned from the beginning.
   */
  recordEvaluation(input: RecordEvaluationInput): Promise<void>
}

// ---------------------------------------------------------------------------
// Trust Evaluation
// Records a customer's explicit decision on a Digital Employee's proposed action.
// Append-only — evaluations are never deleted; they form the performance history
// that the earned-autonomy mechanism depends on.
// ---------------------------------------------------------------------------

export type EvaluationDecision = 'approved' | 'rejected'

export interface TrustEvaluation {
  id: string
  tenantId: TenantId
  organizationId: OrganizationId
  digitalEmployeeId: DigitalEmployeeId
  action: string
  engagementRunId: EngagementRunId
  decision: EvaluationDecision
  decidedBy: UserId
  decidedAt: Date
  reason?: string
}

export interface RecordEvaluationInput {
  tenantId: TenantId
  organizationId: OrganizationId
  digitalEmployeeId: DigitalEmployeeId
  action: string
  engagementRunId: EngagementRunId
  decision: EvaluationDecision
  decidedBy: UserId
  decidedAt: Date
  reason?: string
}

// ---------------------------------------------------------------------------
// Earned Autonomy
// Tracks consecutive customer approvals toward the threshold at which a
// Digital Employee may act without requiring fresh per-action approval.
// One record per (organization, digitalEmployee, action) tuple.
// ---------------------------------------------------------------------------

export interface EarnedAutonomy {
  id: string
  tenantId: TenantId
  organizationId: OrganizationId
  digitalEmployeeId: DigitalEmployeeId
  action: string
  consecutiveApprovals: number
  isEarned: boolean
  earnedAt?: Date
  lastEvaluatedAt: Date
}
