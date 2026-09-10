import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ChannelsService } from './service'
import { InMemoryChannelsRepository } from './in-memory-repository'
import type { OrganizationId, TenantId, UserId } from '@/shared/types'

const KEY_B64 = Buffer.alloc(32, 9).toString('base64')
const ORG_A = 'org_a' as OrganizationId
const ORG_B = 'org_b' as OrganizationId
const TENANT = 'tenant_1' as TenantId
const USER = 'user_1' as UserId

function saveInput(org: OrganizationId, access: string, refresh: string | null) {
  return {
    organizationId: org,
    tenantId: TENANT,
    channel: 'youtube' as const,
    externalAccountId: 'yt_channel_123',
    externalAccountName: 'My Channel',
    accessToken: access,
    refreshToken: refresh,
    tokenExpiresAt: null,
    scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    connectedBy: USER,
  }
}

describe('ChannelsService (Step 3D-1a)', () => {
  const prev = process.env.CHANNEL_TOKEN_ENC_KEY
  beforeAll(() => {
    process.env.CHANNEL_TOKEN_ENC_KEY = KEY_B64
  })
  afterAll(() => {
    if (prev === undefined) delete process.env.CHANNEL_TOKEN_ENC_KEY
    else process.env.CHANNEL_TOKEN_ENC_KEY = prev
  })

  it('saves a connection and returns a customer-safe view with NO token material', async () => {
    const svc = new ChannelsService(new InMemoryChannelsRepository())
    const res = await svc.saveConnection(saveInput(ORG_A, 'access-secret', 'refresh-secret'))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const view = res.value
    expect(view.connected).toBe(true)
    expect(view.channelName).toBe('My Channel')
    // The view carries no token fields at all.
    expect(JSON.stringify(view)).not.toContain('secret')
    expect('encryptedAccessToken' in view).toBe(false)
    expect('accessToken' in view).toBe(false)
  })

  it('stores tokens ENCRYPTED at rest (never plaintext)', async () => {
    const repo = new InMemoryChannelsRepository()
    const svc = new ChannelsService(repo)
    await svc.saveConnection(saveInput(ORG_A, 'plaintext-access', 'plaintext-refresh'))
    const stored = await repo.find(ORG_A, 'youtube')
    expect(stored?.encryptedAccessToken).toBeTruthy()
    expect(stored?.encryptedAccessToken).not.toContain('plaintext-access')
    expect(stored?.encryptedAccessToken?.startsWith('v1.')).toBe(true)
    expect(stored?.encryptedRefreshToken).not.toContain('plaintext-refresh')
  })

  it('reconnect updates in place — no duplicate connection', async () => {
    const repo = new InMemoryChannelsRepository()
    const svc = new ChannelsService(repo)
    const first = await svc.saveConnection(saveInput(ORG_A, 'a1', 'r1'))
    const second = await svc.saveConnection(saveInput(ORG_A, 'a2', 'r2'))
    expect(first.ok && second.ok).toBe(true)
    // Same id preserved (upsert on org+channel), and only one row for the org.
    const stored = await repo.find(ORG_A, 'youtube')
    expect(stored).not.toBeNull()
  })

  it('is org-isolated — one org cannot read another org’s connection', async () => {
    const repo = new InMemoryChannelsRepository()
    const svc = new ChannelsService(repo)
    await svc.saveConnection(saveInput(ORG_A, 'a', 'r'))
    const bView = await svc.getConnectionView(ORG_B, 'youtube')
    expect(bView.ok).toBe(true)
    if (bView.ok) expect(bView.value.connected).toBe(false)
  })

  it('disconnect affects only the current org', async () => {
    const repo = new InMemoryChannelsRepository()
    const svc = new ChannelsService(repo)
    await svc.saveConnection(saveInput(ORG_A, 'a', 'r'))
    await svc.saveConnection(saveInput(ORG_B, 'b', 'r'))
    await svc.disconnect(ORG_A, 'youtube')
    expect(await repo.find(ORG_A, 'youtube')).toBeNull()
    expect(await repo.find(ORG_B, 'youtube')).not.toBeNull() // untouched
  })
})
