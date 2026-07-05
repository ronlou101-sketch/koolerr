'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  DogfoodingObjective,
  DogfoodingCampaign,
  MarketingPlan,
  AdCopyVariant,
  DogfoodingCreative,
  ObjectiveStatus,
} from '@/domains/dogfooding'

const STATUS_CONFIG: Record<ObjectiveStatus, { dot: string; label: string; bg: string }> = {
  draft: { dot: 'bg-muted-foreground/40', label: 'Draft', bg: '' },
  active: { dot: 'bg-emerald-500', label: 'Active', bg: '' },
  paused: { dot: 'bg-amber-400', label: 'Paused', bg: '' },
  completed: { dot: 'bg-blue-500', label: 'Completed', bg: '' },
  archived: { dot: 'bg-muted-foreground/20', label: 'Archived', bg: '' },
}

const GOAL_LABELS: Record<string, string> = {
  brand_awareness: 'Brand Awareness',
  lead_generation: 'Lead Generation',
  user_acquisition: 'User Acquisition',
  retention: 'Retention',
  revenue: 'Revenue',
}

interface EnrichedCampaign extends DogfoodingCampaign {
  copyVariants: AdCopyVariant[]
  creatives: DogfoodingCreative[]
}

interface PageData {
  objective: DogfoodingObjective
  campaigns: EnrichedCampaign[]
  marketingPlan: MarketingPlan | null
}

function inferStages(data: PageData): {
  research: 'pending' | 'done'
  strategy: 'pending' | 'done'
  plan: 'pending' | 'done'
  copy: 'pending' | 'done'
  creative: 'pending' | 'done'
} {
  const hasCampaigns = data.campaigns.length > 0
  const hasPlan = data.marketingPlan !== null
  const hasCopy = data.campaigns.some((c) => c.copyVariants.length > 0)
  const hasCreative = data.campaigns.some((c) => c.creatives.length > 0)

  return {
    research: hasCampaigns || hasPlan ? 'done' : 'pending',
    strategy: hasCampaigns ? 'done' : 'pending',
    plan: hasPlan ? 'done' : 'pending',
    copy: hasCopy ? 'done' : 'pending',
    creative: hasCreative ? 'done' : 'pending',
  }
}

