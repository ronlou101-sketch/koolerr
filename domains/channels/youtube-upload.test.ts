import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import {
  uploadYouTubeVideo,
  uploadToYouTubeSession,
  probeYouTubeUploadSession,
  YouTubeUploadError,
} from './youtube-upload'

const TOKEN = 'ya29.test-access-token'
const SOURCE = 'https://files2.heygen.ai/rendered.mp4'
const SESSION_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?upload_id=SESSION123'

/** A minimal Response-like object for a mocked fetch. */
function res(
  init: {
    ok?: boolean
    status?: number
    headers?: Record<string, string>
    json?: unknown
    body?: ArrayBuffer
  } = {}
): Response {
  const headers = new Headers(init.headers ?? {})
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers,
    json: async () => init.json,
    arrayBuffer: async () => init.body ?? new ArrayBuffer(8),
  } as unknown as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── One-shot wrapper (existing behavior must keep passing) ───────────────────

/** Wire the happy-path three-call sequence: asset fetch → init → upload. */
function wireHappyPath(videoId = 'yt_abc123') {
  fetchMock
    .mockResolvedValueOnce(
      res({ headers: { 'content-type': 'video/mp4' }, body: new ArrayBuffer(64) })
    ) // asset
    .mockResolvedValueOnce(res({ headers: { location: SESSION_URL } })) // resumable init
    .mockResolvedValueOnce(res({ json: { id: videoId } })) // upload
}

