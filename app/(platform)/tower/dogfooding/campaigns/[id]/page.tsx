'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { DogfoodingCampaign, AdCopyVariant, DogfoodingCreative } from '@/domains/dogfooding'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CampaignDetailData {
  campaign: DogfoodingCampaign
  copyVariants: AdCopyVariant[]
  creatives: DogfoodingCreative[]
}

type PhaseStatus = 'pending' | 'running' | 'completed'

// 'hidden'     — never shown, or fully removed after fade-out
// 'running'    — pipeline is in progress; tracker is visible
// 'completing' — pipeline just finished; hold the all-done state for 1 s
// 'fadeout'    — opacity transitioning to 0 before DOM removal
type TrackerPhase = 'hidden' | 'running' | 'completing' | 'fadeout'

// ── FadeInCard ─────────────────────────────────────────────────────────────────
// Fades + slides a card in from below on mount.
// `delay` (ms) is used to stagger cards in a list.

function FadeInCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined
    const rafId = requestAnimationFrame(() => {
      timerId = setTimeout(() => setVisible(true), delay)
    })
    return () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId)
      if (timerId !== undefined) clearTimeout(timerId)
    }
  }, [delay])

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
      }}
    >
      {children}
    </div>
  )
}

// ── Skeleton cards ─────────────────────────────────────────────────────────────

function AdCopySkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 rounded-lg border border-border bg-card p-5">
      {/* Variant name + "draft" badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-5 w-11 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        {/* Headline */}
        <div>
          <div className="mb-1 h-2.5 w-14 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
        </div>
        {/* Primary Text */}
        <div>
          <div className="mb-1 h-2.5 w-20 rounded bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded bg-muted" />
            <div className="h-3.5 w-4/5 rounded bg-muted" />
          </div>
        </div>
        {/* CTA + Description inline */}
        <div className="flex items-start gap-8">
          <div>
            <div className="mb-1 h-2.5 w-6 rounded bg-muted" />
            <div className="h-3.5 w-20 rounded bg-muted" />
          </div>
          <div>
            <div className="mb-1 h-2.5 w-20 rounded bg-muted" />
            <div className="h-3.5 w-28 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CreativeSkeletonCard() {
  return (
    <div className="animate-pulse space-y-3 rounded-lg border border-border bg-card p-5">
      {/* "Creative 1" + "image" badge + "planned" badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 rounded bg-muted" />
          <div className="h-5 w-16 rounded bg-muted" />
        </div>
      </div>
      {/* Higgsfield Prompt */}
      <div>
        <div className="mb-1 h-2.5 w-32 rounded bg-muted" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full rounded bg-muted" />
          <div className="h-3.5 w-5/6 rounded bg-muted" />
          <div className="h-3.5 w-4/5 rounded bg-muted" />
        </div>
      </div>
      {/* Concept */}
      <div>
        <div className="mb-1 h-2.5 w-14 rounded bg-muted" />
        <div className="h-3.5 w-3/4 rounded bg-muted" />
      </div>
      {/* Phase 2 info box */}
      <div className="rounded-md bg-muted/50 px-3 py-2.5">
        <div className="space-y-1">
          <div className="h-3 w-full rounded bg-muted/60" />
          <div className="h-3 w-3/4 rounded bg-muted/60" />
        </div>
      </div>
    </div>
  )
}

// ── AI Workforce Status ────────────────────────────────────────────────────────

function PhaseIcon({ status }: { status: PhaseStatus }) {
  if (status === 'completed') {
    return (
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
        <svg
          className="h-3.5 w-3.5 text-primary-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    )
  }
  if (status === 'running') {
    return (
      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        <span
          className="absolute inline-flex h-4 w-4 animate-ping rounded-full bg-primary/30"
          style={{ animationDuration: '1.75s' }}
        />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
      </div>
    )
  }
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card">
      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
    </div>
  )
}

