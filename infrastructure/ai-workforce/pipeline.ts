import type {
  DigitalEmployeeId,
  EngagementRunId,
  OrganizationId,
  TenantId,
  WorkforceId,
} from '@/shared/types'
import type { BusinessProfile } from '@/domains/ai-workforce/research'
import { researchDepartment } from '@/domains/ai-workforce/research'
import { strategyDepartment } from '@/domains/ai-workforce/strategy'
import { creativeDepartment } from '@/domains/ai-workforce/creative'
import {
  videoProductionDepartment,
  buildSkippedVideoProductionBrief,
} from '@/domains/ai-workforce/video-production'
import type { VideoProductionBrief } from '@/domains/ai-workforce/video-production'
import { publishingDepartment } from '@/domains/ai-workforce/publishing'
import { approvalDepartment } from '@/domains/ai-workforce/approval'
import { deliveryDepartment } from '@/domains/ai-workforce/delivery'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { logger } from '@/shared/lib/logger'

export interface AIWorkforcePipelineContext {
  tenantId: TenantId
  organizationId: OrganizationId
  workforceId: WorkforceId
  engagementRunId: EngagementRunId
}

/** Options for tuning pipeline execution. Backoff is exposed so tests run fast. */
export interface RunPipelineOptions {
  /** Delay between department retry attempts, in ms. Defaults to 2000. Pass 0 in tests. */
  retryBackoffMs?: number
}

type PipelineStep =
  | 'research'
  | 'strategy'
  | 'creative'
  | 'video'
  | 'publishing'
  | 'approval'
  | 'delivery'

/** A normalized department result: either a produced value or a human-readable failure. */
type StepOutcome<T> = { ok: true; value: T } | { ok: false; message: string }

/** 1 initial attempt + 2 retries. Transient provider errors usually clear by attempt 2. */
const MAX_DEPARTMENT_ATTEMPTS = 3
const DEFAULT_RETRY_BACKOFF_MS = 2000

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Runs a single pipeline step with bounded retry and fixed backoff.
 *
 * Each department call is wrapped so that a transient failure (provider rate limit,
 * timeout, a malformed response that parses on a second attempt) does not abort the
 * whole engagement run on the first stumble. The step is retried up to
 * MAX_DEPARTMENT_ATTEMPTS times; the final outcome — success or the last failure
 * message — is returned to the caller, which decides whether to fail or skip.
 */
async function attemptStep<T>(
  step: PipelineStep,
  runId: EngagementRunId,
  attempt: () => Promise<StepOutcome<T>>,
  backoffMs: number
): Promise<StepOutcome<T>> {
  let outcome: StepOutcome<T> = { ok: false, message: 'Step not attempted' }

  for (let i = 1; i <= MAX_DEPARTMENT_ATTEMPTS; i++) {
    outcome = await attempt()
    if (outcome.ok) return outcome

    if (i < MAX_DEPARTMENT_ATTEMPTS) {
      logger.warn('AI Workforce pipeline retrying step', {
        runId,
        step,
        attempt: i,
        message: outcome.message,
      })
      await delay(backoffMs)
    }
  }

  return outcome
}

async function recordProgress(
  ctx: AIWorkforcePipelineContext,
  step: PipelineStep,
  status: 'running' | 'completed' | 'failed' | 'skipped',
  error?: string
): Promise<void> {
  await businessBrainService.storeMemory({
    tenantId: ctx.tenantId,
    organizationId: ctx.organizationId,
    memory: {
      organizationId: ctx.organizationId,
      type: 'knowledge',
      content: {
        step,
        status,
        ...(error ? { error } : {}),
        // Explicit failure fields so the run detail UI can surface which
        // department failed and why without re-deriving from generic fields.
        ...(status === 'failed'
          ? { failedAtDepartment: step, failureReason: error ?? 'Unknown error' }
          : {}),
        timestamp: new Date().toISOString(),
      },
      source: 'ai-workforce-pipeline',
      relevanceScope: [ctx.engagementRunId],
    },
  })
}

async function failPipeline(
  ctx: AIWorkforcePipelineContext,
  step: PipelineStep,
  message: string
): Promise<void> {
  await recordProgress(ctx, step, 'failed', message)
  await workforceEngineService.updateEngagementRunStatus({
    tenantId: ctx.tenantId,
    id: ctx.engagementRunId,
    status: 'failed',
    updatedAt: new Date(),
  })
  logger.warn('AI Workforce pipeline failed', { step, message, runId: ctx.engagementRunId })
}

/**
 * Sequences all 7 AI Workforce departments for a single engagement run.
 *
 * Each department step is executed with bounded retry (see attemptStep) so a single
 * transient provider failure does not discard completed work. The Video step is
 * additionally non-fatal: after exhausting retries it is skipped rather than failing
 * the run. On a permanent failure of any fatal step, the run is marked failed and the
 * failing department + reason are persisted to the Business Brain for the run detail UI.
 *
 * Progress is written to the Business Brain so the dashboard can poll for status.
 * Designed to be called fire-and-forget from the start API route.
 */
