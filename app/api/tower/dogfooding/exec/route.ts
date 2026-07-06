/**
 * TEMPORARY — one-shot pipeline trigger for server-side use only.
 * Remove this file immediately after the pipeline has been run end-to-end.
 */
import { NextResponse } from 'next/server'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { identityService } from '@/domains/identity'
import { createPlatformContext } from '@/shared/context'
import { env } from '@/shared/config/env'
import {
  dogfoodingService,
  findOrCreateInternalMarketingWorkforce,
  ensureMarketingTrustRules,
} from '@/domains/dogfooding'
import { workforceEngineService } from '@/domains/workforce-engine'
import { runDogfoodingPipeline } from '@/infrastructure/dogfooding/pipeline'
import type { OrganizationId } from '@/shared/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST() {
  await bootstrapPlatform()

  const tenantId = env.platform.tenantId()

  const userResult = await identityService.getUserByEmail('ronlou101@gmail.com', tenantId)
  if (!userResult.ok) {
    return NextResponse.json(
      { error: `User not found: ${userResult.error.message}` },
      { status: 500 }
    )
  }
  const user = userResult.value

  const membershipsResult = await identityService.getMemberships(user.id)
  if (!membershipsResult.ok || membershipsResult.value.length === 0) {
    return NextResponse.json({ error: 'No memberships found' }, { status: 500 })
  }
  const membership = membershipsResult.value[0]
  const organizationId = membership.organizationId as OrganizationId

  const ctx = createPlatformContext({
    tenantId,
    organizationId,
    actor: { type: 'user', userId: user.id, sessionId: user.id, role: membership.role },
  })

  const objectiveResult = await dogfoodingService.createObjective({
    organizationId: ctx.organizationId,
    title: 'Grow Koolerr to 100 paying customers',
    description:
      'Launch autonomous marketing campaigns to drive user acquisition and convert free users to paid subscriptions. Focus on ICP: small teams and solo founders building AI-powered products who need a professional AI workforce without the hiring complexity.',
    goalType: 'user_acquisition',
    targetAudience: 'Solo founders and small teams (1-10) building AI products',
    successMetrics: ['100 paying customers', 'CAC < $200', 'MRR $10k'],
    budgetCents: 500000,
  })

  if (!objectiveResult.ok) {
    return NextResponse.json(
      { error: `Failed to create objective: ${objectiveResult.error.message}` },
      { status: 500 }
    )
  }
  const objective = objectiveResult.value

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

  return NextResponse.json({
    objectiveId: objective.id,
    engagementRunId,
    status: 'running',
    message: 'Pipeline started — poll /api/tower/dogfooding/objectives/' + objective.id,
  })
}
