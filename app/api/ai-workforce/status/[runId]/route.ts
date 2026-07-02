import { NextRequest, NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import type { EngagementRunId } from '@/shared/types'

const PIPELINE_STEPS = [
  'research',
  'strategy',
  'creative',
  'video',
  'publishing',
  'approval',
  'delivery',
] as const

type PipelineStep = (typeof PIPELINE_STEPS)[number]
type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

/**
 * GET /api/ai-workforce/status/:runId
 *
 * Returns the current pipeline progress for a given engagement run.
 * Progress is read from Brain memories written by the pipeline executor.
 * Safe to poll every 3-5 seconds from the client dashboard.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { runId } = await params

  if (!/^run_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(runId)) {
    return NextResponse.json({ error: 'Invalid run ID' }, { status: 400 })
  }

  const engagementRunId = runId as EngagementRunId

  const runResult = await workforceEngineService.getEngagementRun(
    engagementRunId,
    ctx.organizationId
  )
  if (!runResult.ok) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }
  const run = runResult.value

  const memoriesResult = await businessBrainService.queryMemory({
    organizationId: ctx.organizationId,
    relevanceScope: [runId],
  })
  const allMemories = memoriesResult.ok ? memoriesResult.value.memories : []

  const progressMemories = allMemories.filter((m) => m.source === 'ai-workforce-pipeline')

  const stepStatus: Partial<
    Record<PipelineStep, { status: StepStatus; timestamp?: string; error?: string | null }>
  > = {}

  for (const memory of progressMemories) {
    const c = memory.content as {
      step?: string
      status?: string
      timestamp?: string
      error?: string
    }
    const step = c.step as PipelineStep | undefined
    if (!step || !PIPELINE_STEPS.includes(step)) continue
    const incoming = {
      status: (c.status ?? 'pending') as StepStatus,
      timestamp: c.timestamp,
      error: c.error ?? null,
    }
    const existing = stepStatus[step]
    if (
      !existing ||
      (incoming.timestamp && (!existing.timestamp || incoming.timestamp > existing.timestamp))
    ) {
      stepStatus[step] = incoming
    }
  }

  const steps = PIPELINE_STEPS.map((step) => ({
    step,
    status: stepStatus[step]?.status ?? ('pending' as StepStatus),
    error: stepStatus[step]?.error ?? null,
  }))

  const completedCount = steps.filter((s) => s.status === 'completed').length
  const currentStep = steps.find((s) => s.status === 'running')?.step ?? null
  const failedStep = steps.find((s) => s.status === 'failed')?.step ?? null

  return NextResponse.json({
    runId,
    runStatus: run.status,
    steps,
    completedCount,
    totalSteps: PIPELINE_STEPS.length,
    currentStep,
    failedStep,
    isComplete: run.status === 'completed',
    isFailed: run.status === 'failed' || failedStep !== null,
  })
}
