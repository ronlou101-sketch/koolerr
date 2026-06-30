import { notFound } from 'next/navigation'
import { parseTracker } from './parse-tracker'
import { PhaseCard } from './PhaseCard'
import type { ItemStatus, BlockerStatus } from './parse-tracker'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: ItemStatus | BlockerStatus }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    complete: {
      label: 'Complete',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    },
    'in-progress': {
      label: 'In Progress',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    },
    'not-started': { label: 'Not Started', cls: 'bg-muted text-muted-foreground' },
    blocked: { label: 'Blocked', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    pending: {
      label: 'Pending',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    },
    'needs-review': {
      label: 'Needs Review',
      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    resolved: {
      label: 'Resolved',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    },
    waiting: { label: 'Waiting', cls: 'bg-muted text-muted-foreground' },
  }
  const { label, cls } = cfg[status] ?? cfg['not-started']!
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  )
}

function Bar({
  percent,
  color = 'bg-emerald-500',
  height = 'h-1.5',
}: {
  percent: number
  color?: string
  height?: string
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-muted ${height}`}>
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

export default async function TrackerPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (authUser?.email !== 'ronlou101@gmail.com') notFound()

  const data = parseTracker()

  const openBlockers = data.blockers.filter((b) => b.status !== 'resolved')
  const currentPhase = data.phases.find((p) => p.status === 'in-progress') ?? data.phases[0]!
  const doneCount = data.objectiveItems.filter((o) => o.done).length
  const objectivePct =
    data.objectiveItems.length > 0 ? Math.round((doneCount / data.objectiveItems.length) * 100) : 0

  const platformMilestones = [
    'Tower Control Phase 1 — Foundation & Auth',
    'Tower Control Phase 2 — Executive Intelligence',
    'Tower Control Phase 3 — Autonomous Operations',
    'Tower Control Phase 4 — Agent Execution Framework',
    'Tower Control Phase 5 — Autonomous Support',
    'Tower Control Phase 6 — Autonomous Execution',
    'Tower Control Phase 7 — Business Brain',
    'Tower Control Phase 8 — Founder Intelligence',
    'Tower Control Phase 9 — Company Operating System',
    'Tower Control Phase 10 — Company Memory',
    'Tower Control Phase 11 — Self-Optimization Engine',
    'Tower Control Phase 12 — Predictive Intelligence Engine',
  ]

  const platformFeatures = [
    'Executive Intelligence — AI-powered strategic briefings and company health dashboards',
    'Autonomous Operations — Real-time monitoring of all company systems',
    'Agent Execution Framework — Delegated AI workforce with task routing',
    'Autonomous Support — AI-first support triage and resolution',
    'Autonomous Execution — Mission-based execution engine with approval gates',
    'Business Brain — Living knowledge base and company intelligence layer',
    'Founder Intelligence — Personalized decision support for the founder',
    'Company Operating System — SOPs, rituals, and operational cadence',
    'Company Memory — Persistent institutional knowledge across sessions',
    'Self-Optimization Engine — Continuous analysis of efficiency and automation opportunities',
    'Predictive Intelligence — Forward-looking forecasts across all company domains',
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Koolerr Tracker</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live view of{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              docs/KOOLERR_MASTER_TRACKER.md
            </code>{' '}
            · Read-only · Markdown file is the source of truth
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Last updated</p>
          <p className="font-mono text-sm font-medium text-foreground">{data.lastUpdated}</p>
        </div>
      </div>

      {/* Success banner */}
      <div className="rounded-lg border border-emerald-400 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/40">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏁</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Tower Control v1 Complete
            </p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              The AI Operating System has been fully implemented. Current company focus has shifted
              from platform development to launch execution.
            </p>
          </div>
        </div>
      </div>

      {/* Top-level progress cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Platform Development
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-emerald-800 dark:text-emerald-300">
              100%
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Complete
            </span>
          </div>
          <Bar percent={100} color="bg-emerald-500" height="h-2" />
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            12 of 12 phases · Completed June 2026
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Launch Readiness
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-foreground">{data.overallPercent}%</span>
            <span className="text-sm text-muted-foreground">overall</span>
          </div>
          <Bar percent={data.overallPercent} color="bg-amber-400" height="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {data.phases.filter((p) => p.status === 'complete').length} of {data.phases.length}{' '}
            launch phases complete
          </p>
        </div>
      </div>

      {/* Platform Development section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-emerald-500">✅</span>
          <p className="text-sm font-semibold text-foreground">
            Platform Development — Tower Control v1
          </p>
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            COMPLETE
          </span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platform Milestones — 12 of 12 Complete
          </p>
          <ul className="space-y-2">
            {platformMilestones.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-px flex-shrink-0 text-sm text-emerald-500">✓</span>
                <span className="text-xs text-foreground">{m}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tower Control v1 — Feature Summary
          </p>
          <ul className="space-y-2">
            {platformFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-px flex-shrink-0 font-mono text-xs font-semibold text-emerald-500">
                  {(i + 1).toString().padStart(2, '0')}
                </span>
                <span className="text-xs leading-relaxed text-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Launch Readiness section */}
      <div className="flex items-center gap-3 border-t border-border pt-4">
        <p className="text-base font-semibold text-foreground">Launch Readiness</p>
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          In Progress
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Overall Progress
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">{data.overallPercent}%</p>
          <Bar percent={data.overallPercent} color="bg-emerald-500" height="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Phase 1 complete · Phase 2 near-complete · Phase 3 in progress
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Phase
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl font-semibold text-foreground">{currentPhase.percent}%</span>
            <StatusBadge status={currentPhase.status} />
          </div>
          <Bar percent={currentPhase.percent} color="bg-amber-400" height="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Phase {currentPhase.number} — {currentPhase.name}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Open Blockers
          </p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold text-foreground">{openBlockers.length}</span>
            <span className="text-sm text-muted-foreground">
              blocker{openBlockers.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {openBlockers.slice(0, 4).map((b) => (
              <span key={b.id} className="font-mono text-xs font-medium text-muted-foreground">
                {b.id}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Current mission + session objective */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Mission
          </p>
          <p className="mt-2 text-sm text-foreground">
            {data.currentMission || `Phase ${currentPhase.number} — ${currentPhase.name}`}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session Objective
            </p>
            <span className="text-xs text-muted-foreground">
              {doneCount} / {data.objectiveItems.length}
            </span>
          </div>
          <div className="mt-1.5">
            <Bar percent={objectivePct} color="bg-emerald-500" height="h-1.5" />
          </div>
          <ul className="mt-4 space-y-2.5">
            {data.objectiveItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className={`mt-px flex-shrink-0 text-sm leading-none ${
                    item.done ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}
                >
                  {item.done ? '✓' : '○'}
                </span>
                <span
                  className={`text-xs leading-relaxed ${
                    item.done
                      ? 'text-muted-foreground line-through decoration-muted-foreground/50'
                      : 'text-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Roadmap — expandable phase cards */}
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Roadmap</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {data.phases.map((phase) => (
            <PhaseCard
              key={phase.number}
              phase={phase}
              activeBlockers={openBlockers.filter((b) => b.phase === phase.number)}
            />
          ))}
        </div>
      </div>

      {/* Blockers */}
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Blockers</p>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Phase
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Owner
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.blockers.map((b) => (
                <tr key={b.id} className={b.status === 'resolved' ? 'opacity-40' : undefined}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                    {b.id}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{b.title}</td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {b.phase}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {b.owner}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Ledger */}
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Progress Ledger</p>
        <div className="space-y-3">
          {data.ledger.map((entry, i) => (
            <div key={i} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div className="w-28 flex-shrink-0">
                <p className="font-mono text-xs text-muted-foreground">{entry.date}</p>
                <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ verified
                </p>
              </div>
              <div className="min-w-0 flex-1 border-l border-border pl-4">
                <p className="text-sm font-medium text-foreground">{entry.mission}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {entry.completed}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open blockers as risks */}
      {openBlockers.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="mb-3 text-sm font-medium text-foreground">Active Risks</p>
          <ul className="space-y-2.5">
            {openBlockers.map((b) => (
              <li key={b.id} className="flex items-start gap-2.5">
                <span className="mt-px flex-shrink-0 text-amber-500">⚠</span>
                <span className="text-xs leading-relaxed text-foreground">
                  <span className="font-mono font-semibold">{b.id}</span> — {b.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Data sourced live from{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            KOOLERR_MASTER_TRACKER.md
          </code>
        </p>
      </div>
    </div>
  )
}
