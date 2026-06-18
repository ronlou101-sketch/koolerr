import type {
  Deliverable,
  DeliverableId,
  DeliverableStatus,
  DeliverableType,
  OrganizationId,
  TenantId,
} from '@/shared/types'
import type { DeliverableApprovalDecision, DeliverableRevisionRequest } from './types'

/**
 * Deliverables Repository Interface
 *
 * Declares the storage contract for the Deliverables domain.
 *
 * Approval decisions and revision requests are append-only — they represent
 * events in the Deliverable lifecycle and are never mutated after being saved.
 *
 * organizationId is required alongside approval decisions and revision
 * requests so that the database can enforce tenant isolation on these
 * child tables (which do not carry it in the TypeScript types).
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.9 — Deliverables.
 * See docs/adr/ADR-004-repository-pattern.md.
 */

export interface DeliverableQueryFilter {
  organizationId: OrganizationId
  status?: DeliverableStatus
  type?: DeliverableType
  limit?: number
  offset?: number
}

export interface IDeliverablesRepository {
  // Deliverables
  saveDeliverable(deliverable: Deliverable, tenantId: TenantId): Promise<Deliverable>
  findDeliverableById(id: DeliverableId): Promise<Deliverable | null>
  listDeliverables(filter: DeliverableQueryFilter): Promise<Deliverable[]>

  // Append-only decision history
  saveApprovalDecision(
    decision: DeliverableApprovalDecision,
    organizationId: OrganizationId
  ): Promise<void>
  saveRevisionRequest(
    request: DeliverableRevisionRequest,
    organizationId: OrganizationId
  ): Promise<void>
}
