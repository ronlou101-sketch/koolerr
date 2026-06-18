import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { approvalWorkflowService } from '@/shared/approval'
import { resolveApprovalFormAction } from './actions'

interface Props {
  searchParams: Promise<{ resolved?: string }>
}

/**
 * Approvals page — Phase 2 Customer Dashboard.
 *
 * Lists all pending ApprovalRequests for the organization. Customers review
 * each proposed Digital Employee action and approve or reject it. Every
 * decision is forwarded to TrustEngine.recordEvaluation() which advances
 * (or resets) the earned-autonomy counter for that Digital Employee.
 *
 * See FOUNDATION_003 §Phase 2 — Approval Workflows.
 * See docs/adr/ADR-014-approval-workflows.md.
 */
export default async function ApprovalsPage({ searchParams }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { resolved } = await searchParams

  const result = await approvalWorkflowService.listPending(ctx.organizationId, ctx.tenantId)
  const pending = result.ok ? result.value : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Actions your Digital Employees have proposed. Review each one before they proceed.
        </p>
      </div>

      {resolved && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            resolved === 'approved'
              ? 'bg-green-50 text-green-700'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {resolved === 'approved'
            ? 'Action approved. Your Digital Employee will proceed.'
            : 'Action rejected. Your Digital Employee has been notified.'}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No pending approvals.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Approval requests appear here when a Digital Employee proposes a consequential action
            that requires your review before it executes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((req) => (
            <div key={req.id} className="rounded-lg border border-yellow-200 bg-card p-5">
              <div className="space-y-3">
                <div>
                  <span className="inline-block rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                    {req.action.replace(/_/g, ' ')}
                  </span>
                  <p className="mt-2 text-sm font-medium text-foreground">{req.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Run: <code className="font-mono text-xs">{req.engagementRunId}</code>
                  </span>
                  <span>Requested: {req.createdAt.toLocaleString()}</span>
                  {req.expiresAt && (
                    <span className="text-yellow-600">
                      Expires: {req.expiresAt.toLocaleString()}
                    </span>
                  )}
                </div>

                {Object.keys(req.context).length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show context
                    </summary>
                    <pre className="mt-2 overflow-auto rounded bg-muted/40 p-3 text-xs text-foreground">
                      {JSON.stringify(req.context, null, 2)}
                    </pre>
                  </details>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
                  {/* Approve */}
                  <form action={resolveApprovalFormAction}>
                    <input type="hidden" name="id" value={req.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      Approve
                    </button>
                  </form>

                  {/* Reject */}
                  <form action={resolveApprovalFormAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={req.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <input
                      name="note"
                      type="text"
                      placeholder="Rejection reason (optional)"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
