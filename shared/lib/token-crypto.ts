/**
 * Application-layer AES-256-GCM encryption for OAuth tokens at rest (Step 3D-1a).
 *
 * SERVER-ONLY. This module reads a platform secret (CHANNEL_TOKEN_ENC_KEY) and
 * uses Node's built-in crypto. It must never be imported into client/browser
 * code. A runtime guard below throws if it is somehow evaluated in a browser.
 *
 * Design (all requirements pinned):
 * - AES-256-GCM (authenticated encryption).
 * - Fresh cryptographically-random 12-byte IV per encryption.
 * - GCM auth tag stored and verified on decrypt (tamper detection → throw).
 * - Key = base64(CHANNEL_TOKEN_ENC_KEY) that MUST decode to exactly 32 bytes;
 *   fail closed if missing/invalid. Never derived from a predictable value.
 * - AAD binds ciphertext to the (organizationId, channel) context so a blob
 *   cannot be silently reassigned to another org/channel (decrypt fails).
 * - Never logs the key, plaintext, ciphertext, IV, or auth tag.
 *
 * Serialized format (single opaque string stored in the DB):
 *   v1.<base64url(iv)>.<base64url(authTag)>.<base64url(ciphertext)>
 *
 * CHANNEL_TOKEN_ENC_KEY format — a base64 string decoding to exactly 32 bytes,
 * e.g. generate with:  openssl rand -base64 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '@/shared/config/env'

if (typeof window !== 'undefined') {
  // Defensive: this must never run in a browser bundle.
  throw new Error('[TOKEN_CRYPTO] server-only module imported in a browser context')
}

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const KEY_BYTES = 32
const VERSION = 'v1'

/** Decode + validate the key. Fail closed on missing/wrong-length key. */
function loadKey(): Buffer {
  const raw = env.channels.tokenEncryptionKey() // throws if missing
  let key: Buffer
  try {
    key = Buffer.from(raw, 'base64')
  } catch {
    throw new Error('[TOKEN_CRYPTO] CHANNEL_TOKEN_ENC_KEY is not valid base64')
  }
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `[TOKEN_CRYPTO] CHANNEL_TOKEN_ENC_KEY must decode to exactly ${KEY_BYTES} bytes (got ${key.length})`
    )
  }
  return key
}

/** Additional authenticated data binding the ciphertext to its owner + channel. */
function aad(organizationId: string, channel: string): Buffer {
  return Buffer.from(`${organizationId}:${channel}`, 'utf8')
}

const b64u = (b: Buffer): string => b.toString('base64url')
const fromB64u = (s: string): Buffer => Buffer.from(s, 'base64url')

/**
 * Encrypt a plaintext token, binding it to (organizationId, channel).
 * Returns the opaque serialized string to persist. Never logs any material.
 */
export function encryptToken(plaintext: string, organizationId: string, channel: string): string {
  const key = loadKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 })
  cipher.setAAD(aad(organizationId, channel))
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${VERSION}.${b64u(iv)}.${b64u(authTag)}.${b64u(ciphertext)}`
}

/**
 * Decrypt a serialized token, verifying the auth tag AND the (organizationId,
 * channel) binding. Throws on any tamper / wrong context / malformed input.
 */
export function decryptToken(serialized: string, organizationId: string, channel: string): string {
  const parts = serialized.split('.')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('[TOKEN_CRYPTO] malformed or unsupported token ciphertext')
  }
  const key = loadKey()
  const iv = fromB64u(parts[1])
  const authTag = fromB64u(parts[2])
  const ciphertext = fromB64u(parts[3])
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 })
  decipher.setAAD(aad(organizationId, channel))
  decipher.setAuthTag(authTag)
  // .final() throws if the auth tag / AAD do not verify — tamper detection.
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}
