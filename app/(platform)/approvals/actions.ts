'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { approvalWorkflowService } from '@/shared/approval'
import { deliverablesService } from '@/domains/deliverables'
import { env } from '@/shared/config/env'
import { asDeliverableId, type ApprovalRequestId } from '@/shared/types'

/**
 * Resolve a single item from the unified Review queue.
 *
 * The queue merges two existing sources behind one customer experience:
 *  - proposed Digital-Employee actions (ApprovalRequests → TrustEngine), and
 *  - deliverables awaiting review.
 * This action branches on `kind` and delegates to the SAME services the two
 * original flows used — no business-logic or backend change, only one surface.
 * Reason (from the "Send back" chips) maps to the existing note/feedback field.
 */
export async function resolveReviewFormAction(formData: FormData) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const kind = formData.get('kind') as 'action' | 'deliverable' | null
  const id = formData.get('id') as string | null
  const decision = formData.get('decision') as 'approved' | 'rejected' | null
  const reason = (formData.get('reason') as string | null) || undefined

  if (!id || (decision !== 'approved' && decision !== 'rejected')) return

  if (kind === 'deliverable') {
    const deliverableId = asDeliverableId(id)
    // Mirror the deliverable review flow: promote a draft to pending_review first.
    const current = await deliverablesService.getDeliverable(deliverableId, ctx.organizationId)
    if (current.ok && current.value.status === 'draft') {
      await deliverablesService.submitForReview(
        deliverableId,
        ctx.organizationId,
        env.platform.tenantId()
      )
    }
    await deliverablesService.recordApprovalDecision(
      {
        deliverableId,
        reviewedBy: ctx.actor.userId,
        decision,
        feedback: decision === 'rejected' ? reason : undefined,
        decidedAt: new Date(),
      },
      env.platform.tenantId()
    )
  } else {
    await approvalWorkflowService.resolveRequest({
      id: id as ApprovalRequestId,
      organizationId: ctx.organizationId,
      decision,
      resolvedBy: ctx.actor.userId,
      resolutionNote: reason,
    })
  }

  redirect(`/approvals?resolved=${decision}`)
}
