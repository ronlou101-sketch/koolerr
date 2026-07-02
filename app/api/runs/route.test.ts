/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'

vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    listWorkforces: vi.fn(),
    listEngagementRuns: vi.fn(),
  },
}))
vi.mock('@/infrastructure/content-workforce', () => ({
  executeContentEngagementRun: vi.fn(),
}))

import { GET, POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { executeContentEngagementRun } from '@/infrastructure/content-workforce'
import { createPlatformContext } from '@/shared/context'

const CTX = createPlatformContext({
  tenantId: 'tenant_test' as TenantId,
  organizationId: 'org_test' as OrganizationId,
  actor: { type: 'user', userId: 'user_1' as UserId, sessionId: 'sess_1', role: 'owner' },
  requestId: 'req_1',
})

const WORKFORCE = { id: 'wf_content' as any, businessFunction: 'Content Marketing' } as any

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/runs', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/runs', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Auth guard ──────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await POST(postRequest({ objective: 'test' }))
    expect(res.status).toBe(401)
  })

  // ── Input validation ────────────────────────────────────────────────────────

  it('returns 400 for invalid JSON body', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const req = new NextRequest('http://localhost/api/runs', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Invalid JSON body' })
  })

  it('returns 400 when objective is missing', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const res = await POST(postRequest({}))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'objective is required' })
  })

  it('returns 400 when objective is blank whitespace', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const res = await POST(postRequest({ objective: '   ' }))
    expect(res.status).toBe(400)
  })

  // ── Workforce guard ─────────────────────────────────────────────────────────

  it('returns 404 when no Content Marketing workforce exists', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [],
    })
    const res = await POST(postRequest({ objective: 'Write a blog post' }))
    expect(res.status).toBe(404)
  })

  // ── Rate limiting guard (P0-8) ──────────────────────────────────────────────

  it('returns 429 when a run is already pending for this workforce', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [{ workforceId: 'wf_content' as any, status: 'pending' as const } as any],
    })
    const res = await POST(postRequest({ objective: 'Write a blog post' }))
    expect(res.status).toBe(429)
  })

  it('returns 429 when a run is already running for this workforce', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [{ workforceId: 'wf_content' as any, status: 'running' as const } as any],
    })
    const res = await POST(postRequest({ objective: 'Write a blog post' }))
    expect(res.status).toBe(429)
  })

  // ── Success path ────────────────────────────────────────────────────────────

  it('returns 201 with result when run succeeds', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [],
    })
    vi.mocked(executeContentEngagementRun).mockResolvedValue({
      engagementRunId: 'run_abc' as any,
      deliverableId: 'del_123' as any,
    } as any)

    const res = await POST(postRequest({ objective: 'Write a blog post' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.engagementRunId).toBe('run_abc')
  })
})

describe('GET /api/runs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with empty runs list', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [],
    })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ runs: [] })
  })

  it('returns 500 when listEngagementRuns fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: false,
      error: { message: 'DB error' } as any,
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
