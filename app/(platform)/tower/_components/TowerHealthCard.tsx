import Link from 'next/link'
import type { HealthStatus } from '../health/health-data'

interface TowerHealthCardProps {
  title: string
  status: HealthStatus
  value: string
  detail: string
  href?: string
}

const STATUS_CONFIG: Record<HealthStatus, { dot: string; badge: string; label: string }> = {
  healthy: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    label: 'Healthy',
  },
  warning: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    label: 'Warning',
  },
  critical: {
    dot: 'bg-destructive',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    label: 'Critical',
  },
  'not-configured': {
    dot: 'bg-muted-foreground/40',
    badge: 'bg-muted text-muted-foreground',
    label: 'Not Configured',
  },
}

export function TowerHealthCard({ title, status, value, detail, href }: TowerHealthCardProps) {
  const cfg = STATUS_CONFIG[status]

  const inner = (
    <div className="group relative flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          {href && (
            <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              →
            </span>
          )}
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  )

  if (!href) return inner

  return (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  )
}
