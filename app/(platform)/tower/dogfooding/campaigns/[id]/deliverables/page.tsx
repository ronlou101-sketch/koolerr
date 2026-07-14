'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import type {
  AdCopyVariant,
  CampaignApprovalEvent,
  CampaignAsset,
  CampaignCalendarSlot,
  CampaignCaption,
  CampaignHashtagSet,
  CampaignScript,
  DogfoodingCampaign,
  DogfoodingCreative,
} from '@/domains/dogfooding'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CampaignSummary {
  campaign: DogfoodingCampaign
  copyVariants: AdCopyVariant[]
  creatives: DogfoodingCreative[]
}

interface DeliverablesData {
  assets: CampaignAsset[]
  scripts: CampaignScript[]
  captions: CampaignCaption[]
  hashtagSets: CampaignHashtagSet[]
  calendarSlots: CampaignCalendarSlot[]
  approvalEvents: CampaignApprovalEvent[]
}

type ApproveAssetType = 'ad_copy_variant' | 'creative'

// ── Shared utilities ───────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  approved: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-destructive/10 text-destructive',
  generating: 'bg-primary/10 text-primary',
  ready: 'bg-blue-500/10 text-blue-600',
  failed: 'bg-destructive/10 text-destructive',
  published: 'bg-violet-500/10 text-violet-600',
  planned: 'bg-muted text-muted-foreground',
  archived: 'bg-muted/60 text-muted-foreground',
  unpublished: 'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-500/10 text-amber-600',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-muted text-muted-foreground'
  return <span className={`rounded px-1.5 py-0.5 text-xs capitalize ${cls}`}>{status}</span>
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse space-y-2 rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-5 w-14 rounded bg-muted" />
          </div>
          <div className="h-3.5 w-full rounded bg-muted" />
          <div className="h-3.5 w-4/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{children}</p>
  )
}

// ── Approve / Reject controls ──────────────────────────────────────────────────

interface ApproveControlsProps {
  campaignId: string
  assetType: ApproveAssetType
  assetId: string
  currentStatus: string
  onSettled: () => void
}

