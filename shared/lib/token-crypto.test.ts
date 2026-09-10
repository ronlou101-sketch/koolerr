import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// A valid 32-byte key, base64-encoded, set BEFORE importing the module under test
// (the module reads env lazily per-call, so setting it here is sufficient).
const VALID_KEY_B64 = Buffer.alloc(32, 7).toString('base64')

describe('token-crypto (AES-256-GCM)', () => {
  let encryptToken: typeof import('./token-crypto').encryptToken
  let decryptToken: typeof import('./token-crypto').decryptToken
  const prev = process.env.CHANNEL_TOKEN_ENC_KEY

  beforeAll(async () => {
    process.env.CHANNEL_TOKEN_ENC_KEY = VALID_KEY_B64
    const mod = await import('./token-crypto')
    encryptToken = mod.encryptToken
    decryptToken = mod.decryptToken
  })
  afterAll(() => {
    if (prev === undefined) delete process.env.CHANNEL_TOKEN_ENC_KEY
    else process.env.CHANNEL_TOKEN_ENC_KEY = prev
  })

  it('round-trips a token (encrypt → decrypt) with matching org+channel', () => {
    const plaintext = 'ya29.a0-secret-access-token'
    const blob = encryptToken(plaintext, 'org_1', 'youtube')
    expect(decryptToken(blob, 'org_1', 'youtube')).toBe(plaintext)
  })

  it('produces a versioned, non-plaintext ciphertext with a fresh IV each time', () => {
    const a = encryptToken('same', 'org_1', 'youtube')
    const b = encryptToken('same', 'org_1', 'youtube')
    expect(a.startsWith('v1.')).toBe(true)
    expect(a).not.toContain('same')
    expect(a).not.toBe(b) // random IV → different ciphertext for identical input
  })

  it('rejects a tampered ciphertext (auth-tag verification fails)', () => {
    const blob = encryptToken('secret', 'org_1', 'youtube')
    const parts = blob.split('.')
    // Flip a byte in the ciphertext segment.
    const ct = Buffer.from(parts[3], 'base64url')
    ct[0] ^= 0xff
    const tampered = [parts[0], parts[1], parts[2], ct.toString('base64url')].join('.')
    expect(() => decryptToken(tampered, 'org_1', 'youtube')).toThrow()
  })

  it('fails to decrypt when the org context differs (AAD binding)', () => {
    const blob = encryptToken('secret', 'org_1', 'youtube')
    expect(() => decryptToken(blob, 'org_2', 'youtube')).toThrow()
  })

  it('fails to decrypt when the channel context differs (AAD binding)', () => {
    const blob = encryptToken('secret', 'org_1', 'youtube')
    expect(() => decryptToken(blob, 'org_1', 'tiktok')).toThrow()
  })

  it('rejects malformed input', () => {
    expect(() => decryptToken('not-a-valid-blob', 'org_1', 'youtube')).toThrow()
    expect(() => decryptToken('v2.a.b.c', 'org_1', 'youtube')).toThrow()
  })
})

describe('token-crypto fails closed on a bad key', () => {
  const prev = process.env.CHANNEL_TOKEN_ENC_KEY

  afterAll(() => {
    if (prev === undefined) delete process.env.CHANNEL_TOKEN_ENC_KEY
    else process.env.CHANNEL_TOKEN_ENC_KEY = prev
  })

  it('throws when the key decodes to the wrong length', async () => {
    process.env.CHANNEL_TOKEN_ENC_KEY = Buffer.alloc(16, 1).toString('base64') // 16 bytes
    const mod = await import('./token-crypto')
    expect(() => mod.encryptToken('x', 'org_1', 'youtube')).toThrow(/32 bytes/)
  })

  it('throws when the key is missing', async () => {
    delete process.env.CHANNEL_TOKEN_ENC_KEY
    const mod = await import('./token-crypto')
    expect(() => mod.encryptToken('x', 'org_1', 'youtube')).toThrow()
  })
})
