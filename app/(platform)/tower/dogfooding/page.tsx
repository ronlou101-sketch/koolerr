'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import type {
  DogfoodingObjective,
  DogfoodingCampaign,
  AdCopyVariant,
  DogfoodingCreative,
  DogfoodingLearning,
  ObjectiveStatus,
} from '@/domains/dogfooding'
import type { BusinessMemory } from '@/shared/types'

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

const CAMPAIGN_STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  planning: { dot: 'bg-muted-foreground/40', label: 'Planning' },
  ready: { dot: 'bg-emerald-500', label: 'Ready' },
  active: { dot: 'bg-blue-500', label: 'Active' },
  paused: { dot: 'bg-amber-400', label: 'Paused' },
  completed: { dot: 'bg-violet-500', label: 'Completed' },
  archived: { dot: 'bg-muted-foreground/20', label: 'Archived' },
}

interface DashboardData {
  stats: {
    totalObjectives: number
    activeObjectives: number
    draftObjectives: number
    totalCampaigns: number
    readyCampaigns: number
    totalCopyVariants: number
    totalCreatives: number
    totalLearnings: number
  }
  objectives: DogfoodingObjective[]
  campaigns: DogfoodingCampaign[]
  copyVariants: AdCopyVariant[]
  creatives: DogfoodingCreative[]
  learnings: DogfoodingLearning[]
  activity: BusinessMemory[]
}

