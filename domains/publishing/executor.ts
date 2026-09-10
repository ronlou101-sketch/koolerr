import { err, ok, PlatformErrorCode } from '@/shared/types'
import type { OrganizationId, PlatformResult, PublishJobId } from '@/shared/types'
import { logger } from '@/shared/lib/logger'
import { deliverablesService } from '@/domains/deliverables'
import {
  channelsService,
  fetchVideoAsset,
  createYouTubeUploadSession,
  uploadToYouTubeSession,
  probeYouTubeUploadSession,
  YouTubeUploadError,
  type CreateUploadSessionParams,
  type ProbeResult,
  type UploadVideoResult,
  type VideoAsset,
} from '@/domains/channels'
import { publishJobsService } from './service'
import type { PublishJob, PublishResult } from './types'

/**
 * Publish execution (Step 3D-2B). Uploads an approved video deliverable to the
 * connected YouTube channel via the resumable protocol.
 *
 * DUPLICATE-UPLOAD SAFETY (review finding B2) — distinct from true resume:
 *   • The access token is obtained FIRST, because the recovery probe is an
 *     authorized request. Recovery therefore runs before any deliverable lookup
 *     or source-asset fetch.
 *   • Recovery: PROBE any session URL already persisted on the job (with the
 *     persisted content length). YouTube finalizes a video ONLY when a resumable
 *     session completes, so 'complete' → the video exists → recover its id and
 *     DO NOT upload again.
 *   • A 308/'incomplete' session HAS received data and is resumable, but was
 *     never finalized, so YouTube created NO video. This driver deliberately does
 *     NOT resume-from-offset: it ABANDONS the partial session and creates a FRESH
 *     session, re-uploading the whole object from byte 0. Duplicate-safe (an
 *     unfinalized session yields no video), just not bandwidth-optimal.
 *     'gone' (404/410) likewise → fresh upload.
 *   • Fresh upload: create a NEW session, PERSIST (url + content length) BEFORE
 *     sending a byte, then upload the full object.
 *
 * Every YouTube request is authorized. Cross-domain calls are injectable for
 * tests; defaults bind to the live channels/deliverables/publishing singletons.
 */
export interface PublishExecutorDeps {
  getDeliverable: typeof deliverablesService.getDeliverable
  getAccessToken: (org: OrganizationId) => Promise<PlatformResult<string>>
  fetchAsset: (sourceUrl: string) => Promise<VideoAsset>
  createSession: (accessToken: string, params: CreateUploadSessionParams) => Promise<string>
  uploadToSession: (
    sessionUrl: string,
    accessToken: string,
    media: ArrayBuffer,
    contentType: string
  ) => Promise<UploadVideoResult>
  probeSession: (
    sessionUrl: string,
    accessToken: string,
    contentLength: number
  ) => Promise<ProbeResult>
  persistSession: (jobId: PublishJobId, sessionUrl: string, contentLength: number) => Promise<void>
}

const defaultDeps: PublishExecutorDeps = {
  getDeliverable: (id, org) => deliverablesService.getDeliverable(id, org),
  getAccessToken: (org) => channelsService.getValidYouTubeAccessToken(org),
  fetchAsset: fetchVideoAsset,
  createSession: createYouTubeUploadSession,
  uploadToSession: uploadToYouTubeSession,
  probeSession: probeYouTubeUploadSession,
  persistSession: async (jobId, sessionUrl, contentLength) => {
    // Persisting the session is a precondition for uploading — if it fails we must
    // NOT send bytes, so surface it as a thrown error the worker records.
    const saved = await publishJobsService.saveUploadSession(jobId, sessionUrl, contentLength)
    if (!saved.ok) {
      throw new Error(`could not persist upload session: ${saved.error.message}`)
    }
  },
}

/** Map a thrown upload error to a typed, recordable failure. */
function toFailure(e: unknown): PlatformResult<PublishResult> {
  if (e instanceof YouTubeUploadError) {
    return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: `${e.code}: ${e.message}` })
  }
  return err({ code: PlatformErrorCode.INTERNAL_ERROR, message: String(e) })
}

