'use client'

import { useState } from 'react'
import Link from 'next/link'

type GenerationState = 'idle' | 'loading' | 'success' | 'error'

export default function CreativePage() {
  const [prompt, setPrompt] = useState('')
  const [state, setState] = useState<GenerationState>('idle')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [deliverableId, setDeliverableId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsedSecs, setElapsedSecs] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || state === 'loading') return

    setState('loading')
    setImageUrl(null)
    setDeliverableId(null)
    setError(null)
    setElapsedSecs(0)

    const startTime = Date.now()
    const timer = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    try {
      const res = await fetch('/api/image/higgsfield/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      const data = (await res.json()) as {
        imageUrl?: string
        deliverableId?: string | null
        error?: string
      }

      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error ?? 'Generation failed')
      }

      setImageUrl(data.imageUrl)
      setDeliverableId(data.deliverableId ?? null)
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setState('error')
    } finally {
      clearInterval(timer)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Image Generation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate cinematic images using Higgsfield AI.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-foreground">
              Scene prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cinematic sunrise over a city skyline, golden hour lighting..."
              rows={4}
              disabled={state === 'loading'}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!prompt.trim() || state === 'loading'}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === 'loading' ? 'Generating…' : 'Generate image'}
          </button>
        </form>
      </div>

      {state === 'loading' && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              Generating via Higgsfield… {elapsedSecs}s
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Cinematic image generation typically takes 1–3 minutes. Please keep this page open.
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${Math.min((elapsedSecs / 180) * 100, 95)}%` }}
            />
          </div>
        </div>
      )}

      {state === 'error' && error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Generation failed</p>
          <p className="mt-1 text-xs text-destructive/80">{error}</p>
          <button
            onClick={() => setState('idle')}
            className="mt-3 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}

      {state === 'success' && imageUrl && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm font-medium text-foreground">Generated image</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={prompt} className="w-full rounded-md object-contain" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="break-all text-xs text-muted-foreground">{imageUrl}</p>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs text-primary underline hover:text-primary/80"
            >
              Open
            </a>
          </div>
          {deliverableId && (
            <Link
              href={`/deliverables/${deliverableId}`}
              className="mt-3 block text-xs text-primary hover:underline"
            >
              View in Deliverables →
            </Link>
          )}
          <button
            onClick={() => {
              setState('idle')
              setPrompt('')
            }}
            className="mt-4 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Generate another
          </button>
        </div>
      )}
    </div>
  )
}
