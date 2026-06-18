import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { auditLogger } from '@/shared/audit'

/**
 * Audit Trail page.
 *
 * Shows the 100 most recent audit events for the organization. Gives
 * customers the auditability guarantee required by Phase 1 exit criteria:
 * "All AI actions are logged, attributed, and auditable."
 *
 * Read-only in Phase 1 — filtering, export, and pagination are Phase 2 scope.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §8.5 — Auditability.
 * See FOUNDATION_003_DEVELOPMENT_ROADMAP.md — Phase 1 exit criteria.
 */

const OUTCOME_COLORS = {
  success: 'text-green-600',
  failure: 'text-destructive',
  denied: 'text-yellow-600',
} as const

const OUTCOME_LABELS = {
  success: 'Success',
  failure: 'Failed',
  denied: 'Denied',
} as const

const ACTOR_LABELS = {
  user: 'User',
  digital_employee: 'Digital Employee',
  system: 'System',
} as const

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\./g, ' › ')
}

function formatTime(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default async function AuditPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const events = await auditLogger.query({
    tenantId: ctx.tenantId,
    organizationId: ctx.organizationId,
    limit: 100,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Trail</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All AI actions performed by your workforce, logged and attributed.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No audit events recorded yet. Events appear here after your first Engagement Run.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Outcome
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {formatTime(event.occurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm capitalize text-foreground">
                      {formatAction(event.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {ACTOR_LABELS[event.actor.type]}
                      </span>
                      <p className="mt-0.5 max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                        {event.actor.id}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {event.resourceType.replace(/_/g, ' ')}
                      </span>
                      <p className="mt-0.5 max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                        {event.resourceId}
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`text-sm font-medium ${OUTCOME_COLORS[event.outcome]}`}>
                      {OUTCOME_LABELS[event.outcome]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-2">
            <p className="text-xs text-muted-foreground">
              Showing {events.length} most recent {events.length === 1 ? 'event' : 'events'}. Audit
              records are permanent and append-only.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
