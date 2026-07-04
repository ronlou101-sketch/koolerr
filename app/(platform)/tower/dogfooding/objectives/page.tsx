import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSessionServerClient } from '@/shared/lib/supabase-session'
import { bootstrapPlatform } from '@/infrastructure/platform/bootstrap'
import { dogfoodingService } from '@/domains/dogfooding'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import type { ObjectiveStatus } from '@/domains/dogfooding'

export const dynamic = 'force-dynamic'

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

export default async function ObjectivesPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user?.email !== 'ronlou101@gmail.com') notFound()

  await bootstrapPlatform()
  const ctx = await getRequestPlatformContext()
  if (!ctx) notFound()

  const result = await dogfoodingService.listObjectives(ctx.organizationId)
  const objectives = result.ok ? result.value : []

  return (
    <div className="space-y-8">
      {/* Header */}
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
            <span className="text-foreground">Objectives</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Marketing Objectives</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {objectives.length} objective{objectives.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/tower/dogfooding/objectives/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Objective
        </Link>
      </div>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">No objectives yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first marketing objective to kick off the agent pipeline.
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
          {objectives.map((obj) => {
            const { dot, label } = STATUS_CONFIG[obj.status] ?? STATUS_CONFIG.draft
            return (
              <Link
                key={obj.id}
                href={`/tower/dogfooding/objectives/${obj.id}`}
                className="group flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{obj.title}</p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {GOAL_LABELS[obj.goalType] ?? obj.goalType}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {obj.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {obj.budgetCents > 0 && (
                      <span>Budget: ${(obj.budgetCents / 100).toLocaleString()}</span>
                    )}
                    <span>{new Date(obj.createdAt).toLocaleDateString()}</span>
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
