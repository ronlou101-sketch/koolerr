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
  pending: 'Getting started',
  running: 'Working on it',
  awaiting_approval: 'Ready for you',
  approved: 'Approved',
  rejected: 'Sent back',
  completed: 'Completed',
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

  const orgName = orgResult.ok ? orgResult.value.name : null
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

  // Create is Ask(+) / outcome tiles above — never /pipeline as the destination.
  const nextStep =
    attentionCount > 0
      ? {
          title: 'Review the work your team finished',
          desc: `${attentionCount} item${attentionCount === 1 ? '' : 's'} ${attentionCount === 1 ? 'is' : 'are'} ready for your review.`,
          href: '/approvals',
          cta: 'Review now',
        }
      : activeCount > 0
        ? {
            title: "Sit tight — we're on it",
            desc: `We're working on your ${activeCount === 1 ? 'campaign' : `${activeCount} campaigns`} and will bring you the results as soon as they're ready.`,
            href: '/runs',
            cta: 'See progress',
          }
        : brainCoveragePct < 100
          ? {
              title: 'Finish your business profile',
              desc: 'The more we know about your business, the sharper your marketing gets.',
              href: '/brain',
              cta: 'Finish profile',
            }
          : null

  const workingLine =
    activeCount > 0
      ? `We're actively working on your ${activeCount === 1 ? 'campaign' : `${activeCount} campaigns`} right now.`
      : teamReady
        ? "Your team is ready and waiting. Ask them above whenever you'd like more."
        : "We're just getting set up. Finish your profile and we'll get to work."

  return (
    <div className="space-y-12 pb-4">
      {/* ── First viewport: greeting, outcome tiles, Ask(+) ───────────────── */}
      <Greeting subtitle="What would you like Koolerr to do for your business today?" />

      {/* ── Koolerr is working for you (existing live + ready + recent) ──── */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Koolerr is working for you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {orgName ? `${workingLine} Here's how things look for ${orgName}.` : workingLine}
            </p>
          </div>
          {recentRuns.length > 0 && (
            <Link href="/runs" className="shrink-0 text-sm text-primary hover:underline">
              View all →
            </Link>
          )}
        </div>

        {attentionCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            You&apos;re all caught up. We&apos;ll let you know the moment we need you.
          </p>
        ) : (
          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-yellow-800">
                {attentionCount} {attentionCount === 1 ? 'thing is' : 'things are'} ready for your
                review
              </p>
              <p className="mt-1 text-xs text-yellow-700">
                Take a look whenever you have a minute — it&apos;s quick.
              </p>
            </div>
            <Link
              href="/approvals"
              className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
            >
              Review now
            </Link>
          </div>
        )}

        <LiveRunsPanel runs={activeRuns.map((r) => ({ id: r.id, objective: r.objective }))} />

        {recentRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing here yet. Ask your marketing team above to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentRuns.map((run) => (
              <Link
                key={run.id}
                href={`/runs/${run.id}`}
                className="flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {run.objective}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
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
                <span className={`mt-3 text-xs ${STATUS_COLORS[run.status]}`}>
                  {STATUS_LABELS[run.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Campaign health (quiet secondary) ─────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Campaign health</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Active campaigns</p>
            <p className="mt-0.5 text-xl font-semibold text-foreground">{activeCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="mt-0.5 text-xl font-semibold text-foreground">{completedCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Content created</p>
            <p className="mt-0.5 text-xl font-semibold text-foreground">{contentCount}</p>
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

      {/* ── Recommended next step (quiet secondary) ───────────────────────── */}
      {nextStep && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recommended next step</h2>
          <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{nextStep.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{nextStep.desc}</p>
            </div>
            <Link
              href={nextStep.href}
              className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {nextStep.cta}
            </Link>
          </div>
        </section>
      )}

      {/* ── Learn (gentle footer nudge) ───────────────────────────────────── */}
      <LearnCta />
    </div>
  )
}
