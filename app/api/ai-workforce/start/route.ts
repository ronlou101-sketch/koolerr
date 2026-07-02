import { after, NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { buildBusinessProfileFromMemories } from '@/infrastructure/ai-workforce/build-profile'
import { runAIWorkforcePipeline } from '@/infrastructure/ai-workforce/pipeline'
import { env } from '@/shared/config/env'
import type { TenantId } from '@/shared/types'

// Extend execution window so Vercel keeps the function alive for the full pipeline.
// after() registers the pipeline with the execution context before the response is sent,
// preventing the function from being torn down before the background work completes.
export const maxDuration = 300

/**
 * POST /api/ai-workforce/start
 *
 * Triggers the 7-department AI Workforce pipeline for the authenticated organization.
 * Requires a business profile stored in the Brain (via the AI Workforce onboarding wizard).
 *
 * Returns 202 immediately with the engagementRunId.
 * The pipeline runs asynchronously; poll /api/ai-workforce/status/:runId for progress.
 */
export async function POST() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await buildBusinessProfileFromMemories(ctx.organizationId)
  if (!profile || !profile.businessName) {
    return NextResponse.json(
      { error: 'Business profile not found. Complete the onboarding wizard first.' },
      { status: 400 }
    )
  }

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok) {
    return NextResponse.json({ error: 'Failed to retrieve workforces' }, { status: 500 })
  }

  const workforce = workforcesResult.value.find((w) => w.businessFunction === 'Content Marketing')
  if (!workforce) {
    return NextResponse.json({ error: 'No workforce found for this organization' }, { status: 404 })
  }

  const runsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  if (runsResult.ok) {
    const hasActiveRun = runsResult.value.some(
      (r) => r.workforceId === workforce.id && (r.status === 'pending' || r.status === 'running')
    )
    if (hasActiveRun) {
      return NextResponse.json(
        {
          error:
            'A pipeline run is already in progress. Wait for it to complete before starting a new one.',
        },
        { status: 429 }
      )
    }
  }

  const tenantId = env.platform.tenantId() as TenantId
  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId: workforce.id,
    organizationId: ctx.organizationId,
    objective: `AI Workforce: Full content production for ${profile.businessName}`,
    context: { type: 'ai-workforce-pipeline', businessName: profile.businessName },
  })

  if (!runResult.ok) {
    return NextResponse.json({ error: 'Failed to create engagement run' }, { status: 500 })
  }

  const engagementRunId = runResult.value.id

  after(() =>
    runAIWorkforcePipeline(
      { tenantId, organizationId: ctx.organizationId, workforceId: workforce.id, engagementRunId },
      profile
    )
  )

  return NextResponse.json({ engagementRunId }, { status: 202 })
}
