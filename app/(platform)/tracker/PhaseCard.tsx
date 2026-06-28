'use client'

import { useState } from 'react'
import type { PhaseData, BlockerData, ItemStatus, BlockerStatus } from './parse-tracker'

function statusBadge(status: ItemStatus | BlockerStatus) {
  const cfg: Record<string, { label: string; cls: string }> = {
    complete: {
      label: 'Complete',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    },
    'in-progress': {
      label: 'In Progress',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    },
    'not-started': { label: 'Not Started', cls: 'bg-muted text-muted-foreground' },
    blocked: { label: 'Blocked', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    pending: {
      label: 'Pending',
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    },
    'needs-review': {
      label: 'Needs Review',
      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    resolved: {
      label: 'Resolved',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    },
    waiting: { label: 'Waiting', cls: 'bg-muted text-muted-foreground' },
  }
  const { label, cls } = cfg[status] ?? cfg['not-started']!
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  )
}

function itemDot(status: ItemStatus) {
  if (status === 'complete')
    return <span className="mt-0.5 flex-shrink-0 text-xs text-emerald-500">✓</span>
  if (status === 'in-progress')
    return <span className="mt-0.5 flex-shrink-0 text-xs text-amber-500">◑</span>
  if (status === 'blocked')
    return <span className="mt-0.5 flex-shrink-0 text-xs text-red-500">✗</span>
  return <span className="mt-0.5 flex-shrink-0 text-xs text-muted-foreground">○</span>
}

interface PhaseCardProps {
  phase: PhaseData
  activeBlockers: BlockerData[]
}

export function PhaseCard({ phase, activeBlockers }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isDone = phase.status === 'complete'
  const isActive = phase.status === 'in-progress'
  const borderCls = isDone
    ? 'border-emerald-200 dark:border-emerald-800'
    : isActive
      ? 'border-amber-200 dark:border-amber-800'
      : 'border-border'
  const bgCls = isDone
    ? 'bg-emerald-50 dark:bg-emerald-950/30'
    : isActive
      ? 'bg-amber-50 dark:bg-amber-950/30'
      : 'bg-card'

  const totalItems = phase.groups.reduce((n, g) => n + g.items.length, 0)
  const doneItems = phase.groups.reduce(
    (n, g) => n + g.items.filter((i) => i.status === 'complete').length,
    0
  )

  return (
    <div className={`rounded-lg border ${borderCls} ${bgCls} overflow-hidden`}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Phase {phase.number}</span>
            {statusBadge(phase.status)}
          </div>
          <p className="mt-0.5 text-xs font-semibold leading-snug text-foreground">{phase.name}</p>
          {totalItems > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {doneItems}/{totalItems} items
            </p>
          )}
          {phase.percent > 0 && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${phase.percent}%` }}
              />
            </div>
          )}
        </div>
        <span
          className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-3 pb-4 pt-3">
          {phase.description && (
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {phase.description}
            </p>
          )}

          {phase.groups.length === 0 && !phase.description && (
            <p className="text-xs text-muted-foreground">No details available.</p>
          )}

          {phase.groups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
              {group.heading && (
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.heading}
                </p>
              )}
              <ul className="space-y-1.5">
                {group.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2">
                    {itemDot(item.status)}
                    <span
                      className={`text-xs leading-relaxed ${
                        item.status === 'complete'
                          ? 'text-muted-foreground'
                          : item.status === 'blocked'
                            ? 'text-destructive'
                            : 'text-foreground'
                      }`}
                    >
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {activeBlockers.length > 0 && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-2.5 dark:border-red-800 dark:bg-red-950/30">
              <p className="mb-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
                Active blockers
              </p>
              <ul className="space-y-1">
                {activeBlockers.map((b) => (
                  <li key={b.id} className="flex items-start gap-1.5">
                    <span className="flex-shrink-0 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      {b.id}
                    </span>
                    <span className="text-xs text-red-700 dark:text-red-300">{b.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
