import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ElevenLabsAdapter } from './elevenlabs-adapter'

/**
 * ElevenLabsAdapter unit tests.
 *
 * Mocks global fetch to avoid real network calls.
 * Verifies: env-var guards (key, voice ID), successful audio encoding as
 * base64 data URL, and HTTP error propagation.
 */

function mockAudioFetch(audioBytes: Uint8Array = new Uint8Array([0x49, 0x44, 0x33]), status = 200) {
  const ok = status >= 200 && status < 300
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Unauthorized',
    arrayBuffer: vi.fn().mockResolvedValue(audioBytes.buffer),
    text: vi.fn().mockResolvedValue(ok ? '' : 'Unauthorized'),
  })
}

describe('ElevenLabsAdapter', () => {
  beforeEach(() => {
    delete process.env.ELEVENLABS_API_KEY
    delete process.env.ELEVENLABS_VOICE_ID
    delete process.env.ELEVENLABS_MODEL_ID
    delete process.env.ELEVENLABS_API_URL
  })
  afterEach(() => vi.restoreAllMocks())

  // ── Provider identity ────────────────────────────────────────────────────────

  it('reports provider as "elevenlabs"', () => {
    const adapter = new ElevenLabsAdapter()
    expect(adapter.provider).toBe('elevenlabs')
  })

  // ── Env var guards (validated at invoke time) ────────────────────────────────

  it('throws during invoke when ELEVENLABS_API_KEY is missing', async () => {
    process.env.ELEVENLABS_VOICE_ID = 'voice_123'
    const adapter = new ElevenLabsAdapter()
    await expect(adapter.invoke({ prompt: 'Hello' })).rejects.toThrow(
      'ELEVENLABS_API_KEY is not set'
    )
  })

  it('throws during invoke when ELEVENLABS_VOICE_ID is missing', async () => {
    process.env.ELEVENLABS_API_KEY = 'key_123'
    const adapter = new ElevenLabsAdapter()
    await expect(adapter.invoke({ prompt: 'Hello' })).rejects.toThrow(
      'ELEVENLABS_VOICE_ID is not set'
    )
  })

  // ── Request construction ─────────────────────────────────────────────────────

  it('sends a POST to /v1/text-to-speech/{voice_id} with xi-api-key header', async () => {
    process.env.ELEVENLABS_API_KEY = 'key_123'
    process.env.ELEVENLABS_VOICE_ID = 'voice_abc'
    const fetchMock = mockAudioFetch()
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new ElevenLabsAdapter()
    await adapter.invoke({ prompt: 'Speak this text' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/v1/text-to-speech/voice_abc')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['xi-api-key']).toBe('key_123')

    const bodyParsed = JSON.parse(init.body as string)
    expect(bodyParsed.text).toBe('Speak this text')
  })

  it('uses ELEVENLABS_API_URL env var as the base URL', async () => {
    process.env.ELEVENLABS_API_KEY = 'key_123'
    process.env.ELEVENLABS_VOICE_ID = 'voice_abc'
    process.env.ELEVENLABS_API_URL = 'https://custom.elevenlabs.test'
    const fetchMock = mockAudioFetch()
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new ElevenLabsAdapter()
    await adapter.invoke({ prompt: 'Test' })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('https://custom.elevenlabs.test')
  })

  // ── Response encoding ────────────────────────────────────────────────────────

  it('returns audio encoded as a base64 data:audio/mpeg data URL', async () => {
    process.env.ELEVENLABS_API_KEY = 'key_123'
    process.env.ELEVENLABS_VOICE_ID = 'voice_abc'
    const audioBytes = new Uint8Array([0x49, 0x44, 0x33, 0x04]) // ID3v2.4 header bytes
    vi.stubGlobal('fetch', mockAudioFetch(audioBytes))

    const adapter = new ElevenLabsAdapter()
    const res = await adapter.invoke({ prompt: 'Read this' })

    expect(res.content).toMatch(/^data:audio\/mpeg;base64,/)
    expect(res.tokensUsed).toBe(0)
    expect(res.model).toContain('elevenlabs')
    expect(typeof res.latencyMs).toBe('number')
  })

  // ── HTTP error propagation ───────────────────────────────────────────────────

  it('throws when the API returns a non-OK status', async () => {
    process.env.ELEVENLABS_API_KEY = 'key_123'
    process.env.ELEVENLABS_VOICE_ID = 'voice_abc'
    vi.stubGlobal('fetch', mockAudioFetch(new Uint8Array(), 401))

    const adapter = new ElevenLabsAdapter()
    await expect(adapter.invoke({ prompt: 'Hello' })).rejects.toThrow(
      'Speech synthesis failed (401)'
    )
  })
})
