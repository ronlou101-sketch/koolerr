import { describe, expect, it, vi } from 'vitest'
import { ok, err, PlatformErrorCode } from '@/shared/types'
import type {
  ChannelConnectionId,
  Deliverable,
  DeliverableId,
  OrganizationId,
  PlatformResult,
  PublishJobId,
  TenantId,
} from '@/shared/types'
import type { ProbeResult, UploadVideoResult, VideoAsset } from '@/domains/channels'
import { executePublishJob, type PublishExecutorDeps } from './executor'
import type { PublishJob } from './types'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const ORG = 'org_1' as OrganizationId
const TENANT = 'tenant_1' as TenantId
const DELIV = 'deliv_1' as DeliverableId
const CONN = 'chan_1' as ChannelConnectionId

function job(over: Partial<PublishJob> = {}): PublishJob {
  return {
    id: 'pub_1' as PublishJobId,
    organizationId: ORG,
    tenantId: TENANT,
    deliverableId: DELIV,
    channelConnectionId: CONN,
    provider: 'youtube',
    status: 'processing',
    idempotencyKey: `${ORG}:${DELIV}:${CONN}`,
    attemptCount: 0,
    availableAt: new Date(),
    startedAt: new Date(),
    completedAt: null,
    externalVideoId: null,
    externalUrl: null,
    privacyStatus: 'unlisted',
    uploadSessionUrl: null,
    uploadContentLength: null,
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }
}

function deliverable(over: Partial<Deliverable> = {}): Deliverable {
  return {
    id: DELIV,
    organizationId: ORG,
    type: 'video',
    status: 'approved',
    title: 'Launch teaser',
    content: { videoUrl: 'https://files2.heygen.ai/x.mp4' },
    ...over,
  } as Deliverable
}

const ASSET: VideoAsset = { media: new ArrayBuffer(4096), contentType: 'video/mp4' }
const SESSION_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=SESS'
const UPLOAD_RESULT: UploadVideoResult = {
  videoId: 'yt_vid_123',
  watchUrl: 'https://www.youtube.com/watch?v=yt_vid_123',
}

/** Fully-stubbed deps; individual tests override what they assert on. */
function makeDeps(over: Partial<PublishExecutorDeps> = {}): PublishExecutorDeps {
  return {
    getDeliverable: async (): Promise<PlatformResult<Deliverable>> => ok(deliverable()),
    getAccessToken: async () => ok('ya29.token'),
    fetchAsset: async () => ASSET,
    createSession: async () => SESSION_URL,
    uploadToSession: async () => UPLOAD_RESULT,
    probeSession: async () => ({ status: 'gone' }) as ProbeResult,
    persistSession: async () => {},
    ...over,
  }
}

describe('executePublishJob — fresh upload', () => {
  it('creates + persists a session BEFORE uploading, then returns the provider result', async () => {
    const createSession = vi.fn(async () => SESSION_URL)
    const persistSession = vi.fn(async () => {})
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)
    const probeSession = vi.fn(async () => ({ status: 'gone' }) as ProbeResult)

    const r = await executePublishJob(
      job(),
      makeDeps({ createSession, persistSession, uploadToSession, probeSession })
    )

    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual({
        externalVideoId: 'yt_vid_123',
        externalUrl: 'https://www.youtube.com/watch?v=yt_vid_123',
        privacyStatus: 'unlisted',
      })
    }
    // No prior session on the job → probe is never called.
    expect(probeSession).not.toHaveBeenCalled()
    // Persist carries (jobId, sessionUrl, byteLength) and runs BEFORE the upload.
    expect(persistSession).toHaveBeenCalledWith('pub_1', SESSION_URL, 4096)
    expect(uploadToSession).toHaveBeenCalledWith(
      SESSION_URL,
      'ya29.token',
      ASSET.media,
      'video/mp4'
    )
    expect(persistSession.mock.invocationCallOrder[0]).toBeLessThan(
      uploadToSession.mock.invocationCallOrder[0]
    )
  })

  it('threads a public privacyStatus through create + result', async () => {
    const createSession = vi.fn(async () => SESSION_URL)
    const r = await executePublishJob(job({ privacyStatus: 'public' }), makeDeps({ createSession }))
    expect(createSession).toHaveBeenCalledWith(
      'ya29.token',
      expect.objectContaining({ privacyStatus: 'public' })
    )
    if (r.ok) expect(r.value.privacyStatus).toBe('public')
  })
})

