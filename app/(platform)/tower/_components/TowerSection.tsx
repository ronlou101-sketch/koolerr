import Link from 'next/link'

interface TowerSectionProps {
  title: string
  description?: string
  viewAllHref?: string
  children: React.ReactNode
}

export function TowerSection({ title, description, viewAllHref, children }: TowerSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  )
}
