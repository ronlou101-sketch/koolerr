/**
 * Business Brain Domain — Public Interface
 *
 * Owns: Business Brain lifecycle, Business Memory storage and retrieval,
 *       Business Intelligence synthesis.
 *
 * Does not own: AI invocation, workflow orchestration, billing,
 *               user identity.
 *
 * All reads from the Business Brain go through this domain's query interface.
 * Writes from other domains are accepted only through the contribution interface.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export * from './types'
export * from './service'
