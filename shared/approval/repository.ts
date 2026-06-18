import type { ApprovalRequestId, OrganizationId, TenantId } from '@/shared/types'
import type { ApprovalRequest } from './types'

/**
 * Approval Repository Interface
 *
 * Provides durable storage for ApprovalRequests.
 *
 * See docs/adr/ADR-014-approval-workflows.md.
 */
export interface IApprovalRepository {
  saveRequest(request: ApprovalRequest): Promise<void>
  findById(id: ApprovalRequestId): Promise<ApprovalRequest | null>
  listPending(organizationId: OrganizationId, tenantId: TenantId): Promise<ApprovalRequest[]>
}
