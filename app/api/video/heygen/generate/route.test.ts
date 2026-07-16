import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    listWorkforces: vi.fn(),
    triggerEngagementRun: vi.fn(),
    updateEngagementRunStatus: vi.fn(),
  },
}))
vi.mock('@/domains/deliverables', () => ({
  deliverablesService: {
    getDeliverable: vi.fn(),
    storeDeliverable: vi.fn(),
  },
}))
vi.mock('@/shared/model-gateway', () => ({
  modelGateway: { invoke: vi.fn() },
}))
vi.mock('@/shared/trust', () => ({
  trustEngine: { registerRule: vi.fn() },
}))
vi.mock('@/shared/config/env', () => ({
  env: { platform: { tenantId: vi.fn().mockReturnValue('tenant_test') } },
}))

import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { modelGateway } from '@/shared/model-gateway'
import type { DeliverableId, EngagementRunId, OrganizationId, TenantId } from '@/shared/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org_test_123' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId
const ENGAGEMENT_RUN_ID = 'run_heygen_1' as EngagementRunId
const SCRIPT_DELIVERABLE_ID = 'del_script_1' as DeliverableId
const VIDEO_DELIVERABLE_ID = 'del_video_1' as DeliverableId
const VIDEO_URL = 'https://cdn.heygen.com/videos/abc123.mp4'

function makeCtx() {
  return {
    tenantId: TENANT_ID,
    organizationId: ORG_ID,
    actor: {
      type: 'user' as const,
      userId: 'user_1' as import('@/shared/types').UserId,
      sessionId: 'session_test',
      role: 'owner' as const,
    },
    requestId: 'req_test_1',
  }
}

function makeScriptDeliverable(
  overrides: Partial<{
    type: string
    content: Record<string, unknown>
    title: string
  }> = {}
) {
  return {
    id: SCRIPT_DELIVERABLE_ID,
    organizationId: ORG_ID,
    engagementRunId: 'run_pipeline_1' as EngagementRunId,
    type: overrides.type ?? 'video_script',
    title: overrides.title ?? 'Pain-Point Hook — 45s',
    content: overrides.content ?? {
      script: 'Stop hiring humans. Start Koolerr today.',
      platform: 'facebook',
      estimatedDurationSec: 45,
      creativeId: 'creative_abc',
    },
    status: 'draft' as const,
    version: 1,
    attributedTo: ['video-producer'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function makeWorkforce() {
  return {
    id: 'wf_content' as import('@/shared/types').WorkforceId,
    businessFunction: 'Content Marketing',
    organizationId: ORG_ID,
  }
}

function makeVideoDeliverable() {
  return {
    id: VIDEO_DELIVERABLE_ID,
    organizationId: ORG_ID,
    engagementRunId: ENGAGEMENT_RUN_ID,
    type: 'video' as const,
    title: 'Pain-Point Hook — 45s',
    content: {
      videoUrl: VIDEO_URL,
      scriptDeliverableId: SCRIPT_DELIVERABLE_ID,
      creativeId: 'creative_abc',
    },
    status: 'draft' as const,
    version: 1,
    attributedTo: ['video-producer'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function request(body: unknown) {
  return new Request('http://localhost/api/video/heygen/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/video/heygen/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [makeWorkforce() as never],
    })
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: true,
      value: { id: ENGAGEMENT_RUN_ID } as never,
    })
    vi.mocked(workforceEngineService.updateEngagementRunStatus).mockResolvedValue({
      ok: true,
      value: {} as never,
    })
    vi.mocked(deliverablesService.getDeliverable).mockResolvedValue({
      ok: true,
      value: makeScriptDeliverable() as never,
    })
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: true,
      value: makeVideoDeliverable() as never,
    })
    vi.mocked(modelGateway.invoke).mockResolvedValue({
      content: VIDEO_URL,
      provider: 'heygen',
      model: 'heygen-v2',
      tokensUsed: 0,
      latencyMs: 15000,
    })
  })

  it('returns 401 when no auth context', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when deliverableId is missing', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(request({}))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/deliverableId/)
  })

  it('returns 400 when body is invalid JSON', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(
      new Request('http://localhost/api/video/heygen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('returns 404 when script deliverable is not found', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.getDeliverable).mockResolvedValue({
      ok: false,
      error: { code: 'NOT_FOUND' as never, message: 'not found' },
    })

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/not found/i)
  })

  it('returns 400 when deliverable type is not video_script', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.getDeliverable).mockResolvedValue({
      ok: true,
      value: makeScriptDeliverable({ type: 'image' }) as never,
    })

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/video_script/)
  })

  it('returns 422 when deliverable content has no script field', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.getDeliverable).mockResolvedValue({
      ok: true,
      value: makeScriptDeliverable({ content: { platform: 'facebook' } }) as never,
    })

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.error).toMatch(/script/)
  })

  it('returns 404 when no Content Marketing workforce exists', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [{ id: 'wf_other' as never, businessFunction: 'SEO' } as never],
    })

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/Content Marketing/)
  })

  it('returns 500 when triggerEngagementRun fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db error' },
    })

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/engagement run/i)
  })

  it('returns 500 and marks run failed when modelGateway throws', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(modelGateway.invoke).mockRejectedValue(new Error('HeyGen timeout'))

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('HeyGen timeout')

    expect(workforceEngineService.updateEngagementRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: ENGAGEMENT_RUN_ID, status: 'failed' })
    )
  })

  it('returns videoUrl, deliverableId, and engagementRunId on success', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.videoUrl).toBe(VIDEO_URL)
    expect(body.deliverableId).toBe(VIDEO_DELIVERABLE_ID)
    expect(body.engagementRunId).toBe(ENGAGEMENT_RUN_ID)
  })

  it('marks engagement run as completed on success', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(workforceEngineService.updateEngagementRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: ENGAGEMENT_RUN_ID, status: 'completed' })
    )
  })

  it('stores a video Deliverable owned by the new engagementRunId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(deliverablesService.storeDeliverable).toHaveBeenCalledOnce()
    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.engagementRunId).toBe(ENGAGEMENT_RUN_ID)
    expect(call.organizationId).toBe(ORG_ID)
    expect(call.type).toBe('video')
  })

  it('stores video Deliverable content with videoUrl, scriptDeliverableId, and creativeId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.content).toMatchObject({
      videoUrl: VIDEO_URL,
      scriptDeliverableId: SCRIPT_DELIVERABLE_ID,
      creativeId: 'creative_abc',
    })
  })

  it('attributes the video Deliverable to the video-producer digital employee', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.attributedTo).toContain('video-producer')
  })

  it('invokes HeyGen via the model gateway with the script as prompt', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(modelGateway.invoke).toHaveBeenCalledOnce()
    const call = vi.mocked(modelGateway.invoke).mock.calls[0][0]
    expect(call.provider).toBe('heygen')
    expect(call.prompt).toBe('Stop hiring humans. Start Koolerr today.')
    expect(call.digitalEmployeeId).toBe('video-producer')
    expect(call.engagementRunId).toBe(ENGAGEMENT_RUN_ID)
  })

  it('still returns videoUrl when Deliverable storage fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db write failed' },
    })

    const res = await POST(request({ deliverableId: SCRIPT_DELIVERABLE_ID }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.videoUrl).toBe(VIDEO_URL)
    expect(body.deliverableId).toBeNull()
  })
})
