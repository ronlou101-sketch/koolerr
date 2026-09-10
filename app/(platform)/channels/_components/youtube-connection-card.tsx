'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Minimal YouTube connection UI (Step 3D-1a). Not connected → "Connect YouTube"
 * (navigates to the connect route, which redirects to Google). Connected →
 * "Connected as <channel>" + "Disconnect". No upload/publish/schedule controls.
 */
export function YouTubeConnectionCard({
  connected,
  channelName,
}: {
  connected: boolean
  channelName: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  function connect() {
    // Full-page navigation so Google's consent redirect works.
    window.location.href = '/api/channels/youtube/connect'
  }

  async function disconnect() {
    setBusy(true)
    try {
      await fetch('/api/channels/youtube/disconnect', { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">YouTube</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {connected
              ? `Connected as ${channelName ?? 'your channel'}`
              : 'Publish approved spokesperson videos to your YouTube channel.'}
          </p>
        </div>
        {connected ? (
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {busy ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : (
          <button
            type="button"
            onClick={connect}
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-extrabold text-background hover:opacity-90"
          >
            Connect YouTube
          </button>
        )}
      </div>
    </div>
  )
}
