'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    section: null,
    items: [
      { href: '/tower', label: 'Overview' },
      { href: '/tower/morning-brief', label: 'Morning Brief' },
      { href: '/tower/agents', label: 'Agent Registry' },
      { href: '/tower/approvals', label: 'Approvals' },
    ],
  },
  {
    section: 'Platform',
    items: [
      { href: '/tower/health', label: 'System Health' },
      { href: '/tower/audit', label: 'Audit Events' },
      { href: '/tower/notifications', label: 'Notifications' },
    ],
  },
  {
    section: 'Customers',
    items: [
      { href: '/tower/orgs', label: 'Organizations' },
      { href: '/tower/users', label: 'Users' },
    ],
  },
  {
    section: 'Finance',
    items: [
      { href: '/tower/billing', label: 'Billing' },
      { href: '/tower/revenue', label: 'Revenue' },
    ],
  },
  {
    section: 'AI Workforce',
    items: [
      { href: '/tower/runs', label: 'Activity' },
      { href: '/tower/workforce-status', label: 'Workforce Status' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { href: '/tower/execution', label: 'Execution Engine' },
      { href: '/tower/cto', label: 'CTO Operations' },
      { href: '/tower/automation', label: 'Automation' },
    ],
  },
  {
    section: 'Growth',
    items: [
      { href: '/tower/marketing', label: 'Marketing' },
      { href: '/tower/growth', label: 'Growth Center' },
      { href: '/tower/analytics', label: 'Analytics' },
    ],
  },
  {
    section: 'Support',
    items: [
      { href: '/tower/support', label: 'Support Center' },
      { href: '/tower/customer-success', label: 'Customer Success' },
      { href: '/tower/knowledge-base', label: 'Knowledge Base' },
      { href: '/tower/feedback', label: 'Product Feedback' },
      { href: '/tower/docs', label: 'Internal Docs' },
    ],
  },
  {
    section: 'Founder',
    items: [
      { href: '/tower/recommendations', label: 'Recommendations' },
      { href: '/tracker', label: 'Tracker ↗' },
      { href: '/mission-control', label: 'Mission Control ↗' },
    ],
  },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/tower') return pathname === '/tower'
  if (href.startsWith('/tower/')) return pathname === href || pathname.startsWith(href + '/')
  return pathname === href
}

export function TowerNav() {
  const pathname = usePathname()

  const renderItems = (items: { href: string; label: string }[]) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
          isActive(item.href, pathname)
            ? 'bg-muted font-medium text-foreground'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
        }`}
      >
        {item.label}
      </Link>
    ))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-52 lg:flex-shrink-0 lg:flex-col">
        <div className="mb-4 px-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Tower Control
          </p>
          <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            Founder Only
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((group, i) => (
            <div key={i} className={group.section ? 'mt-5' : ''}>
              {group.section && (
                <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.section}
                </p>
              )}
              {renderItems(group.items)}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile horizontal nav */}
      <div className="mb-6 lg:hidden">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Tower Control
          </p>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            Founder Only
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {NAV.flatMap((g) => g.items).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive(item.href, pathname)
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
