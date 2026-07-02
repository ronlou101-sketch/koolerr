/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return { ...actual, after: vi.fn() }
})
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    listWorkforces: vi.fn(),
    listEngagementRuns: vi.fn(),
    triggerEngagementRun: vi.fn(),
  },
}))
vi.mock('@/infrastructure/ai-workforce/build-profile', () => ({
  buildBusinessProfileFromMemories: vi.fn(),
}))
vi.mock('@/infrastructure/ai-workforce/pipeline', () => ({
  runAIWorkforcePipeline: vi.fn(),
}))
vi.mock('@/shared/config/env', () => ({
  env: { platform: { tenantId: () => 'tenant_test' } },
}))

import { after } from 'next/server'
import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { buildBusinessProfileFromMemories } from '@/infrastructure/ai-workforce/build-profile'
import { createPlatformContext } from '@/shared/context'

const CTX = createPlatformContext({
  tenantId: 'tenant_test' as TenantId,
  organizationId: 'org_test' as OrganizationId,
  actor: { type: 'user', userId: 'user_1' as UserId, sessionId: 'sess_1', role: 'owner' },
  requestId: 'req_1',
})

const WORKFORCE = { id: 'wf_content' as any, businessFunction: 'Content Marketing' } as any
const RUN_ID = 'run_00000000-0000-0000-0000-000000000002' as any

describe('POST /api/ai-workforce/start', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Auth guard ──────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  // ── Profile guard ───────────────────────────────────────────────────────────

  it('returns 400 when no business profile exists', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('profile') })
  })

  it('returns 400 when profile exists but has no businessName', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({} as any)
    const res = await POST()
    expect(res.status).toBe(400)
  })

  // ── Workforce guard ─────────────────────────────────────────────────────────

  it('returns 500 when listWorkforces fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({ businessName: 'Acme' } as any)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: false,
      error: { message: 'DB error' } as any,
    })
    const res = await POST()
    expect(res.status).toBe(500)
  })

  it('returns 404 when no Content Marketing workforce exists', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({ businessName: 'Acme' } as any)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [{ id: 'wf_other' as any, businessFunction: 'SEO' } as any],
    })
    const res = await POST()
    expect(res.status).toBe(404)
  })

  // ── Rate limiting guard (P0-8) ──────────────────────────────────────────────

  it('returns 429 when a run is already pending for this workforce', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({ businessName: 'Acme' } as any)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [{ workforceId: 'wf_content' as any, status: 'pending' as const } as any],
    })
    const res = await POST()
    expect(res.status).toBe(429)
  })

  it('returns 429 when a run is already running for this workforce', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({ businessName: 'Acme' } as any)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [{ workforceId: 'wf_content' as any, status: 'running' as const } as any],
    })
    const res = await POST()
    expect(res.status).toBe(429)
  })

  it('does not block when a completed run exists for this workforce', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({ businessName: 'Acme' } as any)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [{ workforceId: 'wf_content' as any, status: 'completed' as const } as any],
    })
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: true,
      value: { id: RUN_ID } as any,
    })
    const res = await POST()
    expect(res.status).toBe(202)
  })

  // ── Success path ────────────────────────────────────────────────────────────

  it('returns 202 with engagementRunId and schedules pipeline via after() (P0-1)', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue({ businessName: 'Acme' } as any)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [WORKFORCE],
    })
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: false,
      error: { message: 'skip check' } as any,
    })
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: true,
      value: { id: RUN_ID } as any,
    })

    const res = await POST()
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body.engagementRunId).toBe(RUN_ID)
    expect(vi.mocked(after)).toHaveBeenCalledOnce()
  })
})
