import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { modelGateway } from '@/shared/model-gateway'
import type { IModelGateway } from '@/shared/model-gateway'
import { trustEngine } from '@/shared/trust'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'
import { ok, err } from '@/shared/types'
import type {
  DeliverableId,
  DeliverableType,
  DigitalEmployeeId,
  EngagementRunId,
  ModelProvider,
  OrganizationId,
  Result,
} from '@/shared/types'

/**
 * Shared render path for the Creative and Video Production departments.
 *
 * This centralizes the render sequence that previously lived — duplicated — inside
 * the two standalone render routes (`app/api/video/heygen/generate`,
 * `app/api/image/higgsfield/generate`). Per ADR-025 §2 there is exactly one render
 * implementation; the routes and the department services call this single path
 * (Charter Principles 2/3 — one system, single source of truth).
 *
 * It is behavior-preserving: it performs the same steps, in the same order, with the
 * same messages, as the routes did — resolve the Content Marketing workforce, trigger
 * an engagement run, register the trust rule, invoke the Model Gateway (provider value
 * only — no provider SDK; ADR-025 §3), update run status, and store the deliverable.
 *
 * Brand-identity injection (ADR-025 §1/§7) is intentionally NOT performed here — that
 * arrives in a later slice (CR-3); this slice only consolidates the existing path.
 */

export type RenderErrorCode = 'WORKFORCE_NOT_FOUND' | 'RUN_TRIGGER_FAILED' | 'RENDER_FAILED'

export interface RenderError {
  code: RenderErrorCode
  message: string
}

export interface RenderJobResult {
  /** Provider-hosted asset URL returned by the render adapter. */
  assetUrl: string
  /** Stored deliverable id, or null when the deliverable store failed (asset still returned). */
  deliverableId: DeliverableId | null
  engagementRunId: EngagementRunId
}

export interface RenderJobRequest {
  organizationId: OrganizationId
  employeeId: DigitalEmployeeId
  /** Registered TrustRule action for this render (evaluated by the Trust Engine). */
  action: string
  /** Stable id for the per-organization TrustRule registered for this action. */
  trustRuleId: string
  provider: ModelProvider
  /** The render prompt (video script or image prompt). */
  prompt: string
  runObjective: string
  runContext: Record<string, unknown>
  deliverableType: DeliverableType
  deliverableTitle: string
  /** Builds the stored deliverable content from the rendered asset URL. */
  buildContent: (assetUrl: string) => Record<string, unknown>
  /** Log prefix for the store-failure warning (preserves the routes' prior log labels). */
  logLabel: string
}

/**
 * Executes a single render job through the Model Gateway and persists the result.
 *
 * @param request  the provider- and deliverable-specific render spec
 * @param gateway  the Model Gateway (injectable for tests; defaults to the singleton)
 */
export async function executeRenderJob(
  request: RenderJobRequest,
  gateway: IModelGateway = modelGateway
): Promise<Result<RenderJobResult, RenderError>> {
  const workforcesResult = await workforceEngineService.listWorkforces(request.organizationId)
  if (!workforcesResult.ok || workforcesResult.value.length === 0) {
    return err({
      code: 'WORKFORCE_NOT_FOUND',
      message: 'No workforce found. Complete the onboarding wizard first.',
    })
  }

  const workforce = workforcesResult.value.find((w) => w.businessFunction === 'Content Marketing')
  if (!workforce) {
    return err({ code: 'WORKFORCE_NOT_FOUND', message: 'Content Marketing workforce not found.' })
  }

  const tenantId = env.platform.tenantId()

  const runResult = await workforceEngineService.triggerEngagementRun({
    tenantId,
    workforceId: workforce.id,
    organizationId: request.organizationId,
    objective: request.runObjective,
    context: request.runContext,
  })
  if (!runResult.ok) {
    return err({ code: 'RUN_TRIGGER_FAILED', message: 'Failed to create engagement run' })
  }
  const engagementRunId = runResult.value.id

  trustEngine.registerRule({
    id: request.trustRuleId,
    organizationId: request.organizationId,
    digitalEmployeeId: request.employeeId,
    action: request.action,
    requiresApproval: false,
    autonomyLevel: 'autonomous',
  })

  let assetUrl: string
  try {
    const response = await gateway.invoke({
      tenantId,
      organizationId: request.organizationId,
      workforceId: workforce.id,
      digitalEmployeeId: request.employeeId,
      engagementRunId,
      action: request.action,
      provider: request.provider,
      prompt: request.prompt,
    })
    assetUrl = response.content
  } catch (error) {
    await workforceEngineService.updateEngagementRunStatus({
      tenantId,
      id: engagementRunId,
      status: 'failed',
      updatedAt: new Date(),
    })
    const message = error instanceof Error ? error.message : 'Render failed'
    return err({ code: 'RENDER_FAILED', message })
  }

  await workforceEngineService.updateEngagementRunStatus({
    tenantId,
    id: engagementRunId,
    status: 'completed',
    updatedAt: new Date(),
  })

  const storeResult = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId: request.organizationId,
    engagementRunId,
    type: request.deliverableType,
    title: request.deliverableTitle,
    content: request.buildContent(assetUrl),
    attributedTo: [request.employeeId],
  })

  if (!storeResult.ok) {
    logger.warn(`[${request.logLabel}] Failed to store Deliverable — returning asset URL anyway`, {
      engagementRunId,
    })
  }

  return ok({
    assetUrl,
    deliverableId: storeResult.ok ? storeResult.value.id : null,
    engagementRunId,
  })
}
