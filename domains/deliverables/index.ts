/**
 * Deliverables Domain — Public Interface
 *
 * Owns: Deliverable storage, versioning, attribution, customer review
 *       and approval workflows.
 *
 * Does not own: Deliverable creation — that is performed by Digital Employees
 *               within the workforce-engine domain. Also does not own
 *               billing or identity.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export * from './types'
export * from './service'
