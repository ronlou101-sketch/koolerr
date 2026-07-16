import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { modelGateway } from '@/shared/model-gateway'
import { trustEngine } from '@/shared/trust'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'
import type { DeliverableId, DigitalEmployeeId, TrustRule } from '@/shared/types'

// HeyGen polls for up to 10 minutes; Vercel Pro function timeout caps at 5 minutes.
export const maxDuration = 300

const VIDEO_EMPLOYEE_ID = 'video-producer' as DigitalEmployeeId
const VIDEO_ACTION = 'generate_heygen_video'

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let deliverableId: DeliverableId
  try {
    const body = (await request.json()) as { deliverableId?: unknown }
    if (
      !body.deliverableId ||
      typeof body.deliverableId !== 'string' ||
      !body.deliverableId.trim()
    ) {
      return NextResponse.json({ error: 'deliverableId is required' }, { status: 400 })
    }
    deliverableId = body.deliverableId.trim() as DeliverableId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const scriptResult = await deliverablesService.getDeliverable(deliverableId, ctx.organizationId)
  if (!scriptResult.ok) {
    return NextResponse.json({ error: 'Script deliverable not found.' }, { status: 404 })
  }
  const scriptDeliverable = scriptResult.value

  if (scriptDeliverable.type !== 'video_script') {
    return NextResponse.json(
      { error: `Deliverable must be type 'video_script', got '${scriptDeliverable.type}'.` },
      { status: 400 }
    )
  }

  const script = scriptDeliverable.content?.script
  if (!script || typeof script !== 'string') {
    return NextResponse.json(
      { error: 'Script deliverable is missing the script field.' },
      { status: 422 }
    )
  }

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok || workforcesResult.value.length === 0) {
    return NextResponse.json(
      { error: 'No workforce found. Complete the onboarding wizard first.' },
      { status: 404 }
    )
  }
  const workforce = workforcesResult.value.find((w) => w.businessFunction === 'Content Marketing')
  if (!workforce) {
    return NextResponse.json({ error: 'Content Marketing workforce not found.' }, { status: 404 })
  }

  const tenantId = env.platform.tenantId()

  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId: workforce.id,
    organizationId: ctx.organizationId,
    objective: `HeyGen video generation for script: ${deliverableId}`,
    context: { type: 'heygen-video-generation', scriptDeliverableId: deliverableId },
  })

  if (!runResult.ok) {
    return NextResponse.json({ error: 'Failed to create engagement run' }, { status: 500 })
  }

  const engagementRunId = runResult.value.id

  const trustRule: TrustRule = {
    id: `heygen-video-${ctx.organizationId}`,
    organizationId: ctx.organizationId,
    digitalEmployeeId: VIDEO_EMPLOYEE_ID,
    action: VIDEO_ACTION,
    requiresApproval: false,
    autonomyLevel: 'autonomous',
  }
  trustEngine.registerRule(trustRule)

  let videoUrl: string
  try {
    const response = await modelGateway.invoke({
      tenantId,
      organizationId: ctx.organizationId,
      workforceId: workforce.id,
      digitalEmployeeId: VIDEO_EMPLOYEE_ID,
      engagementRunId,
      action: VIDEO_ACTION,
      provider: 'heygen',
      prompt: script,
    })
    videoUrl = response.content
  } catch (err) {
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRunId,
      status: 'failed',
      updatedAt: new Date(),
    })
    const message = err instanceof Error ? err.message : 'Video generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'completed',
    updatedAt: new Date(),
  })

  const storeResult = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId: ctx.organizationId,
    engagementRunId,
    type: 'video',
    title: scriptDeliverable.title,
    content: {
      videoUrl,
      scriptDeliverableId: deliverableId,
      creativeId: scriptDeliverable.content.creativeId ?? null,
    },
    attributedTo: [VIDEO_EMPLOYEE_ID],
  })

  if (!storeResult.ok) {
    logger.warn('[HEYGEN_GENERATE] Failed to store video Deliverable — returning videoUrl anyway', {
      engagementRunId,
      scriptDeliverableId: deliverableId,
    })
  }

  const newDeliverableId = storeResult.ok ? storeResult.value.id : null

  return NextResponse.json({ videoUrl, deliverableId: newDeliverableId, engagementRunId })
}