describe('uploadYouTubeVideo (one-shot wrapper)', () => {
  it('uploads and returns the video id + public watch URL', async () => {
    wireHappyPath('yt_abc123')

    const result = await uploadYouTubeVideo(TOKEN, {
      sourceUrl: SOURCE,
      title: 'My video',
      privacyStatus: 'unlisted',
    })

    expect(result).toEqual({
      videoId: 'yt_abc123',
      watchUrl: 'https://www.youtube.com/watch?v=yt_abc123',
    })

    // init call carries the auth bearer + snippet/status metadata
    const initCall = fetchMock.mock.calls[1]
    expect(initCall[0]).toContain('uploadType=resumable')
    expect(initCall[1].headers.Authorization).toBe(`Bearer ${TOKEN}`)
    const body = JSON.parse(initCall[1].body)
    expect(body.snippet.title).toBe('My video')
    expect(body.status.privacyStatus).toBe('unlisted')

    // bytes are PUT to the session URL returned by init
    const uploadCall = fetchMock.mock.calls[2]
    expect(uploadCall[0]).toBe(SESSION_URL)
    expect(uploadCall[1].method).toBe('PUT')
  })

  it('clamps an over-long title to YouTube’s 100-char limit', async () => {
    wireHappyPath()
    const longTitle = 'x'.repeat(250)

    await uploadYouTubeVideo(TOKEN, {
      sourceUrl: SOURCE,
      title: longTitle,
      privacyStatus: 'private',
    })

    const body = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(body.snippet.title).toHaveLength(100)
  })

  it('treats a failed source asset fetch as a transient (retryable) error', async () => {
    fetchMock.mockResolvedValueOnce(res({ ok: false, status: 404 }))

    await expect(
      uploadYouTubeVideo(TOKEN, { sourceUrl: SOURCE, title: 't', privacyStatus: 'unlisted' })
    ).rejects.toMatchObject({ code: 'SOURCE_FETCH_FAILED', terminal: false })
    expect(fetchMock).toHaveBeenCalledTimes(1) // never reached YouTube
  })

  it('marks a 401 from the resumable init as a terminal auth failure', async () => {
    fetchMock
      .mockResolvedValueOnce(
        res({ headers: { 'content-type': 'video/mp4' }, body: new ArrayBuffer(8) })
      )
      .mockResolvedValueOnce(res({ ok: false, status: 401 }))

    await expect(
      uploadYouTubeVideo(TOKEN, { sourceUrl: SOURCE, title: 't', privacyStatus: 'unlisted' })
    ).rejects.toMatchObject({ code: 'YOUTUBE_UNAUTHORIZED', terminal: true })
  })

  it('marks a 403 (permission/quota) as terminal', async () => {
    fetchMock
      .mockResolvedValueOnce(
        res({ headers: { 'content-type': 'video/mp4' }, body: new ArrayBuffer(8) })
      )
      .mockResolvedValueOnce(res({ ok: false, status: 403 }))

    await expect(
      uploadYouTubeVideo(TOKEN, { sourceUrl: SOURCE, title: 't', privacyStatus: 'unlisted' })
    ).rejects.toMatchObject({ code: 'YOUTUBE_FORBIDDEN', terminal: true })
  })

  it('treats a 5xx during the byte upload as transient (retryable)', async () => {
    fetchMock
      .mockResolvedValueOnce(
        res({ headers: { 'content-type': 'video/mp4' }, body: new ArrayBuffer(8) })
      )
      .mockResolvedValueOnce(res({ headers: { location: SESSION_URL } }))
      .mockResolvedValueOnce(res({ ok: false, status: 503 }))

    await expect(
      uploadYouTubeVideo(TOKEN, { sourceUrl: SOURCE, title: 't', privacyStatus: 'unlisted' })
    ).rejects.toMatchObject({ code: 'YOUTUBE_HTTP_503', terminal: false })
  })

  it('errors when the resumable init returns no session URL', async () => {
    fetchMock
      .mockResolvedValueOnce(
        res({ headers: { 'content-type': 'video/mp4' }, body: new ArrayBuffer(8) })
      )
      .mockResolvedValueOnce(res({ headers: {} })) // no Location header

    await expect(
      uploadYouTubeVideo(TOKEN, { sourceUrl: SOURCE, title: 't', privacyStatus: 'unlisted' })
    ).rejects.toBeInstanceOf(YouTubeUploadError)
  })

  it('errors when the upload response is missing the video id', async () => {
    fetchMock
      .mockResolvedValueOnce(
        res({ headers: { 'content-type': 'video/mp4' }, body: new ArrayBuffer(8) })
      )
      .mockResolvedValueOnce(res({ headers: { location: SESSION_URL } }))
      .mockResolvedValueOnce(res({ json: {} })) // no id

    await expect(
      uploadYouTubeVideo(TOKEN, { sourceUrl: SOURCE, title: 't', privacyStatus: 'unlisted' })
    ).rejects.toMatchObject({ code: 'NO_VIDEO_ID' })
  })
})

// ── Granular byte upload (authorized PUT with explicit length + range) ───────

