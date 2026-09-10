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
vi.mock('@/domains/publishing', () => ({
  publishJobsService: {
    claimPending: vi.fn(),
    markPublished: vi.fn().mockResolvedValue({ ok: true, value: null }),
    markFailed: vi.fn().mockResolvedValue({ ok: true, value: null }),
  },
  executePublishJob: vi.fn(),
}))

import { GET } from './route'
import { publishJobsService, executePublishJob } from '@/domains/publishing'
import { env } from '@/shared/config/env'
import { ok, err, PlatformErrorCode } from '@/shared/types'
import type {
  ChannelConnectionId,
  DeliverableId,
  OrganizationId,
  PublishJobId,
  TenantId,
} from '@/shared/types'
import type { PublishJob } from '@/domains/publishing'

function makeJob(overrides: Partial<PublishJob> = {}): PublishJob {
  return {
    id: 'pub_1' as PublishJobId,
    organizationId: 'org_test' as OrganizationId,
    tenantId: 'tenant_test' as TenantId,
    deliverableId: 'del_1' as DeliverableId,
    channelConnectionId: 'chan_1' as ChannelConnectionId,
    provider: 'youtube',
    status: 'processing',
    idempotencyKey: 'org_test:del_1:chan_1',
    attemptCount: 0,
    availableAt: new Date(),
    startedAt: new Date(),
    completedAt: null,
    externalVideoId: null,
    externalUrl: null,
    privacyStatus: 'unlisted',
    uploadSessionUrl: null,
    uploadContentLength: null,
    errorCode: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function request(secret: string | null): Request {
  const headers: Record<string, string> = {}
  if (secret !== null) headers.authorization = `Bearer ${secret}`
  return new Request('http://localhost/api/cron/publish-jobs', { headers })
}

const claimMock = vi.mocked(publishJobsService.claimPending)
const publishedMock = vi.mocked(publishJobsService.markPublished)
const failedMock = vi.mocked(publishJobsService.markFailed)
const execMock = vi.mocked(executePublishJob)

const RESULT = {
  externalVideoId: 'yt_vid_1',
  externalUrl: 'https://www.youtube.com/watch?v=yt_vid_1',
  privacyStatus: 'unlisted' as const,
}

describe('GET /api/cron/publish-jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(env.cron.secret).mockReturnValue('test-secret')
    claimMock.mockResolvedValue(ok([]))
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
    expect(await res.json()).toEqual({ claimed: 0, published: 0, failed: 0 })
    expect(execMock).not.toHaveBeenCalled()
  })

  it('claims a job, uploads it, and records the published result', async () => {
    claimMock.mockResolvedValue(ok([makeJob()]))
    execMock.mockResolvedValue(ok(RESULT))

    const res = await GET(request('test-secret'))

    expect(execMock).toHaveBeenCalledWith(expect.objectContaining({ id: 'pub_1' }))
    expect(publishedMock).toHaveBeenCalledWith('pub_1', RESULT)
    expect(failedMock).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({ claimed: 1, published: 1, failed: 0 })
  })

  it('marks a job failed (with the error code) when execution returns an error', async () => {
    claimMock.mockResolvedValue(ok([makeJob()]))
    execMock.mockResolvedValue(err({ code: PlatformErrorCode.UNAUTHORIZED, message: 'revoked' }))

    const res = await GET(request('test-secret'))

    expect(failedMock).toHaveBeenCalledWith('pub_1', PlatformErrorCode.UNAUTHORIZED, 'revoked')
    expect(publishedMock).not.toHaveBeenCalled()
    expect(await res.json()).toEqual({ claimed: 1, published: 0, failed: 1 })
  })

  it('marks a job failed when execution throws', async () => {
    claimMock.mockResolvedValue(ok([makeJob()]))
    execMock.mockRejectedValue(new Error('kaboom'))

    await GET(request('test-secret'))

    expect(failedMock).toHaveBeenCalledWith('pub_1', 'INTERNAL_ERROR', 'kaboom')
  })

  it('returns 500 when claiming fails', async () => {
    claimMock.mockResolvedValue(err({ code: PlatformErrorCode.INTERNAL_ERROR, message: 'db down' }))
    const res = await GET(request('test-secret'))
    expect(res.status).toBe(500)
  })
})
