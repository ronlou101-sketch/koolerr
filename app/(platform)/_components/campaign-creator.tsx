'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AIWorkforceProgress } from '../dashboard/_components/AIWorkforceProgress'

type FlowState = 'idle' | 'loading' | 'running' | 'done' | 'error'

/**
 * The campaign-creation flow (Experience Phase 13).
 *
 * Extracted verbatim from the former /pipeline page so the SAME flow can be
 * rendered both as a full page (backward-compat /pipeline) and inside the
 * "New campaign" modal on Campaigns (Slice C). Presentation only — it posts to
 * the existing `POST /api/pipeline/run` and streams progress via the existing
 * AIWorkforceProgress component. No engine, orchestration, or API change.
 *
 * It renders only the flow chrome (form → progress → done); the surrounding
 * title/box is supplied by the caller (page heading or modal header).
 *
 * @param onStarted fired once when a run begins, so a caller (e.g. the modal)
 *   can refresh a server-rendered list to reveal the new campaign.
 */
export function CampaignCreator({ onStarted }: { onStarted?: () => void }) {
  const [topic, setTopic] = useState('')
  const [brief, setBrief] = useState('')
  const [state, setState] = useState<FlowState>('idle')
  const [runId, setRunId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [needsProfile, setNeedsProfile] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!topic.trim() || state === 'loading') return

    setState('loading')
    setError(null)
    setNeedsProfile(false)
    setRunId(null)

    try {
      // Same engine, same request — only the surface changes.
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), brief: brief.trim() || undefined }),
      })

      const data = (await res.json()) as { engagementRunId?: string; error?: string }

      if (!res.ok || !data.engagementRunId) {
        throw new Error(data.error ?? 'could not start')
      }

      setRunId(data.engagementRunId)
      setState('running')
      onStarted?.()
    } catch (err) {
      // Detect the "needs onboarding" case from the raw error, but never show
      // the raw/technical text to the customer — keep the message calm and human.
      const raw = (err instanceof Error ? err.message : '').toLowerCase()
      setNeedsProfile(
        raw.includes('wizard') ||
          raw.includes('onboarding') ||
          raw.includes('brain') ||
          raw.includes('profile')
      )
      setError("I couldn't get started just now. Please try again.")
      setState('error')
    }
  }

  return (
    <div className="space-y-6">
      {(state === 'idle' || state === 'error') && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-foreground">
              What would you like your marketing to accomplish?{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. More weekend bookings, more leads from Google, more repeat customers"
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="brief" className="block text-sm font-medium text-foreground">
              Anything specific I should know?{' '}
              <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Audience, tone, timing, or a particular focus — optional."
              rows={3}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {state === 'error' && error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
              {needsProfile && (
                <Link
                  href="/onboarding"
                  className="mt-1 block text-xs text-primary hover:underline"
                >
                  Finish your business profile first →
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!topic.trim()}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start campaign
          </button>
        </form>
      )}

      {state === 'loading' && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Getting started…</span>
        </div>
      )}

      {state === 'running' && runId && (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-blue-800">
              On it — I&apos;m getting your campaign underway.
            </p>
            <p className="mt-0.5 text-xs text-blue-700">
              I&apos;ll research your market, plan the campaign, and create your content. This
              usually takes 2–5 minutes.
            </p>
          </div>

          <AIWorkforceProgress runId={runId} onComplete={() => setState('done')} />
        </div>
      )}

      {state === 'done' && runId && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-800">
              All done — here&apos;s what I put together.
            </p>
            <p className="mt-0.5 text-xs text-green-700">Want to take a look?</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/deliverables"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Review it →
            </Link>
            <Link
              href={`/runs/${runId}`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              See the details
            </Link>
            <button
              type="button"
              onClick={() => {
                setState('idle')
                setTopic('')
                setBrief('')
                setRunId(null)
              }}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Start another campaign
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
