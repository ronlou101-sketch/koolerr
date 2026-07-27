import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { identityService } from '@/domains/identity'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { approvalWorkflowService } from '@/shared/approval'
import { LiveRunsPanel } from './_components/LiveRunsPanel'
import { LearnCta } from './_components/learn-cta'
import { Greeting } from './_components/greeting'
import { computeMediaStats } from './_components/media-stats'
import { timeAgo } from '@/shared/lib/time'

// Customer-facing status wording (display only; underlying statuses unchanged).
const STATUS_LABELS = {
  pending: 'Queued',
  running: 'Working on it',
  awaiting_approval: 'Ready for you',
  approved: 'Approved',
  rejected: 'Sent back',
  completed: 'Done',
  failed: "Didn't finish",
} as const

const STATUS_COLORS = {
  pending: 'text-muted-foreground',
  running: 'text-blue-600',
  awaiting_approval: 'text-yellow-600 font-medium',
  approved: 'text-green-600',
  rejected: 'text-destructive',
  completed: 'text-green-600',
  failed: 'text-destructive',
} as const

export default async function DashboardPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login?error=account_error')

  const [
    orgResult,
    brainResult,
    runsResult,
    allDeliverablesResult,
    workforcesResult,
    approvalsResult,
  ] = await Promise.all([
    identityService.findOrganizationById(ctx.organizationId),
    businessBrainService.queryMemory({ organizationId: ctx.organizationId, limit: 100 }),
    workforceEngineService.listEngagementRuns(ctx.organizationId),
    deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
    workforceEngineService.listWorkforces(ctx.organizationId),
    approvalWorkflowService.listPending(ctx.organizationId, ctx.tenantId),
  ])

  const orgName = orgResult.ok ? orgResult.value.name : 'Your Organization'
  const brainMemories = brainResult.ok ? brainResult.value.memories : []
  const memoryCount = brainResult.ok ? brainResult.value.totalCount : 0
  const brainCoveragePct =
    brainMemories.length > 0
      ? Math.round((new Set(brainMemories.map((m) => m.type)).size / 12) * 100)
      : 0
  const allRuns = runsResult.ok ? runsResult.value : []
  const recentRuns = allRuns.slice(0, 5)
  const activeRuns = allRuns.filter((r) => r.status === 'pending' || r.status === 'running')
  const allDeliverables = allDeliverablesResult.ok ? allDeliverablesResult.value : []
  const pendingDeliverables = allDeliverables.filter((d) => d.status === 'pending_review')
  const mediaStats = computeMediaStats(allDeliverables)
  const workforces = workforcesResult.ok ? workforcesResult.value : []
  const pendingApprovals = approvalsResult.ok ? approvalsResult.value : []

  if (memoryCount === 0) {
    redirect('/onboarding')
  }

  // ── Customer-facing derived values (presentation only) ──────────────────────
  const teamReady = workforces.filter((w) => w.status === 'active').length > 0
  const activeCount = activeRuns.length
  const completedCount = allRuns.filter((r) => r.status === 'completed').length
  const failedCount = allRuns.filter((r) => r.status === 'failed').length
  const contentCount = allDeliverables.length
  const attentionCount = pendingApprovals.length + pendingDeliverables.length

  const nextStep =
    attentionCount > 0
      ? {
          title: 'Review the work waiting for you',
          desc: `${attentionCount} item${attentionCount === 1 ? '' : 's'} ready for your review.`,
          href: pendingDeliverables.length > 0 ? '/deliverables' : '/approvals',
          cta: 'Review now',
        }
      : activeCount > 0
        ? {
            title: 'Your team is on it',
            desc: `${activeCount} campaign${activeCount === 1 ? '' : 's'} in progress. I'll let you know the moment there's something to review.`,
            href: '/runs',
            cta: 'See progress',
          }
        : brainCoveragePct < 100
          ? {
              title: 'Tell your team more about your business',
              desc: 'The more they know about you, the sharper your marketing gets.',
              href: '/brain',
              cta: 'Add details',
            }
          : {
              title: 'Start a new campaign',
              desc: 'Tell your marketing team what you want more of, and they’ll take it from there.',
              href: '/pipeline',
              cta: 'Start a campaign',
            }

  return (
    <div className="space-y-8">
      {/* ── Good morning greeting ─────────────────────────────────────────── */}
      <Greeting subtitle={`Here's what your marketing team has been up to at ${orgName}.`} />

      {/* ── Marketing Team Status ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Your marketing team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount > 0
              ? `Hard at work on ${activeCount} campaign${activeCount === 1 ? '' : 's'} right now.`
              : teamReady
                ? 'Ready and standing by. Start a campaign whenever you are.'
                : 'Getting set up — finish onboarding to put your team to work.'}
          </p>
        </div>
        <LiveRunsPanel runs={activeRuns.map((r) => ({ id: r.id, objective: r.objective }))} />
      </section>

      {/* ── Ready for You ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Ready for you</h2>
        {attentionCount === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing needs you right now. Your marketing team will let you know when
              something&apos;s ready.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingApprovals.length > 0 && (
              <div className="flex items-start justify-between gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {pendingApprovals.length} decision{pendingApprovals.length === 1 ? '' : 's'}{' '}
                    need your OK
                  </p>
                  <p className="mt-1 text-xs text-yellow-700">
                    {pendingApprovals[0].description}
                    {pendingApprovals.length > 1 && ` and ${pendingApprovals.length - 1} more.`}
                  </p>
                </div>
                <Link
                  href="/approvals"
                  className="shrink-0 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700"
                >
                  Review
                </Link>
              </div>
            )}
            {pendingDeliverables.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-yellow-200 bg-card">
                {pendingDeliverables.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {d.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Link
                      href={`/deliverables/${d.id}`}
                      className="ml-4 shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Campaign Health ───────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Campaign health</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Active campaigns</p>
            <p className="mt-0.5 text-2xl font-semibold text-foreground">{activeCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="mt-0.5 text-2xl font-semibold text-foreground">{completedCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Content created</p>
            <p className="mt-0.5 text-2xl font-semibold text-foreground">{contentCount}</p>
          </div>
        </div>
        {mediaStats.total > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {mediaStats.videos} video{mediaStats.videos === 1 ? '' : 's'}, {mediaStats.images} image
            {mediaStats.images === 1 ? '' : 's'}, and {mediaStats.scripts} script
            {mediaStats.scripts === 1 ? '' : 's'} so far.
          </p>
        )}
        {failedCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {failedCount} campaign{failedCount === 1 ? '' : 's'} didn&apos;t finish.{' '}
            <Link href="/runs" className="text-primary hover:underline">
              Take a look →
            </Link>
          </p>
        )}
      </section>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <Link href="/runs" className="text-xs text-primary hover:underline">
            View all →
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">Nothing here yet.</p>
            <Link
              href="/pipeline"
              className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start your first campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
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
                        · {run.deliverableIds.length} piece
                        {run.deliverableIds.length === 1 ? '' : 's'} of content
                      </>
                    )}
                  </p>
                </div>
                <span className={`ml-4 shrink-0 text-xs ${STATUS_COLORS[run.status]}`}>
                  {STATUS_LABELS[run.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Recommended Next Step ─────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Recommended next step</h2>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{nextStep.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{nextStep.desc}</p>
          </div>
          <Link
            href={nextStep.href}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {nextStep.cta}
          </Link>
        </div>
      </section>

      {/* ── Learn (gentle footer nudge) ───────────────────────────────────── */}
      <LearnCta />
    </div>
  )
}
