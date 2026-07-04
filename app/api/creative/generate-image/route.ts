import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { modelGateway } from '@/shared/model-gateway'
import { trustEngine } from '@/shared/trust'
import { env } from '@/shared/config/env'
import type { DigitalEmployeeId, TrustRule } from '@/shared/types'

// Higgsfield image generation blocks for up to 5 minutes while the adapter polls.
export const maxDuration = 300

const IMAGE_EMPLOYEE_ID = 'creative-video-director' as DigitalEmployeeId
const IMAGE_ACTION = 'generate_image'

export async function POST(request: Request) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let prompt: string
  try {
    const body = (await request.json()) as { prompt?: unknown }
    if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }
    prompt = body.prompt.trim()
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
    objective: `Image generation: ${prompt.slice(0, 100)}`,
    context: { type: 'higgsfield-image-generation' },
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
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'completed',
    updatedAt: new Date(),
  })

  return NextResponse.json({ imageUrl, engagementRunId })
}
