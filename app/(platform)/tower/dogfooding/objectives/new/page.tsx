'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ObjectiveGoalType } from '@/domains/dogfooding'

const GOAL_TYPES: { value: ObjectiveGoalType; label: string; description: string }[] = [
  {
    value: 'user_acquisition',
    label: 'User Acquisition',
    description: 'Drive sign-ups and new account creation',
  },
  {
    value: 'brand_awareness',
    label: 'Brand Awareness',
    description: 'Increase Koolerr visibility and recognition',
  },
  {
    value: 'lead_generation',
    label: 'Lead Generation',
    description: 'Capture qualified leads for the sales pipeline',
  },
  {
    value: 'revenue',
    label: 'Revenue',
    description: 'Drive direct subscription upgrades and payments',
  },
  {
    value: 'retention',
    label: 'Retention',
    description: 'Re-engage existing users and reduce churn',
  },
]

export default function NewObjectivePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState<ObjectiveGoalType>('user_acquisition')
  const [targetAudience, setTargetAudience] = useState('')
  const [budgetDollars, setBudgetDollars] = useState('')
  const [successMetrics, setSuccessMetrics] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/tower/dogfooding/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          goalType,
          targetAudience: targetAudience.trim() || undefined,
          successMetrics: successMetrics
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          budgetCents: budgetDollars ? Math.round(parseFloat(budgetDollars) * 100) : 0,
        }),
      })

      const data = (await res.json()) as { objective?: { id: string }; error?: string }

      if (!res.ok || !data.objective) {
        throw new Error(data.error ?? 'Failed to create objective')
      }

      router.push(`/tower/dogfooding/objectives/${data.objective.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/tower" className="hover:text-foreground">
            Tower Control
          </Link>
          <span>/</span>
          <Link href="/tower/dogfooding" className="hover:text-foreground">
            Dogfooding
          </Link>
          <span>/</span>
          <Link href="/tower/dogfooding/objectives" className="hover:text-foreground">
            Objectives
          </Link>
          <span>/</span>
          <span className="text-foreground">New</span>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold text-foreground">New Marketing Objective</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a marketing goal. Once saved, you can trigger the 5-agent pipeline to generate a
          full campaign plan automatically.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5 rounded-lg border border-border bg-card p-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground">
              Objective title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acquire 500 trial sign-ups in Q3 2026"
              disabled={submitting}
              required
              className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground">
              Description
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Context for the AI pipeline — who to target, why now, and what success looks like.
            </p>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={submitting}
              required
              placeholder="We want to acquire SaaS founders and growth marketers who currently spend $5k+/month on contractors. The pipeline should target LinkedIn-active growth marketers who have used tools like Jasper or Copy.ai..."
              className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-foreground">Goal type</label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {GOAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setGoalType(type.value)}
                  disabled={submitting}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    goalType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-foreground">
              Target audience <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="audience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. SaaS founders, growth marketers, marketing agencies"
              disabled={submitting}
              className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Budget */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-foreground">
              Budget ($) <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="budget"
              type="number"
              min="0"
              step="100"
              value={budgetDollars}
              onChange={(e) => setBudgetDollars(e.target.value)}
              placeholder="e.g. 5000"
              disabled={submitting}
              className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          {/* Success Metrics */}
          <div>
            <label htmlFor="metrics" className="block text-sm font-medium text-foreground">
              Success metrics{' '}
              <span className="font-normal text-muted-foreground">(optional, one per line)</span>
            </label>
            <textarea
              id="metrics"
              value={successMetrics}
              onChange={(e) => setSuccessMetrics(e.target.value)}
              rows={3}
              disabled={submitting}
              placeholder="500 trial sign-ups&#10;CPA under $10&#10;5% trial-to-paid conversion"
              className="mt-1.5 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!title.trim() || !description.trim() || submitting}
            className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create Objective'}
          </button>
          <Link
            href="/tower/dogfooding/objectives"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
