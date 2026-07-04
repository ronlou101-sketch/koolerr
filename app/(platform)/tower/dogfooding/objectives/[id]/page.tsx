'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import type {
  DogfoodingObjective,
  DogfoodingCampaign,
  MarketingPlan,
  ObjectiveStatus,
} from '@/domains/dogfooding'

const STATUS_CONFIG: Record<ObjectiveStatus, { dot: string; label: string }> = {
  draft: { dot: 'bg-muted-foreground/40', label: 'Draft' },
  active: { dot: 'bg-emerald-500', label: 'Active' },
  paused: { dot: 'bg-amber-400', label: 'Paused' },
  completed: { dot: 'bg-blue-500', label: 'Completed' },
  archived: { dot: 'bg-muted-foreground/20', label: 'Archived' },
}

const GOAL_LABELS: Record<string, string> = {
  brand_awareness: 'Brand Awareness',
  lead_generation: 'Lead Generation',
  user_acquisition: 'User Acquisition',
  retention: 'Retention',
  revenue: 'Revenue',
}

interface PageData {
  objective: DogfoodingObjective
  campaigns: DogfoodingCampaign[]
  marketingPlan: MarketingPlan | null
}

export default function ObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/tower/dogfooding/objectives/${id}`)
      .then((r) => r.json())
      .then(
        (d: {
          objective?: DogfoodingObjective
          campaigns?: DogfoodingCampaign[]
          marketingPlan?: MarketingPlan | null
          error?: string
        }) => {
          if (d.error) throw new Error(d.error)
          setData({
            objective: d.objective!,
            campaigns: d.campaigns ?? [],
            marketingPlan: d.marketingPlan ?? null,
          })
        }
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function runPipeline() {
    if (!id || pipelineRunning) return
    setPipelineRunning(true)
    setPipelineMessage(null)
    try {
      const res = await fetch(`/api/tower/dogfooding/objectives/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_pipeline' }),
      })
      const d = (await res.json()) as { engagementRunId?: string; status?: string; error?: string }
      if (!res.ok) throw new Error(d.error ?? 'Failed to start pipeline')
      setPipelineMessage(
        `Pipeline started (run ${d.engagementRunId?.slice(0, 8)}…). Refresh in 2-3 minutes to see results.`
      )
    } catch (e) {
      setPipelineMessage(e instanceof Error ? e.message : 'Failed to start pipeline')
    } finally {
      setPipelineRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading objective…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">{error ?? 'Objective not found'}</p>
        <Link
          href="/tower/dogfooding/objectives"
          className="mt-3 block text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to objectives
        </Link>
      </div>
    )
  }

  const { objective, campaigns, marketingPlan } = data
  const { dot, label } = STATUS_CONFIG[objective.status] ?? STATUS_CONFIG.draft
  const canRunPipeline = objective.status === 'draft' || objective.status === 'paused'

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <Link href="/tower/dogfooding" className="hover:text-foreground">
              Dogfooding
            </Link>
            <span>/</span>
            <Link href="/tower/dogfooding/objectives" className="hover:text-foreground">
              Objectives
            </Link>
            <span>/</span>
            <span className="text-foreground">
              {objective.title.slice(0, 30)}
              {objective.title.length > 30 ? '…' : ''}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">{objective.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {GOAL_LABELS[objective.goalType] ?? objective.goalType}
            </span>
            {objective.budgetCents > 0 && (
              <span className="text-xs text-muted-foreground">
                Budget: ${(objective.budgetCents / 100).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {canRunPipeline && (
          <button
            onClick={runPipeline}
            disabled={pipelineRunning}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pipelineRunning ? 'Starting…' : 'Run Pipeline'}
          </button>
        )}
      </div>

      {pipelineMessage && (
        <div className="rounded-md border border-border bg-muted/50 p-4">
          <p className="text-sm text-foreground">{pipelineMessage}</p>
        </div>
      )}

      {/* Objective Details */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Details</h2>
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-1 text-sm text-foreground">{objective.description}</p>
          </div>
          {objective.targetAudience && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target Audience
              </p>
              <p className="mt-1 text-sm text-foreground">{objective.targetAudience}</p>
            </div>
          )}
          {objective.successMetrics.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Success Metrics
              </p>
              <ul className="mt-1 space-y-0.5">
                {objective.successMetrics.map((m, i) => (
                  <li key={i} className="text-sm text-foreground">
                    · {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Marketing Plan */}
      {marketingPlan && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Marketing Plan</h2>
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground">{marketingPlan.title}</p>
            <p className="text-sm text-muted-foreground">{marketingPlan.executiveSummary}</p>
            {marketingPlan.messagingPillars.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Messaging Pillars
                </p>
                <ul className="space-y-0.5">
                  {marketingPlan.messagingPillars.map((p, i) => (
                    <li key={i} className="text-sm text-foreground">
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {marketingPlan.kpis.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  KPIs
                </p>
                <ul className="space-y-0.5">
                  {marketingPlan.kpis.map((k, i) => (
                    <li key={i} className="text-sm text-foreground">
                      · {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Campaigns */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Campaigns ({campaigns.length})</h2>
          {campaigns.length > 0 && (
            <Link
              href="/tower/dogfooding/campaigns"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all →
            </Link>
          )}
        </div>
        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {objective.status === 'draft'
                ? 'Run the pipeline to generate campaigns automatically.'
                : 'No campaigns generated yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/tower/dogfooding/campaigns/${c.id}`}
                className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground/20"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {c.objectiveSummary}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {c.channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {c.status}
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
