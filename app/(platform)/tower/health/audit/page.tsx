import Link from 'next/link'
import { getAuditHealthDetail } from '../health-data'
import { TowerHealthBadge } from '../../_components/TowerHealthBadge'
import { TowerHealthCalc } from '../../_components/TowerHealthCalc'
import { TowerHealthCard } from '../../_components/TowerHealthCard'
import { TowerHealthAction } from '../../_components/TowerHealthAction'

export const dynamic = 'force-dynamic'

export default async function AuditHealthPage() {
  const data = await getAuditHealthDetail()

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <Link href="/tower/health" className="hover:text-foreground">
              System Health
            </Link>
            <span>/</span>
            <span className="text-foreground">Audit Log</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">Audit Log (24h)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform events and error distribution over the last 24 hours.
          </p>
        </div>
        <TowerHealthBadge status={data.overall} fetchedAt={data.fetchedAt} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Event Breakdown</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TowerHealthCard
            title="Total Events"
            status="healthy"
            value={String(data.total24h)}
            detail="All audit events in the last 24 hours"
          />
          <TowerHealthCard
            title="Successful"
            status="healthy"
            value={String(data.success24h)}
            detail="Events with outcome=success"
          />
          <TowerHealthCard
            title="Denied"
            status="healthy"
            value={String(data.denied24h)}
            detail="Events with outcome=denied (access control working)"
          />
          <TowerHealthCard
            title="Errors"
            status={data.errors24h > 0 ? 'warning' : 'healthy'}
            value={String(data.errors24h)}
            detail={
              data.errors24h > 0
                ? `${data.errors24h} event${data.errors24h !== 1 ? 's' : ''} with error outcome`
                : 'No error events in last 24h'
            }
          />
        </div>
      </section>

      {data.recentEvents.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Events</h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Action
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Actor
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Outcome
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentEvents.map((event, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{event.action}</td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                      {event.actorType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          event.outcome === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : event.outcome === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {event.outcome}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                      {new Date(event.occurredAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <TowerHealthCalc
        description="Audit Log health reflects the presence of error-outcome events in the last 24 hours across all organizations."
        rules={[
          'Healthy when no error-outcome events exist in the last 24 hours.',
          'Warning when error events are present — these indicate failed operations requiring investigation.',
          'Denied events are normal and expected (access control working correctly) — they do not affect health status.',
          'Critical if the audit_events table is inaccessible.',
        ]}
      />

      <TowerHealthAction
        label="View Full Audit Log"
        href="/tower/audit"
        description="Explore the complete cross-organization audit event stream."
      />
    </div>
  )
}
