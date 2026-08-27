import { logger } from '@/shared/lib/logger'

/**
 * Visibility of an uploaded video. Structurally identical to the publishing
 * domain's PublishPrivacyStatus, declared locally so the channels domain does
 * not depend on the publishing domain (the coupling runs publishing → channels).
 */
export type YouTubeVideoPrivacy = 'private' | 'unlisted' | 'public'

/**
 * YouTube video upload (Step 3D-2B). Uploads an already-rendered video (a public
 * asset URL — e.g. a HeyGen file) to the connected YouTube channel via the
 * YouTube Data API v3 resumable-upload protocol. Plain `fetch`, no googleapis
 * dependency — consistent with youtube-oauth.ts.
 *
 * Exposed as composable steps so a crashed upload is recovered idempotently
 * (review finding B2): create the session, PUT the bytes, and — on retry — PROBE
 * the session to recover the video YouTube already created rather than uploading
 * a second copy. Every YouTube request (init, upload, AND status probe) carries
 * the bearer access token. This module never reads/stores or logs token material.
 */

const RESUMABLE_INIT_ENDPOINT =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status'

/** YouTube caps the `snippet.title` at 100 characters. */
const MAX_TITLE_LENGTH = 100
/** YouTube caps the `snippet.description` at 5000 characters. */
const MAX_DESCRIPTION_LENGTH = 5000

/**
 * Raised when a YouTube upload fails. `terminal` marks failures that will not
 * succeed on retry (bad/expired grant, insufficient permission, malformed
 * request) so the caller can fail the job fast instead of burning retries.
 */
export class YouTubeUploadError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly terminal: boolean
  ) {
    super(`[YOUTUBE_UPLOAD] ${message}`)
    this.name = 'YouTubeUploadError'
  }
}

export interface UploadVideoParams {
  /** Public URL of the rendered video asset to upload. */
  sourceUrl: string
  title: string
  description?: string
  privacyStatus: YouTubeVideoPrivacy
}

export interface UploadVideoResult {
  videoId: string
  watchUrl: string
}

export interface CreateUploadSessionParams {
  title: string
  description?: string
  privacyStatus: YouTubeVideoPrivacy
  contentType: string
  contentLength: number
}

/** Fetched video asset ready to upload. */
export interface VideoAsset {
  media: ArrayBuffer
  contentType: string
}

/**
 * Result of probing a persisted resumable session:
 * - 'complete'   — the session was FINALIZED, so YouTube created the video;
 *                  recover its id (NO re-upload).
 * - 'incomplete' — the session HAS received data and is resumable, but was never
 *                  finalized, so YouTube created NO video. This module's callers
 *                  do NOT resume-from-offset — they abandon the partial session
 *                  and start a fresh one; `receivedBytes` (from the 308 `Range`
 *                  header) is surfaced only for a FUTURE resume-from-offset.
 * - 'gone'       — the session no longer exists (404/410); a fresh upload is safe.
 */
export type ProbeResult =
  | { status: 'complete'; videoId: string; watchUrl: string }
  | { status: 'incomplete'; receivedBytes: number | null }
  | { status: 'gone' }

/** HTTP status → (code, terminal). 401/403 and 4xx client errors are terminal. */
function classifyHttpError(status: number): { code: string; terminal: boolean } {
  if (status === 401) return { code: 'YOUTUBE_UNAUTHORIZED', terminal: true }
  if (status === 403) return { code: 'YOUTUBE_FORBIDDEN', terminal: true }
  if (status >= 400 && status < 500) return { code: `YOUTUBE_HTTP_${status}`, terminal: true }
  return { code: `YOUTUBE_HTTP_${status}`, terminal: false } // 5xx — transient
}

/** Truncate to a byte-safe character cap without throwing on undefined. */
function clamp(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value
}

function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * Parse a 308 `Range: bytes=0-<end>` header into the count of bytes YouTube has
 * received (end + 1). A 308 with no Range header means zero bytes received.
 * Returns null if the header is present but unparseable.
 */
function parseReceivedBytes(rangeHeader: string | null): number | null {
  if (!rangeHeader) return 0
  const m = /bytes=0-(\d+)/i.exec(rangeHeader)
  return m ? Number(m[1]) + 1 : null
}

/**
 * Fetch the rendered asset bytes. A failed fetch is TRANSIENT (the source URL,
 * e.g. a signed HeyGen link, may be briefly unavailable) so the job can retry.
 */
export async function fetchVideoAsset(sourceUrl: string): Promise<VideoAsset> {
  try {
    const res = await fetch(sourceUrl)
    if (!res.ok) {
      throw new YouTubeUploadError(
        `source asset fetch failed (${res.status})`,
        'SOURCE_FETCH_FAILED',
        false
      )
    }
    return {
      contentType: res.headers.get('content-type') ?? 'video/mp4',
      media: await res.arrayBuffer(),
    }
  } catch (e) {
    if (e instanceof YouTubeUploadError) throw e
    throw new YouTubeUploadError('source asset fetch error', 'SOURCE_FETCH_FAILED', false)
  }
}

