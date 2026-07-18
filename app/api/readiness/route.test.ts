import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/business-brain', () => ({
  businessBrainService: { queryMemory: vi.fn() },
}))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: { listWorkforces: vi.fn() },
}))

import { GET } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import type {
  BusinessBrainId,
  OrganizationId,
  TenantId,
  UserId,
  Workforce,
  WorkforceId,
} from '@/shared/types'
import { PlatformErrorCode } from '@/shared/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ORG_ID = 'org_readiness_55' as OrganizationId
const BRAIN_ID = 'brain_readiness' as BusinessBrainId

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
    requestId: 'req_readiness',
  }
}

function makeMemoryResult(count: number) {
  return {
    ok: true as const,
    value: {
      businessBrainId: BRAIN_ID,
      memories: [],
      totalCount: count,
    },
  }
}

function makeWorkforce(status: 'active' | 'inactive' = 'active'): Workforce {
  return {
    id: 'workforce_1' as WorkforceId,
    organizationId: ORG_ID,
    name: 'Content Team',
    businessFunction: 'Content Marketing',
    status,
    goals: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRequestPlatformContext).mockResolvedValue(makeCtx())
  vi.mocked(businessBrainService.queryMemory).mockResolvedValue(makeMemoryResult(5))
  vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
    ok: true,
    value: [makeWorkforce('active')],
  })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/readiness', () => {
  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with ready: true when brain configured and workforce active', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ready).toBe(true)
  })

  it('returns ready: false when brain has no memories', async () => {
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue(makeMemoryResult(0))
    const res = await GET()
    const data = await res.json()
    expect(data.ready).toBe(false)
    expect(data.checks.brainConfigured).toBe(false)
  })

  it('returns ready: false when no workforce is active', async () => {
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [makeWorkforce('inactive')],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.ready).toBe(false)
    expect(data.checks.workforceActive).toBe(false)
  })

  it('sets brainConfigured: false when queryMemory fails — graceful degradation', async () => {
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue({
      ok: false,
      error: { code: PlatformErrorCode.INTERNAL_ERROR, message: 'DB error' },
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.checks.brainConfigured).toBe(false)
  })

  it('sets workforceActive: false when listWorkforces fails — graceful degradation', async () => {
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: false,
      error: { code: PlatformErrorCode.INTERNAL_ERROR, message: 'DB error' },
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.checks.workforceActive).toBe(false)
  })

  it('includes missing item for unconfigured Brain', async () => {
    vi.mocked(businessBrainService.queryMemory).mockResolvedValue(makeMemoryResult(0))
    const res = await GET()
    const data = await res.json()
    expect(data.missingItems).toContain('Business Brain not configured — complete onboarding')
  })

  it('includes missing item when no active workforce', async () => {
    vi.mocked(workforceEngineService.listWorkforces).mockResolvedValue({
      ok: true,
      value: [],
    })
    const res = await GET()
    const data = await res.json()
    expect(data.missingItems).toContain('No active workforce registered')
  })

  it('returns empty missingItems when platform is fully ready', async () => {
    const res = await GET()
    const data = await res.json()
    expect(data.missingItems).toHaveLength(0)
  })

  it('returns both checks passing when fully configured', async () => {
    const res = await GET()
    const data = await res.json()
    expect(data.checks.brainConfigured).toBe(true)
    expect(data.checks.workforceActive).toBe(true)
  })
})
