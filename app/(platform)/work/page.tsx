import Link from 'next/link'
import { WORK_NAV } from '../_lib/nav-items'

/**
 * Work — compositional shell for the customer lifecycle (Architect lock 339fed89).
 *
 * Presentation only. The three destinations already exist (/approvals, /runs,
 * /deliverables) and stay loadable at those URLs. This page does not fetch
 * domain data, create work, or redirect those routes; it composes them so Work
 * has a valid primary destination.
 */
const STAGE_COPY: Record<string, string> = {
  '/approvals': 'Review work that is waiting for your yes.',
  '/runs': 'See what your team is working on now.',
  '/deliverables': 'Open the results your team has finished.',
}

export default function WorkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Work</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow the loop: ask on Home, then review, watch progress, and collect
          results here.
        </p>
      </div>

      <nav aria-label="Work lifecycle" className="grid gap-3 sm:grid-cols-3">
        {WORK_NAV.map((stage) => (
          <Link
            key={stage.href}
            href={stage.href}
            className="rounded-lg border border-border bg-card p-4 hover:bg-muted/40"
          >
            <p className="text-sm font-medium text-foreground">{stage.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {STAGE_COPY[stage.href] ?? 'Open this step.'}
            </p>
          </Link>
        ))}
      </nav>
    </div>
  )
}
