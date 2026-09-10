import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import {
  videoProductionDepartment,
  isValidVideoDuration,
  MAX_VIDEO_SECONDS,
  DEFAULT_AVATAR_ID,
  DEFAULT_VOICE_ID,
  isValidVideoAvatar,
  isValidVideoVoice,
} from '@/domains/ai-workforce/video-production'
import { consumeSpokespersonVideoUsage } from '@/domains/ai-workforce/render'
import { billingService } from '@/domains/billing'

/**
 * POST /api/video/compose — render a customer-composed spokesperson video (Step 4A).
 *
 * Accepts a reviewed/edited script + a chosen length (30/60/90/120s). Enforces the
 * cost-control DUAL entitlement gate BEFORE any provider spend — remaining video
 * COUNT and remaining video SECONDS must both cover the request (Step 3) — then
 * renders through the existing approved brand avatar/voice path (no avatar/voice/
 * model/resolution options are exposed). Metering is unchanged.
 */
export const maxDuration = 300

const SPOKESPERSON_VIDEO = 'spokesperson_video'
const SPOKESPERSON_VIDEO_SECONDS = 'spokesperson_video_seconds'

export async function POST(request: Request): Promise<Response> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let script: string
  let title: string
  let targetDurationSec: number
  let avatarId: string
  let voiceId: string
  try {
    const body = (await request.json()) as {
      script?: unknown
      title?: unknown
      targetDurationSec?: unknown
      avatarId?: unknown
      voiceId?: unknown
    }
    if (typeof body.script !== 'string' || !body.script.trim()) {
      return NextResponse.json({ error: 'Your video needs a script.' }, { status: 400 })
    }
    if (
      typeof body.targetDurationSec !== 'number' ||
      !isValidVideoDuration(body.targetDurationSec)
    ) {
      return NextResponse.json(
        { error: 'Choose a length of 30, 60, 90, or 120 seconds.' },
        { status: 400 }
      )
    }
    script = body.script.trim()
    targetDurationSec = body.targetDurationSec
    title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim().slice(0, 120)
        : 'My video'
    // Selection defaults to the confirmed low-cost spokesperson (Armando, Avatar III,
    // ~$1/min) + Michael C voice. NOTE (Step 4B): customer-composed videos therefore
    // render with the catalog selection, which OVERRIDES the org's Brand Ambassador —
    // this intentionally differs from the earlier 4A behavior that used the org
    // ambassador (which fell through to the pricier env default).
    avatarId =
      typeof body.avatarId === 'string' && body.avatarId.trim()
        ? body.avatarId.trim()
        : DEFAULT_AVATAR_ID
    voiceId =
      typeof body.voiceId === 'string' && body.voiceId.trim()
        ? body.voiceId.trim()
        : DEFAULT_VOICE_ID
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // STRICT allowlist: only cost-verified catalog avatars/voices are accepted — an
  // unknown avatar is NEVER passed to HeyGen, so the ~$1/min gate cannot be bypassed.
  if (!isValidVideoAvatar(avatarId)) {
    return NextResponse.json({ error: 'That spokesperson is not available.' }, { status: 400 })
  }
  if (!isValidVideoVoice(voiceId)) {
    return NextResponse.json({ error: 'That voice is not available.' }, { status: 400 })
  }

  // Belt-and-braces cap (the UI also enforces this).
  if (targetDurationSec > MAX_VIDEO_SECONDS) {
    return NextResponse.json(
      { error: `Videos can be at most ${MAX_VIDEO_SECONDS} seconds.` },
      { status: 400 }
    )
  }

  // ── DUAL entitlement gate BEFORE provider spend (Step 3) ────────────────────
  // Both remaining COUNT and remaining SECONDS must cover this request. A confirmed
  // over-limit is a non-spending 402; a billing read error does not block (the
  // render path re-checks the count gate before dispatch anyway).
  const countCheck = await billingService.checkEntitlement({
    organizationId: ctx.organizationId,
    feature: SPOKESPERSON_VIDEO,
    quantityRequested: 1,
  })
  if (countCheck.ok && countCheck.value.used + 1 > countCheck.value.limit) {
    return NextResponse.json(
      { error: "You've reached your video limit for this billing period." },
      { status: 402 }
    )
  }
  const secondsCheck = await billingService.checkEntitlement({
    organizationId: ctx.organizationId,
    feature: SPOKESPERSON_VIDEO_SECONDS,
    quantityRequested: targetDurationSec,
  })
  if (secondsCheck.ok && secondsCheck.value.used + targetDurationSec > secondsCheck.value.limit) {
    return NextResponse.json(
      { error: 'This video would exceed your remaining video minutes for this billing period.' },
      { status: 402 }
    )
  }

  // Render via the single authoritative path (creates the run + video deliverable,
  // re-checks the count gate, meters). No scriptDeliverableId — customer-composed.
  const result = await videoProductionDepartment.renderSpokespersonVideo({
    organizationId: ctx.organizationId,
    script,
    avatarId,
    voiceId,
    creativeId: null,
    title,
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

  // Meter AFTER durable persistence (idempotent on the run id) — unchanged behavior.
  if (result.value.deliverableId) {
    await consumeSpokespersonVideoUsage({
      organizationId: ctx.organizationId,
      idempotencyKey: result.value.engagementRunId,
      durationSeconds: result.value.durationSeconds ?? 0,
    })
  }

  return NextResponse.json({
    videoUrl: result.value.assetUrl,
    deliverableId: result.value.deliverableId,
    engagementRunId: result.value.engagementRunId,
  })
}
