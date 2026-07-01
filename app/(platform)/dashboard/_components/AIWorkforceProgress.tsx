'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface StepState {
  step: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error: string | null
}

interface PipelineStatus {
  runId: string
  runStatus: string
  steps: StepState[]
  completedCount: number
  totalSteps: number
  currentStep: string | null
  failedStep: string | null
  isComplete: boolean
  isFailed: boolean
}

const STEP_LABELS: Record<string, string> = {
  research: 'Research',
  strategy: 'Strategy',
  creative: 'Creative',
  video: 'Video Production',
  publishing: 'Publishing',
  approval: 'Approval',
  delivery: 'Delivery',
}

function StatusDot({ status }: { status: StepState['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
        <svg className="h-3 w-3 text-green-600" viewBox="0 0 12 12" fill="currentColor">
          <path
            d="M3.5 6.5l2 2 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }
  if (status === 'running') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
        <span className="h-2 w-2 rounded-full bg-red-500" />
      </span>
    )
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
    </span>
  )
}

export function AIWorkforceProgress({ runId }: { runId: string }) {
  const [status, setStatus] = useState<PipelineStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai-workforce/status/${runId}`)
      if (!res.ok) {
        setError('Failed to load pipeline status')
        return
      }
      const data = (await res.json()) as PipelineStatus
      setStatus(data)
      if (data.isComplete || data.isFailed) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch {
      setError('Connection error')
    }
  }, [runId])

  useEffect(() => {
    void poll()
    intervalRef.current = setInterval(() => {
      void poll()
    }, 4000)
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [poll])

  if (error) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-destructive">{error}</p>
      </section>
    )
  }

  if (!status) {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Loading AI Workforce status…</p>
      </section>
    )
  }

  const progressPct = Math.round((status.completedCount / status.totalSteps) * 100)

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Workforce Running</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {status.isComplete
              ? 'Pipeline complete — your content package is ready.'
              : status.isFailed
                ? `Pipeline stopped at ${status.failedStep ?? 'unknown step'}.`
                : status.currentStep
                  ? `${STEP_LABELS[status.currentStep] ?? status.currentStep} in progress…`
                  : 'Starting up…'}
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {status.completedCount}/{status.totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            status.isFailed ? 'bg-destructive' : status.isComplete ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step list */}
      <ul className="space-y-2">
        {status.steps.map((s) => (
          <li key={s.step} className="flex items-center gap-2.5">
            <StatusDot status={s.status} />
            <span
              className={`text-xs ${
                s.status === 'completed'
                  ? 'text-foreground'
                  : s.status === 'running'
                    ? 'font-medium text-blue-600'
                    : s.status === 'failed'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
              }`}
            >
              {STEP_LABELS[s.step] ?? s.step}
            </span>
            {s.error && <span className="ml-1 text-xs text-destructive/80">({s.error})</span>}
          </li>
        ))}
      </ul>

      {status.isComplete && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
          Your content package has been delivered. Check{' '}
          <strong>Deliverables Awaiting Review</strong> above.
        </div>
      )}
    </section>
  )
}
