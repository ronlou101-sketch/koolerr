'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function GenerateVideoButton({ deliverableId }: { deliverableId: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  async function generate() {
    setState('loading')
    setError(null)
    setElapsed(0)

    const started = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000))
    }, 1000)

    try {
      const res = await fetch('/api/video/heygen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverableId }),
      })
      const data = (await res.json()) as { deliverableId?: string | null; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Video generation failed')
      if (data.deliverableId) {
        router.push(`/deliverables/${data.deliverableId}`)
      } else {
        setState('idle')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed')
      setState('error')
    } finally {
      clearInterval(timer)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={state === 'loading'}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {state === 'loading'
          ? `Generating video… ${elapsed > 0 ? `(${elapsed}s)` : ''}`
          : 'Generate Video with HeyGen'}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
