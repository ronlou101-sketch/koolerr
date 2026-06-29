import Link from 'next/link'

interface TowerEmptyStateProps {
  title?: string
  description?: string
  action?: { label: string; href: string }
}

export function TowerEmptyState({
  title = 'No data yet',
  description = 'This section will populate once the data integration is complete.',
  action,
}: TowerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
