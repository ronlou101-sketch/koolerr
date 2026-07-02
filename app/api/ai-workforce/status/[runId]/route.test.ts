/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'

vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: { getEngagementRun: vi.fn() },
}))
vi.mock('@/domains/business-brain', () => ({
  businessBrainService: { queryMemory: vi.fn() },
}))

import { GET } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { businessBrainService } from '@/domains/business-brain'
import { createPlatformContext } from '@/shared/context'

const CTX = createPlatformContext({
  tenantId: 'tenant_test' as TenantId,
  organizationId: 'org_test' as OrganizationId,
  actor: { type: 'user', userId: 'user_1' as UserId, sessionId: 'sess_1', role: 'owner' },
  requestId: 'req_1',
})

const VALID_RUN_ID = 'run_00000000-0000-0000-0000-000000000001'

function makeGet(runId: string) {
  return GET(new NextRequest(`http://localhost/api/ai-workforce/status/${runId}`), {
    params: Promise.resolve({ runId }),
  })
}

const emptyMemoriesResult = {
  ok: true as const,
  value: { businessBrainId: 'bb_1' as any, memories: [], totalCount: 0 },
}

const runningRunResult = {
  ok: true as const,
  value: { id: VALID_RUN_ID as any, status: 'running' as const } as any,
}

describe('GET /api/ai-workforce/status/[runId]', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Auth guard ──────────────────────────────────────────────────────────────

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await makeGet(VALID_RUN_ID)
    expect(res.status).toBe(401)
  })

  // ── Run ID validation (P0-6) ────────────────────────────────────────────────

  it('returns 400 for a plain UUID without the run_ prefix', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const res = await makeGet('00000000-0000-0000-0000-000000000001')
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Invalid run ID' })
  })

  it('returns 400 for a run_ prefix with invalid UUID segment', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const res = await makeGet('run_not-a-uuid')
    expect(res.status).toBe(400)
  })

  it('returns 400 for an empty run ID', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const res = await makeGet('')
    expect(res.status).toBe(400)
  })

  it('returns 400 for a run ID with SQL injection attempt', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    const res = await makeGet("run_' OR '1'='1")
    expect(res.status).toBe(400)
  })

  // ── Run not found ───────────────────────────────────────────────────────────

  it('returns 404 and does not query memories when the run is not found', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.getEngagementRun).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'not found' } as any,
    })

    const res = await makeGet(VALID_RUN_ID)
    expect(res.status).toBe(404)
    expect(vi.mocked(businessBrainService.queryMemory)).not.toHaveBeenCalled()
  })

  // ── Successful response ─────────────────────────────────────────────────────

  it('returns 200 with 7 steps in pending state when no memories exist', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.getEngagementRun).mockResolvedValue(runningRunResult)
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue(emptyMemoriesResult)

    const res = await makeGet(VALID_RUN_ID)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.runId).toBe(VALID_RUN_ID)
    expect(body.steps).toHaveLength(7)
    expect(body.steps.every((s: { status: string }) => s.status === 'pending')).toBe(true)
    expect(body.runStatus).toBe('running')
    expect(body.totalSteps).toBe(7)
    expect(body.isComplete).toBe(false)
    expect(body.isFailed).toBe(false)
  })

  it('marks isComplete when run status is completed', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.getEngagementRun).mockResolvedValue({
      ok: true,
      value: { id: VALID_RUN_ID as any, status: 'completed' as const } as any,
    })
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue(emptyMemoriesResult)

    const res = await makeGet(VALID_RUN_ID)
    const body = await res.json()
    expect(body.isComplete).toBe(true)
  })

  it('marks isFailed when a step status is failed (P0-5: uses queryMemory)', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.getEngagementRun).mockResolvedValue(runningRunResult)
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue({
      ok: true,
      value: {
        businessBrainId: 'bb_1' as any,
        memories: [
          {
            id: 'mem_1' as any,
            businessBrainId: 'bb_1' as any,
            organizationId: 'org_test' as OrganizationId,
            type: 'progress' as any,
            content: { step: 'research', status: 'failed', timestamp: new Date().toISOString() },
            source: 'ai-workforce-pipeline',
            relevanceScope: [VALID_RUN_ID],
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalCount: 1,
      },
    })

    const res = await makeGet(VALID_RUN_ID)
    const body = await res.json()
    expect(body.isFailed).toBe(true)
    expect(body.failedStep).toBe('research')
  })

  it('uses queryMemory scoped to the runId (P0-5)', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.getEngagementRun).mockResolvedValue(runningRunResult)
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue(emptyMemoriesResult)

    await makeGet(VALID_RUN_ID)

    expect(vi.mocked(businessBrainService.queryMemory)).toHaveBeenCalledWith(
      expect.objectContaining({ relevanceScope: [VALID_RUN_ID] })
    )
  })
})
