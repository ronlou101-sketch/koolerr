import Link from 'next/link'

type CardStatus = 'ready' | 'live' | 'error' | 'pending'

interface TowerCardProps {
  title: string
  description: string
  href?: string
  status?: CardStatus
  badge?: string
  external?: boolean
}

const STATUS: Record<CardStatus, { dot: string; label: string }> = {
  ready: { dot: 'bg-muted-foreground/40', label: 'Ready for integration.' },
  live: { dot: 'bg-emerald-500', label: 'Live' },
  error: { dot: 'bg-destructive', label: 'Error' },
  pending: { dot: 'bg-amber-400', label: 'Connecting…' },
}

export function TowerCard({
  title,
  description,
  href,
  status = 'ready',
  badge,
  external = false,
}: TowerCardProps) {
  const { dot, label } = STATUS[status]

  const inner = (
    <div className="group relative flex h-full flex-col rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-snug text-foreground">{title}</p>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {badge && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {badge}
            </span>
          )}
          {href && (
            <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
              →
            </span>
          )}
        </div>
      </div>
      <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )

  if (!href) return inner

  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block h-full"
    >
      {inner}
    </Link>
  )
}
