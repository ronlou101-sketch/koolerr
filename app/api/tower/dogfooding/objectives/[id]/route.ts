import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import {
  dogfoodingService,
  findOrCreateInternalMarketingWorkforce,
  ensureMarketingTrustRules,
} from '@/domains/dogfooding'
import { workforceEngineService } from '@/domains/workforce-engine'
import { env } from '@/shared/config/env'
import { runDogfoodingPipeline } from '@/infrastructure/dogfooding/pipeline'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  const objectiveResult = await dogfoodingService.getObjective(id, ctx.organizationId)
  if (!objectiveResult.ok) {
    return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
  }

  const [campaignsResult, planResult] = await Promise.all([
    dogfoodingService.listCampaignsByObjective(id, ctx.organizationId),
    dogfoodingService.getMarketingPlan(id, ctx.organizationId),
  ])

  return NextResponse.json({
    objective: objectiveResult.value,
    campaigns: campaignsResult.ok ? campaignsResult.value : [],
    marketingPlan: planResult.ok ? planResult.value : null,
  })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await bootstrapPlatform()

  let body: { action?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body.action !== 'run_pipeline') {
    return NextResponse.json({ error: 'action must be "run_pipeline"' }, { status: 400 })
  }

  const objectiveResult = await dogfoodingService.getObjective(id, ctx.organizationId)
  if (!objectiveResult.ok) {
    return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
  }

  const objective = objectiveResult.value
  if (objective.status === 'active') {
    return NextResponse.json({ error: 'Pipeline already ran for this objective' }, { status: 409 })
  }

  const tenantId = env.platform.tenantId()

  const { workforceId } = await findOrCreateInternalMarketingWorkforce({
    tenantId,
    organizationId: ctx.organizationId,
  })

  ensureMarketingTrustRules(ctx.organizationId)

  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId,
    organizationId: ctx.organizationId,
    objective: `Dogfooding pipeline: ${objective.title}`,
    context: { domain: 'dogfooding', objectiveId: objective.id },
  })

  if (!runResult.ok) {
    return NextResponse.json({ error: 'Failed to create engagement run' }, { status: 500 })
  }

  const engagementRunId = runResult.value.id

  runDogfoodingPipeline({
    tenantId,
    organizationId: ctx.organizationId,
    workforceId,
    engagementRunId,
    objective,
  }).catch((err) => {
    console.error('[DOGFOODING] Pipeline error (fire-and-forget):', err)
  })

  return NextResponse.json({ engagementRunId, status: 'running' })
}
