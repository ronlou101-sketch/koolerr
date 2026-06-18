/**
 * Workforce Engine Domain — Public Interface
 *
 * Owns: Workforce definitions, Digital Employee definitions and lifecycle,
 *       Engagement Run execution, Orchestration Engine integration.
 *
 * Does not own: Business Brain writes (contributes through the business-brain
 *               domain's contribution interface), billing, identity.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export * from './types'
export * from './service'