describe('executePublishJob — recovery (duplicate-upload safety, B2)', () => {
  it('completed persisted session → recovers the video id with ZERO upload calls', async () => {
    const probeSession = vi.fn(
      async (): Promise<ProbeResult> => ({
        status: 'complete',
        videoId: 'yt_recovered',
        watchUrl: 'https://www.youtube.com/watch?v=yt_recovered',
      })
    )
    const fetchAsset = vi.fn(async () => ASSET)
    const createSession = vi.fn(async () => SESSION_URL)
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)

    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({ probeSession, fetchAsset, createSession, uploadToSession })
    )

    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.externalVideoId).toBe('yt_recovered')
      expect(r.value.externalUrl).toContain('yt_recovered')
    }
    expect(probeSession).toHaveBeenCalledWith(SESSION_URL, 'ya29.token', 4096)
    // No second upload of any kind.
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(createSession).not.toHaveBeenCalled()
    expect(uploadToSession).not.toHaveBeenCalled()
  })

  it('incomplete 308 → abandons partial session and uploads on a FRESH session', async () => {
    const probeSession = vi.fn(
      async (): Promise<ProbeResult> => ({ status: 'incomplete', receivedBytes: 10 })
    )
    const createSession = vi.fn(async () => 'https://sessions/new')
    const persistSession = vi.fn(async () => {})
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)

    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({ probeSession, createSession, persistSession, uploadToSession })
    )

    expect(r.ok).toBe(true)
    expect(createSession).toHaveBeenCalledTimes(1) // fresh session, not the old one
    expect(persistSession).toHaveBeenCalledWith('pub_1', 'https://sessions/new', 4096)
    expect(uploadToSession).toHaveBeenCalledWith(
      'https://sessions/new',
      'ya29.token',
      ASSET.media,
      'video/mp4'
    )
  })

  it('incomplete 308 with no Range (receivedBytes 0) → fresh upload', async () => {
    const probeSession = vi.fn(
      async (): Promise<ProbeResult> => ({ status: 'incomplete', receivedBytes: 0 })
    )
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)
    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({ probeSession, uploadToSession })
    )
    expect(r.ok).toBe(true)
    expect(uploadToSession).toHaveBeenCalledTimes(1)
  })

  it('gone (404/410) → fresh upload', async () => {
    const probeSession = vi.fn(async (): Promise<ProbeResult> => ({ status: 'gone' }))
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)
    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({ probeSession, uploadToSession })
    )
    expect(r.ok).toBe(true)
    expect(uploadToSession).toHaveBeenCalledTimes(1)
  })

  it('probe 5xx → fails/retries and performs ABSOLUTELY NO new upload', async () => {
    const probeSession = vi.fn(async () => {
      throw Object.assign(new Error('[YOUTUBE_UPLOAD] session probe failed (503)'), {
        name: 'YouTubeUploadError',
        code: 'YOUTUBE_HTTP_503',
        terminal: false,
      })
    })
    const fetchAsset = vi.fn(async () => ASSET)
    const createSession = vi.fn(async () => SESSION_URL)
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)

    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({ probeSession, fetchAsset, createSession, uploadToSession })
    )

    expect(r.ok).toBe(false)
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(createSession).not.toHaveBeenCalled()
    expect(uploadToSession).not.toHaveBeenCalled()
  })

  it('probe 401/403 → propagates a failure and does not upload', async () => {
    const probeSession = vi.fn(async () => {
      throw Object.assign(new Error('[YOUTUBE_UPLOAD] session probe failed (403)'), {
        name: 'YouTubeUploadError',
        code: 'YOUTUBE_FORBIDDEN',
        terminal: true,
      })
    })
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)
    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({ probeSession, uploadToSession })
    )
    expect(r.ok).toBe(false)
    expect(uploadToSession).not.toHaveBeenCalled()
  })

  it('FAIL CLOSED: persisted session but null content length → INTERNAL_ERROR, no probe, no upload', async () => {
    const probeSession = vi.fn(async (): Promise<ProbeResult> => ({ status: 'gone' }))
    const fetchAsset = vi.fn(async () => ASSET)
    const createSession = vi.fn(async () => SESSION_URL)
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)

    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: null }),
      makeDeps({ probeSession, fetchAsset, createSession, uploadToSession })
    )

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe(PlatformErrorCode.INTERNAL_ERROR)
    expect(probeSession).not.toHaveBeenCalled()
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(createSession).not.toHaveBeenCalled()
    expect(uploadToSession).not.toHaveBeenCalled()
  })
})

