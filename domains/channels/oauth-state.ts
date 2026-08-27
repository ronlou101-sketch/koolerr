import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/shared/config/env'

/**
 * OAuth `state` — CSRF protection + organization binding for the YouTube connect
 * flow. The state is HMAC-signed (keyed on CHANNEL_TOKEN_ENC_KEY, a server-only
 * secret) so a client cannot forge it, carries the organizationId so the callback
 * associates the connection with exactly the org that started the flow (never a
 * query-param-supplied org), a random nonce, and a short expiry.
 *
 * Server-only (imports the token encryption key accessor). Format:
 *   base64url(json).base64url(hmac)
 */

const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface StatePayload {
  organizationId: string
  channel: string
  nonce: string
  exp: number // epoch ms
}

function signingKey(): Buffer {
  // Reuse the platform token-encryption secret purely as an HMAC key here; it is
  // never exposed and is unrelated to the token ciphertext (different operation).
  return Buffer.from(env.channels.tokenEncryptionKey(), 'utf8')
}

const b64u = (b: Buffer): string => b.toString('base64url')

function hmac(payloadB64: string): string {
  return b64u(createHmac('sha256', signingKey()).update(payloadB64).digest())
}

/** Create a signed state for an org+channel with a random nonce and TTL. */
export function createOAuthState(organizationId: string, channel: string, nowMs: number): string {
  const payload: StatePayload = {
    organizationId,
    channel,
    nonce: b64u(Buffer.from(crypto.randomUUID())),
    exp: nowMs + STATE_TTL_MS,
  }
  const payloadB64 = b64u(Buffer.from(JSON.stringify(payload), 'utf8'))
  return `${payloadB64}.${hmac(payloadB64)}`
}

export interface VerifiedState {
  ok: boolean
  organizationId?: string
  channel?: string
  reason?: string
}

/** Verify signature + expiry. Returns the bound org/channel on success. */
export function verifyOAuthState(state: string, nowMs: number): VerifiedState {
  const parts = state.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'malformed state' }
  const [payloadB64, sig] = parts

  const expected = hmac(payloadB64)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad signature' }
  }

  let payload: StatePayload
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as StatePayload
  } catch {
    return { ok: false, reason: 'unparseable payload' }
  }
  if (typeof payload.exp !== 'number' || payload.exp < nowMs) {
    return { ok: false, reason: 'expired state' }
  }
  return { ok: true, organizationId: payload.organizationId, channel: payload.channel }
}
