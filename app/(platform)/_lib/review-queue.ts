import { approvalWorkflowService } from '@/shared/approval'
import { deliverablesService } from '@/domains/deliverables'
import type { OrganizationId, TenantId } from '@/shared/types'

/**
 * Number of items awaiting the customer's yes in the unified Review queue.
 *
 * The Review queue (Experience Phase 13 Slice A) merges two sources:
 *  - proposed Digital-Employee actions (pending ApprovalRequests), and
 *  - deliverables with status `pending_review`.
 * This helper is the single definition of that count, used by the platform
 * layout to drive the primary-nav "Review" badge (Slice B). It reads only
 * through existing domain services — no new data access or business logic.
 *
 * Fails open to 0: if either source cannot be read, the badge simply hides
 * rather than blocking the header from rendering.
 */
export async function getPendingReviewCount(
  organizationId: OrganizationId,
  tenantId: TenantId
): Promise<number> {
  const [approvalsResult, deliverablesResult] = await Promise.all([
    approvalWorkflowService.listPending(organizationId, tenantId),
    deliverablesService.listDeliverables({ organizationId }),
  ])

  const pendingActions = approvalsResult.ok ? approvalsResult.value.length : 0
  const pendingDeliverables = deliverablesResult.ok
    ? deliverablesResult.value.filter((d) => d.status === 'pending_review').length
    : 0

  return pendingActions + pendingDeliverables
}
