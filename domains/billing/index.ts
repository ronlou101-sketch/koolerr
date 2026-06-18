/**
 * Billing Domain — Public Interface
 *
 * Owns: subscription management, usage tracking, payment processing,
 *       entitlement enforcement.
 *
 * Does not own: any business data, any AI invocations, any workflow logic.
 *
 * The Model Gateway emits usage events to billing. No other domain writes
 * billing records directly.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export * from './types'
export * from './service'
