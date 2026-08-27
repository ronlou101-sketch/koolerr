import { env } from '@/shared/config/env'

/**
 * Google/YouTube OAuth2 client helpers (server-only). Authorization-code +
 * offline flow. NO googleapis dependency — plain fetch against Google's public
 * OAuth + YouTube Data API endpoints. Publishing/upload is NOT here (Step 3D-2);
 * this only exchanges the code and reads the connected channel identity.
 *
 * Never logs client_secret or tokens.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke'
const CHANNELS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true'

/** Minimum scopes for V1: upload (publish) + readonly (identify the channel). */
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]

/** Build the Google consent URL. `state` is our signed, org-bound state. */
export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.channels.google.clientId(),
    redirect_uri: env.channels.google.redirectUri(),
    response_type: 'code',
    scope: YOUTUBE_SCOPES.join(' '),
    access_type: 'offline', // request a refresh token
    include_granted_scopes: 'true',
    prompt: 'consent', // ensure a refresh token is returned on reconnect
    state,
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

export interface TokenExchangeResult {
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  scopes: string[]
}

/**
 * Thrown when Google reports the grant is no longer valid (invalid_grant) —
 * the user revoked access or the refresh token expired. Callers should treat
 * this as a TERMINAL auth failure (reconnect required), not a transient error.
 */
export class YouTubeAuthRevokedError extends Error {
  readonly revoked = true
  constructor(message = 'YouTube authorization is no longer valid') {
    super(`[YOUTUBE_OAUTH] ${message}`)
    this.name = 'YouTubeAuthRevokedError'
  }
}

export interface RefreshResult {
  accessToken: string
  expiresAt: Date | null
}

/**
 * Exchange a stored refresh token for a fresh access token (server-side).
 * Throws YouTubeAuthRevokedError on invalid_grant (revoked/expired) so the
 * caller can fail terminally; throws a generic error on transient failures.
 * Never logs the refresh token, the new access token, or the client secret.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: env.channels.google.clientId(),
    client_secret: env.channels.google.clientSecret(),
    grant_type: 'refresh_token',
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    // Inspect (without echoing) whether this is a terminal revocation.
    let revoked = false
    try {
      const j = (await res.json()) as { error?: string }
      revoked = res.status === 400 && j.error === 'invalid_grant'
    } catch {
      /* non-JSON body — treat as transient */
    }
    if (revoked) throw new YouTubeAuthRevokedError()
    throw new Error(`[YOUTUBE_OAUTH] token refresh failed (${res.status})`)
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) throw new Error('[YOUTUBE_OAUTH] refresh response missing access_token')
  return {
    accessToken: json.access_token,
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null,
  }
}

/** Exchange an authorization code for tokens (server-side; uses client_secret). */
export async function exchangeCodeForTokens(code: string): Promise<TokenExchangeResult> {
  const body = new URLSearchParams({
    code,
    client_id: env.channels.google.clientId(),
    client_secret: env.channels.google.clientSecret(),
    redirect_uri: env.channels.google.redirectUri(),
    grant_type: 'authorization_code',
  })
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    // Do not include the response body verbatim — it may echo sensitive fields.
    throw new Error(`[YOUTUBE_OAUTH] token exchange failed (${res.status})`)
  }
  const json = (await res.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  }
  if (!json.access_token) throw new Error('[YOUTUBE_OAUTH] token response missing access_token')
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: json.expires_in ? new Date(Date.now() + json.expires_in * 1000) : null,
    scopes: json.scope ? json.scope.split(' ') : [],
  }
}

export interface YouTubeIdentity {
  channelId: string | null
  channelName: string | null
}

/** Read the connected YouTube channel identity (safe to display). */
export async function fetchChannelIdentity(accessToken: string): Promise<YouTubeIdentity> {
  const res = await fetch(CHANNELS_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error(`[YOUTUBE_OAUTH] channel identity fetch failed (${res.status})`)
  }
  const json = (await res.json()) as {
    items?: Array<{ id?: string; snippet?: { title?: string } }>
  }
  const item = json.items?.[0]
  return {
    channelId: item?.id ?? null,
    channelName: item?.snippet?.title ?? null,
  }
}

/** Best-effort revoke of a token at Google (used on disconnect). Never throws. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(REVOKE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    })
  } catch {
    // Revocation is best-effort; local disconnect proceeds regardless.
  }
}
