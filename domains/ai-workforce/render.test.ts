import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    listWorkforces: vi.fn(),
    triggerEngagementRun: vi.fn(),
    updateEngagementRunStatus: vi.fn(),
  },
}))
vi.mock('@/domains/deliverables', () => ({
  deliverablesService: { storeDeliverable: vi.fn() },
}))
vi.mock('@/shared/trust', () => ({ trustEngine: { registerRule: vi.fn() } }))
vi.mock('@/domains/brand-ambassador', () => ({
  brandAmbassadorService: { resolveBrandAmbassador: vi.fn() },
}))
vi.mock('@/shared/config/env', () => ({
  env: { platform: { tenantId: vi.fn().mockReturnValue('tenant_test') } },
}))
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { executeRenderJob } from './render'
import type { RenderJobRequest } from './render'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { brandAmbassadorService } from '@/domains/brand-ambassador'
import { trustEngine } from '@/shared/trust'
import { logger } from '@/shared/lib/logger'
import type { DigitalEmployeeId, EngagementRunId, OrganizationId } from '@/shared/types'

const ORG_ID = 'org_test' as OrganizationId
const RUN_ID = 'run_1' as EngagementRunId
const ASSET_URL = 'https://cdn.example.com/asset.mp4'

function makeGateway(impl?: () => Promise<unknown>) {
  const invoke = impl
    ? vi.fn().mockImplementation(impl)
    : vi.fn().mockResolvedValue({
        content: ASSET_URL,
        provider: 'heygen',
        model: 'heygen-v2',
        tokensUsed: 0,
        latencyMs: 10,
      })
  return { invoke, registeredProviders: vi.fn(() => []) }
}

function makeRequest(overrides: Partial<RenderJobRequest> = {}): RenderJobRequest {
  return {
    organizationId: ORG_ID,
    employeeId: 'video-producer' as DigitalEmployeeId,
    action: 'generate_heygen_video',
    trustRuleId: `heygen-video-${ORG_ID}`,
    provider: 'heygen',
    prompt: 'Say hello',
    runObjective: 'HeyGen video generation for script: del_1',
    runContext: { type: 'heygen-video-generation', scriptDeliverableId: 'del_1' },
    deliverableType: 'video',
    deliverableTitle: 'Hook — 45s',
    buildContent: (assetUrl) => ({ videoUrl: assetUrl, scriptDeliverableId: 'del_1' }),
    logLabel: 'HEYGEN_GENERATE',
    ...overrides,
  }
}

