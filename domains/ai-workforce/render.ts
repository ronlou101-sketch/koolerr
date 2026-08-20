import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { brandAmbassadorService } from '@/domains/brand-ambassador'
import type { BrandAmbassadorIdentity } from '@/domains/brand-ambassador'
import { billingService, billableSeconds } from '@/domains/billing'
import { modelGateway } from '@/shared/model-gateway'
import type { BrandIdentity, IModelGateway } from '@/shared/model-gateway'
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
  UsageEventType,
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
 * Steps: resolve the Content Marketing workforce, trigger an engagement run, register
 * the trust rule, resolve the organization's Brand Ambassador and inject its identity,
 * invoke the Model Gateway (provider value + provider-agnostic identity only — no
 * provider SDK; ADR-025 §1/§3), update run status, and store the deliverable.
 *
 * Brand-identity injection (ADR-025 §1/§7, Slice CR-3): every render resolves the
 * organization's ambassador via `resolveBrandAmbassador(orgId)` and maps it to the
 * gateway's provider-agnostic `BrandIdentity`, so all campaign media is branded with
 * the org's single spokesperson. If no ambassador is found — or resolution fails —
 * the render falls back to the platform env default (adapters' env fallback) and logs;
 * identity resolution never breaks a render. No new identity storage is introduced.
 *
 * Entitlement enforcement (ADR-025 §4, Slice CR-4): a render that carries a
 * `meteredFeature` is gated on that billing entitlement BEFORE dispatch — an
 * over-limit request is rejected with `ENTITLEMENT_EXCEEDED` and never invokes the
 * gateway (non-spending). On success the CALLER consumes usage idempotently after
 * durable persistence + job completion (Step 2D — `consumeSpokespersonVideoUsage`);
 * `executeRenderJob` no longer meters inline. Only spokesperson video renders are
 * gated; image renders carry no `meteredFeature` and are not gated (ADR-025 §4).
 */

export type RenderErrorCode =
  | 'WORKFORCE_NOT_FOUND'
  | 'RUN_TRIGGER_FAILED'
  | 'RENDER_FAILED'
  | 'ENTITLEMENT_EXCEEDED'

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
  /**
   * Actual rendered video duration in seconds, when the provider reports it
   * (HeyGen). Undefined for image renders. The caller consumes video-second
   * usage from this AFTER durable persistence + job completion (Step 2D).
   */
  durationSeconds?: number
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
  /**
   * When set, this render is gated on the given billing entitlement before dispatch
   * and metered as one usage event of the same type on success (ADR-025 §4). Only
   * spokesperson video renders set this; image renders leave it undefined.
   */
  meteredFeature?: UsageEventType
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

  // Entitlement gate (ADR-025 §4): reject a confirmed over-limit render BEFORE any
  // engagement run is created or the gateway is invoked — a non-spending rejection.
  if (request.meteredFeature) {
    const check = await billingService.checkEntitlement({
      organizationId: request.organizationId,
      feature: request.meteredFeature,
      quantityRequested: 1,
    })
    if (check.ok && check.value.used + 1 > check.value.limit) {
      return err({
        code: 'ENTITLEMENT_EXCEEDED',
        message: "You've reached your spokesperson video limit for this billing period.",
      })
    }
    if (!check.ok) {
      // Can't confirm over-limit — do not block a legitimate render on a billing read error.
      logger.warn('[RENDER] Entitlement check failed — proceeding without gate', {
        organizationId: request.organizationId,
        feature: request.meteredFeature,
        error: check.error.message,
      })
    }
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

  // Brand the render with the org's single spokesperson (ADR-025 §1/§7). Falls back
  // to the platform env default (adapters' env fallback) when unavailable.
  const brandIdentity = await resolveBrandIdentity(request.organizationId)

  let assetUrl: string
  let durationSeconds: number | undefined
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
      brandIdentity,
    })
    assetUrl = response.content
    // Provider-reported rendered duration (HeyGen video). Billing source of truth.
    durationSeconds = response.durationSeconds
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

  // Usage is NOT consumed here. Per Step 2D the caller consumes video count +
  // seconds idempotently (keyed on render_job.id) AFTER the deliverable is durably
  // stored and the job marked completed — so a store failure/retry cannot
  // double-charge. Pre-dispatch entitlement gating (above) is unchanged.
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
    durationSeconds,
  })
}

