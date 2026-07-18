/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'

vi.mock('@/infrastructure/auth', () => ({ getRequestPlatformContext: vi.fn() }))
vi.mock('@/domains/workforce-engine', () => ({
  workforceEngineService: {
    listEngagementRuns: vi.fn(),
  },
}))

import { GET } from './route'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { createPlatformContext } from '@/shared/context'

const CTX = createPlatformContext({
  tenantId: 'tenant_test' as TenantId,
  organizationId: 'org_test' as OrganizationId,
  actor: { type: 'user', userId: 'user_1' as UserId, sessionId: 'sess_1', role: 'owner' },
  requestId: 'req_1',
})

describe('GET /api/runs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 200 with empty runs list', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: true,
      value: [],
    })
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ runs: [] })
  })

  it('returns 500 when listEngagementRuns fails', async () => {
    vi.mocked(getRequestPlatformContext).mockResolvedValue(CTX)
    vi.mocked(workforceEngineService.listEngagementRuns).mockResolvedValue({
      ok: false,
      error: { message: 'DB error' } as any,
    })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
