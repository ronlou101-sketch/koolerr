import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform'
import { channelsService } from '@/domains/channels'
import { decryptToken } from '@/shared/lib/token-crypto'
import { revokeToken } from '@/domains/channels/youtube-oauth'
import { logger } from '@/shared/lib/logger'

/**
 * DELETE /api/channels/youtube/disconnect — disconnect the authenticated org's
 * YouTube connection: best-effort revoke at Google, then remove the stored
 * (encrypted) credentials. Strictly scoped to ctx.organizationId — one org can
 * never affect another's connection. No token material is ever returned.
 */
export async function DELETE(): Promise<Response> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await bootstrapPlatform()

  // Best-effort token revocation at Google before local removal.
  const existing = await channelsService.getConnection(ctx.organizationId, 'youtube')
  if (existing.ok && existing.value?.encryptedRefreshToken) {
    try {
      const refresh = decryptToken(
        existing.value.encryptedRefreshToken,
        ctx.organizationId,
        'youtube'
      )
      await revokeToken(refresh)
    } catch (e) {
      // Revocation is best-effort; proceed with local disconnect regardless.
      logger.warn('[YOUTUBE_DISCONNECT] revoke skipped', {
        error: e instanceof Error ? e.message : 'unknown',
      })
    }
  }

  const result = await channelsService.disconnect(ctx.organizationId, 'youtube')
  if (!result.ok) {
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
  }
  return NextResponse.json({ disconnected: true })
}
