/**
 * Audit Infrastructure — Public Interface
 *
 * Every consequential platform action emits an audit event through this module.
 * The audit log is append-only and permanent.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.5 — Auditability.
 */

export * from './types'
export { auditLogger } from './audit-logger'
