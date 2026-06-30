import { notFound } from 'next/navigation'
import { execSync } from 'child_process'
import { parseTracker } from './parse-tracker'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export const dynamic = 'force-dynamic'

interface ActivityItem {
  id: string
  label: string
  meta: string
}

function getGitActivity(): ActivityItem[] | null {
  try {
    const raw = execSync('git log -8 --pretty=format:%h%x09%s%x09%cr', {
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 3000,
    })
    return raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, subject, ago] = line.split('\t')
        return { id: hash ?? '', label: subject ?? '', meta: ago ?? '' }
      })
  } catch {
    return null
  }
}

function getTowerPhaseCount(): number {
  try {
    const raw = execSync('git log --oneline', {
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 3000,
    })
    const matches = raw.match(/feat\(tower\): Phase \d+/g) ?? []
    const phases = new Set(
      matches.flatMap((m) => {
        const n = m.match(/Phase (\d+)/)?.[1]
        return n ? [n] : []
      })
    )
    return phases.size
  } catch {
    return 12
  }
}

function Bar({ percent, color = 'bg-emerald-500' }: { percent: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
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
  const gitActivity = getGitActivity()
  const platformPhaseCount = getTowerPhaseCount()

  const TOTAL_PLATFORM_PHASES = 12
  const platformComplete = platformPhaseCount >= TOTAL_PLATFORM_PHASES

  const openBlockers = data.blockers.filter((b) => b.status !== 'resolved')
  const doneItems = data.objectiveItems.filter((o) => o.done)
  const pendingItems = data.objectiveItems.filter((o) => !o.done)
  const taskTotal = data.objectiveItems.length
  const taskPct = taskTotal > 0 ? Math.round((doneItems.length / taskTotal) * 100) : 0

  const recentActivity: ActivityItem[] = gitActivity
    ? gitActivity
    : data.ledger.slice(0, 6).map((e) => ({ id: e.date, label: e.mission, meta: e.date }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Project Status</h1>
        <p className="text-xs text-muted-foreground">Tracker updated {data.lastUpdated}</p>
      </div>

      {/* Platform Development + Current Focus */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className={`rounded-lg border p-4 ${
            platformComplete
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
              : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Platform Development
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={platformComplete ? 'text-emerald-500' : 'text-amber-500'}>
              {platformComplete ? '✅' : '◑'}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {platformComplete ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {platformPhaseCount} of {TOTAL_PLATFORM_PHASES} platform phases
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Current Focus
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {data.currentPhaseName || 'Not set'}
          </p>
          {data.currentMission && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {data.currentMission}
            </p>
          )}
        </div>
      </div>

      {/* Active Tasks + Blockers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Tasks
            </p>
            <span className="text-xs text-muted-foreground">
              {doneItems.length}/{taskTotal}
            </span>
          </div>
          <Bar percent={taskPct} color={taskPct === 100 ? 'bg-emerald-500' : 'bg-amber-400'} />
          {taskTotal === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No active tasks.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {[...pendingItems, ...doneItems].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className={`mt-px flex-shrink-0 text-xs leading-none ${
                      item.done ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  >
                    {item.done ? '✓' : '○'}
                  </span>
                  <span
                    className={`text-xs leading-relaxed ${
                      item.done
                        ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                        : 'text-foreground'
                    }`}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Blockers
            </p>
            {openBlockers.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {openBlockers.length} open
              </span>
            )}
          </div>
          {openBlockers.length === 0 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">No open blockers.</p>
          ) : (
            <ul className="space-y-2.5">
              {openBlockers.map((b) => (
                <li key={b.id} className="flex items-start gap-2">
                  <span className="mt-px flex-shrink-0 font-mono text-xs font-semibold text-amber-500">
                    {b.id}
                  </span>
                  <span className="text-xs leading-relaxed text-foreground">{b.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </p>
        {recentActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity found.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground">
                    {item.id}
                  </span>
                  <span className="truncate text-xs text-foreground">{item.label}</span>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">{item.meta}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
