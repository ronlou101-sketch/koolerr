import { notFound } from 'next/navigation'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusTask {
  id: string
  label: string
  done: boolean
}

interface StatusBlocker {
  id: string
  label: string
  owner: string | null
  resolved: boolean
}

interface StatusData {
  focus: string
  tasks: StatusTask[]
  blockers: StatusBlocker[]
}

interface Commit {
  hash: string
  subject: string
  ago: string
}

// ─── Data readers ─────────────────────────────────────────────────────────────

function readStatus(): StatusData {
  const raw = readFileSync(join(process.cwd(), 'docs', 'status.json'), 'utf-8')
  return JSON.parse(raw) as StatusData
}

function git(args: string): string {
  return execSync(`git ${args}`, {
    encoding: 'utf8',
    cwd: process.cwd(),
    timeout: 4000,
  }).trim()
}

function getTowerPhaseCount(): number {
  try {
    const log = git('log --oneline')
    const matches = log.match(/feat\(tower\): Phase \d+/g) ?? []
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

function getLastCommitAge(): string {
  try {
    return git('log -1 --pretty=format:%cr')
  } catch {
    return 'unknown'
  }
}

function getRecentCommits(): Commit[] {
  try {
    const raw = git('log -8 --pretty=format:%h%x09%s%x09%cr')
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [hash, subject, ago] = line.split('\t')
        return { hash: hash ?? '', subject: subject ?? '', ago: ago ?? '' }
      })
  } catch {
    return []
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackerPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (authUser?.email !== 'ronlou101@gmail.com') notFound()

  const status = readStatus()
  const platformPhaseCount = getTowerPhaseCount()
  const lastCommitAge = getLastCommitAge()
  const recentCommits = getRecentCommits()

  const TOTAL_PLATFORM_PHASES = 12
  const platformComplete = platformPhaseCount >= TOTAL_PLATFORM_PHASES

  const pendingTasks = status.tasks.filter((t) => !t.done)
  const doneTasks = status.tasks.filter((t) => t.done)
  const taskTotal = status.tasks.length
  const taskPct = taskTotal > 0 ? Math.round((doneTasks.length / taskTotal) * 100) : 0

  const openBlockers = status.blockers.filter((b) => !b.resolved)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Project Status</h1>
        <p className="text-xs text-muted-foreground">Last commit {lastCommitAge}</p>
      </div>

      {/* Platform Status + Current Focus */}
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
          <p className="mt-2 text-sm font-semibold text-foreground">{status.focus || 'Not set'}</p>
        </div>
      </div>

      {/* Active Tasks + Blockers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Tasks */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Tasks
            </p>
            <span className="text-xs text-muted-foreground">
              {doneTasks.length} / {taskTotal}
            </span>
          </div>
          <Bar percent={taskPct} color={taskPct === 100 ? 'bg-emerald-500' : 'bg-amber-400'} />
          {taskTotal === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No active tasks.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {[...pendingTasks, ...doneTasks].map((task) => (
                <li key={task.id} className="flex items-start gap-2">
                  <span
                    className={`mt-px flex-shrink-0 text-xs leading-none ${
                      task.done ? 'text-emerald-500' : 'text-muted-foreground'
                    }`}
                  >
                    {task.done ? '✓' : '○'}
                  </span>
                  <span
                    className={`text-xs leading-relaxed ${
                      task.done
                        ? 'text-muted-foreground line-through decoration-muted-foreground/40'
                        : 'text-foreground'
                    }`}
                  >
                    {task.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Blockers */}
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
                  <div className="min-w-0">
                    <p className="text-xs leading-relaxed text-foreground">{b.label}</p>
                    {b.owner && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Owner: {b.owner}</p>
                    )}
                  </div>
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
        {recentCommits.length === 0 ? (
          <p className="text-xs text-muted-foreground">Git history not available.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentCommits.map((c) => (
              <li
                key={c.hash}
                className="flex items-baseline justify-between gap-4 py-1.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground">
                    {c.hash}
                  </span>
                  <span className="truncate text-xs text-foreground">{c.subject}</span>
                </div>
                <span className="flex-shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                  {c.ago}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