function ApproveControls({
  campaignId,
  assetType,
  assetId,
  currentStatus,
  onSettled,
}: ApproveControlsProps) {
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  if (currentStatus === 'approved' || currentStatus === 'rejected') return null

  async function act(decision: 'approved' | 'rejected') {
    setBusy(true)
    setLocalError(null)
    try {
      const res = await fetch(`/api/tower/dogfooding/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetType, assetId, decision }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        throw new Error(body.error ?? 'Request failed')
      }
      onSettled()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => act('approved')}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Approve'}
        </button>
        <button
          disabled={busy}
          onClick={() => act('rejected')}
          className="rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {localError && <p className="text-xs text-destructive">{localError}</p>}
    </div>
  )
}

// ── Section: Ad Copy Variants ──────────────────────────────────────────────────

function AdCopySection({
  campaignId,
  variants,
  loading,
  onSettled,
}: {
  campaignId: string
  variants: AdCopyVariant[]
  loading: boolean
  onSettled: () => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Ad Copy Variants{variants.length > 0 ? ` (${variants.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={3} />
      ) : variants.length === 0 ? (
        <EmptyState message="No copy variants generated yet." />
      ) : (
        <div className="space-y-3">
          {variants.map((v) => (
            <div key={v.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{v.variantName}</p>
                <StatusBadge status={v.status} />
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <Label>Headline</Label>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{v.headline}</p>
                </div>
                <div>
                  <Label>Primary Text</Label>
                  <p className="mt-0.5 text-sm text-foreground">{v.primaryText}</p>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <Label>CTA</Label>
                    <p className="mt-0.5 text-sm font-medium text-foreground">{v.callToAction}</p>
                  </div>
                  {v.description && (
                    <div>
                      <Label>Description</Label>
                      <p className="mt-0.5 text-sm text-muted-foreground">{v.description}</p>
                    </div>
                  )}
                </div>
                {v.approvalNote && (
                  <div>
                    <Label>Note</Label>
                    <p className="mt-0.5 text-sm text-muted-foreground">{v.approvalNote}</p>
                  </div>
                )}
              </div>
              <ApproveControls
                campaignId={campaignId}
                assetType="ad_copy_variant"
                assetId={v.id}
                currentStatus={v.status}
                onSettled={onSettled}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Section: Creative Direction ────────────────────────────────────────────────

function CreativesSection({
  campaignId,
  creatives,
  loading,
  onSettled,
}: {
  campaignId: string
  creatives: DogfoodingCreative[]
  loading: boolean
  onSettled: () => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Creative Direction{creatives.length > 0 ? ` (${creatives.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={2} />
      ) : creatives.length === 0 ? (
        <EmptyState message="No creative direction generated yet." />
      ) : (
        <div className="space-y-3">
          {creatives.map((cr, i) => (
            <div key={cr.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Creative {i + 1}</p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={cr.type} />
                  <StatusBadge status={cr.status} />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div>
                  <Label>Prompt</Label>
                  <p className="mt-1 text-sm text-foreground">{cr.prompt}</p>
                </div>
                {cr.metadata.concept ? (
                  <div>
                    <Label>Concept</Label>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {String(cr.metadata.concept)}
                    </p>
                  </div>
                ) : null}
                {cr.assetUrl && (
                  <div>
                    <Label>Asset</Label>
                    <a
                      href={cr.assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block truncate text-sm text-primary hover:underline"
                    >
                      {cr.assetUrl}
                    </a>
                  </div>
                )}
                {cr.approvalNote && (
                  <div>
                    <Label>Note</Label>
                    <p className="mt-0.5 text-sm text-muted-foreground">{cr.approvalNote}</p>
                  </div>
                )}
              </div>
              <ApproveControls
                campaignId={campaignId}
                assetType="creative"
                assetId={cr.id}
                currentStatus={cr.status}
                onSettled={onSettled}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Section: Assets ────────────────────────────────────────────────────────────

function AssetsSection({ assets, loading }: { assets: CampaignAsset[]; loading: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Assets{assets.length > 0 ? ` (${assets.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={2} />
      ) : assets.length === 0 ? (
        <EmptyState message="No generated assets yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {assets.map((a) => (
            <div key={a.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium capitalize text-foreground">
                    {a.subtype ?? a.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.modelProvider}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={a.status} />
                  {a.version > 1 && (
                    <span className="text-[10px] text-muted-foreground">v{a.version}</span>
                  )}
                </div>
              </div>
              {a.thumbnailUrl ? (
                <img
                  src={a.thumbnailUrl}
                  alt={a.subtype ?? a.type}
                  className="mt-3 w-full rounded object-cover"
                  style={{ maxHeight: 160 }}
                />
              ) : a.assetUrl ? (
                <a
                  href={a.assetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-xs text-primary hover:underline"
                >
                  View asset →
                </a>
              ) : null}
              {a.approvalNote && (
                <p className="mt-2 text-xs text-muted-foreground">{a.approvalNote}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Section: Scripts ───────────────────────────────────────────────────────────

function ScriptsSection({ scripts, loading }: { scripts: CampaignScript[]; loading: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Scripts{scripts.length > 0 ? ` (${scripts.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={1} />
      ) : scripts.length === 0 ? (
        <EmptyState message="No scripts generated yet." />
      ) : (
        <div className="space-y-3">
          {scripts.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{s.title}</p>
                <div className="flex items-center gap-2">
                  {s.platform && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                      {s.platform}
                    </span>
                  )}
                  <StatusBadge status={s.status} />
                </div>
              </div>
              {s.estimatedDurationSec != null && (
                <p className="mt-1 text-xs text-muted-foreground">~{s.estimatedDurationSec}s</p>
              )}
              <div className="mt-3">
                <Label>Script</Label>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Section: Captions ──────────────────────────────────────────────────────────

function CaptionsSection({ captions, loading }: { captions: CampaignCaption[]; loading: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Captions{captions.length > 0 ? ` (${captions.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={2} />
      ) : captions.length === 0 ? (
        <EmptyState message="No captions generated yet." />
      ) : (
        <div className="space-y-3">
          {captions.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                  {c.platform}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{c.characterCount} chars</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Section: Hashtag Sets ──────────────────────────────────────────────────────

function HashtagsSection({
  hashtagSets,
  loading,
}: {
  hashtagSets: CampaignHashtagSet[]
  loading: boolean
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Hashtag Sets{hashtagSets.length > 0 ? ` (${hashtagSets.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={1} />
      ) : hashtagSets.length === 0 ? (
        <EmptyState message="No hashtag sets generated yet." />
      ) : (
        <div className="space-y-3">
          {hashtagSets.map((h) => (
            <div key={h.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{h.name}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {h.platform}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {h.reachTier}
                  </span>
                  <StatusBadge status={h.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {h.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Section: Calendar ──────────────────────────────────────────────────────────

const SLOT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-500/10 text-amber-600',
  published: 'bg-emerald-500/10 text-emerald-600',
  missed: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted/60 text-muted-foreground',
}

function CalendarSection({
  calendarSlots,
  loading,
}: {
  calendarSlots: CampaignCalendarSlot[]
  loading: boolean
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Calendar{calendarSlots.length > 0 ? ` (${calendarSlots.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={2} />
      ) : calendarSlots.length === 0 ? (
        <EmptyState message="No calendar slots scheduled yet." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {calendarSlots.map((slot) => {
            const d = new Date(slot.scheduledAt)
            const statusCls = SLOT_STATUS_COLORS[slot.status] ?? 'bg-muted text-muted-foreground'
            const contentCount = [
              slot.assetId,
              slot.copyVariantId,
              slot.captionId,
              slot.hashtagSetId,
            ].filter(Boolean).length
            return (
              <div key={slot.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-24 shrink-0">
                  <p className="text-xs font-medium text-foreground">
                    {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm capitalize text-foreground">{slot.platform}</p>
                  <p className="text-xs text-muted-foreground">
                    {contentCount} content item{contentCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs capitalize ${statusCls}`}>
                  {slot.status}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Section: Approval History ──────────────────────────────────────────────────

const DECISION_COLORS: Record<string, string> = {
  approved: 'text-emerald-600',
  rejected: 'text-destructive',
  reset_to_draft: 'text-muted-foreground',
}

function ApprovalHistorySection({
  approvalEvents,
  loading,
}: {
  approvalEvents: CampaignApprovalEvent[]
  loading: boolean
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Approval History{approvalEvents.length > 0 ? ` (${approvalEvents.length})` : ''}
      </h2>
      {loading ? (
        <SectionSkeleton rows={2} />
      ) : approvalEvents.length === 0 ? (
        <EmptyState message="No approval actions recorded yet." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {approvalEvents.map((ev) => {
            const d = new Date(ev.createdAt)
            const decisionCls = DECISION_COLORS[ev.decision] ?? 'text-foreground'
            return (
              <div key={ev.id} className="flex items-start gap-4 px-5 py-3">
                <div className="w-24 shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-medium capitalize ${decisionCls}`}>
                      {ev.decision.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                      {ev.assetType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {ev.note && <p className="mt-0.5 text-xs text-muted-foreground">{ev.note}</p>}
                  <p className="mt-0.5 text-xs text-muted-foreground/60">
                    by {ev.actorType === 'digital_employee' ? 'AI' : 'user'} ·{' '}
                    {ev.actorId.slice(0, 8)}…
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DeliverablesPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [summary, setSummary] = useState<CampaignSummary | null>(null)
  const [deliverables, setDeliverables] = useState<DeliverablesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  const refresh = useCallback(
    (isInitial: boolean) => {
      if (!id) return
      if (isInitial) setLoading(true)

      Promise.all([
        fetch(`/api/tower/dogfooding/campaigns/${id}`).then((r) => r.json()),
        fetch(`/api/tower/dogfooding/campaigns/${id}/deliverables`).then((r) => r.json()),
      ])
        .then(
          ([summaryData, deliverableData]: [
            CampaignSummary & { error?: string },
            DeliverablesData & { error?: string },
          ]) => {
            if (summaryData.error) throw new Error(summaryData.error)
            setSummary(summaryData)
            setDeliverables(deliverableData)
          }
        )
        .catch((e: Error) => setError(e.message))
        .finally(() => {
          if (isInitial) setLoading(false)
        })
    },
    [id]
  )

  useEffect(() => {
    if (id) refresh(true)
  }, [id, refresh])

  const onSettled = useCallback(() => refresh(false), [refresh])

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-12 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Loading deliverables…
      </div>
    )
  }

  if (error || !summary) {
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

  const { campaign, copyVariants, creatives } = summary
  const {
    assets = [],
    scripts = [],
    captions = [],
    hashtagSets = [],
    calendarSlots = [],
    approvalEvents = [],
  } = deliverables ?? {}

  const deliverablesLoading = !deliverables

  return (
    <div className="space-y-10">
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
          <Link href={`/tower/dogfooding/campaigns/${id}`} className="hover:text-foreground">
            {campaign.name.length > 24 ? campaign.name.slice(0, 24) + '…' : campaign.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">Deliverables</span>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Deliverables</h1>
        <p className="mt-1 text-sm text-muted-foreground">{campaign.name}</p>
      </div>

      {/* Sections */}
      <AdCopySection
        campaignId={campaign.id}
        variants={copyVariants}
        loading={deliverablesLoading}
        onSettled={onSettled}
      />

      <CreativesSection
        campaignId={campaign.id}
        creatives={creatives}
        loading={deliverablesLoading}
        onSettled={onSettled}
      />

      <AssetsSection assets={assets} loading={deliverablesLoading} />

      <ScriptsSection scripts={scripts} loading={deliverablesLoading} />

      <CaptionsSection captions={captions} loading={deliverablesLoading} />

      <HashtagsSection hashtagSets={hashtagSets} loading={deliverablesLoading} />

      <CalendarSection calendarSlots={calendarSlots} loading={deliverablesLoading} />

      <ApprovalHistorySection approvalEvents={approvalEvents} loading={deliverablesLoading} />
    </div>
  )
}
