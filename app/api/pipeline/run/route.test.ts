import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/infrastructure/ai-workforce/build-profile', () => ({
  buildBusinessProfileFromMemories: vi.fn(),
}))
vi.mock('@/infrastructure/ai-workforce/pipeline', () => ({
  runAIWorkforcePipeline: vi.fn(),
}))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    listWorkforces: vi.fn(),
    listEngagementRuns: vi.fn(),
    triggerEngagementRun: vi.fn(),
  },
}))
vi.mock('@/shared/config/env', () => ({
  env: { platform: { tenantId: vi.fn().mockReturnValue('tenant_test') } },
}))
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return { ...actual, after: vi.fn() }
})

import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { buildBusinessProfileFromMemories } from '@/infrastructure/ai-workforce/build-profile'
import { runAIWorkforcePipeline } from '@/infrastructure/ai-workforce/pipeline'
import { workforceEngineService } from '@/domains/workforce-engine'
import { after } from 'next/server'
import type {
  OrganizationId,
  TenantId,
  WorkforceId,
  EngagementRunId,
  Workforce,
} from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org_test_p52' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId
const WORKFORCE_ID = 'wf_content_1' as WorkforceId
const RUN_ID = 'run_pipeline_1' as EngagementRunId

const BASE_PROFILE = {
  businessName: 'Acme Corp',
  businessCategory: 'SaaS',
  location: 'Austin TX',
  notes: 'Existing brand notes.',
}

const WORKFORCE: Workforce = {
  id: WORKFORCE_ID,
  organizationId: ORG_ID,
  businessFunction: 'Content Marketing',
  status: 'active',
  name: 'Content Team',
  goals: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

function makeCtx() {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    actor: {
      type: 'user' as const,
      userId: 'user_1' as import('@/shared/types').UserId,
      sessionId: 'sess_1',
      role: 'owner' as const,
    },
    requestId: 'req_p52',
  }
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/pipeline/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
  vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue(BASE_PROFILE)
  vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
    ok: true,
    value: [WORKFORCE],
  })
  vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
    ok: true,
    value: [],
  })
  vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
    ok: true,
    value: { id: RUN_ID } as never,
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/pipeline/run', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await POST(makeRequest({ topic: 'test' }) as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/pipeline/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when topic is missing', async () => {
    const res = await POST(makeRequest({}) as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('topic')
  })

  it('returns 400 when topic is whitespace only', async () => {
    const res = await POST(makeRequest({ topic: '   ' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no business profile is found', async () => {
    vi.mocked(buildBusinessProfileFromMemories).mockResolvedValue(null)
    const res = await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('Business profile')
  })

  it('returns 404 when no Content Marketing workforce exists', async () => {
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [{ ...WORKFORCE, businessFunction: 'SEO' } as Workforce],
    })
    const res = await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(res.status).toBe(404)
  })

  it('returns 429 when an active run exists for the workforce', async () => {
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [{ workforceId: WORKFORCE_ID, status: 'running' } as never],
    })
    const res = await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(res.status).toBe(429)
  })

  it('returns 500 when triggerEngagementRun fails', async () => {
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: false,
      error: { code: PlatformErrorCode.INTERNAL_ERROR, message: 'DB error' },
    })
    const res = await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(res.status).toBe(500)
  })

  it('returns 202 with engagementRunId on success', async () => {
    const res = await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(res.status).toBe(202)
    const data = await res.json()
    expect(data.engagementRunId).toBe(RUN_ID)
  })

  it('uses the topic as the engagement run objective', async () => {
    await POST(makeRequest({ topic: 'Summer Launch' }) as never)
    const call = vi.mocked(workforceEngineService.triggerEngagementRun).mock.calls[0][0]
    expect(call.objective).toBe('Summer Launch')
  })

  it('injects topic into profile notes without overwriting existing notes', async () => {
    await POST(makeRequest({ topic: 'Holiday Campaign' }) as never)
    const pipelineCall = vi.mocked(after).mock.calls[0][0]
    const cb = pipelineCall as () => void
    cb()
    const profileArg = vi.mocked(runAIWorkforcePipeline).mock.calls[0][1]
    expect(profileArg.notes).toContain('Existing brand notes.')
    expect(profileArg.notes).toContain('Campaign focus: Holiday Campaign')
  })

  it('appends brief to profile notes when brief is provided', async () => {
    await POST(makeRequest({ topic: 'Holiday Campaign', brief: 'Focus on gift guides' }) as never)
    const pipelineCall = vi.mocked(after).mock.calls[0][0]
    const cb = pipelineCall as () => void
    cb()
    const profileArg = vi.mocked(runAIWorkforcePipeline).mock.calls[0][1]
    expect(profileArg.notes).toContain('Brief: Focus on gift guides')
  })

  it('registers the pipeline with after() on success', async () => {
    await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(after).toHaveBeenCalledOnce()
  })

  it('does not call after() when run creation fails', async () => {
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: false,
      error: { code: PlatformErrorCode.INTERNAL_ERROR, message: 'DB error' },
    })
    await POST(makeRequest({ topic: 'Q3 Campaign' }) as never)
    expect(after).not.toHaveBeenCalled()
  })
})
