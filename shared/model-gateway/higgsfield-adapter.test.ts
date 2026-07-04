import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HiggsfieldAdapter } from './higgsfield-adapter'
import type { NormalizedModelRequest } from './types'

const REQUEST: NormalizedModelRequest = {
  prompt: 'cinematic sunrise over a city skyline',
  model: 'higgsfield-v1',
}

const ASSET_URL = 'https://cdn.higgsfield.ai/result.jpg'

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
const err = (status: number) => ({ ok: false, status, body: {} })

const SUBMIT_COMPLETED = ok({
  request_id: 'req-001',
  status: 'completed',
  images: [{ url: ASSET_URL }],
})
const SUBMIT_QUEUED = ok({ request_id: 'req-002', status: 'queued' })
const POLL_QUEUED = ok({ status: 'queued' })
const POLL_IN_PROGRESS = ok({ status: 'in_progress' })
const POLL_COMPLETED = ok({ status: 'completed', images: [{ url: ASSET_URL }] })

describe('HiggsfieldAdapter', () => {
  beforeEach(() => {
    delete process.env.HIGGSFIELD_API_KEY
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('exposes provider identity as "higgsfield"', () => {
    expect(new HiggsfieldAdapter().provider).toBe('higgsfield')
  })

  it('throws when HIGGSFIELD_API_KEY is not set', async () => {
    const adapter = new HiggsfieldAdapter()
    await expect(adapter.invoke(REQUEST)).rejects.toThrow('HIGGSFIELD_API_KEY is not set')
  })

  it('returns asset URL on immediate completion', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([SUBMIT_COMPLETED]))
    const adapter = new HiggsfieldAdapter()
    const result = await adapter.invoke(REQUEST)
    expect(result.content).toBe(ASSET_URL)
    expect(result.model).toBe('higgsfield/text2image/soul')
    expect(result.tokensUsed).toBe(0)
    expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('sends correct Authorization header and endpoint on submit', async () => {
    process.env.HIGGSFIELD_API_KEY = 'kid:ksecret'
    const mockFetch = makeFetch([SUBMIT_COMPLETED])
    vi.stubGlobal('fetch', mockFetch)
    await new HiggsfieldAdapter().invoke(REQUEST)
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/v1/text2image/soul')
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Key kid:ksecret')
  })

  it('polls until completed when initially queued', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal(
      'fetch',
      makeFetch([SUBMIT_QUEUED, POLL_QUEUED, POLL_IN_PROGRESS, POLL_COMPLETED])
    )
    const adapter = new HiggsfieldAdapter({ pollIntervalMs: 0 })
    const result = await adapter.invoke(REQUEST)
    expect(result.content).toBe(ASSET_URL)
  })

  it('throws on 401 authentication failure', async () => {
    process.env.HIGGSFIELD_API_KEY = 'bad_id:bad_secret'
    vi.stubGlobal('fetch', makeFetch([err(401)]))
    await expect(new HiggsfieldAdapter().invoke(REQUEST)).rejects.toThrow('Authentication failed')
  })

  it('throws on 403 insufficient credits', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([err(403)]))
    await expect(new HiggsfieldAdapter().invoke(REQUEST)).rejects.toThrow('Insufficient credits')
  })

  it('throws on 5xx provider outage', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([err(500)]))
    await expect(new HiggsfieldAdapter().invoke(REQUEST)).rejects.toThrow('server error')
  })

  it('throws on malformed response missing request_id', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([ok({})]))
    await expect(new HiggsfieldAdapter().invoke(REQUEST)).rejects.toThrow('request_id')
  })

  it('throws when job is rejected as nsfw', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([SUBMIT_QUEUED, ok({ status: 'nsfw' })]))
    const adapter = new HiggsfieldAdapter({ pollIntervalMs: 0 })
    await expect(adapter.invoke(REQUEST)).rejects.toThrow('nsfw')
  })

  it('throws when job fails during polling', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([SUBMIT_QUEUED, ok({ status: 'failed' })]))
    const adapter = new HiggsfieldAdapter({ pollIntervalMs: 0 })
    await expect(adapter.invoke(REQUEST)).rejects.toThrow('[HIGGSFIELD_ADAPTER]')
  })

  it('throws when poll times out', async () => {
    process.env.HIGGSFIELD_API_KEY = 'test_id:test_secret'
    vi.stubGlobal('fetch', makeFetch([SUBMIT_QUEUED, POLL_QUEUED]))
    const adapter = new HiggsfieldAdapter({ pollIntervalMs: 10, pollTimeoutMs: 50 })
    await expect(adapter.invoke(REQUEST)).rejects.toThrow('did not complete')
  })
})
