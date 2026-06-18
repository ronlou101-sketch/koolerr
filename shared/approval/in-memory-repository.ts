import type { ApprovalRequestId, OrganizationId, TenantId } from '@/shared/types'
import type { ApprovalRequest } from './types'
import type { IApprovalRepository } from './repository'

/**
 * In-memory Approval Repository
 *
 * Used in tests and local development. Swap for SupabaseApprovalRepository
 * in production via _configureApprovalRepository() during bootstrap.
 */
export class InMemoryApprovalRepository implements IApprovalRepository {
  private readonly requests = new Map<string, ApprovalRequest>()

  async saveRequest(request: ApprovalRequest): Promise<void> {
    this.requests.set(request.id, request)
  }

  async findById(id: ApprovalRequestId): Promise<ApprovalRequest | null> {
    return this.requests.get(id) ?? null
  }

  async listPending(
    organizationId: OrganizationId,
    _tenantId: TenantId
  ): Promise<ApprovalRequest[]> {
    return Array.from(this.requests.values()).filter(
      (r) => r.organizationId === organizationId && r.status === 'pending'
    )
  }
}
