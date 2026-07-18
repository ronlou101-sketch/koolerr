import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/business-brain', () => ({
  businessBrainService: {
    synthesizeInsights: vi.fn(),
    listAllMemories: vi.fn(),
  },
}))

import { GET } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import type {
  OrganizationId,
  TenantId,
  BusinessMemory,
  BusinessMemoryId,
  BusinessBrainId,
  BusinessMemoryType,
  UserId,
} from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org_brain_53' as OrganizationId
const BRAIN_ID = 'brain_test_53' as BusinessBrainId

function makeCtx() {
  return {
    tenantId: 'tenant_test' as TenantId,
    organizationId: ORG_ID,
    actor: {
      type: 'user' as const,
      userId: 'user_1' as UserId,
      sessionId: 'sess_1',
      role: 'owner' as const,
    },
    requestId: 'req_brain53',
  }
}

function makeReport(
  opts: {
    totalMemories?: number
    countsByType?: Partial<Record<string, number>>
    mostDocumented?: BusinessMemoryType | null
  } = {}
) {
  return {
    ok: true as const,
    value: {
      organizationId: ORG_ID,
      businessBrainId: BRAIN_ID,
      generatedAt: new Date('2026-06-01'),
      insights: [],
      trends: {
        totalMemories: opts.totalMemories ?? 0,
        countsByType: opts.countsByType ?? {},
        mostDocumented: opts.mostDocumented ?? null,
        undocumentedTypes: [],
      },
    },
  }
}

function makeMemory(overrides: Partial<BusinessMemory> = {}): BusinessMemory {
  return {
    id: 'memory_1' as BusinessMemoryId,
    businessBrainId: BRAIN_ID,
    organizationId: ORG_ID,
    type: 'knowledge',
    content: {},
    source: 'test-source',
    relevanceScope: [],
    version: 1,
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...overrides,
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
  vi.mocked(businessBrainService.synthesizeInsights).mockResolvedValue(makeReport())
  vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({ ok: true, value: [] })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/brain/insights', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 500 when synthesizeInsights fails', async () => {
    vi.mocked(businessBrainService.synthesizeInsights).mockResolvedValue({
      ok: false,
      error: { code: PlatformErrorCode.INTERNAL_ERROR, message: 'Brain failure' },
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('returns 500 when listAllMemories fails', async () => {
    vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({
      ok: false,
      error: { code: PlatformErrorCode.INTERNAL_ERROR, message: 'Memories failure' },
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })

  it('returns 200 with correct totalMemories from report', async () => {
    vi.mocked(businessBrainService.synthesizeInsights).mockResolvedValue(
      makeReport({ totalMemories: 9, countsByType: { knowledge: 5, brand: 4 } })
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalMemories).toBe(9)
  })

  it('computes coveragePct from the number of documented types', async () => {
    vi.mocked(businessBrainService.synthesizeInsights).mockResolvedValue(
      makeReport({ countsByType: { knowledge: 3, brand: 2, product: 1 } })
    )
    const res = await GET()
    const data = await res.json()
    // 3 types / 12 total × 100 = 25
    expect(data.coveragePct).toBe(25)
  })

  it('returns lastUpdatedAt from the most recently updated memory', async () => {
    vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({
      ok: true,
      value: [
        makeMemory({ updatedAt: new Date('2026-05-01') }),
        makeMemory({ id: 'memory_2' as BusinessMemoryId, updatedAt: new Date('2026-07-01') }),
      ],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.lastUpdatedAt).toBe(new Date('2026-07-01').toISOString())
  })

  it('returns null lastUpdatedAt when no memories exist', async () => {
    vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({
      ok: true,
      value: [],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.lastUpdatedAt).toBeNull()
  })

  it('returns campaignTopics from engagement_run knowledge memories with objective', async () => {
    vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({
      ok: true,
      value: [
        makeMemory({
          source: 'engagement_run:run_abc',
          type: 'knowledge',
          content: { objective: 'Q3 Social Campaign', deliverableId: 'del_1' },
          createdAt: new Date('2026-06-15'),
        }),
      ],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.campaignTopics).toHaveLength(1)
    expect(data.campaignTopics[0].objective).toBe('Q3 Social Campaign')
  })

  it('excludes memories from non-engagement_run sources in campaignTopics', async () => {
    vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({
      ok: true,
      value: [
        makeMemory({
          source: 'ai-workforce-pipeline',
          type: 'knowledge',
          content: { objective: 'Should not appear — wrong source' },
        }),
        makeMemory({
          id: 'memory_2' as BusinessMemoryId,
          source: 'engagement_run:run_abc',
          type: 'brand',
          content: { objective: 'Should not appear — wrong type' },
        }),
      ],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.campaignTopics).toHaveLength(0)
  })

  it('excludes knowledge memories without a string objective from campaignTopics', async () => {
    vi.mocked(businessBrainService.listAllMemories).mockResolvedValue({
      ok: true,
      value: [
        makeMemory({
          source: 'engagement_run:run_abc',
          type: 'knowledge',
          content: { step: 'research', status: 'completed' },
        }),
      ],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.campaignTopics).toHaveLength(0)
  })
})
