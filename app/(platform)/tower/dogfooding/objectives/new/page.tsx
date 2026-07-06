'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Users,
  Phone,
  CalendarCheck,
  Megaphone,
  Wrench,
  Tag,
  HeartHandshake,
  Snowflake,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

type GoalOption = {
  label: string
  icon: React.ElementType
}

const GOAL_OPTIONS: GoalOption[] = [
  { label: 'Generate More Leads', icon: Users },
  { label: 'Get More Phone Calls', icon: Phone },
  { label: 'Book More Appointments', icon: CalendarCheck },
  { label: 'Increase Brand Awareness', icon: Megaphone },
  { label: 'Promote a Specific Service', icon: Wrench },
  { label: 'Promote a Special Offer', icon: Tag },
  { label: 'Increase Customer Retention', icon: HeartHandshake },
  { label: 'Seasonal Campaign', icon: Snowflake },
  { label: 'Custom Goal', icon: Sparkles },
]

type WizardState = {
  goalType: string
}

export default function NewObjectivePage() {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [_wizardState, setWizardState] = useState<WizardState | null>(null)

  function handleNext() {
    if (!selectedGoal) return
    setWizardState({ goalType: selectedGoal })
    // Step 2 will be built here
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Breadcrumb */}
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
        <span className="text-foreground">New Campaign</span>
      </div>

      {/* Progress indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Step 1 of 6</span>
          <span>AI Campaign Architect</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === 0 ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          What would you like to accomplish?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose your primary marketing goal. We&apos;ll build the rest of your campaign around it.
        </p>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOAL_OPTIONS.map(({ label, icon: Icon }) => {
          const isSelected = selectedGoal === label
          return (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedGoal(label)}
              className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${
                isSelected
                  ? 'bg-primary/8 border-primary shadow-sm ring-1 ring-primary'
                  : 'hover:bg-primary/4 border-border bg-card hover:border-primary/40'
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-sm font-medium leading-snug transition-colors ${
                  isSelected ? 'text-primary' : 'text-foreground'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <Link
            href="/tower/dogfooding/objectives"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={!selectedGoal}
            onClick={handleNext}
            className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
