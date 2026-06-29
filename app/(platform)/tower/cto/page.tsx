import Link from 'next/link'
import { getCTOData } from './cto-data'
import type { IssueSeverity } from './cto-data'

export const dynamic = 'force-dynamic'

const SEVERITY_BADGE: Record<IssueSeverity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
  info: 'bg-muted text-muted-foreground',
}

const SEVERITY_BORDER: Record<IssueSeverity, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
  info: 'border-border',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

export default async function CTOOperationsCenterPage() {
  const data = await getCTOData()
  const { platformIssues, maintenance, technicalDebt, pendingDecisions, generatedAt } = data

  const briefTime = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/tower" className="hover:text-foreground">
              Tower Control
            </Link>
            <span>/</span>
            <span className="text-foreground">CTO Operations</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">CTO Operations Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform issues, maintenance backlog, technical debt, and pending decisions
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Platform Issues */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Platform Issues{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({platformIssues.length})
            </span>
          </h2>
          <Link
            href="/tower/health"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Full health dashboard →
          </Link>
        </div>

        {platformIssues.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              No platform issues detected
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              All monitored systems are operating normally
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {platformIssues.map((issue) => (
              <div
                key={issue.id}
                className={`rounded-lg border bg-card p-4 ${SEVERITY_BORDER[issue.severity]}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[issue.severity]}`}
                    >
                      {issue.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">{issue.affectedSystem}</span>
                  </div>
                  <Link
                    href={issue.href}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View details →
                  </Link>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">{issue.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {issue.explanation}
                </p>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Action:</span>{' '}
                    {issue.recommendedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recently Resolved */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recently Resolved</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6">
          <p className="text-sm text-muted-foreground">
            Resolution history is not available — requires health state persistence
          </p>
          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground">
            Tower Control derives platform issues from live data on each page load. To track when
            issues are resolved and how long they persisted, a health history table would need to be
            added to the database.
          </p>
        </div>
      </section>

      {/* Recommended Maintenance */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Recommended Maintenance{' '}
          <span className="ml-1 font-normal text-muted-foreground">({maintenance.length})</span>
        </h2>
        <div className="space-y-3">
          {maintenance.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.area}</span>
                </div>
                {item.href && (
                  <Link
                    href={item.href}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View →
                  </Link>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Effort:</span> {item.effort}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Technical Debt */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Technical Debt{' '}
          <span className="ml-1 font-normal text-muted-foreground">({technicalDebt.length})</span>
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Item
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Category
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Impact
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Effort
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {technicalDebt.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 align-top sm:table-cell">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {item.category}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 align-top text-xs text-muted-foreground lg:table-cell">
                    {item.impact}
                  </td>
                  <td className="hidden px-4 py-3 text-right align-top text-xs text-muted-foreground md:table-cell">
                    {item.effort}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending Founder Decisions */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Pending Founder Decisions{' '}
          <span className="ml-1 font-normal text-muted-foreground">
            ({pendingDecisions.length})
          </span>
        </h2>

        {pendingDecisions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">No pending decisions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDecisions.map((decision) => (
              <div key={decision.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{decision.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {decision.context}
                </p>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Options
                  </p>
                  <ul className="space-y-1">
                    {decision.options.map((opt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-px flex-shrink-0 font-medium text-muted-foreground/60">
                          {i + 1}.
                        </span>
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={decision.href}
                    className="mt-3 inline-flex items-center text-xs text-foreground hover:underline"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