describe('executeRenderJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [{ id: 'wf_content', businessFunction: 'Content Marketing' } as never],
    })
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: true,
      value: { id: RUN_ID } as never,
    })
    vi.mocked(workforceEngineService.updateEngagementRunStatus).mockResolvedValue({
      ok: true,
      value: {} as never,
    })
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: true,
      value: { id: 'del_video_1' } as never,
    })
    // Default: no ambassador assigned (fallback path) unless a test overrides.
    vi.mocked(brandAmbassadorService.resolveBrandAmbassador).mockResolvedValue({
      ok: true,
      value: null,
    })
  })

  it('renders, stores the deliverable, and returns the asset on the happy path', async () => {
    const gateway = makeGateway()
    const result = await executeRenderJob(makeRequest(), gateway)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      assetUrl: ASSET_URL,
      deliverableId: 'del_video_1',
      engagementRunId: RUN_ID,
    })

    expect(gateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'heygen',
        prompt: 'Say hello',
        digitalEmployeeId: 'video-producer',
        action: 'generate_heygen_video',
        engagementRunId: RUN_ID,
      })
    )
    expect(trustEngine.registerRule).toHaveBeenCalledWith(
      expect.objectContaining({ id: `heygen-video-${ORG_ID}`, action: 'generate_heygen_video' })
    )
    expect(workforceEngineService.updateEngagementRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: RUN_ID, status: 'completed' })
    )
    const store = vi.mocked(deliverablesService.storeDeliverable).mock.calls[0][0]
    expect(store.type).toBe('video')
    expect(store.content).toEqual({ videoUrl: ASSET_URL, scriptDeliverableId: 'del_1' })
    expect(store.attributedTo).toEqual(['video-producer'])
  })

  it('returns WORKFORCE_NOT_FOUND when no workforce exists', async () => {
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({ ok: true, value: [] })
    const result = await executeRenderJob(makeRequest(), makeGateway())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('WORKFORCE_NOT_FOUND')
    expect(result.error.message).toMatch(/No workforce found/)
  })

  it('returns WORKFORCE_NOT_FOUND when no Content Marketing workforce exists', async () => {
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [{ id: 'wf_seo', businessFunction: 'SEO' } as never],
    })
    const result = await executeRenderJob(makeRequest(), makeGateway())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('WORKFORCE_NOT_FOUND')
    expect(result.error.message).toMatch(/Content Marketing/)
  })

  it('returns RUN_TRIGGER_FAILED when the engagement run cannot be created', async () => {
    vi.mocked(workforceEngineService.triggerEngagementRun).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db error' },
    })
    const result = await executeRenderJob(makeRequest(), makeGateway())
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('RUN_TRIGGER_FAILED')
    expect(result.error.message).toBe('Failed to create engagement run')
  })

  it('returns RENDER_FAILED and marks the run failed when the gateway throws', async () => {
    const gateway = makeGateway(() => Promise.reject(new Error('HeyGen timeout')))
    const result = await executeRenderJob(makeRequest(), gateway)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('RENDER_FAILED')
    expect(result.error.message).toBe('HeyGen timeout')
    expect(workforceEngineService.updateEngagementRunStatus).toHaveBeenCalledWith(
      expect.objectContaining({ id: RUN_ID, status: 'failed' })
    )
    expect(deliverablesService.storeDeliverable).not.toHaveBeenCalled()
  })

  it('returns success with null deliverableId when the store fails', async () => {
    vi.mocked(deliverablesService.storeDeliverable).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db write failed' },
    })
    const result = await executeRenderJob(makeRequest(), makeGateway())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.assetUrl).toBe(ASSET_URL)
    expect(result.value.deliverableId).toBeNull()
    expect(logger.warn).toHaveBeenCalled()
  })

  // ── Brand Ambassador injection (ADR-025 §1/§7 — Slice CR-3) ──────────────────

  it('injects the resolved ambassador identity into the gateway request', async () => {
    vi.mocked(brandAmbassadorService.resolveBrandAmbassador).mockResolvedValue({
      ok: true,
      value: {
        ambassadorId: 'ambassador_1' as DigitalEmployeeId,
        libraryId: 'lib_1',
        displayName: 'Ava',
        role: 'Spokesperson',
        persona: 'warm',
        personalityTraits: [],
        appearance: { description: 'friendly', referenceImageUrls: ['https://cdn/x.png'] },
        voice: { description: 'calm' },
        branding: {},
        seed: 4242,
        source: 'auto-assigned',
        providerRefs: { heygen: { avatarId: 'av_brand', voiceId: 'vo_brand' } },
      } as never,
    })
    const gateway = makeGateway()
    await executeRenderJob(makeRequest(), gateway)

    expect(gateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        brandIdentity: {
          avatarId: 'av_brand',
          voiceId: 'vo_brand',
          referenceImageUrls: ['https://cdn/x.png'],
          seed: 4242,
        },
      })
    )
  })

  it('falls back (no brandIdentity) and logs when no ambassador is assigned', async () => {
    // beforeEach default: resolve → ok(null)
    const gateway = makeGateway()
    await executeRenderJob(makeRequest(), gateway)

    expect(gateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({ brandIdentity: undefined })
    )
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('No Brand Ambassador assigned'),
      expect.anything()
    )
  })

  it('falls back (no brandIdentity) and warns when ambassador resolution fails', async () => {
    vi.mocked(brandAmbassadorService.resolveBrandAmbassador).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'brain down' },
    })
    const gateway = makeGateway()
    const result = await executeRenderJob(makeRequest(), gateway)

    expect(result.ok).toBe(true)
    expect(gateway.invoke).toHaveBeenCalledWith(
      expect.objectContaining({ brandIdentity: undefined })
    )
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Brand Ambassador resolve failed'),
      expect.anything()
    )
  })
})
