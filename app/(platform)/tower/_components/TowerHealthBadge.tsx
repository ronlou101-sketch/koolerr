import type { HealthStatus } from '../health/health-data'

const CONFIG: Record<
  HealthStatus,
  { dot: string; label: string; border: string; bg: string; text: string }
> = {
  healthy: {
    dot: 'bg-emerald-500',
    label: 'Healthy',
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  warning: {
    dot: 'bg-amber-400',
    label: 'Warning',
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-800 dark:text-amber-200',
  },
  critical: {
    dot: 'bg-destructive',
    label: 'Critical',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950',
    text: 'text-red-800 dark:text-red-200',
  },
  'not-configured': {
    dot: 'bg-muted-foreground/40',
    label: 'Not Configured',
    border: 'border-border',
    bg: 'bg-muted/20',
    text: 'text-muted-foreground',
  },
}

interface TowerHealthBadgeProps {
  status: HealthStatus
  fetchedAt?: string
}

export function TowerHealthBadge({ status, fetchedAt }: TowerHealthBadgeProps) {
  const cfg = CONFIG[status]
  const time = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      })
    : null

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-4 py-2 ${cfg.border} ${cfg.bg}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
      <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
      {time && <span className={`text-xs ${cfg.text} opacity-60`}>· {time}</span>}
    </div>
  )
}
