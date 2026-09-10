import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()
const createSessionServerClient = vi.fn(async () => ({
  auth: { getUser },
}))

const getUserByEmail = vi.fn()
const getMemberships = vi.fn()

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  // Vitest uses the client React build where cache() is a no-op. Mirror the
  // RSC dispatcher behavior: store the in-flight Promise so concurrent callers
  // share one getUser() (as Next.js Server Components do via React cache).
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T): T => {
      let hit: unknown
      let filled = false
      return ((...args: never[]) => {
        if (!filled) {
          hit = fn(...args)
          filled = true
        }
        return hit
      }) as T
    },
  }
})

vi.mock('@/shared/lib/supabase-session', () => ({
  createSessionServerClient,
}))

vi.mock('@/domains/identity', () => ({
  identityService: {
    getUserByEmail,
    getMemberships,
    validateApiKey: vi.fn(),
  },
}))

vi.mock('@/infrastructure/platform', () => ({
  isPlatformBootstrapped: () => true,
  bootstrapPlatform: vi.fn(),
}))

vi.mock('@/shared/config/env', () => ({
  env: {
    platform: {
      tenantId: () => 'tenant_test',
    },
  },
}))

vi.mock('@/shared/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

describe('resolve auth email dedupe', () => {
  beforeEach(() => {
    vi.resetModules()
    getUser.mockReset()
    createSessionServerClient.mockClear()
    getUserByEmail.mockReset()
    getMemberships.mockReset()
  })

  it('getRequestAuthEmail returns undefined when unauthenticated', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null })
    const { getRequestAuthEmail } = await import('./resolve')
    await expect(getRequestAuthEmail()).resolves.toBeUndefined()
  })

  it('shares one getUser between context and email (React cache)', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'auth_1', email: 'ronlou101@gmail.com' } },
      error: null,
    })
    getUserByEmail.mockResolvedValue({
      ok: true,
      value: { id: 'user_1' },
    })
    getMemberships.mockResolvedValue({
      ok: true,
      value: [{ organizationId: 'org_1', role: 'owner' }],
    })

    const { getRequestAuthEmail, getRequestPlatformContext } = await import('./resolve')

    const [ctx, email] = await Promise.all([getRequestPlatformContext(), getRequestAuthEmail()])

    expect(email).toBe('ronlou101@gmail.com')
    expect(ctx).not.toBeNull()
    expect(ctx?.organizationId).toBe('org_1')
    expect(getUser).toHaveBeenCalledTimes(1)
    expect(createSessionServerClient).toHaveBeenCalledTimes(1)
  })

  it('founder gate email match is exact when email exposed', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'auth_1', email: 'ronlou101@gmail.com' } },
      error: null,
    })
    const { getRequestAuthEmail } = await import('./resolve')
    const email = await getRequestAuthEmail()
    expect(email === 'ronlou101@gmail.com').toBe(true)
  })
})
