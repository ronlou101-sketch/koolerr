import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { modelGateway } from '@/shared/model-gateway'
import { trustEngine } from '@/shared/trust'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'
import type { DigitalEmployeeId, TrustRule } from '@/shared/types'

// Higgsfield polls until the image is ready; Vercel Pro function timeout caps at 5 minutes.
export const maxDuration = 300

const IMAGE_EMPLOYEE_ID = 'creative-video-director' as DigitalEmployeeId
const IMAGE_ACTION = 'generate_image'

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let prompt: string
  let creativeId: string | null = null
  try {
    const body = (await request.json()) as { prompt?: unknown; creativeId?: unknown }
    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    prompt = body.prompt.trim()
    creativeId = typeof body.creativeId === 'string' ? body.creativeId : null
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
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
    objective: `Higgsfield image generation: ${prompt.slice(0, 100)}`,
    context: { type: 'higgsfield-image-generation', creativeId },
  })

  if (!runResult.ok) {
    return NextResponse.json({ error: 'Failed to create engagement run' }, { status: 500 })
  }

  const engagementRunId = runResult.value.id

  const trustRule: TrustRule = {
    id: `higgsfield-image-${ctx.organizationId}`,
    organizationId: ctx.organizationId,
    digitalEmployeeId: IMAGE_EMPLOYEE_ID,
    action: IMAGE_ACTION,
    requiresApproval: false,
    autonomyLevel: 'autonomous',
  }
  trustEngine.registerRule(trustRule)

  let imageUrl: string
  try {
    const response = await modelGateway.invoke({
      tenantId,
      organizationId: ctx.organizationId,
      workforceId: workforce.id,
      digitalEmployeeId: IMAGE_EMPLOYEE_ID,
      engagementRunId,
      action: IMAGE_ACTION,
      provider: 'higgsfield',
      prompt,
    })
    imageUrl = response.content
  } catch (err) {
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRunId,
      status: 'failed',
      updatedAt: new Date(),
    })
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'completed',
    updatedAt: new Date(),
  })

  const title = prompt.length > 80 ? `${prompt.slice(0, 77)}...` : prompt

  const storeResult = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId: ctx.organizationId,
    engagementRunId,
    type: 'image',
    title,
    content: {
      imageUrl,
      creativeId,
    },
    attributedTo: [IMAGE_EMPLOYEE_ID],
  })

  if (!storeResult.ok) {
    logger.warn(
      '[HIGGSFIELD_GENERATE] Failed to store image Deliverable — returning imageUrl anyway',
      {
        engagementRunId,
        creativeId,
      }
    )
  }

  const newDeliverableId = storeResult.ok ? storeResult.value.id : null

  return NextResponse.json({ imageUrl, deliverableId: newDeliverableId, engagementRunId })
}
