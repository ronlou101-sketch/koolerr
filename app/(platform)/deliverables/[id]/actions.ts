'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import { env } from '@/shared/config/env'
import { asDeliverableId } from '@/shared/types'

async function ensurePendingReview(
  deliverableId: string,
  ctx: NonNullable<Awaited<ReturnType<typeof getRequestPlatformContext>>>
) {
  const current = await deliverablesService.getDeliverable(
    asDeliverableId(deliverableId),
    ctx.organizationId
  )
  if (current.ok && current.value.status === 'draft') {
    await deliverablesService.submitForReview(
      asDeliverableId(deliverableId),
      ctx.organizationId,
      env.platform.tenantId()
    )
  }
}

export async function approveDeliverable(deliverableId: string) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  await ensurePendingReview(deliverableId, ctx)

  const result = await deliverablesService.recordApprovalDecision(
    {
      deliverableId: asDeliverableId(deliverableId),
      reviewedBy: ctx.actor.userId,
      decision: 'approved',
      decidedAt: new Date(),
    },
    env.platform.tenantId()
  )

  if (result.ok) {
    redirect(`/deliverables/${deliverableId}?approved=true`)
  }
}

export async function rejectDeliverable(deliverableId: string, feedback: string) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  await ensurePendingReview(deliverableId, ctx)

  const result = await deliverablesService.recordApprovalDecision(
    {
      deliverableId: asDeliverableId(deliverableId),
      reviewedBy: ctx.actor.userId,
      decision: 'rejected',
      feedback: feedback || undefined,
      decidedAt: new Date(),
    },
    env.platform.tenantId()
  )

  if (result.ok) {
    redirect(`/deliverables/${deliverableId}?rejected=true`)
  }
}
