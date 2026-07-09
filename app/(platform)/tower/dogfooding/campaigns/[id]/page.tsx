'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { DogfoodingCampaign, AdCopyVariant, DogfoodingCreative } from '@/domains/dogfooding'

interface CampaignDetailData {
  campaign: DogfoodingCampaign
  copyVariants: AdCopyVariant[]
  creatives: DogfoodingCreative[]
}

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
    setLoading(true)
    fetch(`/api/tower/dogfooding/campaigns/${id}`)
      .then((r) => r.json())
      .then((d: CampaignDetailData & { error?: string }) => {
        if (d.error) throw new Error(d.error)
        setData(d)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

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
      </div>

      {/* Summary */}
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

      {/* Ad Copy Variants */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Ad Copy Variants ({copyVariants.length})
        </h2>
        {copyVariants.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No copy variants generated yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {copyVariants.map((v) => (
              <div key={v.id} className="space-y-3 rounded-lg border border-border bg-card p-5">
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
                      <p className="mt-0.5 text-sm font-medium text-foreground">{v.callToAction}</p>
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
            ))}
          </div>
        )}
      </section>

      {/* Creatives */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Creative Direction ({creatives.length})
        </h2>
        {creatives.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No creatives generated yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {creatives.map((cr, i) => (
              <div key={cr.id} className="space-y-3 rounded-lg border border-border bg-card p-5">
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
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
