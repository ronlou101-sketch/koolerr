import { beforeEach, describe, expect, it, vi } from 'vitest'

// The middleware validates the session via supabase.auth.getUser(). Stub the
// client so we can simulate an UNAUTHENTICATED request without any network/DB.
const getUserMock = vi.fn()
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: getUserMock } }),
}))
vi.mock('@/shared/config/env', () => ({
  env: { supabase: { url: () => 'http://localhost', anonKey: () => 'anon-key' } },
}))
vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import { NextRequest } from 'next/server'
import { middleware } from './middleware'

function request(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost${path}`))
}

describe('middleware — B1: publish-jobs cron reachability', () => {
  beforeEach(() => {
    getUserMock.mockReset()
    // No authenticated user (the pg_cron request carries no session cookie).
    getUserMock.mockResolvedValue({ data: { user: null }, error: null })
  })

  it('does NOT redirect an unauthenticated request to /api/cron/publish-jobs (reachable)', async () => {
    const res = await middleware(request('/api/cron/publish-jobs'))
    // NextResponse.next() → no redirect Location; the route itself enforces
    // CRON_SECRET (covered by app/api/cron/publish-jobs/route.test.ts).
    expect(res.headers.get('location')).toBeNull()
  })

  it('still redirects an unauthenticated request to a protected path to /login', async () => {
    const res = await middleware(request('/dashboard'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/login')
  })

  it('keeps the render-jobs cron path reachable too (unchanged)', async () => {
    const res = await middleware(request('/api/cron/render-jobs'))
    expect(res.headers.get('location')).toBeNull()
  })
})
