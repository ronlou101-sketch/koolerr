'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { approvalWorkflowService } from '@/shared/approval'
import type { ApprovalRequestId } from '@/shared/types'

/**
 * Resolve a pending ApprovalRequest from a form submission.
 * Called by approve and reject forms on the /approvals page.
 *
 * Reads decision ('approved' | 'rejected'), the request ID, and an optional
 * resolution note from formData. Delegates to ApprovalWorkflowService which
 * forwards the decision to TrustEngine.recordEvaluation() (ADR-014).
 */
export async function resolveApprovalFormAction(formData: FormData) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const id = formData.get('id') as string
  const decision = formData.get('decision') as 'approved' | 'rejected'
  const note = (formData.get('note') as string | null) || undefined

  if (!id || (decision !== 'approved' && decision !== 'rejected')) return

  await approvalWorkflowService.resolveRequest({
    id: id as ApprovalRequestId,
    organizationId: ctx.organizationId,
    decision,
    resolvedBy: ctx.actor.userId,
    resolutionNote: note,
  })

  redirect(`/approvals?resolved=${decision}`)
}
