import type { ExecutiveSummary } from '../executive/executive-data'

interface TowerExecutiveSummaryProps {
  summary: ExecutiveSummary
  generatedAt: string
}

const STATUS_CONFIG = {
  good: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  attention: {
    dot: 'bg-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
  },
  critical: {
    dot: 'bg-destructive',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/40',
  },
}

export function TowerExecutiveSummary({ summary, generatedAt }: TowerExecutiveSummaryProps) {
  const cfg = STATUS_CONFIG[summary.statusLevel]
  const time = new Date(generatedAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  return (
    <div className={`rounded-lg border p-5 ${cfg.border} ${cfg.bg}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${cfg.dot}`} />
          <p className={`text-sm font-medium ${cfg.text}`}>{summary.headline}</p>
        </div>
        <p className="text-xs text-muted-foreground">Platform Analysis · Generated {time}</p>
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-border/50 pt-4">
        {summary.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-px flex-shrink-0 text-muted-foreground/50">·</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {summary.priorities.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recommended Priorities
          </p>
          <ul className="space-y-1.5">
            {summary.priorities.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                <span className="mt-px flex-shrink-0 font-medium text-muted-foreground">→</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
