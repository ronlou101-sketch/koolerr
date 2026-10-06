import type {
  DeliverableId,
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
import type { PublishingPackage, PublishingSchedule } from '@/domains/ai-workforce/publishing/types'
import { resolveAllowedPlatforms } from '@/domains/ai-workforce/publishing/platform-resolver'
import { approvalDepartment } from '@/domains/ai-workforce/approval'
import type { ApprovalDecision } from '@/domains/ai-workforce/approval'
import { deliveryDepartment } from '@/domains/ai-workforce/delivery'
import type {
  MediaTruth,
  VerifiedImageAsset,
  VerifiedVideoAsset,
} from '@/domains/ai-workforce/delivery/types'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { renderJobsService } from '@/domains/ai-workforce/render-jobs'
import { logger } from '@/shared/lib/logger'
import { PlatformErrorCode } from '@/shared/types/errors'
import { addDaysToDate, formatDateInTimezone, resolveBusinessTimezone } from './business-timezone'

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

/** Upper bound on image render jobs enqueued per campaign (ADR-025 §2 — bounded set). */
const MAX_IMAGE_RENDER_JOBS = 3

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

/** Bounds a failure message for progress records and logs (single line, max 300 chars). */
function sanitizeFailureReason(message: string | undefined): string {
  const oneLine = (message ?? 'unknown error').replace(/\s+/g, ' ').trim()
  return oneLine.length > 300 ? `${oneLine.slice(0, 297)}...` : oneLine
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
 * Returns a human-readable reason when the approval decision cannot be handed to
 * Delivery (zero approved packages resolve to a publishing package), or null when
 * at least one approved package resolves and Delivery may proceed.
 */
function validateDeliveryHandoff(
  decision: { overallDecision?: string; approvedPackages?: readonly string[] },
  publishingJob: { packages?: ReadonlyArray<{ platform: string }> }
): string | null {
  const requested = decision.approvedPackages ?? []
  const available = (publishingJob.packages ?? []).map((p) => p.platform)
  const resolved = available.filter((platform) => requested.includes(platform))
  if (resolved.length > 0) return null

  const outcome = decision.overallDecision ?? 'UNKNOWN'
  const detail =
    `approvedPackages=${JSON.stringify(requested)}; ` +
    `publishing package platforms=${JSON.stringify(available)}`

  if (outcome === 'APPROVED') {
    return (
      `Approval→Delivery handoff error: decision APPROVED but no approved package ` +
      `matches a publishing package (${detail}). Delivery not invoked.`
    )
  }
  return (
    `Approval decision ${outcome} approved no publishing packages (${detail}). ` +
    `Delivery not invoked.`
  )
}

/** Days between the run date (in the business timezone) and the scheduled publish date. */
const SCHEDULE_LEAD_DAYS = 7

/**
 * Builds the publishing schedule from the business timezone. Returns null (no date,
 * no time, no timezone in the report) when the timezone is unknown — never a guess.
 */
export function buildPublishingSchedule(
  profile: Pick<BusinessProfile, 'timezone' | 'location'>,
  now: Date = new Date()
): PublishingSchedule | null {
  const timezone =
    profile.timezone !== undefined ? profile.timezone : resolveBusinessTimezone(profile.location)
  const runDate = formatDateInTimezone(now, timezone ?? null)
  if (!timezone || !runDate) return null
  return { timezone, publishDate: addDaysToDate(runDate, SCHEDULE_LEAD_DAYS) }
}

/**
 * Business claims that may appear in a package only when the Business Brain facts
 * contain the same kind of claim. A package claiming one the facts lack is unusable.
 */
const CLAIM_PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ['free offer', /\bfree\b/i],
  ['guarantee', /\bguarantee/i],
  ['24/7 availability', /\b24\s*\/\s*7\b|\b24-7\b|\b24 hours\b|around the clock/i],
  ['discount', /\bdiscount|\d+\s*%\s*off\b|\bcoupon|\bpromo code/i],
  ['loyalty program', /\bloyalty\b/i],
  ['price', /\$\s?\d/],
  [
    'credential',
    /\b(licensed|certified|insured|bonded|accredited|award-winning)\b|#1\b|\bnumber one\b/i,
  ],
  ['response time', /\bwithin \d+\s*(minutes?|mins?|hours?)\b|\bsame[- ]day\b/i],
]

/** File names, paths, links, and platform account IDs that no app record backs. */
const FABRICATED_REFERENCE =
  /\b[\w-]+\.(mp4|mov|jpg|jpeg|png|gif|zip|pdf)\b|\b(page[_ ]id|ad[_ ]account|channel[_ ]id|place[_ ]id|act_\d+)\b/i
const MEDIA_REFERENCE = /\b(watch|video|videos|reel|reels|clip|footage|thumbnail)\b/i
const SCHEDULE_REFERENCE =
  /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s?(am|pm)\b|\b(EST|EDT|CST|CDT|MST|MDT|PST|PDT)\b|\bChicago\b/i
const PLATFORM_MENTIONS: ReadonlyArray<readonly [string, RegExp]> = [
  ['facebook', /\bfacebook\b/i],
  ['instagram', /\binstagram\b/i],
  ['tiktok', /\btik\s?tok\b/i],
  ['youtube-shorts', /\byoutube\b/i],
  ['linkedin', /\blinkedin\b/i],
  ['google-business-profile', /\bgoogle business\b/i],
  ['unsupported', /\btwitter\b|\bthreads\b|\bpinterest\b|\bsnapchat\b/i],
]

export interface UsableItemContext {
  allowedPlatforms: readonly string[]
  /** Business Brain facts — the only source of business claims. */
  factsText: string
  videoVerified: boolean
  scheduled: boolean
}

/**
 * Returns the reason a package is not a usable content item, or null when it is:
 * an approved package targeted to one allowed platform, with non-empty copy and CTA,
 * no unsupported claims, no fabricated reference, and no unverified asset reference.
 */
export function unusableReason(pkg: PublishingPackage, ctx: UsableItemContext): string | null {
  if (!ctx.allowedPlatforms.includes(pkg.platform)) return `${pkg.platform}: platform not allowed`
  if (!pkg.caption?.trim() || !pkg.callToAction?.trim()) {
    return `${pkg.platform}: missing caption or call to action`
  }
  const text = [pkg.title, pkg.caption, pkg.callToAction, ...(pkg.hashtags ?? [])].join(' ')
  for (const [label, pattern] of CLAIM_PATTERNS) {
    if (pattern.test(text) && !pattern.test(ctx.factsText)) {
      return `${pkg.platform}: unsupported claim (${label})`
    }
  }
  if (FABRICATED_REFERENCE.test(text)) return `${pkg.platform}: fabricated file, path, or ID`
  if (!ctx.videoVerified && MEDIA_REFERENCE.test(text)) {
    return `${pkg.platform}: references unverified media`
  }
  if (!ctx.scheduled && SCHEDULE_REFERENCE.test(text)) {
    return `${pkg.platform}: states a time without a known business timezone`
  }
  for (const [platform, pattern] of PLATFORM_MENTIONS) {
    if (
      platform !== pkg.platform &&
      !ctx.allowedPlatforms.includes(platform) &&
      pattern.test(text)
    ) {
      return `${pkg.platform}: mentions an unsupported platform`
    }
  }
  return null
}

/** Usable approved packages (deduped, in package order) plus reasons for the rest. */
export function selectUsablePackages(
  decision: Pick<ApprovalDecision, 'approvedPackages'>,
  packages: readonly PublishingPackage[],
  ctx: UsableItemContext
): { usable: PublishingPackage[]; reasons: string[] } {
  const usable: PublishingPackage[] = []
  const reasons: string[] = []
  const seen = new Set<string>()
  for (const pkg of packages) {
    if (!decision.approvedPackages.includes(pkg.platform) || seen.has(pkg.platform)) continue
    seen.add(pkg.platform)
    const reason = unusableReason(pkg, ctx)
    if (reason) reasons.push(reason)
    else usable.push(pkg)
  }
  return { usable, reasons }
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Gathers verified media for the run from app records only: a completed render job
 * whose result deliverable resolves with a non-empty asset URL. Pending, queued, and
 * failed jobs are omitted. A failed lookup yields video 'unavailable' — never 'none'.
 */
export async function gatherMediaTruth(ctx: AIWorkforcePipelineContext): Promise<MediaTruth> {
  const unavailable: MediaTruth = { images: [], video: { state: 'unavailable' } }
  let jobs
  try {
    const listed = await renderJobsService.listByRun(ctx.engagementRunId)
    if (!listed.ok) return unavailable
    jobs = listed.value
  } catch {
    return unavailable
  }

  const images: VerifiedImageAsset[] = []
  const videos: VerifiedVideoAsset[] = []
  let videoLookupFailed = false

  for (const job of jobs) {
    if (job.status !== 'completed' || !job.resultDeliverableId) continue
    try {
      const found = await deliverablesService.getDeliverable(
        job.resultDeliverableId,
        ctx.organizationId
      )
      if (!found.ok) {
        if (job.kind === 'video' && found.error.code !== PlatformErrorCode.NOT_FOUND) {
          videoLookupFailed = true
        }
        continue
      }
      const content = found.value.content as Record<string, unknown>
      if (
        job.kind === 'image' &&
        found.value.type === 'image' &&
        nonEmptyString(content.imageUrl)
      ) {
        images.push({ deliverableId: found.value.id, imageUrl: content.imageUrl })
      }
      if (
        job.kind === 'video' &&
        found.value.type === 'video' &&
        nonEmptyString(content.videoUrl)
      ) {
        videos.push({ deliverableId: found.value.id, videoUrl: content.videoUrl })
      }
    } catch {
      if (job.kind === 'video') videoLookupFailed = true
    }
  }

  return {
    images,
    video:
      videos.length > 0
        ? { state: 'verified', videos }
        : videoLookupFailed
          ? { state: 'unavailable' }
          : { state: 'none' },
  }
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
  const allowedPlatforms = resolveAllowedPlatforms(profile.allowedPlatforms)
  const schedule = buildPublishingSchedule(profile)

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

  // ── Spokesperson video script (additive, bounded, non-fatal) ────────────────
  // Emit the canonical script artifact for the campaign — one `video_script`
  // deliverable — so a branded spokesperson video can later be rendered from it
  // (ADR-025 §2/§6). Best-effort: a failure here never fails the campaign, and the
  // script generator already falls back across text providers internally.
  const scriptResult = await videoProductionDepartment.writeScript({
    tenantId,
    organizationId,
    workforceId,
    engagementRunId,
    creativeBrief,
  })
  let videoScriptDeliverableId: DeliverableId | null = null
  let videoScriptText: string | null = null
  if (scriptResult.ok) {
    const scriptStore = await deliverablesService.storeDeliverable({
      tenantId,
      organizationId,
      engagementRunId,
      type: 'video_script',
      title: scriptResult.value.title,
      content: {
        script: scriptResult.value.script,
        platform: scriptResult.value.platform,
        estimatedDurationSec: scriptResult.value.estimatedDurationSec,
        creativeId: null,
      },
      attributedTo: ['video-producer' as DigitalEmployeeId],
    })
    if (scriptStore.ok) {
      videoScriptDeliverableId = scriptStore.value.id
      videoScriptText = scriptResult.value.script
    } else {
      // Make the persistence failure visible instead of continuing silently: add
      // the reason to the existing video step progress record (same terminal
      // status — no new status, run not failed) so the run status API surfaces it.
      const reason = sanitizeFailureReason(scriptStore.error.message)
      logger.warn('AI Workforce pipeline failed to store video script deliverable', {
        runId: engagementRunId,
        reason,
      })
      await recordProgress(
        ctx,
        'video',
        video.ok ? 'completed' : 'skipped',
        `video_script deliverable not persisted: ${reason}; no video render job queued`
      )
    }
  } else {
    logger.info('AI Workforce pipeline skipped video script', {
      runId: engagementRunId,
      reason: scriptResult.error.message,
    })
  }

  // ── Enqueue render jobs (additive, bounded, non-fatal) ──────────────────────
  // Enqueue a BOUNDED set of idempotent render jobs from the campaign's source
  // deliverables so the async render worker (the /api/cron/render-jobs driver)
  // produces real branded media (ADR-025 §2/§5): one spokesperson video job from
  // the video_script deliverable, plus up to MAX_IMAGE_RENDER_JOBS image jobs from
  // the Creative Brief's image prompts. dedupeKeys are deterministic per run so a
  // re-run never duplicates jobs. Best-effort: a failure to enqueue never fails the
  // campaign.
  try {
    if (videoScriptDeliverableId && videoScriptText) {
      const enqueued = await renderJobsService.enqueue({
        organizationId,
        tenantId,
        engagementRunId,
        kind: 'video',
        sourceDeliverableId: videoScriptDeliverableId,
        prompt: videoScriptText,
        dedupeKey: `${engagementRunId}:video:${videoScriptDeliverableId}`,
      })
      if (!enqueued.ok) {
        logger.warn('AI Workforce pipeline failed to enqueue video render job', {
          runId: engagementRunId,
          reason: enqueued.error.message,
        })
      }
    }

    const imagePrompts = creativeBrief.imagePrompts.slice(0, MAX_IMAGE_RENDER_JOBS)
    for (let i = 0; i < imagePrompts.length; i++) {
      const enqueued = await renderJobsService.enqueue({
        organizationId,
        tenantId,
        engagementRunId,
        kind: 'image',
        sourceDeliverableId: null,
        prompt: imagePrompts[i],
        dedupeKey: `${engagementRunId}:image:${i}`,
      })
      if (!enqueued.ok) {
        logger.warn('AI Workforce pipeline failed to enqueue image render job', {
          runId: engagementRunId,
          index: i,
          reason: enqueued.error.message,
        })
      }
    }
  } catch (e) {
    logger.warn('AI Workforce pipeline render-job enqueue failed', {
      runId: engagementRunId,
      error: e instanceof Error ? e.message : String(e),
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
        schedule,
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
  const approvalDecision = approval.value

  // ── Approval → Delivery handoff guard ───────────────────────────────────────
  // Delivery requires at least one approved package that resolves to a real
  // publishing package (it asks the model for one deliverable per resolved
  // package and rejects an empty list). Never invoke it with zero resolved
  // packages: REVISE/REJECT with nothing approved ends the run at approval, and
  // APPROVED with nothing resolvable is a handoff validation failure.
  const handoffError = validateDeliveryHandoff(approvalDecision, publishingJob)
  if (handoffError) {
    await failPipeline(ctx, 'approval', handoffError)
    return
  }

  // ── One-usable-item floor ───────────────────────────────────────────────────
  // A report is stored only when at least one approved package is a usable content
  // item. Zero usable items fails the run visibly — never an empty or padded report.
  const mediaTruth = await gatherMediaTruth(ctx)
  const factsText = [profile.businessName, profile.serviceArea, profile.website, profile.notes]
    .filter(Boolean)
    .join(' ')
  const { usable, reasons } = selectUsablePackages(approvalDecision, publishingJob.packages, {
    allowedPlatforms,
    factsText,
    videoVerified: mediaTruth.video.state === 'verified',
    scheduled: schedule !== null,
  })
  // Approval finished once packages are selected (or none remain). Record it before
  // the floor check so a zero-item failure does not leave the step showing "running".
  await recordProgress(ctx, 'approval', 'completed')
  if (usable.length === 0) {
    await failPipeline(
      ctx,
      'delivery',
      sanitizeFailureReason(
        `No usable content item: ${reasons.join('; ') || 'no approved package'}. No report stored.`
      )
    )
    return
  }
  const deliveryDecision: ApprovalDecision = {
    ...approvalDecision,
    approvedPackages: usable.map((p) => p.platform),
  }

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
        approvalDecision: deliveryDecision,
        mediaTruth,
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
  // The report is saved as Draft. A failed save is a visible run failure (no report
  // exists). After a successful save, submitForReview is called exactly once; if it
  // fails, the report stays Draft and a visible warning is recorded.
  const stored = await deliverablesService.storeDeliverable({
    tenantId,
    organizationId,
    engagementRunId,
    type: 'report',
    title: `AI Content Package — ${profile.businessName}`,
    content: deliveryPackage as unknown as Record<string, unknown>,
    attributedTo: ['delivery-manager' as DigitalEmployeeId],
  })
  if (!stored.ok) {
    await failPipeline(
      ctx,
      'delivery',
      `Report not saved: ${sanitizeFailureReason(stored.error.message)}`
    )
    return
  }

  const submitted = await deliverablesService.submitForReview(
    stored.value.id,
    organizationId,
    tenantId
  )
  if (!submitted.ok) {
    const reason = sanitizeFailureReason(submitted.error.message)
    logger.warn('AI Workforce pipeline could not submit report for review', {
      runId: engagementRunId,
      deliverableId: stored.value.id,
      reason,
    })
    await recordProgress(
      ctx,
      'delivery',
      'completed',
      `Report kept as Draft: submit for review failed: ${reason}`
    )
  }

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
