import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'
import { timeAgo } from '@/shared/lib/time'
import { updateDigitalEmployeeAction, updateWorkforceGoalsAction } from './actions'
import { computeWorkforceStats } from './_components/workforce-stats'

/**
 * Workforces page — Phase 2 Milestone 5 (Workforce Management).
 *
 * Customers can view and configure their Workforces and Digital Employees:
 * - Set business goals for each Workforce (one goal per line)
 * - Update Digital Employee responsibilities
 * - Toggle Workforce active/inactive status
 *
 * Edit mode is controlled by URL params (searchParams.edit for Workforces,
 * searchParams.editEmployee for Digital Employees) so the page stays a pure
 * server component with no client-side state.
 *
 * See docs/adr/ADR-016-workforce-management.md.
 */

interface Props {
  searchParams: Promise<{ edit?: string; editEmployee?: string }>
}

const RUN_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  running: 'Running',
  awaiting_approval: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
}

const RUN_STATUS_COLORS: Record<string, string> = {
  pending: 'text-muted-foreground',
  running: 'text-blue-600',
  awaiting_approval: 'text-yellow-600',
  approved: 'text-green-600',
  rejected: 'text-destructive',
  completed: 'text-green-600',
  failed: 'text-destructive',
}

const WORKFORCE_STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-muted text-muted-foreground',
} as const

const EMPLOYEE_STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-muted text-muted-foreground',
} as const