/**
 * Idempotently consume a spokesperson video's usage AFTER it has durably rendered
 * and its render_job is completed (Step 2D). Records two meters, each keyed on a
 * deterministic id derived from `idempotencyKey` (the render_job.id): the video
 * COUNT (`spokesperson_video` +1) and the actual duration in whole seconds
 * (`spokesperson_video_seconds` += ceil(duration)). A retry of the same job
 * re-uses the same keys, so consumption happens at most once. Never throws —
 * a metering failure is logged; the render itself already succeeded.
 */
export async function consumeSpokespersonVideoUsage(params: {
  organizationId: OrganizationId
  /** Stable key for idempotency — the render_job.id (or run id for the sync path). */
  idempotencyKey: string
  durationSeconds: number
}): Promise<void> {
  // Metering is a side effect — a failure here must NEVER invalidate or un-complete
  // a render that already succeeded and persisted. Swallow all errors (logged).
  try {
    const tenantId = env.platform.tenantId()
    const seconds = billableSeconds(params.durationSeconds)

    const countResult = await billingService.recordUsageEvent({
      id: `svc:${params.idempotencyKey}`,
      tenantId,
      organizationId: params.organizationId,
      type: 'spokesperson_video',
      quantity: 1,
    })
    if (!countResult.ok) {
      logger.warn('[RENDER] Failed to record spokesperson_video usage — render succeeded', {
        idempotencyKey: params.idempotencyKey,
        error: countResult.error.message,
      })
    }

    // usage_events.quantity has a CHECK (> 0); skip a zero-second edge case.
    if (seconds > 0) {
      const secondsResult = await billingService.recordUsageEvent({
        id: `svs:${params.idempotencyKey}`,
        tenantId,
        organizationId: params.organizationId,
        type: 'spokesperson_video_seconds',
        quantity: seconds,
      })
      if (!secondsResult.ok) {
        logger.warn('[RENDER] Failed to record spokesperson_video_seconds usage', {
          idempotencyKey: params.idempotencyKey,
          error: secondsResult.error.message,
        })
      }
    }
  } catch (e) {
    logger.warn('[RENDER] Video usage consumption threw — render already succeeded', {
      idempotencyKey: params.idempotencyKey,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

/**
 * Resolves the organization's Brand Ambassador and maps it to the gateway's
 * provider-agnostic BrandIdentity (ADR-025 §1/§7). Returns undefined — so adapters
 * fall back to their env defaults — when no ambassador is assigned, resolution
 * fails, or resolution throws. Identity resolution must never break a render.
 */
async function resolveBrandIdentity(
  organizationId: OrganizationId
): Promise<BrandIdentity | undefined> {
  try {
    const result = await brandAmbassadorService.resolveBrandAmbassador(organizationId)
    if (!result.ok) {
      logger.warn(
        '[RENDER] Brand Ambassador resolve failed — falling back to platform default identity',
        { organizationId, error: result.error.message }
      )
      return undefined
    }
    if (!result.value) {
      logger.info('[RENDER] No Brand Ambassador assigned — using platform default identity', {
        organizationId,
      })
      return undefined
    }
    return toBrandIdentity(result.value)
  } catch (error) {
    logger.warn(
      '[RENDER] Brand Ambassador resolve threw — falling back to platform default identity',
      { organizationId, error: error instanceof Error ? error.message : String(error) }
    )
    return undefined
  }
}

/**
 * Maps the provider-agnostic Brand Ambassador identity to the gateway BrandIdentity.
 * Only fields the gateway contract carries (ADR-025 §1) are mapped; the Higgsfield
 * character reference (`providerRefs.higgsfield.characterId`) is not part of that
 * contract and is not mapped here.
 */
function toBrandIdentity(identity: BrandAmbassadorIdentity): BrandIdentity {
  const referenceImageUrls = identity.appearance.referenceImageUrls
  return {
    avatarId: identity.providerRefs.heygen?.avatarId,
    voiceId: identity.providerRefs.heygen?.voiceId,
    referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
    seed: identity.seed,
  }
}
