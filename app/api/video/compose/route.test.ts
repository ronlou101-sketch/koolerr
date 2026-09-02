import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/ai-workforce/render', () => ({ consumeSpokespersonVideoUsage: vi.fn() }))
vi.mock('@/domains/billing', () => ({ billingService: { checkEntitlement: vi.fn() } }))
vi.mock('@/domains/ai-workforce/video-production', async (orig) => {
  const actual = await (orig as () => Promise<Record<string, unknown>>)()
  return { ...actual, videoProductionDepartment: { renderSpokespersonVideo: vi.fn() } }
})

import { POST } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { billingService } from '@/domains/billing'
import {
  videoProductionDepartment,
  DEFAULT_AVATAR_ID,
  DEFAULT_VOICE_ID,
} from '@/domains/ai-workforce/video-production'
import { consumeSpokespersonVideoUsage } from '@/domains/ai-workforce/render'
import { ok } from '@/shared/types'

const ctxMock = vi.mocked(getRequestPlatformContext)
const checkMock = vi.mocked(billingService.checkEntitlement)
const renderMock = vi.mocked(videoProductionDepartment.renderSpokespersonVideo)
const consumeMock = vi.mocked(consumeSpokespersonVideoUsage)

function req(body: unknown): Request {
  return new Request('http://localhost/api/video/compose', {
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
  // Generous entitlement by default (both gates pass).
  checkMock.mockImplementation(async () => ok({ limit: 1000, used: 0 } as never))
  renderMock.mockResolvedValue(
    ok({
      assetUrl: 'https://cdn/v.mp4',
      deliverableId: 'del_v',
      engagementRunId: 'run_1',
      durationSeconds: 58,
    } as never)
  )
})

describe('POST /api/video/compose', () => {
  it('401 without a session', async () => {
    ctxMock.mockResolvedValue(null)
    expect((await POST(req({ script: 'hi', targetDurationSec: 60 }))).status).toBe(401)
  })

  it('400 when the script is empty', async () => {
    expect((await POST(req({ script: '  ', targetDurationSec: 60 }))).status).toBe(400)
  })

  it('400 for a non-preset duration', async () => {
    expect((await POST(req({ script: 'hi', targetDurationSec: 45 }))).status).toBe(400)
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('402 when the video COUNT is exhausted (no provider spend)', async () => {
    checkMock.mockImplementation(async (c) =>
      ok(
        (c.feature === 'spokesperson_video'
          ? { limit: 5, used: 5 }
          : { limit: 1000, used: 0 }) as never
      )
    )
    const res = await POST(req({ script: 'hi', targetDurationSec: 60 }))
    expect(res.status).toBe(402)
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('402 when remaining SECONDS cannot cover the requested length', async () => {
    checkMock.mockImplementation(async (c) =>
      ok(
        (c.feature === 'spokesperson_video_seconds'
          ? { limit: 600, used: 600 }
          : { limit: 1000, used: 0 }) as never
      )
    )
    const res = await POST(req({ script: 'hi', targetDurationSec: 60 }))
    expect(res.status).toBe(402)
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('renders (no scriptDeliverableId) + meters on success', async () => {
    const res = await POST(
      req({ script: 'Say hello to our customers.', title: 'Hi', targetDurationSec: 60 })
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ deliverableId: 'del_v' })
    expect(renderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        script: 'Say hello to our customers.',
        title: 'Hi',
      })
    )
    // customer-composed → no source script deliverable is referenced
    expect(renderMock.mock.calls[0][0]).not.toHaveProperty('scriptDeliverableId')
    expect(consumeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org_1',
        idempotencyKey: 'run_1',
        durationSeconds: 58,
      })
    )
  })

  it('defaults to the confirmed low-cost Armando + Michael C when no selection is given', async () => {
    await POST(req({ script: 'hi', targetDurationSec: 60 }))
    // Step 4B: this overrides the org Brand Ambassador with the ~$1/min default.
    expect(renderMock).toHaveBeenCalledWith(
      expect.objectContaining({ avatarId: DEFAULT_AVATAR_ID, voiceId: DEFAULT_VOICE_ID })
    )
  })

  it('passes a valid Armando + catalog voice selection through to the render', async () => {
    await POST(
      req({
        script: 'hi',
        targetDurationSec: 60,
        avatarId: 'Armando_Casual_Front_public',
        voiceId: '8661cd40d6c44c709e2d0031c0186ada',
      })
    )
    expect(renderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarId: 'Armando_Casual_Front_public',
        voiceId: '8661cd40d6c44c709e2d0031c0186ada',
      })
    )
  })

  it('rejects an avatar outside the cost-verified allowlist (400, no render/spend)', async () => {
    // Lorenzo photo avatar (~$3/min) must be blocked.
    const res = await POST(
      req({ script: 'hi', targetDurationSec: 60, avatarId: 'f5c6986bebd14deab71f1182771c57b9' })
    )
    expect(res.status).toBe(400)
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('rejects a voice outside the catalog (400, no render/spend)', async () => {
    const res = await POST(
      req({ script: 'hi', targetDurationSec: 60, voiceId: 'not_a_real_voice' })
    )
    expect(res.status).toBe(400)
    expect(renderMock).not.toHaveBeenCalled()
  })

  it('maps ENTITLEMENT_EXCEEDED from the render path to 402', async () => {
    renderMock.mockResolvedValue({
      ok: false,
      error: { code: 'ENTITLEMENT_EXCEEDED', message: 'limit' },
    } as never)
    expect((await POST(req({ script: 'hi', targetDurationSec: 60 }))).status).toBe(402)
  })
})
