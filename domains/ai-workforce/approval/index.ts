/**
 * Approval Department — Public Interface
 *
 * The Approval Department is the sixth active AI department in the AI Workforce.
 * It consumes a PublishingJob and produces an ApprovalJob containing a structured
 * ApprovalDecision covering all publishing packages.
 *
 * Three outcomes:
 *   APPROVED — all packages cleared; readyForDelivery = true; workflow proceeds to Delivery
 *   REVISE   — specific issues identified; requiredChanges sent back to originating department
 *   REJECT   — critical or compliance failures; workflow terminated with structured reasons
 *
 * Review provider: OpenAI (primary) / Anthropic (fallback) via buildProviderOrder()
 * Employee: qa-lead (quality-assurance department)
 *
 * Usage:
 *   import { approvalDepartment } from '@/domains/ai-workforce/approval'
 *   const result = await approvalDepartment.reviewPackages(request)
 */

export type {
  ApprovalOutcome,
  ApprovalDecision,
  ApprovalJob,
  ApprovalJobStatus,
  ApprovalError,
  ApprovalErrorCode,
  ApprovalRequest,
  ApprovalDepartmentHealth,
  ApprovalProviderReadiness,
  ApprovalProviderStatus,
} from './types'

export type { IApprovalDepartmentService } from './service'
export { ApprovalDepartmentService, approvalDepartment } from './service'
export { buildApprovalPrompt, parseApprovalDecision, APPROVAL_SYSTEM_CONTEXT } from './prompt'
export { getApprovalDepartmentHealth } from './health'
