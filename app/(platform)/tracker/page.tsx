import { notFound } from 'next/navigation'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string
  label: string
  done: boolean
}

interface Blocker {
  id: string
  label: string
  owner: string | null
  resolved: boolean
}

interface Status {
  currentFocus: string
  activeTasks: Task[]
  blockers: Blocker[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

function readStatus(): Status {
  const raw = readFileSync(join(process.cwd(), 'docs', 'status.json'), 'utf-8')
  return JSON.parse(raw) as Status
}

function gitCmd(args: string): string {
  return execSync(`git ${args}`, { encoding: 'utf8', cwd: process.cwd(), timeout: 4000 }).trim()
}

function platformPhases(): number {
  try {
    const log = gitCmd('log --oneline')
    const nums = new Set(
      (log.match(/feat\(tower\): Phase \d+/g) ?? []).flatMap((m) => {
        const n = m.match(/Phase (\d+)/)?.[1]
        return n ? [n] : []
      })
    )
    return nums.size
  } catch {
    return 12
  }
}

function lastCommitAge(): string {
  try {
    return gitCmd('log -1 --pretty=format:%cr')
  } catch {
    return ''
  }
}

interface Commit {
  hash: string
  subject: string
  ago: string
}

function recentCommits(): Commit[] {
  try {
    return gitCmd('log -6 --pretty=format:%h%x09%s%x09%cr')
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrackerPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (authUser?.email !== 'ronlou101@gmail.com') notFound()

  const status = readStatus()
  const phaseCount = platformPhases()
  const age = lastCommitAge()
  const commits = recentCommits()

  const TOTAL = 12
  const complete = phaseCount >= TOTAL

  const pending = status.activeTasks.filter((t) => !t.done)
  const done = status.activeTasks.filter((t) => t.done)
  const total = status.activeTasks.length
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0

  const openBlockers = status.blockers.filter((b) => !b.resolved)

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Project Status</h1>
        {age && <p className="text-xs text-muted-foreground">Last commit {age}</p>}
      </div>

      {/* Top strip — Platform + Focus */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* 🟢 Platform */}
        <div
          className={`rounded-lg border p-3 ${
            complete
              ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
              : 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          }`}
        >
          <p className="text-xs text-muted-foreground">🟢 Platform</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {complete ? 'Complete' : 'In Progress'}
          </p>
          <p className="text-xs text-muted-foreground">
            {phaseCount} / {TOTAL} phases
          </p>
        </div>

        {/* 🎯 Current Focus */}
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">🎯 Current Focus</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{status.currentFocus || '—'}</p>
        </div>
      </div>

      {/* Middle row — Tasks + Blockers */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* ✅ Active Tasks */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">✅ Active Tasks</p>
            <span className="text-xs font-medium text-foreground">
              {done.length} / {total}
              {total > 0 && <span className="ml-1 text-muted-foreground">({pct}%)</span>}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {pending.length === 0 && done.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active tasks.</p>
          ) : (
            <ul className="space-y-1">
              {pending.map((t) => (
                <li key={t.id} className="flex items-start gap-1.5">
                  <span className="mt-px flex-shrink-0 text-xs text-muted-foreground">○</span>
                  <span className="text-xs leading-snug text-foreground">{t.label}</span>
                </li>
              ))}
              {done.length > 0 && (
                <li className="mt-1 text-xs text-muted-foreground">✓ {done.length} completed</li>
              )}
            </ul>
          )}
        </div>

        {/* 🚧 Open Blockers */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">🚧 Open Blockers</p>
            {openBlockers.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {openBlockers.length}
              </span>
            )}
          </div>

          {openBlockers.length === 0 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">No open blockers.</p>
          ) : (
            <ul className="space-y-2">
              {openBlockers.map((b) => (
                <li key={b.id} className="flex items-start gap-1.5">
                  <span className="flex-shrink-0 font-mono text-xs font-semibold text-amber-500">
                    {b.id}
                  </span>
                  <span className="text-xs leading-snug text-foreground">{b.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 📝 Recent Activity */}
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs text-muted-foreground">📝 Recent Activity</p>
        {commits.length === 0 ? (
          <p className="text-xs text-muted-foreground">Git history unavailable.</p>
        ) : (
          <ul className="divide-y divide-border">
            {commits.map((c) => (
              <li
                key={c.hash}
                className="flex items-baseline justify-between gap-3 py-1 first:pt-0 last:pb-0"
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