describe('executePublishJob — preconditions + failures', () => {
  it('propagates a token error (revoked / reconnect required) without uploading', async () => {
    // Preserved from the pre-B2 suite, adapted to the granular flow: a FRESH job
    // (no persisted session) whose token acquisition fails must return the token
    // error and touch none of the upload steps.
    const fetchAsset = vi.fn(async () => ASSET)
    const createSession = vi.fn(async () => SESSION_URL)
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)

    const r = await executePublishJob(
      job(),
      makeDeps({
        getAccessToken: async () =>
          err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'revoked' }),
        fetchAsset,
        createSession,
        uploadToSession,
      })
    )

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe(PlatformErrorCode.UNAUTHORIZED)
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(createSession).not.toHaveBeenCalled()
    expect(uploadToSession).not.toHaveBeenCalled()
  })

  it('recovery path: token failure → no probe and no upload', async () => {
    const probeSession = vi.fn(async (): Promise<ProbeResult> => ({ status: 'gone' }))
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)
    const r = await executePublishJob(
      job({ uploadSessionUrl: SESSION_URL, uploadContentLength: 4096 }),
      makeDeps({
        getAccessToken: async () =>
          err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'revoked' }),
        probeSession,
        uploadToSession,
      })
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe(PlatformErrorCode.UNAUTHORIZED)
    expect(probeSession).not.toHaveBeenCalled()
    expect(uploadToSession).not.toHaveBeenCalled()
  })

  it('session persistence failure → no bytes uploaded', async () => {
    const persistSession = vi.fn(async () => {
      throw new Error('could not persist upload session: db down')
    })
    const uploadToSession = vi.fn(async () => UPLOAD_RESULT)
    const r = await executePublishJob(job(), makeDeps({ persistSession, uploadToSession }))
    expect(r.ok).toBe(false)
    expect(uploadToSession).not.toHaveBeenCalled()
  })

  it('fails when the deliverable cannot be loaded', async () => {
    const r = await executePublishJob(
      job(),
      makeDeps({
        getDeliverable: async () =>
          err({
            code: PlatformErrorCode.NOT_FOUND,
            message: 'gone',
          }) as PlatformResult<Deliverable>,
      })
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe(PlatformErrorCode.NOT_FOUND)
  })

  it('fails when approval was withdrawn (no longer approved)', async () => {
    const r = await executePublishJob(
      job(),
      makeDeps({ getDeliverable: async () => ok(deliverable({ status: 'rejected' })) })
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.code).toBe(PlatformErrorCode.VALIDATION_ERROR)
  })

  it('fails when the deliverable is not a video', async () => {
    const r = await executePublishJob(
      job(),
      makeDeps({ getDeliverable: async () => ok(deliverable({ type: 'image' })) })
    )
    expect(r.ok).toBe(false)
  })

  it('fails when the deliverable has no rendered video URL', async () => {
    const r = await executePublishJob(
      job(),
      makeDeps({ getDeliverable: async () => ok(deliverable({ content: {} })) })
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toContain('no rendered video URL')
  })

  it('maps an upload throw to a failed result the worker can record', async () => {
    // Adapted from the pre-B2 uploadVideo test → now on uploadToSession.
    const r = await executePublishJob(
      job(),
      makeDeps({
        uploadToSession: async () => {
          throw new Error('boom')
        },
      })
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error.message).toContain('boom')
  })
})
