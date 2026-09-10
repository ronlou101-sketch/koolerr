import { NextResponse } from 'next/server'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform'
import { channelsService } from '@/domains/channels'

/**
 * GET /api/channels/youtube/status — customer-safe connection status for the
 * authenticated org. Returns ONLY the view (connected flag, channel name/id,
 * status). Never any token material. Strictly scoped to ctx.organizationId.
 */
export async function GET(): Promise<Response> {
  const ctx = await getRequestPlatformContext()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await bootstrapPlatform()
  const result = await channelsService.getConnectionView(ctx.organizationId, 'youtube')
  if (!result.ok) {
    return NextResponse.json({ error: 'Failed to load status' }, { status: 500 })
  }
  return NextResponse.json(result.value)
}
