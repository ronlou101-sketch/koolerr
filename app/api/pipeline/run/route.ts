import { after, NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { buildBusinessProfileFromMemories } from '@/infrastructure/ai-workforce/build-profile'
import { runAIWorkforcePipeline } from '@/infrastructure/ai-workforce/pipeline'
import { env } from '@/shared/config/env'

// Match the 7-department pipeline's expected execution window.
export const maxDuration = 300

/**
 * POST /api/pipeline/run
 *
 * Launches the full 7-department AI Workforce pipeline for a user-defined topic.
 * Returns 202 immediately with the engagementRunId.
 * Pipeline runs asynchronously via after(); poll /api/ai-workforce/status/:runId for progress.
 *
 * Body: { topic: string, brief?: string }
 * Response: { engagementRunId: string }
 */
export async function POST(request: NextRequest) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { topic?: string; brief?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const topic = body.topic?.trim()
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 })

  const brief = body.brief?.trim() || undefined

  const baseProfile = await buildBusinessProfileFromMemories(ctx.organizationId)
  if (!baseProfile?.businessName) {
    return NextResponse.json(
      { error: 'Business profile not found. Complete the onboarding wizard first.' },
      { status: 400 }
    )
  }

  // Inject the campaign topic (and optional brief) into the profile notes so the
  // Research Department uses them as the campaign focus when building prompts.
  const campaignNote = brief
    ? `Campaign focus: ${topic}. Brief: ${brief}`
    : `Campaign focus: ${topic}`
  const profile = {
    ...baseProfile,
    notes: [baseProfile.notes, campaignNote].filter(Boolean).join('. '),
  }

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  if (!workforcesResult.ok) {
    return NextResponse.json({ error: 'Failed to retrieve workforces' }, { status: 500 })
  }

  const workforce = workforcesResult.value.find((w) => w.businessFunction === 'Content Marketing')
  if (!workforce) {
    return NextResponse.json(
      { error: 'No Content Marketing workforce found for this organization' },
      { status: 404 }
    )
  }

  const runsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  if (runsResult.ok) {
    const hasActiveRun = runsResult.value.some(
      (r) => r.workforceId === workforce.id && (r.status === 'pending' || r.status === 'running')
    )
    if (hasActiveRun) {
      return NextResponse.json(
        { error: 'A pipeline run is already in progress. Wait for it to complete.' },
        { status: 429 }
      )
    }
  }

  const tenantId = env.platform.tenantId()
  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId: workforce.id,
    organizationId: ctx.organizationId,
    objective: topic,
    context: { type: 'pipeline-run', topic, ...(brief ? { brief } : {}) },
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