export default async function WorkforcesPage({ searchParams }: Props) {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const { edit, editEmployee } = await searchParams

  const [workforcesResult, runsResult] = await Promise.all([
    workforceEngineService.listWorkforces(ctx.organizationId),
    workforceEngineService.listEngagementRuns(ctx.organizationId),
  ])
  const workforces = workforcesResult.ok ? workforcesResult.value : []
  const allRuns = runsResult.ok ? runsResult.value : []

  const teams = await Promise.all(
    workforces.map(async (wf) => {
      const empResult = await workforceEngineService.listDigitalEmployees(wf.id, ctx.organizationId)
      return {
        workforce: wf,
        employees: empResult.ok ? empResult.value : [],
        stats: computeWorkforceStats(wf.id, allRuns),
      }
    })
  )

  const activeCount = workforces.filter((w) => w.status === 'active').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Workforces</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {workforces.length === 0
            ? 'No Workforces registered yet.'
            : `${activeCount} active ${activeCount === 1 ? 'Workforce' : 'Workforces'} — your operating team.`}
        </p>
      </div>

      {workforces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No Workforces have been registered.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Workforces appear here once the platform is configured with your organization.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map(({ workforce, employees, stats }) => {
            const isEditingWorkforce = edit === workforce.id

            return (
              <div
                key={workforce.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                {/* Workforce header */}
                <div className="border-b border-border px-5 py-4">
                  {isEditingWorkforce ? (
                    /* Edit form for workforce goals */
                    <form action={updateWorkforceGoalsAction} className="space-y-4">
                      <input type="hidden" name="workforceId" value={workforce.id} />

                      <div>
                        <h2 className="text-base font-semibold text-foreground">
                          {workforce.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {workforce.businessFunction}
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor={`goals-${workforce.id}`}
                          className="mb-1 block text-xs font-medium text-muted-foreground"
                        >
                          Business Goals (one per line)
                        </label>
                        <textarea
                          id={`goals-${workforce.id}`}
                          name="goals"
                          rows={4}
                          defaultValue={workforce.goals.join('\n')}
                          placeholder="e.g. Publish 10 articles per month&#10;Increase organic traffic by 20%"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`status-${workforce.id}`}
                          className="mb-1 block text-xs font-medium text-muted-foreground"
                        >
                          Status
                        </label>
                        <select
                          id={`status-${workforce.id}`}
                          name="status"
                          defaultValue={workforce.status}
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Save
                        </button>
                        <a
                          href="/workforces"
                          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          Cancel
                        </a>
                      </div>
                    </form>
                  ) : (
                    /* Read-only workforce header */
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold text-foreground">
                          {workforce.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {workforce.businessFunction}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                          {workforce.id}
                        </p>

                        {workforce.goals.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-muted-foreground">Goals</p>
                            <ul className="mt-1 space-y-0.5">
                              {workforce.goals.map((goal, i) => (
                                <li key={i} className="text-xs text-foreground">
                                  · {goal}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-start gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${WORKFORCE_STATUS_STYLES[workforce.status]}`}
                        >
                          {workforce.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <a
                          href={`/workforces?edit=${workforce.id}`}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Edit goals
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Workforce Activity — run history and stats */}
                {stats.totalRuns > 0 && (
                  <div className="border-b border-border bg-muted/20 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{stats.totalRuns}</strong>{' '}
                        {stats.totalRuns === 1 ? 'run' : 'runs'} total
                      </span>
                      <span>·</span>
                      <span>{stats.completedRuns} completed</span>
                      {stats.failedRuns > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-destructive">{stats.failedRuns} failed</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{stats.totalDeliverables} deliverables produced</span>
                      {stats.lastActiveAt && (
                        <>
                          <span>·</span>
                          <span>Last active {timeAgo(stats.lastActiveAt)}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {stats.recentRuns.map((run) => (
                        <a
                          key={run.id}
                          href={`/runs/${run.id}`}
                          className="flex items-center justify-between rounded px-1 py-1 text-xs hover:bg-muted"
                        >
                          <span className="truncate text-foreground">{run.objective}</span>
                          <span
                            className={`ml-4 shrink-0 ${RUN_STATUS_COLORS[run.status] ?? 'text-muted-foreground'}`}
                          >
                            {RUN_STATUS_LABELS[run.status] ?? run.status}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digital Employees */}
                {employees.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-muted-foreground">
                    No Digital Employees registered.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {employees.map((emp) => {
                      const isEditingEmployee = editEmployee === emp.id

                      return (
                        <div key={emp.id} className="px-5 py-4">
                          {isEditingEmployee ? (
                            /* Edit form for Digital Employee responsibilities */
                            <form action={updateDigitalEmployeeAction} className="space-y-3">
                              <input type="hidden" name="digitalEmployeeId" value={emp.id} />

                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {emp.name}
                                  </p>
                                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                    {emp.role}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${EMPLOYEE_STATUS_STYLES[emp.status]}`}
                                >
                                  {emp.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <div>
                                <label
                                  htmlFor={`resp-${emp.id}`}
                                  className="mb-1 block text-xs font-medium text-muted-foreground"
                                >
                                  Responsibilities (one per line)
                                </label>
                                <textarea
                                  id={`resp-${emp.id}`}
                                  name="responsibilities"
                                  rows={4}
                                  defaultValue={emp.responsibilities.join('\n')}
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                  Save
                                </button>
                                <a
                                  href="/workforces"
                                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                                >
                                  Cancel
                                </a>
                              </div>
                            </form>
                          ) : (
                            /* Read-only Digital Employee */
                            <div>
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-foreground">
                                    {emp.name}
                                  </p>
                                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                    {emp.role}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-start gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${EMPLOYEE_STATUS_STYLES[emp.status]}`}
                                  >
                                    {emp.status === 'active' ? 'Active' : 'Inactive'}
                                  </span>
                                  <a
                                    href={`/workforces?editEmployee=${emp.id}`}
                                    className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    Edit
                                  </a>
                                </div>
                              </div>

                              {emp.responsibilities.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                  {emp.responsibilities.map((r, i) => (
                                    <li key={i} className="text-xs text-muted-foreground">
                                      · {r}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {emp.permittedTools.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {emp.permittedTools.map((tool) => (
                                    <span
                                      key={tool}
                                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                                    >
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
