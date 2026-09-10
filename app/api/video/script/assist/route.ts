import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import {
  videoProductionDepartment,
  isValidVideoDuration,
} from '@/domains/ai-workforce/video-production'
import { env } from '@/shared/config/env'
import { asEngagementRunId } from '@/shared/types'

/**
 * POST /api/video/script/assist — AI-assisted video script drafting (Step 4A).
 *
 * Turns a customer's plain-language description into a spokesperson script the
 * customer then REVIEWS/EDITS before submitting for production. This only drafts
 * text (via the AI workforce) — it never renders a video and never spends video
 * provider credits.
 */
export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let description: string
  let targetDurationSec: number
  let tone: string | undefined
  let cta: string | undefined
  try {
    const body = (await request.json()) as {
      description?: unknown
      targetDurationSec?: unknown
      tone?: unknown
      cta?: unknown
    }
    if (typeof body.description !== 'string' || !body.description.trim()) {
      return NextResponse.json({ error: 'Please describe the video you want.' }, { status: 400 })
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
    description = body.description.trim()
    targetDurationSec = body.targetDurationSec
    tone = typeof body.tone === 'string' && body.tone.trim() ? body.tone.trim() : undefined
    cta = typeof body.cta === 'string' && body.cta.trim() ? body.cta.trim() : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Attribute the drafting to the org's Content Marketing workforce (a real id);
  // the run id is a lightweight marker — script drafting is not a formal run.
  const workforces = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforces.ok || workforces.value.length === 0) {
    return NextResponse.json(
      { error: 'Finish setting up your workspace first, then create a video.' },
      { status: 400 }
    )
  }
  const workforce = workforces.value.find((w) => w.businessFunction === 'Content Marketing')
  if (!workforce) {
    return NextResponse.json(
      { error: 'Finish setting up your workspace first, then create a video.' },
      { status: 400 }
    )
  }

  const result = await videoProductionDepartment.writeCustomerVideoScript({
    tenantId: env.platform.tenantId(),
    organizationId: ctx.organizationId,
    workforceId: workforce.id,
    engagementRunId: asEngagementRunId(`assist_${crypto.randomUUID()}`),
    description,
    targetDurationSec,
    tone,
    cta,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: "We couldn't draft that script. Please try again." },
      { status: 502 }
    )
  }

  return NextResponse.json({
    title: result.value.title,
    script: result.value.script,
    estimatedDurationSec: result.value.estimatedDurationSec,
  })
}
