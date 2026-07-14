'use client'

import { useState } from 'react'

interface PlanChangeButtonProps {
  planId: string
  children: React.ReactNode
  className: string
}

export function PlanChangeButton({ planId, children, className }: PlanChangeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to change plan. Please try again.')
        return
      }
      window.location.reload()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? 'Updating…' : children}
      </button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
