import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform'
import { channelsService } from '@/domains/channels'
import { verifyOAuthState } from '@/domains/channels/oauth-state'
import { exchangeCodeForTokens, fetchChannelIdentity } from '@/domains/channels/youtube-oauth'
import { logger } from '@/shared/lib/logger'
import type { UserId } from '@/shared/types'

// Token exchange + identity fetch are quick, but keep headroom.
export const maxDuration = 60

/** Redirect back to the customer channels settings with a status flag. */
function backTo(origin: string, result: 'connected' | 'error'): Response {
  return NextResponse.redirect(new URL(`/channels?youtube=${result}`, origin))
}

/**
 * GET /api/channels/youtube/callback — Google redirects here with ?code&state.
 *
 * Validates the signed state (CSRF + org binding + expiry), confirms it matches
 * the authenticated org, exchanges the code server-side, reads the channel
 * identity, and persists an ENCRYPTED connection for that org. Tokens are never
 * logged, never put in the URL, and never returned to the browser.
 */
export async function GET(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin

  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = new URL(request.url).searchParams
  const code = params.get('code')
  const state = params.get('state')
  const oauthError = params.get('error')

  // User denied consent, or Google returned an error → no partial connection.
  if (oauthError || !code || !state) {
    return backTo(origin, 'error')
  }

  // Validate state signature + expiry, then require it to match THIS org.
  const verified = verifyOAuthState(state, Date.now())
  if (!verified.ok || verified.channel !== 'youtube') {
    logger.warn('[YOUTUBE_CALLBACK] invalid state', { reason: verified.reason })
    return backTo(origin, 'error')
  }
  if (verified.organizationId !== ctx.organizationId) {
    // The connect flow was started by a different org than the current session.
    logger.warn('[YOUTUBE_CALLBACK] state org mismatch')
    return backTo(origin, 'error')
  }

  try {
    await bootstrapPlatform()

    const tokens = await exchangeCodeForTokens(code)
    const identity = await fetchChannelIdentity(tokens.accessToken)

    const saved = await channelsService.saveConnection({
      organizationId: ctx.organizationId,
      tenantId: ctx.tenantId,
      channel: 'youtube',
      externalAccountId: identity.channelId,
      externalAccountName: identity.channelName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      connectedBy: ctx.actor.type === 'user' ? (ctx.actor.userId as UserId) : null,
    })
    if (!saved.ok) {
      logger.error('[YOUTUBE_CALLBACK] saveConnection failed', { error: saved.error.message })
      return backTo(origin, 'error')
    }
    return backTo(origin, 'connected')
  } catch (e) {
    // Never surface token material; log only a generic message.
    logger.error('[YOUTUBE_CALLBACK] connect failed', {
      error: e instanceof Error ? e.message : 'unknown',
    })
    return backTo(origin, 'error')
  }
}
