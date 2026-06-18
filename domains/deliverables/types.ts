import type { DeliverableId, OrganizationId, UserId } from '@/shared/types'

/**
 * Domain-specific types for the Deliverables domain.
 * See FOUNDATION_001_ARCHITECTURE.md §3 — Domain Boundaries.
 */

export interface DeliverableApprovalDecision {
  deliverableId: DeliverableId
  reviewedBy: UserId
  decision: 'approved' | 'rejected'
  feedback?: string
  decidedAt: Date
}

export interface DeliverableRevisionRequest {
  deliverableId: DeliverableId
  requestedBy: UserId
  instructions: string
  requestedAt: Date
}

export interface DeliverableFilter {
  organizationId: OrganizationId
  status?: import('@/shared/types').DeliverableStatus
  type?: import('@/shared/types').DeliverableType
  limit?: number
  offset?: number
}
