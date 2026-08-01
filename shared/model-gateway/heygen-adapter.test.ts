import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeyGenAdapter } from './heygen-adapter'
import type { NormalizedModelRequest } from './types'

/**
 * HeyGen adapter unit tests.
 *
 * Focused on the brand-identity contract (ADR-025 §1): the adapter uses the
 * payload's avatar/voice references when present and falls back to the global
 * env defaults when absent, preserving prior behavior. Provider request/response
 * HTTP shapes are mocked; no real HeyGen calls are made.
 */

const REQUEST: NormalizedModelRequest = { prompt: 'Say hello to our customers' }
const VIDEO_URL = 'https://cdn.heygen.com/videos/abc123.mp4'

function makeFetch(responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  let i = 0
  return vi.fn().mockImplementation(() => {
    const r = responses[Math.min(i++, responses.length - 1)]
    return Promise.resolve({
      ok: r.ok,
      status: r.status,
      statusText: String(r.status),
      text: () => Promise.resolve(JSON.stringify(r.body)),
      json: () => Promise.resolve(r.body),
    })
  })
}

const ok = (body: unknown) => ({ ok: true, status: 200, body })

const CREATE_OK = ok({ data: { video_id: 'vid-1' } })
const STATUS_COMPLETED = ok({ data: { status: 'completed', video_url: VIDEO_URL } })

/** Reads the avatar_id / voice_id from the first fetch call (the create-video POST). */
function submittedCharacter(mockFetch: ReturnType<typeof makeFetch>): {
  avatar_id: string
  voice_id: string
} {
  const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
  const body = JSON.parse(init.body as string) as {
    video_inputs: Array<{ character: { avatar_id: string }; voice: { voice_id: string } }>
  }
  return {
    avatar_id: body.video_inputs[0].character.avatar_id,
    voice_id: body.video_inputs[0].voice.voice_id,
  }
}

describe('HeyGenAdapter', () => {
  beforeEach(() => {
    delete process.env.HEYGEN_API_KEY
    delete process.env.HEYGEN_AVATAR_ID
    delete process.env.HEYGEN_VOICE_ID
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    delete process.env.HEYGEN_API_KEY
    delete process.env.HEYGEN_AVATAR_ID
    delete process.env.HEYGEN_VOICE_ID
  })

  it('exposes provider identity as "heygen"', () => {
    expect(new HeyGenAdapter().provider).toBe('heygen')
  })

  it('throws when HEYGEN_API_KEY is not set', async () => {
    await expect(new HeyGenAdapter().invoke(REQUEST)).rejects.toThrow('HEYGEN_API_KEY is not set')
  })

  it('falls back to env avatar/voice when no brand identity is present', async () => {
    process.env.HEYGEN_API_KEY = 'key'
    process.env.HEYGEN_AVATAR_ID = 'env_avatar'
    process.env.HEYGEN_VOICE_ID = 'env_voice'
    const mockFetch = makeFetch([CREATE_OK, STATUS_COMPLETED])
    vi.stubGlobal('fetch', mockFetch)

    const result = await new HeyGenAdapter().invoke(REQUEST)

    expect(result.content).toBe(VIDEO_URL)
    expect(submittedCharacter(mockFetch)).toEqual({
      avatar_id: 'env_avatar',
      voice_id: 'env_voice',
    })
  })

  it('uses brand-identity avatar/voice references over env when present', async () => {
    process.env.HEYGEN_API_KEY = 'key'
    process.env.HEYGEN_AVATAR_ID = 'env_avatar'
    process.env.HEYGEN_VOICE_ID = 'env_voice'
    const mockFetch = makeFetch([CREATE_OK, STATUS_COMPLETED])
    vi.stubGlobal('fetch', mockFetch)

    await new HeyGenAdapter().invoke({
      ...REQUEST,
      brandIdentity: { avatarId: 'brand_avatar', voiceId: 'brand_voice' },
    })

    expect(submittedCharacter(mockFetch)).toEqual({
      avatar_id: 'brand_avatar',
      voice_id: 'brand_voice',
    })
  })

  it('renders from brand identity even when env avatar/voice are unset', async () => {
    process.env.HEYGEN_API_KEY = 'key'
    const mockFetch = makeFetch([CREATE_OK, STATUS_COMPLETED])
    vi.stubGlobal('fetch', mockFetch)

    const result = await new HeyGenAdapter().invoke({
      ...REQUEST,
      brandIdentity: { avatarId: 'brand_avatar', voiceId: 'brand_voice' },
    })

    expect(result.content).toBe(VIDEO_URL)
    expect(submittedCharacter(mockFetch)).toEqual({
      avatar_id: 'brand_avatar',
      voice_id: 'brand_voice',
    })
  })

  it('throws when no avatar id is available from brand identity or env', async () => {
    process.env.HEYGEN_API_KEY = 'key'
    process.env.HEYGEN_VOICE_ID = 'env_voice'
    await expect(new HeyGenAdapter().invoke(REQUEST)).rejects.toThrow('No avatar id available')
  })

  it('throws when no voice id is available from brand identity or env', async () => {
    process.env.HEYGEN_API_KEY = 'key'
    await expect(
      new HeyGenAdapter().invoke({ ...REQUEST, brandIdentity: { avatarId: 'brand_avatar' } })
    ).rejects.toThrow('No voice id available')
  })
})
