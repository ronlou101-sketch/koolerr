/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OpenAIAdapter } from './openai-adapter'

/**
 * OpenAIAdapter unit tests.
 *
 * Mocks global fetch to avoid real network calls.
 * Verifies: constructor key guard, request construction, response parsing,
 * HTTP error propagation, and empty-content guard.
 */

function makeCompletion(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 'chatcmpl_test',
    model: 'gpt-4o-2024-05-13',
    choices: [
      { message: { role: 'assistant', content: '{"result":"ok"}' }, finish_reason: 'stop' },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    ...overrides,
  }
}

function mockFetch(body: unknown, status = 200) {
  const ok = status >= 200 && status < 300
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  })
}

describe('OpenAIAdapter', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_URL
  })
  afterEach(() => vi.restoreAllMocks())

  // ── Constructor guard ────────────────────────────────────────────────────────

  it('throws in constructor when no API key is provided', () => {
    expect(() => new OpenAIAdapter()).toThrow('OPENAI_API_KEY is not set')
  })

  it('uses the OPENAI_API_KEY env var when no explicit key is passed', () => {
    process.env.OPENAI_API_KEY = 'env-key-test'
    expect(() => new OpenAIAdapter()).not.toThrow()
  })

  it('uses an explicit constructor key over the env var', () => {
    process.env.OPENAI_API_KEY = 'env-key-test'
    expect(() => new OpenAIAdapter('explicit-key')).not.toThrow()
  })

  // ── Provider identity ────────────────────────────────────────────────────────

  it('reports provider as "openai"', () => {
    const adapter = new OpenAIAdapter('test-key')
    expect(adapter.provider).toBe('openai')
  })

  // ── Request construction ─────────────────────────────────────────────────────

  it('sends a POST to /v1/chat/completions with JSON body and Bearer auth', async () => {
    const fetchMock = mockFetch(makeCompletion())
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new OpenAIAdapter('test-key', 'https://api.openai.test')
    await adapter.invoke({ prompt: 'Write a poem' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.openai.test/v1/chat/completions')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-key')

    const bodyParsed = JSON.parse(init.body as string)
    expect(bodyParsed.messages).toContainEqual({ role: 'user', content: 'Write a poem' })
    expect(bodyParsed.response_format).toEqual({ type: 'json_object' })
  })

  it('prepends a system message when systemContext is provided', async () => {
    const fetchMock = mockFetch(makeCompletion())
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new OpenAIAdapter('test-key')
    await adapter.invoke({ prompt: 'Hello', systemContext: 'You are a helpful assistant' })

    const bodyParsed = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(bodyParsed.messages[0]).toEqual({
      role: 'system',
      content: 'You are a helpful assistant',
    })
    expect(bodyParsed.messages[1]).toEqual({ role: 'user', content: 'Hello' })
  })

  it('uses the requested model when provided', async () => {
    const fetchMock = mockFetch(makeCompletion({ model: 'gpt-4-turbo' }))
    vi.stubGlobal('fetch', fetchMock)

    const adapter = new OpenAIAdapter('test-key')
    await adapter.invoke({ prompt: 'Hello', model: 'gpt-4-turbo' })

    const bodyParsed = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(bodyParsed.model).toBe('gpt-4-turbo')
  })

  // ── Response parsing ─────────────────────────────────────────────────────────

  it('returns a normalized response with content, model, and tokensUsed', async () => {
    vi.stubGlobal('fetch', mockFetch(makeCompletion()))

    const adapter = new OpenAIAdapter('test-key')
    const res = await adapter.invoke({ prompt: 'Hello' })

    expect(res.content).toBe('{"result":"ok"}')
    expect(res.model).toBe('gpt-4o-2024-05-13')
    expect(res.tokensUsed).toBe(30)
    expect(typeof res.latencyMs).toBe('number')
  })

  // ── HTTP error propagation ───────────────────────────────────────────────────

  it('throws when the API returns a non-OK status', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: { message: 'quota exceeded' } }, 429))

    const adapter = new OpenAIAdapter('test-key')
    await expect(adapter.invoke({ prompt: 'Hello' })).rejects.toThrow('Request failed (429)')
  })

  // ── Empty content guard ──────────────────────────────────────────────────────

  it('throws when choices array contains no content', async () => {
    const emptyChoices = makeCompletion({
      choices: [{ message: { role: 'assistant', content: '' }, finish_reason: 'stop' }],
    })
    vi.stubGlobal('fetch', mockFetch(emptyChoices))

    const adapter = new OpenAIAdapter('test-key')
    await expect(adapter.invoke({ prompt: 'Hello' })).rejects.toThrow(
      'No content in response choices'
    )
  })
})
