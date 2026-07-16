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

const ORG_ID = 'org_test_456' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId
const ENGAGEMENT_RUN_ID = 'run_higgsfield_1' as EngagementRunId
const IMAGE_DELIVERABLE_ID = 'del_image_1' as DeliverableId
const IMAGE_URL = 'https://cdn.higgsfield.ai/images/xyz789.png'
const PROMPT =
  'A modern SaaS dashboard UI with a glowing blue interface, clean typography, professional lighting, cinematic depth of field'

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
    requestId: 'req_test_2',
  }
}

function makeWorkforce() {
  return {
    id: 'wf_content' as import('@/shared/types').WorkforceId,
    businessFunction: 'Content Marketing',
    organizationId: ORG_ID,
  }
}

function makeImageDeliverable(title = PROMPT) {
  return {
    id: IMAGE_DELIVERABLE_ID,
    organizationId: ORG_ID,
    engagementRunId: ENGAGEMENT_RUN_ID,
    type: 'image' as const,
    title,
    content: { imageUrl: IMAGE_URL, creativeId: 'creative_img_1' },
    status: 'draft' as const,
    version: 1,
    attributedTo: ['creative-video-director'],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function request(body: unknown) {
  return new Request('http://localhost/api/image/higgsfield/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/image/higgsfield/generate', () => {
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
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: true,
      value: makeImageDeliverable() as never,
    })
    vi.mocked(modelGateway.invoke).mockResolvedValue({
      content: IMAGE_URL,
      provider: 'higgsfield',
      model: 'higgsfield-soul-v1',
      tokensUsed: 0,
      latencyMs: 12000,
    })
  })

  it('returns 401 when no auth context', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)

    const res = await POST(request({ prompt: PROMPT }))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 when prompt is missing', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(request({}))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/prompt/)
  })

  it('returns 400 when prompt is empty string', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(request({ prompt: '   ' }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/prompt/)
  })

  it('returns 400 when body is invalid JSON', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(
      new Request('http://localhost/api/image/higgsfield/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('returns 404 when no Content Marketing workforce exists', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [{ id: 'wf_other' as never, businessFunction: 'SEO' } as never],
    })

    const res = await POST(request({ prompt: PROMPT }))

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

    const res = await POST(request({ prompt: PROMPT }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/engagement run/i)
  })

  it('returns 500 and marks run failed when modelGateway throws', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(modelGateway.invoke).mockRejectedValue(new Error('Higgsfield timeout'))

    const res = await POST(request({ prompt: PROMPT }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Higgsfield timeout')

    expect(workforceEngineService.updateEngagementRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: ENGAGEMENT_RUN_ID, status: 'failed' })
    )
  })

  it('returns imageUrl, deliverableId, and engagementRunId on success', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await POST(request({ prompt: PROMPT }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.imageUrl).toBe(IMAGE_URL)
    expect(body.deliverableId).toBe(IMAGE_DELIVERABLE_ID)
    expect(body.engagementRunId).toBe(ENGAGEMENT_RUN_ID)
  })

  it('marks engagement run as completed on success', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ prompt: PROMPT }))

    expect(workforceEngineService.updateEngagementRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: ENGAGEMENT_RUN_ID, status: 'completed' })
    )
  })

  it('stores an image Deliverable owned by the new engagementRunId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ prompt: PROMPT }))

    expect(deliverablesService.storeDeliverable).toHaveBeenCalledOnce()
    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.engagementRunId).toBe(ENGAGEMENT_RUN_ID)
    expect(call.organizationId).toBe(ORG_ID)
    expect(call.type).toBe('image')
  })

  it('stores Deliverable content with imageUrl and creativeId', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ prompt: PROMPT, creativeId: 'creative_img_1' }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.content).toMatchObject({
      imageUrl: IMAGE_URL,
      creativeId: 'creative_img_1',
    })
  })

  it('stores creativeId as null when not provided', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ prompt: PROMPT }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.content).toMatchObject({ creativeId: null })
  })

  it('attributes the image Deliverable to creative-video-director', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ prompt: PROMPT }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.attributedTo).toContain('creative-video-director')
  })

  it('uses truncated prompt as the Deliverable title for long prompts', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    const longPrompt = 'A'.repeat(100)

    await POST(request({ prompt: longPrompt }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.title).toHaveLength(80)
    expect(call.title.endsWith('...')).toBe(true)
  })

  it('uses prompt verbatim as the Deliverable title when 80 chars or fewer', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    const shortPrompt = 'Cinematic dashboard UI'

    await POST(request({ prompt: shortPrompt }))

    const call = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(call.title).toBe('Cinematic dashboard UI')
  })

  it('invokes Higgsfield via the model gateway with the prompt', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await POST(request({ prompt: PROMPT }))

    expect(modelGateway.invoke).toHaveBeenCalledOnce()
    const call = vi.mocked(modelGateway.invoke).mock.calls[0][0]
    expect(call.provider).toBe('higgsfield')
    expect(call.prompt).toBe(PROMPT)
    expect(call.digitalEmployeeId).toBe('creative-video-director')
    expect(call.engagementRunId).toBe(ENGAGEMENT_RUN_ID)
  })

  it('still returns imageUrl when Deliverable storage fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db write failed' },
    })

    const res = await POST(request({ prompt: PROMPT }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.imageUrl).toBe(IMAGE_URL)
    expect(body.deliverableId).toBeNull()
  })
})