function AIWorkforceStatus({
  copyStatus,
  creativeStatus,
}: {
  copyStatus: PhaseStatus
  creativeStatus: PhaseStatus
}) {
  const phases: { label: string; description: string; status: PhaseStatus }[] = [
    {
      label: 'Campaign Brief',
      description: '✓ Complete',
      status: 'completed',
    },
    {
      label: 'Ad Copy Variants',
      description:
        copyStatus === 'running'
          ? 'Writing personalized messaging…'
          : copyStatus === 'completed'
            ? 'Complete'
            : 'Queued',
      status: copyStatus,
    },
    {
      label: 'Creative Direction',
      description:
        creativeStatus === 'running'
          ? 'Generating visual concepts…'
          : creativeStatus === 'completed'
            ? 'Complete'
            : 'Queued',
      status: creativeStatus,
    },
  ]

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">AI Workforce Status</h2>
      <div className="rounded-lg border border-border bg-card px-5 py-7">
        <div className="relative flex items-start justify-between">
          {/* Connecting line sits behind the icons */}
          <div className="absolute left-3 right-3 top-3 h-px bg-border" />
          {phases.map((phase) => (
            <div
              key={phase.label}
              className="relative z-10 flex flex-col items-center gap-3 px-2 text-center"
            >
              <PhaseIcon status={phase.status} />
              <div className="space-y-1">
                <p
                  className={`text-xs font-medium leading-snug ${
                    phase.status === 'completed'
                      ? 'text-foreground'
                      : phase.status === 'running'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                  }`}
                >
                  {phase.label}
                </p>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {phase.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [data, setData] = useState<CampaignDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return

    let cancelled = false
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    function fetchData(isInitial: boolean) {
      if (isInitial) setLoading(true)
      fetch(`/api/tower/dogfooding/campaigns/${id}`)
        .then((r) => r.json())
        .then((d: CampaignDetailData & { error?: string }) => {
          if (cancelled) return
          if (d.error) throw new Error(d.error)
          setData(d)
          // Keep polling while the pipeline is still running
          if (d.campaign?.status !== 'ready') {
            pollTimer = setTimeout(() => fetchData(false), 4000)
          }
        })
        .catch((e: Error) => {
          if (!cancelled) setError(e.message)
        })
        .finally(() => {
          if (isInitial && !cancelled) setLoading(false)
        })
    }

    fetchData(true)

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [id])

  // Derived pipeline state — computed unconditionally so tracker effects below can use them.
  const isPipelineRunning = data !== null && data.campaign.status !== 'ready'
  const hasCopyVariants = (data?.copyVariants.length ?? 0) > 0
  const hasCreatives = (data?.creatives.length ?? 0) > 0

  // ── Tracker lifecycle ──────────────────────────────────────────────────────
  // State machine: hidden → running → completing → fadeout → hidden
  // Driven purely by isPipelineRunning; no artificial timers used for content.
  // The two timeouts here are UX transitions only (hold + fade), not data gates.

  const [trackerPhase, setTrackerPhase] = useState<TrackerPhase>('hidden')

  // Step 1: mirror pipeline state into tracker phase
  useEffect(() => {
    if (isPipelineRunning) {
      setTrackerPhase('running')
    } else {
      // Only advance if we were already showing; avoids showing tracker when
      // the page loads after the pipeline has already finished.
      setTrackerPhase((prev) => (prev === 'running' ? 'completing' : prev))
    }
  }, [isPipelineRunning])

  // Step 2: hold the all-done state for 1 s, then start fading
  useEffect(() => {
    if (trackerPhase !== 'completing') return
    const t = setTimeout(() => setTrackerPhase('fadeout'), 1000)
    return () => clearTimeout(t)
  }, [trackerPhase])

  // Step 3: remove from DOM after the 400 ms CSS fade-out finishes
  useEffect(() => {
    if (trackerPhase !== 'fadeout') return
    const t = setTimeout(() => setTrackerPhase('hidden'), 500)
    return () => clearTimeout(t)
  }, [trackerPhase])

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading campaign…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">{error ?? 'Campaign not found'}</p>
        <Link
          href="/tower/dogfooding/campaigns"
          className="mt-3 block text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to campaigns
        </Link>
      </div>
    )
  }

  const { campaign, copyVariants, creatives } = data

  // Derive which pipeline phase is active from observable DB state.
  // Creative only starts after copy finishes (sequential in the pipeline),
  // so no creatives + no variants = copy is still running.
  const copyStatus: PhaseStatus = hasCopyVariants
    ? 'completed'
    : isPipelineRunning
      ? 'running'
      : 'pending'

  const creativeStatus: PhaseStatus = hasCreatives
    ? 'completed'
    : isPipelineRunning
      ? hasCopyVariants
        ? 'running'
        : 'pending'
      : 'pending'

  return (
    <div className="space-y-8">
      {/* Header */}
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
          <Link href="/tower/dogfooding/campaigns" className="hover:text-foreground">
            Campaigns
          </Link>
          <span>/</span>
          <span className="text-foreground">
            {campaign.name.slice(0, 30)}
            {campaign.name.length > 30 ? '…' : ''}
          </span>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground">{campaign.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
            {campaign.status}
          </span>
          {campaign.channels.map((ch) => (
            <span
              key={ch}
              className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground"
            >
              {ch}
            </span>
          ))}
          {campaign.budgetCents > 0 && (
            <span className="text-xs text-muted-foreground">
              ${(campaign.budgetCents / 100).toLocaleString()} budget
            </span>
          )}
        </div>
        <div className="mt-3">
          <Link
            href={`/tower/dogfooding/campaigns/${campaign.id}/deliverables`}
            className="text-xs text-primary hover:underline"
          >
            View Deliverables →
          </Link>
        </div>
      </div>

      {/* Campaign Brief */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Campaign Brief</h2>
        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Primary Goal
            </p>
            <p className="text-sm text-foreground">{campaign.objectiveSummary}</p>
          </div>

          {campaign.targetAudience.description ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Target Audience
              </p>
              <p className="text-sm text-foreground">
                {String(campaign.targetAudience.description)}
              </p>
            </div>
          ) : null}

          {campaign.targetAudience.coreMessage ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Core Message
              </p>
              <p className="text-sm text-foreground">
                {String(campaign.targetAudience.coreMessage)}
              </p>
            </div>
          ) : null}

          {campaign.targetAudience.recommendedOffer ? (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recommended Offer
              </p>
              <p className="text-sm text-foreground">
                {String(campaign.targetAudience.recommendedOffer)}
              </p>
            </div>
          ) : null}

          {Array.isArray(campaign.targetAudience.contentPillars) &&
          campaign.targetAudience.contentPillars.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Content Pillars
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(campaign.targetAudience.contentPillars as string[]).map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {campaign.targetAudience.postingFrequency || campaign.targetAudience.campaignLength ? (
            <div className="flex flex-wrap gap-6">
              {campaign.targetAudience.postingFrequency ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Posting Frequency
                  </p>
                  <p className="text-sm text-foreground">
                    {String(campaign.targetAudience.postingFrequency)}
                  </p>
                </div>
              ) : null}
              {campaign.targetAudience.campaignLength ? (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Campaign Length
                  </p>
                  <p className="text-sm text-foreground">
                    {String(campaign.targetAudience.campaignLength)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {Array.isArray(campaign.targetAudience.toneOfVoice) &&
          campaign.targetAudience.toneOfVoice.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tone of Voice
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(campaign.targetAudience.toneOfVoice as string[]).map((tone) => (
                  <span key={tone} className="rounded bg-muted px-2 py-0.5 text-xs text-foreground">
                    {tone}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* AI Workforce Status — fades out ~1 s after all phases complete */}
      {trackerPhase !== 'hidden' && (
        <div
          style={{
            opacity: trackerPhase === 'fadeout' ? 0 : 1,
            transition: 'opacity 400ms ease',
          }}
        >
          <AIWorkforceStatus copyStatus={copyStatus} creativeStatus={creativeStatus} />
        </div>
      )}

      {/* Ad Copy Variants */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Ad Copy Variants{hasCopyVariants ? ` (${copyVariants.length})` : null}
        </h2>
        {isPipelineRunning && !hasCopyVariants ? (
          <div className="space-y-3">
            <AdCopySkeletonCard />
            <AdCopySkeletonCard />
            <AdCopySkeletonCard />
          </div>
        ) : hasCopyVariants ? (
          <div className="space-y-3">
            {copyVariants.map((v, i) => (
              <FadeInCard key={v.id} delay={i * 150}>
                <div className="space-y-3 rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{v.variantName}</p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                      {v.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Headline
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{v.headline}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Primary Text
                      </p>
                      <p className="mt-0.5 text-sm text-foreground">{v.primaryText}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          CTA
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-foreground">
                          {v.callToAction}
                        </p>
                      </div>
                      {v.description && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Description
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{v.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </FadeInCard>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No copy variants generated yet.</p>
          </div>
        )}
      </section>

      {/* Creative Direction */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Creative Direction{hasCreatives ? ` (${creatives.length})` : null}
        </h2>
        {isPipelineRunning && !hasCreatives ? (
          <div className="space-y-3">
            <CreativeSkeletonCard />
            <CreativeSkeletonCard />
          </div>
        ) : hasCreatives ? (
          <div className="space-y-3">
            {creatives.map((cr, i) => (
              <FadeInCard key={cr.id} delay={i * 150}>
                <div className="space-y-3 rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">Creative {i + 1}</p>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                        {cr.type}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                        {cr.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Higgsfield Prompt
                    </p>
                    <p className="mt-1 text-sm text-foreground">{cr.prompt}</p>
                  </div>
                  {cr.metadata.concept ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Concept
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {String(cr.metadata.concept)}
                      </p>
                    </div>
                  ) : null}
                  {cr.status === 'planned' && (
                    <div className="rounded-md bg-muted/50 px-3 py-2">
                      <p className="text-xs text-muted-foreground">
                        This prompt is ready for Phase 2 — when Higgsfield generation is connected,
                        click <span className="font-medium">Generate Creative</span> to produce the
                        actual asset.
                      </p>
                    </div>
                  )}
                </div>
              </FadeInCard>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No creatives generated yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
