'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { EngagementRun } from '@/shared/types'

type RunStatus = EngagementRun['status']

const STATUS_LABELS: Record<RunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  awaiting_approval: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
}

const STATUS_COLORS: Record<RunStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  running: 'bg-blue-100 text-blue-700',
  awaiting_approval: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-destructive/10 text-destructive',
}

export default function RunsPage() {
  const [objective, setObjective] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runs, setRuns] = useState<EngagementRun[]>([])
  const [loadingRuns, setLoadingRuns] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/runs')
      .then((r) => r.json())
      .then((data) => setRuns(data.runs ?? []))
      .catch(() => setRuns([]))
      .finally(() => setLoadingRuns(false))
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!objective.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 402) {
          setError(
            'Run limit reached for this billing period. ' + 'Check your usage on the Usage page.'
          )
        } else {
          setError(data.error ?? 'Run failed')
        }
        return
      }

      const { deliverableId } = await res.json()
      router.push(`/deliverables/${deliverableId}`)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Content Runs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Give your Content Workforce an objective and they&apos;ll produce a deliverable for your
          review.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-medium text-foreground">New Run</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="objective" className="block text-sm font-medium text-foreground">
              Objective
            </label>
            <textarea
              id="objective"
              rows={3}
              required
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Write a blog post about the benefits of AI in customer service"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !objective.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Your workforce is working…' : 'Run'}
          </button>
        </form>
        {loading && (
          <p className="mt-3 text-xs text-muted-foreground">
            Your strategist, copywriter, and editor are collaborating. This takes about 30–60
            seconds.
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-foreground">Run History</h2>
        {loadingRuns ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : runs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No runs yet. Start your first one above.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{run.objective}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{run.id}</p>
                </div>
                <span
                  className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[run.status]}`}
                >
                  {STATUS_LABELS[run.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