export async function executePublishJob(
  job: PublishJob,
  deps: PublishExecutorDeps = defaultDeps
): Promise<PlatformResult<PublishResult>> {
  // ── 1. Obtain a valid access token ──────────────────────────────────────────
  // Required for the authorized recovery probe AND a fresh upload. Done first so
  // recovery runs before any deliverable lookup or source-asset fetch.
  const tokenResult = await deps.getAccessToken(job.organizationId)
  if (!tokenResult.ok) return tokenResult
  const accessToken = tokenResult.value

  // ── 2. Recover an interrupted-but-finalized upload ──────────────────────────
  // uploadSessionUrl + uploadContentLength are written atomically together, so
  // normally both are present or both null.
  if (job.uploadSessionUrl) {
    // FAIL CLOSED: a persisted session may represent an interrupted upload, but
    // without the content length we cannot issue the authorized probe
    // (Content-Range: bytes */<len>). Starting a fresh upload here could create a
    // DUPLICATE video, so refuse instead. Returned as a retryable INTERNAL_ERROR
    // (the worker's attempt cap eventually makes it terminal) — never a re-upload.
    // Defensive: both fields are co-persisted, so this guards an unexpected state.
    if (job.uploadContentLength == null) {
      return err({
        code: PlatformErrorCode.INTERNAL_ERROR,
        message:
          'publish job has a persisted upload session but no content length — cannot probe safely; refusing to re-upload',
      })
    }

    let probe: ProbeResult
    try {
      probe = await deps.probeSession(job.uploadSessionUrl, accessToken, job.uploadContentLength)
    } catch (e) {
      // Transient probe error → retry the whole job rather than assume "nothing
      // finalized" (which could duplicate).
      return toFailure(e)
    }
    if (probe.status === 'complete') {
      logger.info('[PUBLISH_EXEC] Recovered finalized YouTube upload — no re-upload', {
        organizationId: job.organizationId,
        deliverableId: job.deliverableId,
        externalVideoId: probe.videoId,
      })
      return ok({
        externalVideoId: probe.videoId,
        externalUrl: probe.watchUrl,
        privacyStatus: job.privacyStatus,
      })
    }
    if (probe.status === 'incomplete') {
      // The session received data and is resumable, but this driver does NOT
      // implement resume-from-offset — it abandons the partial (unfinalized, so
      // no video) session and creates a fresh one below. Duplicate-safe, not
      // bandwidth-optimal; receivedBytes is logged for observability only.
      logger.info(
        '[PUBLISH_EXEC] Prior session incomplete — abandoning + restarting fresh (no resume-from-offset)',
        {
          organizationId: job.organizationId,
          receivedBytes: probe.receivedBytes,
        }
      )
    }
    // 'gone' | 'incomplete' → no finalized video exists; fall through to a fresh upload.
  }

  // ── 3. Resolve + re-validate the deliverable ────────────────────────────────
  const deliverableResult = await deps.getDeliverable(job.deliverableId, job.organizationId)
  if (!deliverableResult.ok) {
    return err({ code: PlatformErrorCode.NOT_FOUND, message: 'Deliverable not found' })
  }
  const deliverable = deliverableResult.value
  if (deliverable.type !== 'video') {
    return err({
      code: PlatformErrorCode.VALIDATION_ERROR,
      message: `Only video deliverables can be published (got '${deliverable.type}')`,
    })
  }
  if (deliverable.status !== 'approved' && deliverable.status !== 'published') {
    return err({
      code: PlatformErrorCode.VALIDATION_ERROR,
      message: `Deliverable is no longer approved (status '${deliverable.status}')`,
    })
  }
  const sourceUrl = deliverable.content.videoUrl
  if (typeof sourceUrl !== 'string' || sourceUrl.length === 0) {
    return err({
      code: PlatformErrorCode.VALIDATION_ERROR,
      message: 'Deliverable has no rendered video URL to publish',
    })
  }

  // ── 4. Fresh upload: fetch asset → create + PERSIST session BEFORE bytes → PUT ─
  try {
    const asset = await deps.fetchAsset(sourceUrl)
    const sessionUrl = await deps.createSession(accessToken, {
      title: deliverable.title,
      privacyStatus: job.privacyStatus,
      contentType: asset.contentType,
      contentLength: asset.media.byteLength,
    })
    // CRITICAL ORDERING: durably save the session URL + length before a single
    // byte is sent, so a crash during/after the PUT is recovered by step 2 on
    // retry (overwriting any prior 'incomplete'/'gone' session).
    await deps.persistSession(job.id, sessionUrl, asset.media.byteLength)

    const uploaded = await deps.uploadToSession(
      sessionUrl,
      accessToken,
      asset.media,
      asset.contentType
    )
    logger.info('[PUBLISH_EXEC] Video published to YouTube', {
      organizationId: job.organizationId,
      deliverableId: job.deliverableId,
      externalVideoId: uploaded.videoId,
    })
    return ok({
      externalVideoId: uploaded.videoId,
      externalUrl: uploaded.watchUrl,
      privacyStatus: job.privacyStatus,
    })
  } catch (e) {
    return toFailure(e)
  }
}
