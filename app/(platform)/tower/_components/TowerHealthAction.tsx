import Link from 'next/link'

interface TowerHealthActionProps {
  label: string
  href: string
  description?: string
}

export function TowerHealthAction({ label, href, description }: TowerHealthActionProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Manage</p>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {label} →
        </Link>
      </div>
    </div>
  )
}
