import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { businessBrainService } from '@/domains/business-brain'
import { workforceEngineService } from '@/domains/workforce-engine'
import { deliverablesService } from '@/domains/deliverables'
import { computeOrganizationReport } from '@/shared/analytics/service'

/**
 * Analytics — Foundation Layer (Phase 2 Milestone 6).
 *
 * Answers the question: "Is my Workforce working?"
 * - Engagement Run counts, success rate, breakdown by status
 * - Deliverable counts by type and status
 * - Business Brain memory composition
 *
 * All data is fetched in parallel and aggregated via the pure
 * computeOrganizationReport() function. No new storage is introduced.
 *
 * See docs/adr/ADR-017-analytics-foundation.md.
 */

const TYPE_LABELS: Record<string, string> = {
  blog_post: 'Blog Post',
  advertisement: 'Advertisement',
  email: 'Email',
  proposal: 'Proposal',
  report: 'Report',
  strategy: 'Strategy',
  image: 'Image',
  video: 'Video',
  hiring_packet: 'Hiring Packet',
  customer_response: 'Customer Response',
}

const MEMORY_TYPE_LABELS: Record<string, string> = {
  company_identity: 'Company Identity',
  brand: 'Brand',
  product: 'Product',
  service: 'Service',
  pricing: 'Pricing',
  policy: 'Policy',
  sop: 'SOP',
  customer: 'Customer',
  asset: 'Asset',
  knowledge: 'Knowledge',
  preference: 'Preference',
  decision: 'Decision',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
}

export default async function AnalyticsPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const [runsResult, deliverablesResult, memoriesResult] = await Promise.all([
    workforceEngineService.listEngagementRuns(ctx.organizationId),
    deliverablesService.listDeliverables({ organizationId: ctx.organizationId }),
    businessBrainService.listAllMemories(ctx.organizationId),
  ])

  const runs = runsResult.ok ? runsResult.value : []
  const deliverables = deliverablesResult.ok ? deliverablesResult.value : []
  const memories = memoriesResult.ok ? memoriesResult.value : []

  const report = computeOrganizationReport(ctx.organizationId, runs, deliverables, memories)

  const successRateDisplay =
    report.engagementRuns.successRate === null
      ? '—'
      : `${Math.round(report.engagementRuns.successRate * 100)}%`

  const runsByStatus = Object.entries(report.engagementRuns.byStatus).sort(([, a], [, b]) => b - a)
  const deliverablesByType = Object.entries(report.deliverables.byType).sort(
    ([, a], [, b]) => b - a
  )
  const memoriesByType = Object.entries(report.businessBrain.byType).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Is your Workforce working? Here is the answer.
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Runs
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {report.engagementRuns.total}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Success Rate
          </p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              report.engagementRuns.successRate === null
                ? 'text-muted-foreground'
                : report.engagementRuns.successRate >= 0.8
                  ? 'text-green-600'
                  : report.engagementRuns.successRate >= 0.5
                    ? 'text-yellow-600'
                    : 'text-destructive'
            }`}
          >
            {successRateDisplay}
          </p>
          {report.engagementRuns.successRate === null && (
            <p className="mt-0.5 text-xs text-muted-foreground">No completed runs yet</p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total Deliverables
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{report.deliverables.total}</p>
          {report.deliverables.published > 0 && (
            <p className="mt-0.5 text-xs text-green-600">
              {report.deliverables.published} published
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Brain Memories
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {report.businessBrain.totalMemories}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Engagement Runs by status */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">Runs by Status</h2>
          {runsByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runsByStatus.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  <span className="font-mono text-sm font-medium text-foreground">{count}</span>
                </div>
              ))}
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completed</span>
                  <span className="font-mono text-xs text-green-600">
                    {report.engagementRuns.completed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Failed</span>
                  <span className="font-mono text-xs text-destructive">
                    {report.engagementRuns.failed}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deliverables by type */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">Deliverables by Type</h2>
          {deliverablesByType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliverables yet.</p>
          ) : (
            <div className="space-y-2">
              {deliverablesByType.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {TYPE_LABELS[type] ?? type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-sm font-medium text-foreground">{count}</span>
                </div>
              ))}
              {report.deliverables.pendingReview > 0 && (
                <div className="mt-3 rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  {report.deliverables.pendingReview} awaiting your review
                </div>
              )}
            </div>
          )}
        </div>

        {/* Business Brain composition */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">Brain by Memory Type</h2>
          {memoriesByType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No memories yet.</p>
          ) : (
            <div className="space-y-2">
              {memoriesByType.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {MEMORY_TYPE_LABELS[type] ?? type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-sm font-medium text-foreground">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
