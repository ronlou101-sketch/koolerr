import Link from 'next/link'
import type { ActionItem, ActionPriority } from '../executive/executive-data'

interface TowerActionQueueProps {
  items: ActionItem[]
}

const PRIORITY_CONFIG: Record<
  ActionPriority,
  { label: string; dot: string; badge: string; text: string }
> = {
  critical: {
    label: 'Critical',
    dot: 'bg-destructive',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
  },
  high: {
    label: 'High',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-400',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
  },
  low: {
    label: 'Low',
    dot: 'bg-muted-foreground/40',
    badge: 'bg-muted text-muted-foreground',
    text: 'text-muted-foreground',
  },
}

export function TowerActionQueue({ items }: TowerActionQueueProps) {
  const urgentCount = items.filter((i) => i.priority === 'critical' || i.priority === 'high').length

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground">Founder Action Queue</p>
        {items.length === 0 ? (
          <span className="text-xs text-muted-foreground">All clear</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {urgentCount > 0 && (
              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                {urgentCount} urgent
              </span>
            )}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            No actions required
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Platform is operating normally.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const cfg = PRIORITY_CONFIG[item.priority]
            return (
              <li key={item.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.reason}</p>
                    <p className="text-xs text-foreground/70">
                      <span className="font-medium">Action:</span> {item.recommendedAction}
                    </p>
                  </div>
                  <Link
                    href={item.href}
                    className="flex-shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground/30 hover:bg-muted"
                  >
                    Manage →
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
