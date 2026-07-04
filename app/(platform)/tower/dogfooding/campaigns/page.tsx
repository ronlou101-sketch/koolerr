import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { dogfoodingService } from '@/domains/dogfooding'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import type { CampaignStatus } from '@/domains/dogfooding'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<CampaignStatus, { dot: string; label: string }> = {
  planning: { dot: 'bg-muted-foreground/40', label: 'Planning' },
  ready: { dot: 'bg-blue-400', label: 'Ready' },
  active: { dot: 'bg-emerald-500', label: 'Active' },
  paused: { dot: 'bg-amber-400', label: 'Paused' },
  completed: { dot: 'bg-blue-500', label: 'Completed' },
  archived: { dot: 'bg-muted-foreground/20', label: 'Archived' },
}

export default async function CampaignsPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email !== 'ronlou101@gmail.com') notFound()

  await bootstrapPlatform()
  const ctx = await getRequestPlatformContext()
  if (!ctx) notFound()

  const result = await dogfoodingService.listCampaigns(ctx.organizationId)
  const campaigns = result.ok ? result.value : []

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
          <span className="text-foreground">Campaigns</span>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {campaigns.length} AI-generated campaign{campaigns.length !== 1 ? 's' : ''}
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">No campaigns yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create an objective and run the pipeline to generate campaigns automatically.
          </p>
          <Link
            href="/tower/dogfooding/objectives/new"
            className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Objective
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const { dot, label } = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.planning
            return (
              <Link
                key={c.id}
                href={`/tower/dogfooding/campaigns/${c.id}`}
                className="group flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {c.objectiveSummary}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {c.channels.map((ch) => (
                      <span
                        key={ch}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground"
                      >
                        {ch}
                      </span>
                    ))}
                    {c.budgetCents > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ${(c.budgetCents / 100).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                    →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
