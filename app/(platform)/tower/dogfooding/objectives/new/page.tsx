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
  Search,
  Check,
} from 'lucide-react'

// ── Step 1 data ────────────────────────────────────────────────────────────────

type GoalOption = { label: string; icon: React.ElementType; primary?: boolean }

const GOAL_OPTIONS: GoalOption[] = [
  { label: 'More Leads', icon: Users, primary: true },
  { label: 'More Calls', icon: Phone, primary: true },
  { label: 'More Appointments', icon: CalendarCheck, primary: true },
  { label: 'Brand Awareness', icon: Megaphone },
  { label: 'Promote a Service', icon: Wrench },
  { label: 'Special Offer', icon: Tag },
  { label: 'Customer Retention', icon: HeartHandshake },
  { label: 'Seasonal Campaign', icon: Snowflake },
  { label: 'Something Else', icon: Sparkles },
]

// ── Step 2 data ────────────────────────────────────────────────────────────────

const BUSINESS_TYPES: string[] = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Landscaping',
  'Pest Control',
  'Cleaning',
  'Garage Door',
  'Locksmith',
  'Pool Service',
  'Pressure Washing',
  'Painting',
  'Flooring',
  'Remodeling',
  'Appliance Repair',
  'Auto Repair',
  'Roadside Assistance',
  'Towing',
  'Moving Company',
  'Medical Spa',
  'Dental Office',
  'Chiropractic',
  'Law Firm',
  'Real Estate',
  'Insurance',
  'Accounting',
  'Restaurant',
  'Coffee Shop',
  'Retail',
  'Other',
]

// ── Wizard state ───────────────────────────────────────────────────────────────

type WizardState = {
  goalType: string
  businessType?: string
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          Step {step} of {total}
        </span>
        <span>AI Campaign Architect</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ── Step 1 ─────────────────────────────────────────────────────────────────────

function Step1({
  selected,
  onSelect,
  onNext,
}: {
  selected: string | null
  onSelect: (v: string) => void
  onNext: () => void
}) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">What&apos;s your goal?</h1>
        <p className="mt-1 text-xs text-muted-foreground/70">This takes about 60 seconds.</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose one. We&apos;ll handle the rest.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GOAL_OPTIONS.map(({ label, icon: Icon, primary }) => {
          const isSelected = selected === label
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className={`group relative flex items-start gap-3 rounded-xl p-4 text-left transition-all duration-150 ${
                isSelected
                  ? 'bg-primary/8 border-2 border-primary shadow-sm'
                  : primary
                    ? 'hover:bg-primary/4 border border-border bg-card shadow-sm hover:border-primary/40'
                    : 'hover:bg-primary/4 border border-border bg-card hover:border-primary/40'
              }`}
            >
              {isSelected && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : primary
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-sm font-medium leading-snug transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>

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
            disabled={!selected}
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Step 2 ─────────────────────────────────────────────────────────────────────

function Step2({
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  selected: string | null
  onSelect: (v: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? BUSINESS_TYPES.filter((b) => b.toLowerCase().includes(query.trim().toLowerCase()))
    : BUSINESS_TYPES

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          What type of business do you have?
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose one. We&apos;ll personalize everything else.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length === 1) {
              onSelect(filtered[0])
            }
          }}
          placeholder="Search your business type…"
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Business type list */}
      <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No match — try a different search.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((business) => {
              const isSelected = selected === business
              return (
                <li key={business}>
                  <button
                    type="button"
                    onClick={() => onSelect(business)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary/8 font-medium text-primary'
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span>{business}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
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
            disabled={!selected}
            onClick={onNext}
            className="flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NewObjectivePage() {
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [wizardState, setWizardState] = useState<Partial<WizardState>>({})

  function advanceToStep2() {
    if (!selectedGoal) return
    setWizardState((prev) => ({ ...prev, goalType: selectedGoal }))
    setStep(2)
  }

  function advanceToStep3() {
    if (!selectedBusiness) return
    setWizardState((prev) => ({ ...prev, businessType: selectedBusiness }))
    // Step 3 will be built here
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

      <ProgressBar step={step} total={6} />

      {step === 1 && (
        <Step1 selected={selectedGoal} onSelect={setSelectedGoal} onNext={advanceToStep2} />
      )}

      {step === 2 && (
        <Step2
          selected={selectedBusiness}
          onSelect={setSelectedBusiness}
          onBack={() => setStep(1)}
          onNext={advanceToStep3}
        />
      )}
    </div>
  )
}
