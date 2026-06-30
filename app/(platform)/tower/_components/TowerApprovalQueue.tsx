'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AgentTask, TaskPriority } from '../agents/agent-tasks'

type TaskLocalState = 'pending' | 'rejected' | 'deferred'

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  low: 'bg-muted text-muted-foreground',
}

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  critical: 'border-red-200 dark:border-red-800',
  high: 'border-amber-200 dark:border-amber-800',
  medium: 'border-border',
  low: 'border-border',
}

interface Props {
  tasks: AgentTask[]
  agentFilter?: string
}

export function TowerApprovalQueue({ tasks, agentFilter }: Props) {
  const [localStates, setLocalStates] = useState<Record<string, TaskLocalState>>({})

  const filtered = agentFilter ? tasks.filter((t) => t.agentId === agentFilter) : tasks
  const pending = filtered.filter((t) => !localStates[t.id] || localStates[t.id] === 'pending')
  const rejected = filtered.filter((t) => localStates[t.id] === 'rejected')
  const deferred = filtered.filter((t) => localStates[t.id] === 'deferred')

  const setState = (id: string, state: TaskLocalState) =>
    setLocalStates((prev) => ({ ...prev, [id]: state }))

  if (pending.length === 0 && rejected.length === 0 && deferred.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          No pending recommendations
        </p>
        <p className="mt-1 text-xs text-muted-foreground">All agent tasks have been reviewed</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending tasks */}
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((task) => (
            <div
              key={task.id}
              className={`rounded-lg border bg-card p-4 ${PRIORITY_BORDER[task.priority]}`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-start gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {task.agentName}
                </span>
                <span className="text-xs text-muted-foreground">{task.source}</span>
              </div>

              {/* Description */}
              <p className="mt-2 text-sm font-medium text-foreground">{task.description}</p>

              {/* Recommended action */}
              <div className="mt-2 border-t border-border/50 pt-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Recommended action:</span>{' '}
                  {task.recommendedAction}
                </p>
                {task.requiresApproval && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Requires approval:</span> Yes
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                <Link
                  href={task.href}
                  onClick={() => setState(task.id, 'pending')}
                  className="inline-flex items-center rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90"
                >
                  Approve &amp; act →
                </Link>
                <button
                  onClick={() => setState(task.id, 'deferred')}
                  className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                >
                  Defer
                </button>
                <button
                  onClick={() => setState(task.id, 'rejected')}
                  className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && (rejected.length > 0 || deferred.length > 0) && (
        <div className="rounded-lg border border-border bg-card px-4 py-6 text-center">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            All visible recommendations reviewed
          </p>
        </div>
      )}

      {/* Deferred */}
      {deferred.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Deferred ({deferred.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Deferred items will reappear on the next page load until the underlying issue is
            resolved.
          </p>
          {deferred.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  deferred
                </span>
                <p className="text-xs text-muted-foreground">{task.description}</p>
              </div>
              <button
                onClick={() => setState(task.id, 'pending')}
                className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rejected */}
      {rejected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Rejected ({rejected.length})
          </p>
          <p className="text-xs text-muted-foreground">
            Rejected items will reappear on the next page load until the underlying issue is
            resolved.
          </p>
          {rejected.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  rejected
                </span>
                <p className="text-xs text-muted-foreground line-through">{task.description}</p>
              </div>
              <button
                onClick={() => setState(task.id, 'pending')}
                className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