/**
 * Initiate a resumable upload session (metadata only) and return the session URL.
 * Authorized POST. The caller MUST persist this URL + the content length BEFORE
 * uploading any bytes so an interrupted upload is recoverable.
 */
export async function createYouTubeUploadSession(
  accessToken: string,
  params: CreateUploadSessionParams
): Promise<string> {
  const title = clamp(params.title.trim() || 'Untitled', MAX_TITLE_LENGTH)
  const description = clamp(params.description?.trim() ?? '', MAX_DESCRIPTION_LENGTH)

  const res = await fetch(RESUMABLE_INIT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': params.contentType,
      'X-Upload-Content-Length': String(params.contentLength),
    },
    body: JSON.stringify({
      snippet: { title, description },
      status: { privacyStatus: params.privacyStatus },
    }),
  })
  if (!res.ok) {
    const { code, terminal } = classifyHttpError(res.status)
    throw new YouTubeUploadError(`resumable init failed (${res.status})`, code, terminal)
  }
  const sessionUrl = res.headers.get('location')
  if (!sessionUrl) {
    throw new YouTubeUploadError('resumable init returned no session URL', 'NO_SESSION_URL', false)
  }
  return sessionUrl
}

/**
 * Upload the FULL video bytes to a resumable session (single request, offset 0)
 * and return the new video. Only ever called on a freshly-created session — this
 * is a complete upload, NOT a resume. Sends the bearer token (the YouTube Data
 * API requires authorization on the bytes PUT) and an explicit Content-Length.
 */
export async function uploadToYouTubeSession(
  sessionUrl: string,
  accessToken: string,
  media: ArrayBuffer,
  contentType: string
): Promise<UploadVideoResult> {
  const res = await fetch(sessionUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
      'Content-Length': String(media.byteLength),
      'Content-Range': `bytes 0-${media.byteLength - 1}/${media.byteLength}`,
    },
    body: media,
  })
  if (!res.ok) {
    const { code, terminal } = classifyHttpError(res.status)
    throw new YouTubeUploadError(`upload failed (${res.status})`, code, terminal)
  }
  const json = (await res.json()) as { id?: string }
  if (!json.id) {
    throw new YouTubeUploadError('upload response missing video id', 'NO_VIDEO_ID', false)
  }
  logger.info('[YOUTUBE_UPLOAD] Video uploaded', { videoId: json.id })
  return { videoId: json.id, watchUrl: watchUrl(json.id) }
}

/**
 * Probe a persisted resumable session (idempotent recovery). Issues Google's
 * documented AUTHORIZED status query: an empty PUT with the bearer token,
 * `Content-Length: 0`, and a wildcard `Content-Range` (a `*` byte-range over the
 * persisted total length) — so no source re-fetch is needed.
 *
 *   200/201 → session FINALIZED: body carries the video resource → recover id.
 *   308     → session INCOMPLETE: has received data (Range header) but is not
 *             finalized, so no video exists yet.
 *   404/410 → session GONE.
 *   other   → thrown (whole job retries; never silently assume "not uploaded").
 */
export async function probeYouTubeUploadSession(
  sessionUrl: string,
  accessToken: string,
  contentLength: number
): Promise<ProbeResult> {
  const res = await fetch(sessionUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Range': `bytes */${contentLength}`,
      'Content-Length': '0',
    },
  })
  if (res.status === 200 || res.status === 201) {
    const json = (await res.json()) as { id?: string }
    if (!json.id) {
      throw new YouTubeUploadError('probed completed upload has no video id', 'NO_VIDEO_ID', false)
    }
    return { status: 'complete', videoId: json.id, watchUrl: watchUrl(json.id) }
  }
  if (res.status === 308) {
    return { status: 'incomplete', receivedBytes: parseReceivedBytes(res.headers.get('range')) }
  }
  if (res.status === 404 || res.status === 410) {
    return { status: 'gone' }
  }
  // Unexpected — surface as an error so the whole job retries rather than
  // silently deciding the upload never happened (which could duplicate).
  const { code, terminal } = classifyHttpError(res.status)
  throw new YouTubeUploadError(`session probe failed (${res.status})`, code, terminal)
}

/**
 * Convenience one-shot upload (fetch asset → create session → PUT bytes). Used
 * where crash-recovery is not needed; the publish driver instead composes the
 * granular steps so it can persist + probe the session for idempotency.
 */
export async function uploadYouTubeVideo(
  accessToken: string,
  params: UploadVideoParams
): Promise<UploadVideoResult> {
  const { media, contentType } = await fetchVideoAsset(params.sourceUrl)
  const sessionUrl = await createYouTubeUploadSession(accessToken, {
    title: params.title,
    description: params.description,
    privacyStatus: params.privacyStatus,
    contentType,
    contentLength: media.byteLength,
  })
  return uploadToYouTubeSession(sessionUrl, accessToken, media, contentType)
}
