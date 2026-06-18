/**
 * Identity Domain — Public Interface
 *
 * Owns: user authentication, session management, role-based access control,
 *       API key lifecycle.
 *
 * Does not own: business data, AI invocations, billing logic,
 *               workforce operations.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export * from './types'
export * from './service'
