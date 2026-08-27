import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createOAuthState, verifyOAuthState } from './oauth-state'

const KEY = Buffer.alloc(32, 3).toString('base64')
const NOW = 1_700_000_000_000

describe('OAuth state (CSRF + org binding)', () => {
  const prev = process.env.CHANNEL_TOKEN_ENC_KEY
  beforeAll(() => {
    process.env.CHANNEL_TOKEN_ENC_KEY = KEY
  })
  afterAll(() => {
    if (prev === undefined) delete process.env.CHANNEL_TOKEN_ENC_KEY
    else process.env.CHANNEL_TOKEN_ENC_KEY = prev
  })

  it('round-trips org + channel binding', () => {
    const state = createOAuthState('org_1', 'youtube', NOW)
    const v = verifyOAuthState(state, NOW + 1000)
    expect(v.ok).toBe(true)
    expect(v.organizationId).toBe('org_1')
    expect(v.channel).toBe('youtube')
  })

  it('rejects a tampered state (bad signature)', () => {
    const state = createOAuthState('org_1', 'youtube', NOW)
    const tampered = state.slice(0, -2) + (state.endsWith('AA') ? 'BB' : 'AA')
    expect(verifyOAuthState(tampered, NOW + 1000).ok).toBe(false)
  })

  it('rejects an expired state', () => {
    const state = createOAuthState('org_1', 'youtube', NOW)
    const v = verifyOAuthState(state, NOW + 11 * 60 * 1000) // > 10 min TTL
    expect(v.ok).toBe(false)
    expect(v.reason).toBe('expired state')
  })

  it('rejects malformed state', () => {
    expect(verifyOAuthState('garbage', NOW).ok).toBe(false)
  })

  it('a forged payload without the correct HMAC does not verify (no org spoofing)', () => {
    const forged = Buffer.from(
      JSON.stringify({
        organizationId: 'org_attacker',
        channel: 'youtube',
        nonce: 'x',
        exp: NOW + 100000,
      })
    ).toString('base64url')
    expect(verifyOAuthState(`${forged}.deadbeef`, NOW).ok).toBe(false)
  })
})
