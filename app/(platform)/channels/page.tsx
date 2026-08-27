import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { bootstrapPlatform } from '@/infrastructure/platform'
import { channelsService } from '@/domains/channels'
import { YouTubeConnectionCard } from './_components/youtube-connection-card'

/**
 * Channels — connect the organization's own publishing accounts. V1 (Step
 * 3D-1a): YouTube connect / "Connected as <channel>" / disconnect. No publishing,
 * scheduling, or analytics here (later slices).
 */
export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<{ youtube?: string }>
}) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  await bootstrapPlatform()
  const result = await channelsService.getConnectionView(ctx.organizationId, 'youtube')
  const view = result.ok
    ? result.value
    : {
        connected: false as const,
        channel: 'youtube' as const,
        channelName: null,
        externalAccountId: null,
        status: 'disconnected' as const,
      }

  const { youtube } = await searchParams

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Channels</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your accounts so Koolerr can publish your approved videos.
        </p>
      </div>

      {youtube === 'connected' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          YouTube connected successfully.
        </div>
      )}
      {youtube === 'error' && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          YouTube connection did not complete. Please try again.
        </div>
      )}

      <YouTubeConnectionCard connected={view.connected} channelName={view.channelName} />
    </div>
  )
}
