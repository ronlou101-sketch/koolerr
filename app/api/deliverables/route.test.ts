import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/deliverables', () => ({
  deliverablesService: { listDeliverables: vi.fn() },
}))
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { GET } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { deliverablesService } from '@/domains/deliverables'
import type { DeliverableId, EngagementRunId, OrganizationId, TenantId } from '@/shared/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org_media_test' as OrganizationId
const TENANT_ID = 'tenant_test' as TenantId

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
    requestId: 'req_test_media',
  }
}

function makeDeliverable(
  type: 'video_script' | 'video' | 'image' | 'blog_post',
  id = `del_${type}_1`
) {
  return {
    id: id as DeliverableId,
    organizationId: ORG_ID,
    engagementRunId: 'run_1' as EngagementRunId,
    type,
    title: `Test ${type}`,
    content: {},
    status: 'draft' as const,
    version: 1,
    attributedTo: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function get(url = 'http://localhost/api/deliverables') {
  return new Request(url, { method: 'GET' })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/deliverables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    vi.mocked(deliverablesService.listDeliverables).mockResolvedValue({
      ok: true,
      value: [],
    })
  })

  it('returns 401 when no auth context', async () => {
    const res = await GET(get())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 500 when listDeliverables fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.listDeliverables).mockResolvedValue({
      ok: false,
      error: { code: 'INTERNAL_ERROR' as never, message: 'db error' },
    })

    const res = await GET(get())

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/Failed to load/)
  })

  it('returns empty deliverables array when none exist', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    const res = await GET(get())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deliverables).toEqual([])
  })

  it('returns only media-type deliverables when no type filter', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.listDeliverables).mockResolvedValue({
      ok: true,
      value: [
        makeDeliverable('video_script'),
        makeDeliverable('video'),
        makeDeliverable('image'),
        makeDeliverable('blog_post'),
      ] as never[],
    })

    const res = await GET(get())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deliverables).toHaveLength(3)
    expect(body.deliverables.map((d: { type: string }) => d.type)).toEqual(
      expect.arrayContaining(['video_script', 'video', 'image'])
    )
    expect(body.deliverables.map((d: { type: string }) => d.type)).not.toContain('blog_post')
  })

  it('passes organizationId from context to the service', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await GET(get())

    expect(deliverablesService.listDeliverables).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_ID })
    )
  })

  it('passes type filter to service when ?type= is a valid media type', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())

    await GET(get('http://localhost/api/deliverables?type=video_script'))

    expect(deliverablesService.listDeliverables).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'video_script' })
    )
  })

  it('returns filtered deliverables for ?type=video', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.listDeliverables).mockResolvedValue({
      ok: true,
      value: [makeDeliverable('video')] as never[],
    })

    const res = await GET(get('http://localhost/api/deliverables?type=video'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.deliverables).toHaveLength(1)
    expect(body.deliverables[0].type).toBe('video')
  })

  it('ignores unknown type param and returns all media types', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
    vi.mocked(deliverablesService.listDeliverables).mockResolvedValue({
      ok: true,
      value: [makeDeliverable('video_script'), makeDeliverable('image')] as never[],
    })

    const res = await GET(get('http://localhost/api/deliverables?type=blog_post'))

    expect(res.status).toBe(200)
    // blog_post is not a valid media type, so no type filter should be passed
    expect(deliverablesService.listDeliverables).toHaveBeenCalledWith(
      expect.objectContaining({ type: undefined })
    )
  })
})