export async function runAIWorkforcePipeline(
  ctx: AIWorkforcePipelineContext,
  profile: BusinessProfile,
  options: RunPipelineOptions = {}
): Promise<void> {
  const { tenantId, organizationId, workforceId, engagementRunId } = ctx
  const backoffMs = options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'running',
    updatedAt: new Date(),
  })

  // ── Step 1: Research ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'research', 'running')
  const research = await attemptStep(
    'research',
    engagementRunId,
    async () => {
      const r = await researchDepartment.conductResearch({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        profile,
        preferredEmployee: 'brand-researcher',
      })
      if (r.ok && r.value.brief) return { ok: true as const, value: r.value.brief }
      return { ok: false as const, message: r.ok ? 'No research brief generated' : r.error.message }
    },
    backoffMs
  )

  if (!research.ok) {
    await failPipeline(ctx, 'research', research.message)
    return
  }
  await recordProgress(ctx, 'research', 'completed')
  const researchBrief = research.value

  // ── Step 2: Strategy ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'strategy', 'running')
  const strategy = await attemptStep(
    'strategy',
    engagementRunId,
    async () => {
      const r = await strategyDepartment.developStrategy({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        researchBrief,
      })
      if (r.ok && r.value.strategyBrief) return { ok: true as const, value: r.value.strategyBrief }
      return { ok: false as const, message: r.ok ? 'No strategy brief generated' : r.error.message }
    },
    backoffMs
  )

  if (!strategy.ok) {
    await failPipeline(ctx, 'strategy', strategy.message)
    return
  }
  await recordProgress(ctx, 'strategy', 'completed')
  const strategyBrief = strategy.value

  // ── Step 3: Creative ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'creative', 'running')
  const creative = await attemptStep(
    'creative',
    engagementRunId,
    async () => {
      const r = await creativeDepartment.createBrief({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        strategyBrief,
      })
      if (r.ok && r.value.creativeBrief) return { ok: true as const, value: r.value.creativeBrief }
      return { ok: false as const, message: r.ok ? 'No creative brief generated' : r.error.message }
    },
    backoffMs
  )

  if (!creative.ok) {
    await failPipeline(ctx, 'creative', creative.message)
    return
  }
  await recordProgress(ctx, 'creative', 'completed')
  const creativeBrief = creative.value

  // ── Step 4: Video Production ────────────────────────────────────────────────
  // Video is non-fatal. After exhausting retries, the run continues with a skipped
  // brief rather than discarding the completed research, strategy, and creative work.
  // Publishing receives a brief that clearly signals no video assets were produced.
  await recordProgress(ctx, 'video', 'running')
  const video = await attemptStep(
    'video',
    engagementRunId,
    async () => {
      const r = await videoProductionDepartment.planProduction({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        creativeBrief,
      })
      if (r.ok && r.value.videoProductionBrief) {
        return { ok: true as const, value: r.value.videoProductionBrief }
      }
      return { ok: false as const, message: r.ok ? 'No video plan generated' : r.error.message }
    },
    backoffMs
  )

  let videoProductionBrief: VideoProductionBrief
  if (video.ok) {
    videoProductionBrief = video.value
    await recordProgress(ctx, 'video', 'completed')
  } else {
    videoProductionBrief = buildSkippedVideoProductionBrief(creativeBrief)
    await recordProgress(ctx, 'video', 'skipped', video.message)
    logger.info('AI Workforce pipeline skipped video step', {
      runId: engagementRunId,
      reason: video.message,
    })
  }

  // ── Step 5: Publishing ──────────────────────────────────────────────────────
  await recordProgress(ctx, 'publishing', 'running')
  const publishing = await attemptStep(
    'publishing',
    engagementRunId,
    async () => {
      const r = await publishingDepartment.preparePackages({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        videoProductionBrief,
      })
      if (r.ok) return { ok: true as const, value: r.value }
      return { ok: false as const, message: r.error.message }
    },
    backoffMs
  )

  if (!publishing.ok) {
    await failPipeline(ctx, 'publishing', publishing.message)
    return
  }
  await recordProgress(ctx, 'publishing', 'completed')
  const publishingJob = publishing.value

  // ── Step 6: Approval ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'approval', 'running')
  const approval = await attemptStep(
    'approval',
    engagementRunId,
    async () => {
      const r = await approvalDepartment.reviewPackages({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        publishingJob,
      })
      if (r.ok && r.value.approvalDecision) {
        return { ok: true as const, value: r.value.approvalDecision }
      }
      return {
        ok: false as const,
        message: r.ok ? 'No approval decision generated' : r.error.message,
      }
    },
    backoffMs
  )

  if (!approval.ok) {
    await failPipeline(ctx, 'approval', approval.message)
    return
  }
  await recordProgress(ctx, 'approval', 'completed')
  const approvalDecision = approval.value

  // ── Step 7: Delivery ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'delivery', 'running')
  const delivery = await attemptStep(
    'delivery',
    engagementRunId,
    async () => {
      const r = await deliveryDepartment.prepareDelivery({
        tenantId,
        organizationId,
        workforceId,
        engagementRunId,
        approvalDecision,
      })
      if (r.ok && r.value.deliveryPackage) {
        return { ok: true as const, value: r.value.deliveryPackage }
      }
      return {
        ok: false as const,
        message: r.ok ? 'No delivery package generated' : r.error.message,
      }
    },
    backoffMs
  )

  if (!delivery.ok) {
    await failPipeline(ctx, 'delivery', delivery.message)
    return
  }
  await recordProgress(ctx, 'delivery', 'completed')
  const deliveryPackage = delivery.value

  // ── Store Deliverable ───────────────────────────────────────────────────────
  await deliverablesService.storeDeliverable({
    tenantId,
    organizationId,
    engagementRunId,
    type: 'report',
    title: `AI Content Package — ${profile.businessName}`,
    content: deliveryPackage as unknown as Record<string, unknown>,
    attributedTo: ['delivery-manager' as DigitalEmployeeId],
  })

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'completed',
    updatedAt: new Date(),
  })

  logger.info('AI Workforce pipeline completed', {
    runId: engagementRunId,
    business: profile.businessName,
  })
}
