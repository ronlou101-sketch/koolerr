import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/shared/config/env', () => ({ env: { platform: { tenantId: () => 'tenant_1' } } }))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: { listWorkforces: vi.fn() },
}))
vi.mock('@/domains/ai-workforce/video-production', async (orig) => {
  const actual = await (orig as () => Promise<Record<string, unknown>>)()
  return { ...actual, videoProductionDepartment: { writeCustomerVideoScript: vi.fn() } }
})

import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { videoProductionDepartment } from '@/domains/ai-workforce/video-production'
import { ok } from '@/shared/types'

const ctxMock = vi.mocked(getRequestPlatformContext)
const listMock = vi.mocked(workforceEngineService.listWorkforces)
const writeMock = vi.mocked(videoProductionDepartment.writeCustomerVideoScript)

function req(body: unknown): Request {
  return new Request('http://localhost/api/video/script/assist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const CTX = {
  organizationId: 'org_1',
  tenantId: 'tenant_1',
  actor: { type: 'user', userId: 'u1' },
} as unknown as NonNullable<Awaited<ReturnType<typeof getRequestPlatformContext>>>

beforeEach(() => {
  vi.clearAllMocks()
  ctxMock.mockResolvedValue(CTX)
  listMock.mockResolvedValue(ok([{ id: 'wf_1', businessFunction: 'Content Marketing' }] as never))
  writeMock.mockResolvedValue(
    ok({
      title: 'Draft',
      script: 'Hello from your team.',
      platform: 'facebook',
      estimatedDurationSec: 60,
    } as never)
  )
})

describe('POST /api/video/script/assist', () => {
  it('401 without a session', async () => {
    ctxMock.mockResolvedValue(null)
    expect((await POST(req({ description: 'x', targetDurationSec: 60 }))).status).toBe(401)
  })

  it('400 when the description is empty', async () => {
    expect((await POST(req({ description: '', targetDurationSec: 60 }))).status).toBe(400)
  })

  it('400 for a non-preset duration', async () => {
    expect((await POST(req({ description: 'x', targetDurationSec: 45 }))).status).toBe(400)
  })

  it('400 when the org has no Content Marketing workforce', async () => {
    listMock.mockResolvedValue(ok([] as never))
    expect((await POST(req({ description: 'x', targetDurationSec: 60 }))).status).toBe(400)
    expect(writeMock).not.toHaveBeenCalled()
  })

  it('drafts a script (no provider video spend) and returns it', async () => {
    const res = await POST(
      req({ description: 'Spring sale', targetDurationSec: 60, tone: 'friendly' })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ script: 'Hello from your team.', title: 'Draft' })
    expect(writeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        workforceId: 'wf_1',
        targetDurationSec: 60,
        tone: 'friendly',
      })
    )
  })

  it('502 when drafting fails', async () => {
    writeMock.mockResolvedValue({
      ok: false,
      error: { code: 'TIMEOUT', message: 'x', retriable: true },
    } as never)
    expect((await POST(req({ description: 'x', targetDurationSec: 60 }))).status).toBe(502)
  })
})
