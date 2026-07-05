/**
 * TEMPORARY — One-time pipeline exec endpoint for founder use only.
 * Remove this file immediately after use.
 */
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { identityService } from '@/domains/identity'
import { env } from '@/shared/config/env'
import {
  dogfoodingService,
  findOrCreateInternalMarketingWorkforce,
  ensureMarketingTrustRules,
} from '@/domains/dogfooding'
import { workforceEngineService } from '@/domains/workforce-engine'
import { runDogfoodingPipeline } from '@/infrastructure/dogfooding/pipeline'
import type { TenantId, OrganizationId } from '@/shared/types'

const EXEC_TOKEN = 'koo_exec_6fbf30c3e9dff39ae4c68753'
const FOUNDER_EMAIL = 'ronlou101@gmail.com'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const token = request.headers.get('x-exec-token')
  if (token !== EXEC_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await bootstrapPlatform()

  const tenantId = env.platform.tenantId()

  const userResult = await identityService.getUserByEmail(FOUNDER_EMAIL, tenantId as TenantId)
  if (!userResult.ok) {
    return NextResponse.json(
      { error: `User not found: ${userResult.error.message}` },
      { status: 500 }
    )
  }

  const membershipsResult = await identityService.getMemberships(userResult.value.id)
  if (!membershipsResult.ok || membershipsResult.value.length === 0) {
    return NextResponse.json({ error: 'No organization memberships found' }, { status: 500 })
  }

  const organizationId = membershipsResult.value[0].organizationId as OrganizationId

  let body: {
    title?: string
    description?: string
    goalType?: string
    targetAudience?: string
    budgetCents?: number
  } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    // use defaults
  }

  const createResult = await dogfoodingService.createObjective({
    organizationId,
    title: body.title ?? 'Koolerr Growth — User Acquisition Q3 2026',
    description:
      body.description ??
      'Drive user acquisition for Koolerr, the AI workforce platform for businesses. Target founders, marketing leads, and operations teams at SMBs and scale-ups who want to replace manual marketing work with autonomous AI agents.',
    goalType: (body.goalType as 'user_acquisition') ?? 'user_acquisition',
    targetAudience:
      body.targetAudience ??
      'Founders and marketing leads at SMBs (10–200 employees) spending $2k–$20k/month on marketing. Tech-savvy, growth-minded, frustrated with the cost and inconsistency of human marketing agencies.',
    successMetrics: [
      '500 trial signups in 30 days',
      'CAC under $80',
      'Trial-to-paid conversion above 15%',
      'CPL under $25 on paid social',
    ],
    budgetCents: body.budgetCents ?? 500000,
  })

  if (!createResult.ok) {
    return NextResponse.json({ error: createResult.error.message }, { status: 500 })
  }

  const objective = createResult.value

  const { workforceId } = await findOrCreateInternalMarketingWorkforce({
    tenantId: tenantId as TenantId,
    organizationId,
  })

  ensureMarketingTrustRules(organizationId)

  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId: tenantId as TenantId,
    workforceId,
    organizationId,
    objective: `Dogfooding pipeline: ${objective.title}`,
    context: { domain: 'dogfooding', objectiveId: objective.id },
  })

  if (!runResult.ok) {
    return NextResponse.json({ error: 'Failed to create engagement run' }, { status: 500 })
  }

  const engagementRunId = runResult.value.id

  runDogfoodingPipeline({
    tenantId: tenantId as TenantId,
    organizationId,
    workforceId,
    engagementRunId,
    objective,
  }).catch((err) => {
    console.error('[DOGFOODING_EXEC] Pipeline error:', err)
  })

  return NextResponse.json({
    ok: true,
    objectiveId: objective.id,
    engagementRunId,
    organizationId,
    title: objective.title,
    pollUrl: `/api/tower/dogfooding/objectives/${objective.id}`,
  })
}

// Cleanup check
export async function GET() {
  return NextResponse.json({ status: 'exec endpoint active — remove after use' })
}
