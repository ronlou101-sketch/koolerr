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
import { videoProductionDepartment } from '@/domains/ai-workforce/video-production'
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

type PipelineStep =
  | 'research'
  | 'strategy'
  | 'creative'
  | 'video'
  | 'publishing'
  | 'approval'
  | 'delivery'

async function recordProgress(
  ctx: AIWorkforcePipelineContext,
  step: PipelineStep,
  status: 'running' | 'completed' | 'failed',
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
 * Progress is written to the Business Brain so the dashboard can poll for status.
 * Designed to be called fire-and-forget from the start API route.
 */
export async function runAIWorkforcePipeline(
  ctx: AIWorkforcePipelineContext,
  profile: BusinessProfile
): Promise<void> {
  const { tenantId, organizationId, workforceId, engagementRunId } = ctx

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'running',
    updatedAt: new Date(),
  })

  // ── Step 1: Research ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'research', 'running')
  const researchResult = await researchDepartment.conductResearch({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    profile,
    preferredEmployee: 'brand-researcher',
  })

  if (!researchResult.ok || !researchResult.value.brief) {
    await failPipeline(
      ctx,
      'research',
      researchResult.ok ? 'No research brief generated' : researchResult.error.message
    )
    return
  }
  await recordProgress(ctx, 'research', 'completed')
  const researchBrief = researchResult.value.brief

  // ── Step 2: Strategy ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'strategy', 'running')
  const strategyResult = await strategyDepartment.developStrategy({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    researchBrief,
  })

  if (!strategyResult.ok || !strategyResult.value.strategyBrief) {
    await failPipeline(
      ctx,
      'strategy',
      strategyResult.ok ? 'No strategy brief generated' : strategyResult.error.message
    )
    return
  }
  await recordProgress(ctx, 'strategy', 'completed')
  const strategyBrief = strategyResult.value.strategyBrief

  // ── Step 3: Creative ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'creative', 'running')
  const creativeResult = await creativeDepartment.createBrief({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    strategyBrief,
  })

  if (!creativeResult.ok || !creativeResult.value.creativeBrief) {
    await failPipeline(
      ctx,
      'creative',
      creativeResult.ok ? 'No creative brief generated' : creativeResult.error.message
    )
    return
  }
  await recordProgress(ctx, 'creative', 'completed')
  const creativeBrief = creativeResult.value.creativeBrief

  // ── Step 4: Video Production ────────────────────────────────────────────────
  await recordProgress(ctx, 'video', 'running')
  const videoResult = await videoProductionDepartment.planProduction({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    creativeBrief,
  })

  if (!videoResult.ok || !videoResult.value.videoProductionBrief) {
    await failPipeline(
      ctx,
      'video',
      videoResult.ok ? 'No video plan generated' : videoResult.error.message
    )
    return
  }
  await recordProgress(ctx, 'video', 'completed')
  const videoProductionBrief = videoResult.value.videoProductionBrief

  // ── Step 5: Publishing ──────────────────────────────────────────────────────
  await recordProgress(ctx, 'publishing', 'running')
  const publishingResult = await publishingDepartment.preparePackages({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    videoProductionBrief,
  })

  if (!publishingResult.ok) {
    await failPipeline(ctx, 'publishing', publishingResult.error.message)
    return
  }
  await recordProgress(ctx, 'publishing', 'completed')
  const publishingJob = publishingResult.value

  // ── Step 6: Approval ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'approval', 'running')
  const approvalResult = await approvalDepartment.reviewPackages({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    publishingJob,
  })

  if (!approvalResult.ok || !approvalResult.value.approvalDecision) {
    await failPipeline(
      ctx,
      'approval',
      approvalResult.ok ? 'No approval decision generated' : approvalResult.error.message
    )
    return
  }
  await recordProgress(ctx, 'approval', 'completed')
  const approvalDecision = approvalResult.value.approvalDecision

  // ── Step 7: Delivery ────────────────────────────────────────────────────────
  await recordProgress(ctx, 'delivery', 'running')
  const deliveryResult = await deliveryDepartment.prepareDelivery({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    approvalDecision,
  })

  if (!deliveryResult.ok || !deliveryResult.value.deliveryPackage) {
    await failPipeline(
      ctx,
      'delivery',
      deliveryResult.ok ? 'No delivery package generated' : deliveryResult.error.message
    )
    return
  }
  await recordProgress(ctx, 'delivery', 'completed')
  const deliveryPackage = deliveryResult.value.deliveryPackage

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