function PipelineActivityItem({ memory }: { memory: BusinessMemory }) {
  const content = memory.content as Record<string, unknown>
  const domain = String(content?.domain ?? '')
  const step = String(content?.step ?? '')
  const status = String(content?.status ?? '')

  let agentLabel = ''
  let stepLabel = step
  if (domain === 'dogfooding-pipeline') {
    const stepMap: Record<string, string> = {
      research: 'Research',
      strategy: 'Campaign Strategy',
      'cmo-plan': 'Marketing Plan',
    }
    if (step.startsWith('copy:')) stepLabel = 'Ad Copy'
    else if (step.startsWith('creative:')) stepLabel = 'Creative Direction'
    else stepLabel = stepMap[step] ?? step
  } else if (domain === 'dogfooding-research') {
    agentLabel = 'marketing-researcher'
    stepLabel = 'Market Research stored'
  }

  const agentForStep: Record<string, string> = {
    research: 'marketing-researcher',
    strategy: 'marketing-strategist',
    'cmo-plan': 'marketing-cmo',
    'Ad Copy': 'marketing-copywriter',
    'Creative Direction': 'marketing-creative-director',
  }
  const agent = agentLabel || agentForStep[stepLabel] || agentForStep[step] || ''

  const statusColor =
    status === 'completed'
      ? 'text-emerald-600 dark:text-emerald-400'
      : status === 'failed'
        ? 'text-destructive'
        : 'text-amber-600 dark:text-amber-400'

  const ts = new Date(memory.createdAt)
  const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground/40" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-medium text-foreground">{stepLabel}</span>
          {agent && (
            <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
              {agent}
            </span>
          )}
          {status && domain === 'dogfooding-pipeline' && (
            <span className={`text-[10px] font-medium capitalize ${statusColor}`}>{status}</span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">{timeStr}</p>
      </div>
    </div>
  )
}

export default function DogfoodingDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(() => {
    fetch('/api/tower/dogfooding/dashboard')
      .then((r) => r.json())
      .then((d: DashboardData & { error?: string }) => {
        if (d.error) throw new Error(d.error)
        setData(d)
        setLastRefresh(new Date())
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading dashboard…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">{error ?? 'Failed to load dashboard'}</p>
        <button onClick={load} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
          Retry
        </button>
      </div>
    )
  }

  const { stats, objectives, campaigns, copyVariants, creatives, learnings, activity } = data
  const runningObjectives = objectives.filter(
    (o) => o.status === 'draft' && o.engagementRunId != null
  )
  const activeObjectives = objectives.filter((o) => o.status === 'active')
  const recentCampaigns = campaigns.slice(0, 6)

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">Dogfooding</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Internal Marketing Department
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Autonomous marketing for Koolerr — 8 AI agents, 5-stage pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-[11px] text-muted-foreground/60">
              Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={load}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Refresh
          </button>
          <Link
            href="/tower/dogfooding/objectives/new"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            New Objective
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {[
            {
              label: 'Objectives',
              value: stats.totalObjectives,
              sub: `${stats.activeObjectives} active`,
              href: '/tower/dogfooding/objectives',
            },
            {
              label: 'Campaigns',
              value: stats.totalCampaigns,
              sub: `${stats.readyCampaigns} ready`,
              href: '/tower/dogfooding/campaigns',
            },
            {
              label: 'Copy Variants',
              value: stats.totalCopyVariants,
              sub: 'AI-generated',
              href: null,
            },
            {
              label: 'Creatives',
              value: stats.totalCreatives,
              sub: 'Higgsfield prompts',
              href: null,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              {s.href ? (
                <Link href={s.href} className="block">
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
                </Link>
              ) : (
                <>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-foreground">{s.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.sub}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Status (running) */}
      {runningObjectives.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Pipeline Running</h2>
          {runningObjectives.map((o) => (
            <Link
              key={o.id}
              href={`/tower/dogfooding/objectives/${o.id}`}
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950"
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{o.title}</p>
                <p className="text-xs text-muted-foreground">
                  Pipeline in progress — click to watch live
                </p>
              </div>
              <span className="text-xs text-muted-foreground">→</span>
            </Link>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left column: Objectives + Campaigns */}
        <div className="space-y-8 lg:col-span-2">
          {/* Active Objectives */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Active Objectives ({activeObjectives.length})
              </h2>
              <Link
                href="/tower/dogfooding/objectives"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                All objectives →
              </Link>
            </div>
            {activeObjectives.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No active objectives yet.{' '}
                  <Link
                    href="/tower/dogfooding/objectives/new"
                    className="text-foreground underline underline-offset-2"
                  >
                    Create one
                  </Link>{' '}
                  and run the pipeline.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {activeObjectives.map((o) => {
                  const { dot, label } = STATUS_CONFIG[o.status]
                  return (
                    <Link
                      key={o.id}
                      href={`/tower/dogfooding/objectives/${o.id}`}
                      className="flex items-center justify-between gap-4 bg-card px-4 py-3 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{o.title}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {GOAL_LABELS[o.goalType] ?? o.goalType}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">→</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* All Objectives (draft/paused) */}
          {objectives.filter((o) => o.status !== 'active').length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">All Objectives</h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {objectives.map((o) => {
                  const { dot, label } = STATUS_CONFIG[o.status]
                  return (
                    <Link
                      key={o.id}
                      href={`/tower/dogfooding/objectives/${o.id}`}
                      className="flex items-center justify-between gap-4 bg-card px-4 py-3 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{o.title}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {GOAL_LABELS[o.goalType] ?? o.goalType}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">→</span>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Current Campaigns */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Campaigns ({campaigns.length})
              </h2>
              {campaigns.length > 0 && (
                <Link
                  href="/tower/dogfooding/campaigns"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  All campaigns →
                </Link>
              )}
            </div>
            {recentCampaigns.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Campaigns will appear here after a pipeline run.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {recentCampaigns.map((c) => {
                  const cfg = CAMPAIGN_STATUS_CONFIG[c.status] ?? CAMPAIGN_STATUS_CONFIG.planning
                  return (
                    <Link
                      key={c.id}
                      href={`/tower/dogfooding/campaigns/${c.id}`}
                      className="flex items-center justify-between gap-4 bg-card px-4 py-3 hover:bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            <span className="text-xs text-muted-foreground">{cfg.label}</span>
                          </div>
                          {c.channels.slice(0, 3).map((ch) => (
                            <span
                              key={ch}
                              className="rounded bg-muted px-1 py-0.5 text-[10px] capitalize text-muted-foreground"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">→</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Generated Copy Variants */}
          {copyVariants.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                Generated Copy Variants ({stats.totalCopyVariants})
              </h2>
              <div className="space-y-3">
                {copyVariants.slice(0, 6).map((v) => (
                  <div
                    key={v.id}
                    className="space-y-1.5 rounded-lg border border-border bg-card p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">{v.headline}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{v.primaryText}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {v.callToAction}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{v.variantName}</span>
                    </div>
                  </div>
                ))}
                {stats.totalCopyVariants > 6 && (
                  <p className="text-center text-xs text-muted-foreground">
                    +{stats.totalCopyVariants - 6} more — view in campaign detail
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Generated Creative Prompts */}
          {creatives.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                Generated Creative Prompts ({stats.totalCreatives})
              </h2>
              <div className="space-y-3">
                {creatives.slice(0, 4).map((cr) => {
                  const meta = cr.metadata as Record<string, unknown>
                  return (
                    <div
                      key={cr.id}
                      className="space-y-2 rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-2">
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
                        <p className="text-xs font-medium text-foreground">
                          {String(meta.concept)}
                        </p>
                      ) : null}
                      <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                        {cr.prompt.length > 200 ? `${cr.prompt.slice(0, 200)}…` : cr.prompt}
                      </p>
                    </div>
                  )
                })}
                {stats.totalCreatives > 4 && (
                  <p className="text-center text-xs text-muted-foreground">
                    +{stats.totalCreatives - 4} more — view in campaign detail
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Business Brain Learnings */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Business Brain Learnings ({learnings.length})
            </h2>
            {learnings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Learnings will populate after the Analyst agent processes campaign performance.
                  Available in Phase 2.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                {learnings.slice(0, 5).map((l) => (
                  <div key={l.id} className="bg-card px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground">{l.insight}</p>
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">
                          {l.learningType}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">
                          {l.confidence}
                        </span>
                      </div>
                    </div>
                    {l.actionable && (
                      <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        Actionable
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right column: Agent Activity Feed */}
        <div className="space-y-4 lg:col-span-1">
          <div className="sticky top-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Agent Activity Feed</h2>
              {activity.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6">
                  <p className="text-center text-xs text-muted-foreground">
                    Agent activity will appear here as pipelines run.
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] divide-y divide-border/50 overflow-y-auto rounded-lg border border-border bg-card px-4 py-2">
                  {activity.map((m) => (
                    <PipelineActivityItem key={m.id} memory={m} />
                  ))}
                </div>
              )}
            </section>

            {/* Quick Links */}
            <section className="mt-6 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Quick Links
              </h2>
              <div className="space-y-1">
                {[
                  { href: '/tower/dogfooding/objectives/new', label: 'New Objective' },
                  { href: '/tower/dogfooding/objectives', label: 'All Objectives' },
                  { href: '/tower/dogfooding/campaigns', label: 'All Campaigns' },
                  { href: '/tower/dogfooding/settings', label: 'Settings & Phase 2' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  >
                    {link.label}
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