function PipelineProgress({
  stages,
  isRunning,
  status,
}: {
  stages: ReturnType<typeof inferStages>
  isRunning: boolean
  status: ObjectiveStatus
}) {
  const allDone = status === 'active'
  const failed = status === 'paused'

  const steps = [
    { key: 'research' as const, agent: 'marketing-researcher', label: 'Market Research' },
    { key: 'strategy' as const, agent: 'marketing-strategist', label: 'Campaign Strategy' },
    { key: 'plan' as const, agent: 'marketing-cmo', label: 'Marketing Plan' },
    { key: 'copy' as const, agent: 'marketing-copywriter', label: 'Ad Copy' },
    { key: 'creative' as const, agent: 'marketing-creative-director', label: 'Creative Direction' },
  ]

  const doneCount = Object.values(stages).filter((s) => s === 'done').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Pipeline Progress</h2>
        {isRunning && !allDone && !failed && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            <span className="text-xs text-amber-600 dark:text-amber-400">Running…</span>
          </div>
        )}
        {allDone && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Complete
          </span>
        )}
        {failed && <span className="text-xs font-medium text-destructive">Failed</span>}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${failed ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${allDone ? 100 : (doneCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {steps.map((step, i) => {
          const isDone = allDone || stages[step.key] === 'done'
          const isNext =
            !isDone && isRunning && (i === 0 || allDone || stages[steps[i - 1].key] === 'done')

          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 px-4 py-3 ${i < steps.length - 1 ? 'border-b border-border' : ''} ${isDone ? 'bg-card' : 'bg-muted/20'}`}
            >
              <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  isDone
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : isNext
                      ? 'animate-pulse bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-medium ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    {step.label}
                  </span>
                  <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {step.agent}
                  </span>
                </div>
              </div>
              {isDone && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Done</span>
              )}
              {isNext && !isDone && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Active</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ObjectiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pipelineRunning, setPipelineRunning] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  const fetchData = useCallback(
    async (quiet = false) => {
      if (!id) return
      if (!quiet) setLoading(true)
      try {
        const res = await fetch(`/api/tower/dogfooding/objectives/${id}`)
        const d = (await res.json()) as PageData & { error?: string }
        if (d.error) throw new Error(d.error)
        setData({
          objective: d.objective,
          campaigns: (d.campaigns ?? []) as EnrichedCampaign[],
          marketingPlan: d.marketingPlan ?? null,
        })
        setError(null)
        // Stop polling once pipeline finishes
        const terminal = d.objective?.status === 'active' || d.objective?.status === 'paused'
        if (terminal) {
          setIsPolling(false)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!quiet) setLoading(false)
      }
    },
    [id]
  )

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Poll every 5s while pipeline is running
  useEffect(() => {
    if (isPolling) {
      pollRef.current = setInterval(() => {
        void fetchData(true)
      }, 5000)
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isPolling, fetchData])

  async function runPipeline() {
    if (!id || pipelineRunning) return
    setPipelineRunning(true)
    setPipelineError(null)
    try {
      const res = await fetch(`/api/tower/dogfooding/objectives/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_pipeline' }),
      })
      const d = (await res.json()) as { engagementRunId?: string; status?: string; error?: string }
      if (!res.ok) throw new Error(d.error ?? 'Failed to start pipeline')
      setIsPolling(true)
      // Refresh immediately to pick up any fast changes
      await fetchData(true)
    } catch (e) {
      setPipelineError(e instanceof Error ? e.message : 'Failed to start pipeline')
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
  const hasOutput = campaigns.length > 0 || marketingPlan !== null
  const stages = inferStages(data)
  const showProgress = hasOutput || isPolling

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
              {objective.title.slice(0, 40)}
              {objective.title.length > 40 ? '…' : ''}
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

        <div className="flex items-center gap-2">
          {isPolling && (
            <button
              onClick={() => setIsPolling(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Stop watching
            </button>
          )}
          {canRunPipeline && (
            <button
              onClick={runPipeline}
              disabled={pipelineRunning || isPolling}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pipelineRunning ? 'Starting…' : 'Run Pipeline'}
            </button>
          )}
        </div>
      </div>

      {pipelineError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{pipelineError}</p>
        </div>
      )}

      {/* Pipeline Progress — shown once triggered */}
      {showProgress && (
        <PipelineProgress stages={stages} isRunning={isPolling} status={objective.status} />
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

      {/* No output yet */}
      {!hasOutput && !isPolling && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium text-foreground">Pipeline not yet run</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click &ldquo;Run Pipeline&rdquo; to trigger all 5 agents and generate a full campaign
            plan.
          </p>
          <button
            onClick={runPipeline}
            disabled={pipelineRunning}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {pipelineRunning ? 'Starting…' : 'Run Pipeline'}
          </button>
        </div>
      )}

      {/* Waiting for first output */}
      {!hasOutput && isPolling && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950">
          <div className="mx-auto mb-2 h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Agents are working… results will appear below as each stage completes.
          </p>
          <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-400/70">
            Full pipeline takes 2–4 minutes depending on complexity.
          </p>
        </div>
      )}

      {/* Marketing Plan */}
      {marketingPlan && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Marketing Plan</h2>
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div>
              <p className="text-base font-semibold text-foreground">{marketingPlan.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{marketingPlan.executiveSummary}</p>
            </div>
            {marketingPlan.messagingPillars.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Messaging Pillars
                </p>
                <ul className="space-y-1">
                  {marketingPlan.messagingPillars.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {marketingPlan.channelMix.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Channel Mix
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {marketingPlan.channelMix.map((ch, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs capitalize text-muted-foreground"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {marketingPlan.kpis.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  KPIs
                </p>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {marketingPlan.kpis.map((k, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-0.5 text-primary">·</span>
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Campaigns with inline output */}
      {campaigns.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Campaigns ({campaigns.length})</h2>
          {campaigns.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-border bg-card">
              {/* Campaign header */}
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.objectiveSummary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {c.status}
                    </span>
                    {c.channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground"
                      >
                        {ch}
                      </span>
                    ))}
                    {c.budgetCents > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ${(c.budgetCents / 100).toLocaleString()} budget
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/tower/dogfooding/campaigns/${c.id}`}
                  className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
                >
                  Full detail →
                </Link>
              </div>

              {/* Ad Copy Variants */}
              {c.copyVariants.length > 0 && (
                <div className="border-b border-border px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ad Copy Variants ({c.copyVariants.length})
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {c.copyVariants.map((v) => (
                      <div
                        key={v.id}
                        className="space-y-1.5 rounded-md border border-border/60 bg-muted/20 p-3"
                      >
                        <p className="text-xs font-semibold text-foreground">{v.headline}</p>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {v.primaryText}
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {v.callToAction}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{v.variantName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Direction */}
              {c.creatives.length > 0 && (
                <div className="px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Creative Direction ({c.creatives.length})
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {c.creatives.map((cr) => {
                      const meta = cr.metadata as Record<string, unknown>
                      return (
                        <div
                          key={cr.id}
                          className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-3"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                              {cr.type}
                            </span>
                            {meta?.adFormat ? (
                              <span className="text-[10px] text-muted-foreground">
                                {String(meta.adFormat)}
                              </span>
                            ) : null}
                          </div>
                          {meta?.concept ? (
                            <p className="text-[11px] font-medium text-foreground">
                              {String(meta.concept)}
                            </p>
                          ) : null}
                          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                            {cr.prompt.length > 250 ? `${cr.prompt.slice(0, 250)}…` : cr.prompt}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                            Higgsfield prompt ready
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Placeholder while campaign is being processed */}
              {c.copyVariants.length === 0 && c.creatives.length === 0 && isPolling && (
                <div className="px-5 py-4 text-center">
                  <div className="mx-auto mb-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-xs text-muted-foreground">Generating copy and creatives…</p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
