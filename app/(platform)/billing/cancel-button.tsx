'use client'

import { useState } from 'react'

interface CancelButtonProps {
  periodEndIso: string
}

export function CancelButton({ periodEndIso }: CancelButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [canceled, setCanceled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const periodEndLabel = new Date(periodEndIso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  async function handleCancel() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to cancel. Please try again.')
        return
      }
      setCanceled(true)
      setConfirming(false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (canceled) {
    return (
      <p className="text-xs text-muted-foreground">
        Subscription will end on {periodEndLabel}. Your access continues until then.
      </p>
    )
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Your access continues until {periodEndLabel}. Cancel anyway?
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading ? 'Canceling…' : 'Yes, cancel'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Keep plan
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
    >
      Cancel subscription
    </button>
  )
}
