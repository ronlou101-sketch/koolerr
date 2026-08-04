import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import { videoProductionDepartment } from '@/domains/ai-workforce/video-production'
import type { DeliverableId } from '@/shared/types'

// HeyGen polls for up to 10 minutes; Vercel Pro function timeout caps at 5 minutes.
export const maxDuration = 300

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

  // Render via the single authoritative render path (ADR-025 §2). The department
  // service owns the workforce/run/trust/gateway/store sequence; this route only
  // resolves the video-specific source and maps the result to HTTP.
  const result = await videoProductionDepartment.renderSpokespersonVideo({
    organizationId: ctx.organizationId,
    script,
    scriptDeliverableId: deliverableId,
    creativeId:
      typeof scriptDeliverable.content.creativeId === 'string'
        ? scriptDeliverable.content.creativeId
        : null,
    title: scriptDeliverable.title,
  })

  if (!result.ok) {
    const status =
      result.error.code === 'WORKFORCE_NOT_FOUND'
        ? 404
        : result.error.code === 'ENTITLEMENT_EXCEEDED'
          ? 402
          : 500
    return NextResponse.json({ error: result.error.message }, { status })
  }

  return NextResponse.json({
    videoUrl: result.value.assetUrl,
    deliverableId: result.value.deliverableId,
    engagementRunId: result.value.engagementRunId,
  })
}
