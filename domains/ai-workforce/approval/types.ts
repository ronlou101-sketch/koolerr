import type { EngagementRunId, OrganizationId, TenantId, WorkforceId } from '@/shared/types'
import type { PublishingJob, SupportedPlatform } from '../publishing/types'

// ── Outcome ────────────────────────────────────────────────────────────────────

/** The three possible outcomes of an approval review. */
export type ApprovalOutcome = 'APPROVED' | 'REVISE' | 'REJECT'

// ── Output ─────────────────────────────────────────────────────────────────────

/**
 * A structured approval decision produced by the QA Lead.
 * Covers the full set of publishing packages in one authoritative review.
 *
 * Three outcomes:
 *   APPROVED  — all packages meet standards; readyForDelivery = true
 *   REVISE    — issues found that must be corrected before delivery
 *   REJECT    — critical or compliance failures; workflow is terminated
 */
export interface ApprovalDecision {
  // ── Verdict ─────────────────────────────────────────────────────────────────
  overallDecision: ApprovalOutcome
  /** Reviewer confidence in this decision (0–100). */
  confidence: number
  /** Aggregate content quality score across all packages (0–100). */
  qualityScore: number
  /** Aggregate readability and clarity score (0–100). */
  readabilityScore: number
  /** True only when overallDecision is APPROVED and no issues remain. */
  readyForDelivery: boolean

  // ── Issue Classification ─────────────────────────────────────────────────────
  /** Blocking issues — must be resolved before any delivery attempt. */
  criticalIssues: string[]
  /** Brand voice, visual identity, or positioning misalignments. */
  brandingIssues: string[]
  /** Legal, regulatory, or policy violations. */
  complianceIssues: string[]
  /** Platform-specific format, character limit, or CTA violations. */
  platformIssues: string[]

  // ── Revision Guidance ────────────────────────────────────────────────────────
  /** Ordered list of specific changes required before re-submission. */
  requiredChanges: string[]
  /** Step-by-step instructions for the department that must revise the work. */
  revisionInstructions: string
  /** QA Lead's overall notes on the submission quality and decision rationale. */
  approvalNotes: string

  // ── Package-Level Decisions ───────────────────────────────────────────────────
  /** Platforms whose packages passed review and are cleared for delivery. */
  approvedPackages: SupportedPlatform[]
  /** Platforms whose packages failed and must be reworked. */
  rejectedPackages: SupportedPlatform[]

  generatedAt: Date
  sourcePublishingJob: PublishingJob
}

// ── Job ────────────────────────────────────────────────────────────────────────

export type ApprovalJobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'retrying' | 'ready'

/** Tracks a single approval job from submission to completion. Persisted in-memory. */
export interface ApprovalJob {
  id: string
  status: ApprovalJobStatus
  publishingJob: PublishingJob
  approvalDecision?: ApprovalDecision
  error?: string
  attempts: number
  employeeId: string
  providerId: string
  createdAt: Date
  updatedAt: Date
}

// ── Errors ─────────────────────────────────────────────────────────────────────

export type ApprovalErrorCode =
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED'
  | 'TRUST_ENGINE_DENIED'

export interface ApprovalError {
  code: ApprovalErrorCode
  message: string
  retriable: boolean
}

// ── Request ────────────────────────────────────────────────────────────────────

/** Everything needed to dispatch an approval job through the platform. */
export interface ApprovalRequest {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
  publishingJob: PublishingJob
  /** Defaults to 'qa-lead'. */
  preferredEmployee?: 'qa-lead'
}

// ── Health ─────────────────────────────────────────────────────────────────────

export type ApprovalProviderReadiness = 'ready' | 'not-configured' | 'error'

export interface ApprovalProviderStatus {
  providerId: string
  name: string
  readiness: ApprovalProviderReadiness
  purpose: string
  notes: string
}

export interface ApprovalDepartmentHealth {
  overall: ApprovalProviderReadiness
  /** Primary text provider — OpenAI (tracked in PROVIDER_REGISTRY). */
  primaryProvider: ApprovalProviderStatus
  /** Fallback text provider — Anthropic (platform-level; checked via env). */
  fallbackProvider: ApprovalProviderStatus
  readyForApproval: boolean
  configuredProviderCount: number
  totalProviderCount: number
}
