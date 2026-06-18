import type {
  Deliverable,
  DeliverableId,
  DeliverableStatus,
  DeliverableType,
  OrganizationId,
  TenantId,
} from '@/shared/types'
import type { DeliverableApprovalDecision, DeliverableRevisionRequest } from './types'
import type { DeliverableQueryFilter, IDeliverablesRepository } from './repository'

export class InMemoryDeliverablesRepository implements IDeliverablesRepository {
  private readonly deliverables = new Map<DeliverableId, Deliverable>()
  private readonly approvalDecisions = new Map<DeliverableId, DeliverableApprovalDecision[]>()
  private readonly revisionRequests = new Map<DeliverableId, DeliverableRevisionRequest[]>()

  async saveDeliverable(deliverable: Deliverable, _tenantId: TenantId): Promise<Deliverable> {
    this.deliverables.set(deliverable.id, deliverable)
    return deliverable
  }

  async findDeliverableById(id: DeliverableId): Promise<Deliverable | null> {
    return this.deliverables.get(id) ?? null
  }

  async listDeliverables(filter: DeliverableQueryFilter): Promise<Deliverable[]> {
    const results: Deliverable[] = []
    for (const d of this.deliverables.values()) {
      if (d.organizationId !== filter.organizationId) continue
      if (filter.status && d.status !== filter.status) continue
      if (filter.type && d.type !== filter.type) continue
      results.push(d)
    }
    const offset = filter.offset ?? 0
    const limit = filter.limit ?? results.length
    return results.slice(offset, offset + limit)
  }

  async saveApprovalDecision(
    decision: DeliverableApprovalDecision,
    _organizationId: OrganizationId
  ): Promise<void> {
    const existing = this.approvalDecisions.get(decision.deliverableId) ?? []
    existing.push(decision)
    this.approvalDecisions.set(decision.deliverableId, existing)
  }

  async saveRevisionRequest(
    request: DeliverableRevisionRequest,
    _organizationId: OrganizationId
  ): Promise<void> {
    const existing = this.revisionRequests.get(request.deliverableId) ?? []
    existing.push(request)
    this.revisionRequests.set(request.deliverableId, existing)
  }
}
