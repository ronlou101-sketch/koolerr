/**
 * Approval Workflow — Public Interface
 *
 * Manages the lifecycle of ApprovalRequests — formal records of pending
 * customer decisions on Digital Employee actions. Every resolved approval
 * feeds into TrustEngine.recordEvaluation() to advance earned-autonomy state.
 *
 * See FOUNDATION_003 §Phase 2 — Approval Workflows.
 * See docs/adr/ADR-014-approval-workflows.md.
 */

export * from './types'
export {
  ApprovalWorkflowService,
  approvalWorkflowService,
  _configureApprovalRepository,
} from './service'
export type { IApprovalRepository } from './repository'
export { SupabaseApprovalRepository } from './supabase-repository'
export { InMemoryApprovalRepository } from './in-memory-repository'
