import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { timeAgo } from '@/shared/lib/time'
import { RUN_STATUS_LABELS, RUN_STATUS_BADGE_COLORS } from '@/shared/lib/run-status'
import type { EngagementRun } from '@/shared/types'
import { EmptyState } from '../_components/empty-state'
import { NewCampaignModal } from './_components/new-campaign-modal'
import { isEngineeringResidue } from './_lib/is-engineering-residue'

/**
 * In-progress Work destination (Architect lock f764eda3; residue demotion
 * bef9971b / ac421b6f Domain 1).
 *
 * Presentation only: this page stays at `/runs` and keeps the existing list
 * plus New campaign create modal. Engineering/render-check residue is demoted
 * to a collapsed section — never deleted — so the primary scan stays customer
 * work. Headline aggregates remain the unfiltered org totals.
 */
export default async function RunsPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const runsResult = await workforceEngineService.listEngagementRuns(ctx.organizationId)
  const runs = runsResult.ok ? runsResult.value : []
  const sortedRuns = [...runs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const primaryRuns = sortedRuns.filter((run) => !isEngineeringResidue(run.objective))
  const residueRuns = sortedRuns.filter((run) => isEngineeringResidue(run.objective))

  const completedCount = runs.filter((r) => r.status === 'completed').length
  const activeCount = runs.filter((r) => r.status === 'pending' || r.status === 'running').length

  return (
    <div className="min-w-0 overflow-x-hidden space-y-8">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-foreground">Work</h1>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {runs.length === 0
              ? 'No campaigns yet. Start your first one whenever you’re ready.'
              : `${runs.length} ${runs.length === 1 ? 'campaign' : 'campaigns'} total · ${completedCount} completed${activeCount > 0 ? ` · ${activeCount} active` : ''}`}
          </p>
          {residueRuns.length > 0 && (
            <p className="mt-1 break-words text-xs text-muted-foreground">
              {residueRuns.length}{' '}
              {residueRuns.length === 1 ? 'older system check is' : 'older system checks are'} listed
              separately below. Totals include every campaign.
            </p>
          )}
        </div>
        <NewCampaignModal />
      </div>

      {sortedRuns.length === 0 ? (
        <EmptyState
          message="No campaigns yet."
          action={<NewCampaignModal label="Start your first campaign" variant="ghost" />}
        />
      ) : (
        <div className="space-y-6">
          {primaryRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No current campaigns to show. Older system checks are listed below.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-lg border border-border bg-card">
              {primaryRuns.map((run) => (
                <RunListItem key={run.id} run={run} />
              ))}
            </div>
          )}

          {residueRuns.length > 0 && (
            <details className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                Older system checks ({residueRuns.length})
              </summary>
              <p className="px-4 pb-2 text-xs text-muted-foreground">
                These are internal video or image checks kept for history. They are not your current
                campaigns.
              </p>
              <div className="divide-y divide-border border-t border-border">
                {residueRuns.map((run) => (
                  <RunListItem key={run.id} run={run} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

function RunListItem({ run }: { run: EngagementRun }) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{run.objective}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {timeAgo(run.createdAt)}
          {run.deliverableIds.length > 0 && (
            <>
              {' '}
              · {run.deliverableIds.length}{' '}
              {run.deliverableIds.length === 1 ? 'deliverable' : 'deliverables'}
            </>
          )}
        </p>
      </div>
      <span
        className={`ml-4 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_BADGE_COLORS[run.status]}`}
      >
        {RUN_STATUS_LABELS[run.status]}
      </span>
    </Link>
  )
}
