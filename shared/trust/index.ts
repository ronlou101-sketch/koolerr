/**
 * Trust Engine — Public Interface
 *
 * Governs what Digital Employees are permitted to do and at what
 * autonomy level. Every AI invocation passes through the Trust Engine
 * before reaching the Model Gateway.
 *
 * No AI action bypasses the Trust Engine. No exception exists to this rule.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 * See FOUNDATION_002_ENGINEERING_PRINCIPLES.md §10 — Rule 4.
 */

export * from './types'
export {
  TrustEngine,
  EARNED_AUTONOMY_THRESHOLD,
  trustEngine,
  _configureTrustRepository,
  _loadTrustRulesFromRepository,
} from './engine'
export type { ITrustRuleRepository } from './repository'
export { SupabaseTrustRuleRepository } from './supabase-repository'
export { InMemoryTrustRuleRepository } from './in-memory-repository'
