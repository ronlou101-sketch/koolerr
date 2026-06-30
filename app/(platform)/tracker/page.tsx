import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createSessionServerClient } from '@/shared/lib/supabase-session'

export const dynamic = 'force-dynamic'

interface Status {
  completed: string[]
  current: string[]
  remaining: string[]
}

function readStatus(): Status {
  const raw = readFileSync(join(process.cwd(), 'docs', 'status.json'), 'utf-8')
  return JSON.parse(raw) as Status
}

export default async function TrackerPage() {
  const supabase = await createSessionServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (authUser?.email !== 'ronlou101@gmail.com') notFound()

  const status = readStatus()
  const total = status.completed.length + status.current.length + status.remaining.length

  return (
    <div className="max-w-2xl space-y-12">
      <h1 className="text-2xl font-semibold text-foreground">Koolerr Progress</h1>

      {/* ✅ Completed */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">✅ Completed</h2>
          <span className="text-sm text-muted-foreground">
            {status.completed.length} of {total} milestones
          </span>
        </div>
        <ul className="space-y-2.5">
          {status.completed.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex-shrink-0 text-sm text-emerald-500">✓</span>
              <span className="text-sm text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 🚧 Currently Building */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">🚧 Currently Building</h2>
        {status.current.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing in progress.</p>
        ) : (
          <ul className="space-y-2.5">
            {status.current.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex-shrink-0 text-sm text-amber-500">◉</span>
                <span className="text-sm font-medium text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ⏳ Remaining */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-foreground">⏳ Remaining</h2>
          <span className="text-sm text-muted-foreground">
            {status.remaining.length} milestone{status.remaining.length === 1 ? '' : 's'}
          </span>
        </div>
        {status.remaining.length === 0 ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">All milestones complete.</p>
        ) : (
          <ul className="space-y-2.5">
            {status.remaining.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex-shrink-0 text-sm text-muted-foreground">○</span>
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
