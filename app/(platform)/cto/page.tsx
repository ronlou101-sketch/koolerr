import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { businessBrainService } from '@/domains/business-brain'
import { CTO_BUSINESS_FUNCTION } from '@/infrastructure/cto-workforce'
import { triggerCTORunAction, refreshCTOContextAction } from './actions'

const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  implementation_plan: 'Implementation Plan',
  code_review: 'Code Review',
  milestone_report: 'Milestone Report',
  blocker_report: 'Blocker Report',
  coordination_brief: 'Coordination Brief',
  v1_readiness_report: 'V1 Readiness Report',
}

const CTO_DELIVERABLE_TYPES = [
  'implementation_plan',
  'code_review',
  'milestone_report',
  'blocker_report',
  'coordination_brief',
  'v1_readiness_report',
]

const OBJECTIVE_PRESETS = [
  'Generate a V1 launch readiness report',
  'Generate implementation plan for Phase 3 Milestone 3 (Brain Multi-Workforce Intelligence)',
  'Identify all critical blockers to Koolerr V1 launch',
  'Review the CTO Workforce architecture and identify Foundation compliance issues',
  'Generate a platform coordination brief for GitHub and Lovable integration',
]

export default async function CTOPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [workforcesResult, deliverablesResult, memoriesResult] = await Promise.all([
    workforceEngineService.listWorkforces(ctx.organizationId),
    deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
    businessBrainService.listAllMemories(ctx.organizationId),
  ])

  const ctoWorkforce = workforcesResult.ok
    ? workforcesResult.value.find((w) => w.businessFunction === CTO_BUSINESS_FUNCTION)
    : undefined

  const ctoContextMemoryCount = memoriesResult.ok
    ? memoriesResult.value.filter((m) => m.relevanceScope.includes('cto_agent')).length
    : 0

  const allCtoDeliverables = deliverablesResult.ok
    ? deliverablesResult.value
        .filter((d) => CTO_DELIVERABLE_TYPES.includes(d.type))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    : []

  const latestReadinessReport = allCtoDeliverables.find((d) => d.type === 'v1_readiness_report')
  const ctoDeliverables = allCtoDeliverables.slice(0, 10)

  const isOnline = !!ctoWorkforce && ctoContextMemoryCount > 0

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">CTO Agent — Atlas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Engineering orchestrator. Implementation plans, code reviews, milestone tracking, launch
            blockers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isOnline ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
            {isOnline ? 'Online' : ctoWorkforce ? 'Context not seeded' : 'Not provisioned'}
          </span>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brain Memories
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{ctoContextMemoryCount}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">CTO context loaded</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Deliverables Produced
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{ctoDeliverables.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">plans, reviews, reports</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Digital Employee
          </p>
          <p className="mt-1 text-xl font-semibold text-foreground">Atlas</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ctoWorkforce ? `ID: ${ctoWorkforce.id.slice(0, 16)}…` : 'Not provisioned'}
          </p>
        </div>
      </div>

      {/* V1 Readiness Report — shown when at least one report exists */}
      {latestReadinessReport && (
        <Link
          href={`/deliverables/${latestReadinessReport.id}`}
          className="block rounded-lg border-2 border-foreground/10 bg-card p-5 hover:border-foreground/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Latest V1 Readiness Report
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {latestReadinessReport.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Generated {latestReadinessReport.createdAt.toLocaleDateString()} at{' '}
                {latestReadinessReport.createdAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
              View Report →
            </span>
          </div>
        </Link>
      )}

      {/* Run form */}
      {ctoWorkforce ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-1 text-sm font-medium text-foreground">Ask Atlas</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Describe what you need. Atlas detects the task type and produces the right Deliverable.
          </p>
          <form action={triggerCTORunAction} className="space-y-4">
            <textarea
              name="objective"
              rows={3}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Generate implementation plan for Phase 3 Milestone 2"
              required
            />
            <div className="flex flex-wrap gap-2">
              {OBJECTIVE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={undefined}
                  className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
                  aria-label={`Use preset: ${preset}`}
                >
                  {preset.length > 60 ? preset.slice(0, 57) + '…' : preset}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Run Atlas
              </button>
              <p className="text-xs text-muted-foreground">
                Atlas runs through the Trust Engine. No production changes without your
                authorization.
              </p>
            </div>
          </form>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            CTO Workforce is not provisioned for this organization. Sign out and sign back in to
            trigger provisioning.
          </p>
        </div>
      )}

      {/* Refresh context */}
      {ctoWorkforce && (
        <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Repository Context</p>
            <p className="text-xs text-muted-foreground">
              {ctoContextMemoryCount} memories in Brain. Re-seed after major repository changes to
              keep Atlas current.
            </p>
          </div>
          <form action={refreshCTOContextAction}>
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Refresh Context
            </button>
          </form>
        </div>
      )}

      {/* Recent deliverables */}
      <div>
        <h2 className="mb-4 text-sm font-medium text-foreground">Recent Atlas Deliverables</h2>
        {ctoDeliverables.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No CTO deliverables yet. Ask Atlas something.
          </p>
        ) : (
          <div className="space-y-2">
            {ctoDeliverables.map((d) => (
              <Link
                key={d.id}
                href={`/deliverables/${d.id}`}
                className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 hover:border-foreground/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.createdAt.toLocaleDateString()} at{' '}
                    {d.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="ml-4 shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                  {DELIVERABLE_TYPE_LABELS[d.type] ?? d.type}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
