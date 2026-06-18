import { redirect } from 'next/navigation'
import { getRequestPlatformContext } from '@/infrastructure/auth'
import { workforceEngineService } from '@/domains/workforce-engine'

/**
 * Workforces page — Phase 2 Customer Dashboard.
 *
 * Shows every Workforce registered to the organization and the Digital
 * Employees within each one. Customers see their team structure: who
 * is active, what each Digital Employee is responsible for, and which
 * tools they are permitted to use.
 *
 * Read-only in Phase 2. Workforce Management (goal/responsibility editing)
 * is delivered in Phase 2 Milestone 5.
 *
 * See FOUNDATION_001_ARCHITECTURE.md §2.6, §2.7 — Workforces and Digital Employees.
 */

const WORKFORCE_STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-muted text-muted-foreground',
} as const

const EMPLOYEE_STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-muted text-muted-foreground',
} as const

export default async function WorkforcesPage() {
  const ctx = await getRequestPlatformContext()
  if (!ctx) redirect('/login')

  const workforcesResult = await workforceEngineService.listWorkforces(ctx.organizationId)
  const workforces = workforcesResult.ok ? workforcesResult.value : []

  const teams = await Promise.all(
    workforces.map(async (wf) => {
      const empResult = await workforceEngineService.listDigitalEmployees(wf.id, ctx.organizationId)
      return { workforce: wf, employees: empResult.ok ? empResult.value : [] }
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
          {teams.map(({ workforce, employees }) => (
            <div
              key={workforce.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              {/* Workforce header */}
              <div className="flex items-start justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{workforce.name}</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {workforce.businessFunction}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{workforce.id}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${WORKFORCE_STATUS_STYLES[workforce.status]}`}
                >
                  {workforce.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Digital Employees */}
              {employees.length === 0 ? (
                <div className="px-5 py-4 text-sm text-muted-foreground">
                  No Digital Employees registered.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {employees.map((emp) => (
                    <div key={emp.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{emp.name}</p>
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
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
