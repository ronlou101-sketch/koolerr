import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/platform/bootstrap', () => ({
  bootstrapPlatform: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/shared/config/env', () => ({
  env: { cron: { secret: vi.fn(() => 'test-secret') } },
}))
vi.mock('@/domains/ai-workforce/render-jobs', () => ({
  renderJobsService: {
    claimPending: vi.fn(),
    markCompleted: vi.fn().mockResolvedValue({ ok: true, value: null }),
    markFailed: vi.fn().mockResolvedValue({ ok: true, value: null }),
  },
}))
vi.mock('@/domains/ai-workforce/video-production', () => ({
  videoProductionDepartment: { renderSpokespersonVideo: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/creative', () => ({
  creativeDepartment: { renderImage: vi.fn() },
}))

import { GET } from './route'
import { renderJobsService } from '@/domains/ai-workforce/render-jobs'
import { videoProductionDepartment } from '@/domains/ai-workforce/video-production'
import { creativeDepartment } from '@/domains/ai-workforce/creative'
import { env } from '@/shared/config/env'
import type {
  DeliverableId,
  EngagementRunId,
  OrganizationId,
  RenderJobId,
  TenantId,
} from '@/shared/types'
import type { RenderJob, RenderJobKind } from '@/domains/ai-workforce/render-jobs'

function makeJob(overrides: Partial<RenderJob> = {}): RenderJob {
  return {
    id: 'render_job_1' as RenderJobId,
    organizationId: 'org_test' as OrganizationId,
    tenantId: 'tenant_test' as TenantId,
    engagementRunId: 'run_test' as EngagementRunId,
    kind: 'video' as RenderJobKind,
    sourceDeliverableId: 'del_script_1' as DeliverableId,
    prompt: 'Say hello to our customers.',
    status: 'running',
    attempts: 0,
    resultDeliverableId: null,
    error: null,
    dedupeKey: 'run_test:video:del_script_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    claimedAt: new Date(),
    ...overrides,
  }
}

function request(secret: string | null): Request {
  const headers: Record<string, string> = {}
  if (secret !== null) headers.authorization = `Bearer ${secret}`
  return new Request('http://localhost/api/cron/render-jobs', { headers })
}

const claimMock = vi.mocked(renderJobsService.claimPending)
const completedMock = vi.mocked(renderJobsService.markCompleted)
const failedMock = vi.mocked(renderJobsService.markFailed)
const videoMock = vi.mocked(videoProductionDepartment.renderSpokespersonVideo)
const imageMock = vi.mocked(creativeDepartment.renderImage)

describe('GET /api/cron/render-jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(env.cron.secret).mockReturnValue('test-secret')
    claimMock.mockResolvedValue({ ok: true, value: [] })
  })

  it('returns 401 when the bearer secret is missing or wrong', async () => {
    expect((await GET(request(null))).status).toBe(401)
    expect((await GET(request('wrong'))).status).toBe(401)
    expect(claimMock).not.toHaveBeenCalled()
  })

  it('returns 500 when CRON_SECRET is not configured', async () => {
    vi.mocked(env.cron.secret).mockImplementation(() => {
      throw new Error('not set')
    })
    const res = await GET(request('anything'))
    expect(res.status).toBe(500)
    expect(claimMock).not.toHaveBeenCalled()
  })

  it('no-ops on an empty queue', async () => {
    const res = await GET(request('test-secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ claimed: 0, completed: 0, failed: 0 })
    expect(videoMock).not.toHaveBeenCalled()
    expect(imageMock).not.toHaveBeenCalled()
  })

  it('claims and completes a video job via the branded render path', async () => {
    claimMock.mockResolvedValue({ ok: true, value: [makeJob()] })
    videoMock.mockResolvedValue({
      ok: true,
      value: {
        assetUrl: 'https://cdn/v.mp4',
        deliverableId: 'del_video_1' as DeliverableId,
        engagementRunId: 'run_test' as EngagementRunId,
      },
    })

    const res = await GET(request('test-secret'))

    expect(videoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_test',
        script: 'Say hello to our customers.',
        scriptDeliverableId: 'del_script_1',
      })
    )
    expect(completedMock).toHaveBeenCalledWith('render_job_1', 'del_video_1')
    expect(await res.json()).toEqual({ claimed: 1, completed: 1, failed: 0 })
  })

  it('dispatches an image job to renderImage', async () => {
    claimMock.mockResolvedValue({
      ok: true,
      value: [makeJob({ kind: 'image', sourceDeliverableId: null, prompt: 'a hero image' })],
    })
    imageMock.mockResolvedValue({
      ok: true,
      value: {
        assetUrl: 'https://cdn/i.png',
        deliverableId: 'del_image_1' as DeliverableId,
        engagementRunId: 'run_test' as EngagementRunId,
      },
    })

    await GET(request('test-secret'))

    expect(imageMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org_test', prompt: 'a hero image' })
    )
    expect(completedMock).toHaveBeenCalledWith('render_job_1', 'del_image_1')
  })

  it('marks a job failed when the render returns an error', async () => {
    claimMock.mockResolvedValue({ ok: true, value: [makeJob()] })
    videoMock.mockResolvedValue({ ok: false, error: { code: 'RENDER_FAILED', message: 'boom' } })

    const res = await GET(request('test-secret'))

    expect(failedMock).toHaveBeenCalledWith('render_job_1', 'boom')
    expect(completedMock).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({ claimed: 1, completed: 0, failed: 1 })
  })

  it('marks a job failed when the render throws', async () => {
    claimMock.mockResolvedValue({ ok: true, value: [makeJob()] })
    videoMock.mockRejectedValue(new Error('kaboom'))

    await GET(request('test-secret'))

    expect(failedMock).toHaveBeenCalledWith('render_job_1', 'kaboom')
  })

  it('marks failed (not completed) when the render succeeds but no deliverable was stored', async () => {
    claimMock.mockResolvedValue({ ok: true, value: [makeJob()] })
    videoMock.mockResolvedValue({
      ok: true,
      value: {
        assetUrl: 'https://cdn/v.mp4',
        deliverableId: null,
        engagementRunId: 'run_test' as EngagementRunId,
      },
    })

    await GET(request('test-secret'))

    expect(completedMock).not.toHaveBeenCalled()
    expect(failedMock).toHaveBeenCalledWith('render_job_1', expect.stringContaining('deliverable'))
  })

  it('returns 500 when claiming fails', async () => {
    claimMock.mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db down' },
    })
    const res = await GET(request('test-secret'))
    expect(res.status).toBe(500)
  })
})
