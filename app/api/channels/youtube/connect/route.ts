import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { createOAuthState } from '@/domains/channels/oauth-state'
import { buildAuthorizationUrl } from '@/domains/channels/youtube-oauth'

/**
 * GET /api/channels/youtube/connect — start the YouTube OAuth connect flow.
 *
 * Requires an authenticated Koolerr user; binds a signed OAuth `state` to the
 * caller's organization (NEVER a query param) and redirects to Google's consent
 * screen. No token handling here.
 */
export async function GET(): Promise<Response> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = createOAuthState(ctx.organizationId, 'youtube', Date.now())
  const url = buildAuthorizationUrl(state)
  return NextResponse.redirect(url)
}
