import Link from 'next/link'
import { getCompanyOSData } from './company-os-data'
import type { Mission, MissionState } from './company-os-data'

export const dynamic = 'force-dynamic'

const PRIORITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

const PRIORITY_BORDER: Record<string, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
}

const STATE_BADGE: Record<MissionState, { label: string; class: string }> = {
  executing: {
    label: 'Executing',
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  },
  awaiting_founder: {
    label: 'Awaiting Founder',
    class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  planning: {
    label: 'Planning',
    class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  blocked: {
    label: 'Blocked',
    class: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
  queued: { label: 'Queued', class: 'bg-muted text-muted-foreground' },
  waiting: { label: 'Waiting', class: 'bg-muted text-muted-foreground' },
  retrying: {
    label: 'Retrying',
    class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  failed: {
    label: 'Failed',
    class: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  },
  completed: {
    label: 'Completed',
    class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  archived: { label: 'Archived', class: 'bg-muted text-muted-foreground' },
}

function MissionCard({ mission }: { mission: Mission }) {
  const stateCfg = STATE_BADGE[mission.state]
  return (
    <div
      className={`rounded-lg border bg-card p-4 ${PRIORITY_BORDER[mission.priority] ?? 'border-border'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[mission.priority]}`}
          >
            {mission.priority}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stateCfg.class}`}
          >
            {stateCfg.label}
          </span>
          <span className="text-xs text-muted-foreground">{mission.agentName}</span>
        </div>
        <span className="text-xs text-muted-foreground">{mission.confidence}% confidence</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs font-medium text-foreground">{mission.title}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {mission.description}
      </p>
      <p className="mt-2 text-xs">
        <span className="font-medium text-foreground">Impact: </span>
        <span className="text-muted-foreground">{mission.businessImpact}</span>
      </p>
      {mission.requiresFounderApproval && (
        <div className="mt-2">
          <Link
            href="/tower/approvals"
            className="inline-flex items-center text-xs font-medium text-amber-700 hover:underline dark:text-amber-400"
          >
            Requires approval →
          </Link>
        </div>
      )}
      {mission.dependencies.length > 0 && (
        <p className="mt-1 text-xs text-red-700 dark:text-red-400">
          Blocked by: {mission.dependencies.join(', ')}
        </p>
      )}
    </div>
  )
}

export default async function CompanyOSPage() {
  const os = await getCompanyOSData()

  const briefTime = new Date(os.generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const activeMissions = [...os.missionsByState.executing, ...os.missionsByState.planning]
  const founderQueue = os.missionsByState.awaiting_founder
  const blockedMissions = os.missionsByState.blocked
  const queuedMissions = os.missionsByState.queued

  const missionsByDomain = {
    revenue: os.missions.filter((m) => m.domain === 'revenue' || m.domain === 'billing'),
    growth: os.missions.filter(
      (m) => m.domain === 'growth' || m.domain === 'marketing' || m.domain === 'customer-success'
    ),
    support: os.missions.filter((m) => m.domain === 'support'),
    engineering: os.missions.filter((m) => m.domain === 'engineering' || m.domain === 'automation'),
    marketing: os.missions.filter((m) => m.domain === 'marketing'),
    billing: os.missions.filter((m) => m.domain === 'billing'),
  }

  const mostLoadedAgent = [...os.agentWorkloads].sort(
    (a, b) => b.totalMissions - a.totalMissions
  )[0]

  const biggestBottleneck = os.conflicts[0] ?? null

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
            <span className="text-foreground">Company OS</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold text-foreground">
            Company Operating System
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mission Control — every agent, every mission, every decision in one view
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Generated {briefTime} · Refreshes on load</p>
      </div>

      {/* Executive Objective */}
      <section>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Company Objective
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{os.companyObjective}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Derived from live platform state · Automatically updates as signals change
          </p>
        </div>
      </section>

      {/* Mission state counts */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Current Company State</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              {
                label: 'Executing',
                value: os.stateCounts.executing,
                color: 'text-blue-700 dark:text-blue-400',
              },
              {
                label: 'Awaiting Founder',
                value: os.stateCounts.awaiting_founder,
                color:
                  os.stateCounts.awaiting_founder > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-foreground',
              },
              {
                label: 'Blocked',
                value: os.stateCounts.blocked,
                color:
                  os.stateCounts.blocked > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground',
              },
              { label: 'Planning', value: os.stateCounts.planning, color: 'text-foreground' },
              { label: 'Queued', value: os.stateCounts.queued, color: 'text-muted-foreground' },
            ] as const
          ).map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className={`mt-2 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top 5 Company Priorities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Top 5 Company Priorities</h2>
          <Link
            href="/tower/approvals"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Approval queue →
          </Link>
        </div>
        {os.topPriorities.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              No active priorities
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {os.topPriorities.map((mission, i) => (
              <div key={mission.id} className="flex items-start gap-3">
                <span className="mt-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <MissionCard mission={mission} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Agent Missions */}
      {activeMissions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Active Agent Missions{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({activeMissions.length})
            </span>
          </h2>
          <div className="space-y-2">
            {activeMissions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      )}

      {/* Founder Approval Queue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Upcoming Founder Decisions{' '}
            <span className="ml-1 font-normal text-muted-foreground">({founderQueue.length})</span>
          </h2>
          <Link
            href="/tower/approvals"
            className="text-xs font-medium text-foreground hover:underline"
          >
            Full approval queue →
          </Link>
        </div>

        {founderQueue.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              No decisions pending your approval
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-amber-200 bg-card dark:border-amber-800">
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/20">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {founderQueue.length} mission{founderQueue.length !== 1 ? 's' : ''} waiting for
                founder approval — agents cannot proceed until actioned
              </p>
            </div>
            <div className="divide-y divide-border">
              {founderQueue.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                      >
                        {m.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.agentName}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs font-medium text-foreground">
                      {m.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.businessImpact}</p>
                  </div>
                  <Link
                    href="/tower/approvals"
                    className="flex-shrink-0 text-xs text-foreground hover:underline"
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Blocked Missions */}
      {blockedMissions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Blocked Missions{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({blockedMissions.length})
            </span>
          </h2>
          <div className="space-y-2">
            {blockedMissions.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      )}

      {/* Revenue Risks + Growth Opportunities */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Revenue Risks */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Revenue Risks</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Revenue Watch
              </p>
              {!os.revenueWatch.stripeConnected ? (
                <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">
                  Stripe not connected — billing health unknown
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-sm font-semibold text-foreground">
                      {os.revenueWatch.active}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trialing</p>
                    <p className="text-sm font-semibold text-foreground">
                      {os.revenueWatch.trialing}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Past Due</p>
                    <p
                      className={`text-sm font-semibold ${os.revenueWatch.pastDue > 0 ? 'text-red-700 dark:text-red-400' : 'text-foreground'}`}
                    >
                      {os.revenueWatch.pastDue}
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">{os.revenueWatch.mrrNote}</p>
            </div>
            {missionsByDomain.billing.length > 0 ? (
              <div className="space-y-2">
                {missionsByDomain.billing.slice(0, 3).map((m) => (
                  <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                      >
                        {m.priority}
                      </span>
                      <p className="line-clamp-1 text-xs font-medium text-foreground">{m.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {STATE_BADGE[m.state].label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                No active billing risks detected
              </p>
            )}
          </div>
        </section>

        {/* Growth Opportunities */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Growth Opportunities</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Growth Watch
              </p>
              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <p className="text-xs text-muted-foreground">Orgs</p>
                  <p className="text-sm font-semibold text-foreground">{os.growthWatch.orgCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New (24h)</p>
                  <p
                    className={`text-sm font-semibold ${os.growthWatch.newOrgs24h > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}
                  >
                    {os.growthWatch.newOrgs24h > 0 ? `+${os.growthWatch.newOrgs24h}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New Users</p>
                  <p
                    className={`text-sm font-semibold ${os.growthWatch.newUsers24h > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}
                  >
                    {os.growthWatch.newUsers24h > 0 ? `+${os.growthWatch.newUsers24h}` : '—'}
                  </p>
                </div>
              </div>
            </div>
            {missionsByDomain.growth.length > 0 ? (
              <div className="space-y-2">
                {missionsByDomain.growth.slice(0, 3).map((m) => (
                  <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                      >
                        {m.priority}
                      </span>
                      <p className="line-clamp-1 text-xs font-medium text-foreground">{m.title}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {STATE_BADGE[m.state].label}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No growth missions queued</p>
            )}
          </div>
        </section>
      </div>

      {/* Domain Queues */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Support Queue */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Support Queue{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({missionsByDomain.support.length})
            </span>
          </h2>
          {missionsByDomain.support.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-4 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">No support missions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {missionsByDomain.support.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                    >
                      {m.priority}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${STATE_BADGE[m.state].class}`}
                    >
                      {STATE_BADGE[m.state].label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">{m.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Engineering Queue */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Engineering Queue{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({missionsByDomain.engineering.length})
            </span>
          </h2>
          {missionsByDomain.engineering.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-4 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                No engineering missions
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {missionsByDomain.engineering.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                    >
                      {m.priority}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${STATE_BADGE[m.state].class}`}
                    >
                      {STATE_BADGE[m.state].label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">{m.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Marketing Queue */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Marketing Queue{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({missionsByDomain.marketing.length})
            </span>
          </h2>
          {missionsByDomain.marketing.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-4 text-center">
              <p className="text-xs text-muted-foreground">No marketing missions queued</p>
            </div>
          ) : (
            <div className="space-y-2">
              {missionsByDomain.marketing.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                    >
                      {m.priority}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${STATE_BADGE[m.state].class}`}
                    >
                      {STATE_BADGE[m.state].label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">{m.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Billing Queue */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Billing Queue{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({missionsByDomain.billing.length})
            </span>
          </h2>
          {missionsByDomain.billing.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-4 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">No billing missions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {missionsByDomain.billing.slice(0, 3).map((m) => (
                <div key={m.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                    >
                      {m.priority}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${STATE_BADGE[m.state].class}`}
                    >
                      {STATE_BADGE[m.state].label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium text-foreground">{m.title}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Agent Workloads */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Agent Mission Workloads</h2>
          <Link
            href="/tower/agents"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Agent registry →
          </Link>
        </div>
        {mostLoadedAgent && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              Most loaded:{' '}
              <span className="font-medium text-foreground">{mostLoadedAgent.agentName}</span> with{' '}
              <span className="font-medium text-foreground">{mostLoadedAgent.totalMissions}</span>{' '}
              missions
            </p>
          </div>
        )}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Agent
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Critical/High
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Awaiting
                </th>
                <th className="hidden px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground md:table-cell">
                  Confidence
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {os.agentWorkloads.map((wl) => (
                <tr key={wl.agentId}>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">{wl.agentName}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-foreground">
                    {wl.totalMissions}
                  </td>
                  <td className="hidden px-4 py-3 text-right text-xs tabular-nums sm:table-cell">
                    <span
                      className={
                        wl.criticalMissions > 0
                          ? 'font-medium text-amber-700 dark:text-amber-400'
                          : 'text-muted-foreground'
                      }
                    >
                      {wl.criticalMissions}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs tabular-nums">
                    <span
                      className={
                        wl.awaitingFounder > 0
                          ? 'font-medium text-amber-700 dark:text-amber-400'
                          : 'text-muted-foreground'
                      }
                    >
                      {wl.awaitingFounder}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right md:table-cell">
                    <span
                      className={`text-xs font-medium ${
                        wl.avgConfidence >= 80
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : wl.avgConfidence >= 60
                            ? 'text-amber-700 dark:text-amber-400'
                            : wl.avgConfidence > 0
                              ? 'text-red-700 dark:text-red-400'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {wl.avgConfidence > 0 ? `${wl.avgConfidence}%` : '—'}
                    </span>
                  </td>
                  <td className="hidden max-w-48 px-4 py-3 lg:table-cell">
                    <p className="truncate text-xs text-muted-foreground">
                      {wl.estimatedBusinessImpact}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mission Conflicts */}
      {os.conflicts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Mission Conflicts{' '}
            <span className="ml-1 font-normal text-muted-foreground">({os.conflicts.length})</span>
          </h2>
          <div className="space-y-2">
            {os.conflicts.map((conflict, i) => (
              <div
                key={i}
                className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20"
              >
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {conflict.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{conflict.resolution}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottleneck summary */}
      {biggestBottleneck && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Biggest Bottleneck</h2>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">
              {biggestBottleneck.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{biggestBottleneck.resolution}</p>
          </div>
        </section>
      )}

      {/* Completed Today */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Completed Today</h2>
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-5">
          <p className="text-sm font-medium text-foreground">No completion history available</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Mission completion tracking requires a persistence layer. Currently, all missions are
            re-derived from live platform state on each page load. A{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">mission_history</code>{' '}
            table would enable tracking resolved missions, completion times, and agent performance
            over time.
          </p>
          <Link
            href="/tower/execution"
            className="mt-3 inline-block text-xs text-foreground hover:underline"
          >
            Execution engine →
          </Link>
        </div>
      </section>

      {/* System Timeline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            System Timeline{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({os.systemTimeline.length} recent events)
            </span>
          </h2>
          <Link href="/tower/audit" className="text-xs text-muted-foreground hover:text-foreground">
            Full audit log →
          </Link>
        </div>
        {os.systemTimeline.length === 0 ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No recent system events</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {os.systemTimeline.map((event, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${event.outcome === 'success' ? 'bg-emerald-500' : event.outcome === 'error' ? 'bg-red-500' : 'bg-muted-foreground/30'}`}
                  />
                  <p className="flex-1 font-mono text-xs text-foreground">{event.action}</p>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {event.actorType}
                  </span>
                  <span className="hidden flex-shrink-0 text-xs text-muted-foreground lg:block">
                    {new Date(event.occurredAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Company Memory */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Company Memory</h2>
        <p className="text-xs text-muted-foreground">
          Derived from live platform signals — requires a persistence layer for historical tracking
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              label: 'Recent Wins',
              items: os.companyMemory.recentWins,
              emptyText: 'No wins recorded yet',
              color: 'text-emerald-700 dark:text-emerald-400',
            },
            {
              label: 'Recent Failures',
              items: os.companyMemory.recentFailures,
              emptyText: 'No failures detected',
              color: 'text-red-700 dark:text-red-400',
            },
            {
              label: 'Repeated Problems',
              items: os.companyMemory.repeatedProblems,
              emptyText: 'No recurring problems',
              color: 'text-amber-700 dark:text-amber-400',
            },
            {
              label: 'Lessons Learned',
              items: os.companyMemory.lessonsLearned,
              emptyText: 'No lessons recorded yet',
              color: 'text-blue-700 dark:text-blue-400',
            },
            {
              label: 'Pending Decisions',
              items: os.companyMemory.pendingDecisions,
              emptyText: 'No pending decisions',
              color: 'text-amber-700 dark:text-amber-400',
            },
            {
              label: 'Frequently Escalated',
              items: os.companyMemory.frequentlyEscalated,
              emptyText: 'No escalations detected',
              color: 'text-red-700 dark:text-red-400',
            },
          ].map(({ label, items, emptyText, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              {items.length === 0 ? (
                <p className={`text-xs ${color}`}>{emptyText}</p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Queued for later */}
      {queuedMissions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Queued{' '}
            <span className="ml-1 font-normal text-muted-foreground">
              ({queuedMissions.length} missions)
            </span>
          </h2>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="divide-y divide-border">
              {queuedMissions.slice(0, 8).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`inline-flex flex-shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${PRIORITY_BADGE[m.priority]}`}
                  >
                    {m.priority}
                  </span>
                  <p className="line-clamp-1 flex-1 text-xs text-muted-foreground">{m.title}</p>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">{m.agentName}</span>
                </div>
              ))}
              {queuedMissions.length > 8 && (
                <div className="px-4 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    +{queuedMissions.length - 8} more queued
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Architecture note */}
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="text-xs font-medium text-foreground">How the Company OS works</p>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The Company OS derives every mission from live platform data — no stored state, no fake
          tasks. Missions are generated from agent recommendations, support escalations, health
          check failures, and revenue signals. The orchestration layer assigns states (queued,
          planning, executing, blocked, awaiting_founder) based on platform signals and dependency
          rules. All founder approvals flow through the{' '}
          <Link
            href="/tower/approvals"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Approval Queue
          </Link>{' '}
          — the Company OS never executes external actions autonomously.
        </p>
      </div>
    </div>
  )
}