describe('uploadToYouTubeSession', () => {
  it('PUTs the bytes with Authorization, Content-Type, Content-Length and Content-Range', async () => {
    const media = new ArrayBuffer(2048)
    fetchMock.mockResolvedValueOnce(res({ json: { id: 'yt_up_1' } }))

    const result = await uploadToYouTubeSession(SESSION_URL, TOKEN, media, 'video/mp4')

    expect(result).toEqual({
      videoId: 'yt_up_1',
      watchUrl: 'https://www.youtube.com/watch?v=yt_up_1',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(SESSION_URL)
    expect(init.method).toBe('PUT')
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(init.headers['Content-Type']).toBe('video/mp4')
    expect(init.headers['Content-Length']).toBe('2048')
    expect(init.headers['Content-Range']).toBe('bytes 0-2047/2048')
    expect(init.body).toBe(media)
  })

  it('classifies a 401 as terminal and a 5xx as transient', async () => {
    fetchMock.mockResolvedValueOnce(res({ ok: false, status: 401 }))
    await expect(
      uploadToYouTubeSession(SESSION_URL, TOKEN, new ArrayBuffer(8), 'video/mp4')
    ).rejects.toMatchObject({ code: 'YOUTUBE_UNAUTHORIZED', terminal: true })

    fetchMock.mockResolvedValueOnce(res({ ok: false, status: 500 }))
    await expect(
      uploadToYouTubeSession(SESSION_URL, TOKEN, new ArrayBuffer(8), 'video/mp4')
    ).rejects.toMatchObject({ code: 'YOUTUBE_HTTP_500', terminal: false })
  })

  it('errors when the upload response has no video id', async () => {
    fetchMock.mockResolvedValueOnce(res({ json: {} }))
    await expect(
      uploadToYouTubeSession(SESSION_URL, TOKEN, new ArrayBuffer(8), 'video/mp4')
    ).rejects.toMatchObject({ code: 'NO_VIDEO_ID' })
  })
})

// ── Status probe (authorized, Content-Range: bytes */<len>) ──────────────────

describe('probeYouTubeUploadSession', () => {
  it('sends Authorization, Content-Length: 0 and Content-Range: bytes */<len>', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 200, json: { id: 'yt_c1' } }))

    const result = await probeYouTubeUploadSession(SESSION_URL, TOKEN, 4096)

    expect(result).toEqual({
      status: 'complete',
      videoId: 'yt_c1',
      watchUrl: 'https://www.youtube.com/watch?v=yt_c1',
    })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(SESSION_URL)
    expect(init.method).toBe('PUT')
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(init.headers['Content-Length']).toBe('0')
    expect(init.headers['Content-Range']).toBe('bytes */4096')
    expect(init.body).toBeUndefined()
  })

  it('reports complete on a 201 as well', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 201, json: { id: 'yt_c2' } }))
    const result = await probeYouTubeUploadSession(SESSION_URL, TOKEN, 10)
    expect(result).toMatchObject({ status: 'complete', videoId: 'yt_c2' })
  })

  it('parses the 308 Range header into receivedBytes (end + 1)', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 308, headers: { range: 'bytes=0-9' } }))
    const result = await probeYouTubeUploadSession(SESSION_URL, TOKEN, 100)
    expect(result).toEqual({ status: 'incomplete', receivedBytes: 10 })
  })

  it('treats a 308 with no Range header as receivedBytes 0', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 308 }))
    const result = await probeYouTubeUploadSession(SESSION_URL, TOKEN, 100)
    expect(result).toEqual({ status: 'incomplete', receivedBytes: 0 })
  })

  it('reports gone on 404 and 410', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 404 }))
    expect(await probeYouTubeUploadSession(SESSION_URL, TOKEN, 5)).toEqual({ status: 'gone' })
    fetchMock.mockResolvedValueOnce(res({ status: 410 }))
    expect(await probeYouTubeUploadSession(SESSION_URL, TOKEN, 5)).toEqual({ status: 'gone' })
  })

  it('throws a transient error on a 5xx probe', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 503 }))
    await expect(probeYouTubeUploadSession(SESSION_URL, TOKEN, 5)).rejects.toMatchObject({
      code: 'YOUTUBE_HTTP_503',
      terminal: false,
    })
  })

  it('throws a terminal auth error on a 401/403 probe', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 401 }))
    await expect(probeYouTubeUploadSession(SESSION_URL, TOKEN, 5)).rejects.toMatchObject({
      code: 'YOUTUBE_UNAUTHORIZED',
      terminal: true,
    })

    fetchMock.mockResolvedValueOnce(res({ status: 403 }))
    await expect(probeYouTubeUploadSession(SESSION_URL, TOKEN, 5)).rejects.toMatchObject({
      code: 'YOUTUBE_FORBIDDEN',
      terminal: true,
    })
  })

  it('errors when a completed (200) probe has no video id', async () => {
    fetchMock.mockResolvedValueOnce(res({ status: 200, json: {} }))
    await expect(probeYouTubeUploadSession(SESSION_URL, TOKEN, 5)).rejects.toMatchObject({
      code: 'NO_VIDEO_ID',
    })
  })
})
