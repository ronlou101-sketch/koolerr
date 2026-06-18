import type {
  ApprovalRequestId,
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  PlatformResult,
  TenantId,
  UserId,
  WorkforceId,
} from '@/shared/types'

/**
 * Approval Workflow Types
 *
 * An ApprovalRequest is the formal record of a Digital Employee requesting
 * permission to take a consequential action. The Trust Engine returns
 * 'requires_approval' and the caller creates an ApprovalRequest so the
 * customer has a structured item to review, approve, or reject.
 *
 * Resolving an ApprovalRequest feeds the decision into TrustEngine.recordEvaluation(),
 * advancing or resetting the earned-autonomy counter for that (org, employee, action)
 * tuple. See FOUNDATION_004 §8 — Progressive Autonomy and ADR-014.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.10 — Trust Engine.
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md §Phase 2 — Approval Workflows.
 */

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled'

export interface ApprovalRequest {
  id: ApprovalRequestId
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  digitalEmployeeId: DigitalEmployeeId
  engagementRunId: EngagementRunId
  /** The Trust Engine action string that triggered this request. */
  action: string
  /** Human-readable description of what the Digital Employee intends to do. */
  description: string
  /** Additional context data for the customer to review (e.g., draft content, target URL). */
  context: Record<string, unknown>
  status: ApprovalRequestStatus
  createdAt: Date
  expiresAt?: Date
  resolvedAt?: Date
  resolvedBy?: UserId
  /** Optional note from the customer explaining their decision. */
  resolutionNote?: string
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateApprovalRequestInput {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  digitalEmployeeId: DigitalEmployeeId
  engagementRunId: EngagementRunId
  action: string
  description: string
  context: Record<string, unknown>
  expiresAt?: Date
}

export interface ResolveApprovalInput {
  id: ApprovalRequestId
  organizationId: OrganizationId
  decision: 'approved' | 'rejected'
  resolvedBy: UserId
  resolutionNote?: string
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface IApprovalWorkflowService {
  /** Create a new pending approval request when the Trust Engine returns 'requires_approval'. */
  createRequest(input: CreateApprovalRequestInput): Promise<PlatformResult<ApprovalRequest>>

  /** Fetch a single request. Returns TENANT_ISOLATION_VIOLATION if the org does not own it. */
  getRequest(
    id: ApprovalRequestId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<ApprovalRequest>>

  /** Return all pending requests for an organization — used by the customer dashboard. */
  listPending(
    organizationId: OrganizationId,
    tenantId: TenantId
  ): Promise<PlatformResult<ApprovalRequest[]>>

  /**
   * Record a customer's approval or rejection of a pending request.
   *
   * Updates the request status and calls TrustEngine.recordEvaluation() so
   * consecutive approvals accumulate toward earned autonomy.
   */
  resolveRequest(input: ResolveApprovalInput): Promise<PlatformResult<ApprovalRequest>>

  /**
   * Cancel a pending request — e.g., when the engagement run is cancelled before the
   * customer reviews it. Has no effect on earned-autonomy state (no evaluation is recorded).
   */
  cancelRequest(
    id: ApprovalRequestId,
    organizationId: OrganizationId
  ): Promise<PlatformResult<ApprovalRequest>>
}
