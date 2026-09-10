'use server'

import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import { channelsService } from '@/domains/channels'
import { publishJobsService } from '@/domains/publishing'
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

/**
 * Enqueue a "publish now" job for an approved video deliverable to the org's
 * connected YouTube channel (Step 3D-2). Idempotent at the service layer — a
 * duplicate request while a job is active/published returns the existing job, so
 * repeated clicks never produce a duplicate upload. The upload itself runs
 * asynchronously in the publish-jobs worker.
 */
export async function publishDeliverableToYouTube(deliverableId: string) {
  const ctx = await getRequestPlatformContext()
  if (!ctx || ctx.actor.type !== 'user') return

  const connection = await channelsService.getConnection(ctx.organizationId, 'youtube')
  if (!connection.ok || !connection.value || connection.value.status !== 'connected') {
    redirect(`/deliverables/${deliverableId}?published=notconnected`)
  }

  const enqueued = await publishJobsService.enqueue({
    organizationId: ctx.organizationId,
    tenantId: env.platform.tenantId(),
    deliverableId: asDeliverableId(deliverableId),
    channelConnectionId: connection.value.id,
  })

  redirect(`/deliverables/${deliverableId}?published=${enqueued.ok ? 'queued' : 'error'}`)
}
