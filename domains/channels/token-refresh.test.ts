import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ChannelsService } from './service'
import { InMemoryChannelsRepository } from './in-memory-repository'
import type { OrganizationId, TenantId } from '@/shared/types'

const KEY_B64 = Buffer.alloc(32, 5).toString('base64')
const ORG = 'org_refresh' as OrganizationId
const TENANT = 'tenant_1' as TenantId
const REFRESH_SECRET = 'REFRESH-TOKEN-SECRET-VALUE'

async function seedExpiredConnection(svc: ChannelsService) {
  await svc.saveConnection({
    organizationId: ORG,
    tenantId: TENANT,
    channel: 'youtube',
    externalAccountId: 'yt_1',
    externalAccountName: 'My Channel',
    accessToken: 'OLD-ACCESS',
    refreshToken: REFRESH_SECRET,
    tokenExpiresAt: new Date(Date.now() - 1000), // already expired → forces refresh
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    connectedBy: null,
  })
}

describe('getValidYouTubeAccessToken — refresh + no token leakage', () => {
  const prevKey = process.env.CHANNEL_TOKEN_ENC_KEY
  const prevId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const prevSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

  beforeAll(() => {
    process.env.CHANNEL_TOKEN_ENC_KEY = KEY_B64
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'test-client-id'
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'test-client-secret'
  })
  afterEach(() => vi.unstubAllGlobals())
  afterAll(() => {
    process.env.CHANNEL_TOKEN_ENC_KEY = prevKey
    process.env.GOOGLE_OAUTH_CLIENT_ID = prevId
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = prevSecret
  })

  it('refreshes an expired access token and persists it ENCRYPTED (no plaintext)', async () => {
    const repo = new InMemoryChannelsRepository()
    const svc = new ChannelsService(repo)
    await seedExpiredConnection(svc)

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ access_token: 'NEW-ACCESS-TOKEN', expires_in: 3600 }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )

    const res = await svc.getValidYouTubeAccessToken(ORG)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.value).toBe('NEW-ACCESS-TOKEN')

    // Persisted access token is ciphertext, not the plaintext.
    const stored = await repo.find(ORG, 'youtube')
    expect(stored?.encryptedAccessToken?.startsWith('v1.')).toBe(true)
    expect(stored?.encryptedAccessToken).not.toContain('NEW-ACCESS-TOKEN')
    // Refresh token preserved (still ciphertext, never plaintext).
    expect(stored?.encryptedRefreshToken).not.toContain(REFRESH_SECRET)
  })

  it('returns a typed UNAUTHORIZED (not a loop) on revoked grant, leaking no token material', async () => {
    const repo = new InMemoryChannelsRepository()
    const svc = new ChannelsService(repo)
    await seedExpiredConnection(svc)

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'invalid_grant' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    )

    const res = await svc.getValidYouTubeAccessToken(ORG)
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('UNAUTHORIZED')
      expect(res.error.message).not.toContain(REFRESH_SECRET)
      expect(res.error.message.toLowerCase()).not.toContain('token-secret')
    }
    // Connection marked expired so the UI prompts a reconnect (no infinite retry).
    const stored = await repo.find(ORG, 'youtube')
    expect(stored?.status).toBe('expired')
  })

  it('returns UNAUTHORIZED when there is no connected YouTube account', async () => {
    const svc = new ChannelsService(new InMemoryChannelsRepository())
    const res = await svc.getValidYouTubeAccessToken(ORG)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error.code).toBe('UNAUTHORIZED')
  })
})
