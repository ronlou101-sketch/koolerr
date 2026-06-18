import type { DigitalEmployeeId, OrganizationId, TrustRule } from '@/shared/types'
import type { EarnedAutonomy, TrustEvaluation } from './types'

/**
 * Trust Rule Repository Interface
 *
 * Provides durable storage for TrustRules, TrustEvaluations, and EarnedAutonomy records.
 * The Trust Engine uses this to:
 *   - Persist rules on registration and reload them at startup.
 *   - Record every customer evaluation (approved/rejected) as an immutable fact.
 *   - Maintain the earned-autonomy counter per (organization, employee, action) tuple.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 * See docs/adr/ADR-013-trust-engine-earned-autonomy.md.
 */
export interface ITrustRuleRepository {
  /**
   * Persist a TrustRule. Uses upsert on (digital_employee_id, action) so
   * re-registering the same rule is idempotent.
   */
  saveRule(rule: TrustRule): Promise<void>

  /** Return all persisted rules, across all organizations. */
  listAllRules(): Promise<TrustRule[]>

  /** Append a customer evaluation record. Evaluations are never updated or deleted. */
  saveEvaluation(evaluation: TrustEvaluation): Promise<void>

  /** Return the current earned-autonomy record for a given (org, employee, action) tuple, or null. */
  getEarnedAutonomy(
    organizationId: OrganizationId,
    digitalEmployeeId: DigitalEmployeeId,
    action: string
  ): Promise<EarnedAutonomy | null>

  /** Upsert the earned-autonomy record for a given (org, employee, action) tuple. */
  saveEarnedAutonomy(earned: EarnedAutonomy): Promise<void>
}
