import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { identityService } from '@/domains/identity'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { approvalWorkflowService } from '@/shared/approval'
import { LiveRunsPanel } from './_components/LiveRunsPanel'
import { Greeting } from './_components/greeting'

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

  void workforcesResult

  const orgName = orgResult.ok ? orgResult.value.name : null
  const memoryCount = brainResult.ok ? brainResult.value.totalCount : 0
  const allRuns = runsResult.ok ? runsResult.value : []
  const activeRuns = allRuns.filter((r) => r.status === 'pending' || r.status === 'running')
  const allDeliverables = allDeliverablesResult.ok ? allDeliverablesResult.value : []
  const pendingDeliverables = allDeliverables.filter((d) => d.status === 'pending_review')
  const pendingApprovals = approvalsResult.ok ? approvalsResult.value : []

  if (memoryCount === 0) {
    redirect('/onboarding')
  }

  const activeCount = activeRuns.length
  const attentionCount = pendingApprovals.length + pendingDeliverables.length
  const businessName = orgName?.trim() || 'your business'

  const workingLine =
    activeCount > 0
      ? `Sit tight — we're on it for ${businessName}.`
      : attentionCount > 0
        ? `Koolerr is ready for ${businessName}.`
        : `You're all caught up. We'll let you know the moment we need you.`

  return (
    <div className="min-w-0 space-y-12 overflow-x-hidden pb-4">
      {/* First viewport: greeting, outcome tiles, Ask(+) */}
      <Greeting
        subtitle="What would you like Koolerr to do for your business today?"
        showReview={attentionCount > 0}
      />

      {/* Thin working status — one short line + one Work destination */}
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Koolerr is working for you
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{workingLine}</p>
          </div>
          <Link href="/work" className="shrink-0 text-sm text-primary hover:underline">
            Work →
          </Link>
        </div>

        <LiveRunsPanel runs={activeRuns.map((r) => ({ id: r.id, objective: r.objective }))} />
      </section>
    </div>
  )
}
