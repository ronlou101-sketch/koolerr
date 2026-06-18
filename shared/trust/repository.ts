import type { TrustRule } from '@/shared/types'

/**
 * Trust Rule Repository Interface
 *
 * Provides durable storage for TrustRules. The Trust Engine uses this to
 * persist rules on registration and reload them from DB on server startup,
 * eliminating the in-memory-only vulnerability where restarts lost all rules.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 */
export interface ITrustRuleRepository {
  /**
   * Persist a TrustRule. Uses upsert on (digital_employee_id, action) so
   * re-registering the same rule is idempotent.
   */
  saveRule(rule: TrustRule): Promise<void>

  /** Return all persisted rules, across all organizations. */
  listAllRules(): Promise<TrustRule[]>
}
