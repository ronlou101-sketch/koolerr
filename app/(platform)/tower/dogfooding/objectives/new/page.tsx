'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
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
  MapPin,
  Map,
  Hash,
  Layers,
  Landmark,
  Globe,
  CircleDot,
  X,
  Building2,
} from 'lucide-react'

const ServiceAreaMap = dynamic(() => import('./ServiceAreaMap'), { ssr: false })

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

// ── Step 3 data ────────────────────────────────────────────────────────────────

type CoverageType = 'local' | 'cities' | 'zips' | 'county' | 'statewide' | 'nationwide' | 'radius'

type ServiceAreaState = {
  coverageType: CoverageType
  locations: string[]
  radiusMiles: number
  radiusAddress: string
}

const COVERAGE_OPTIONS: {
  type: CoverageType
  label: string
  description: string
  icon: React.ElementType
}[] = [
  { type: 'local', label: 'Single City', description: 'Target one specific city', icon: MapPin },
  { type: 'cities', label: 'Multiple Cities', description: 'Target a list of cities', icon: Map },
  { type: 'zips', label: 'ZIP Codes', description: 'Target specific postal codes', icon: Hash },
  { type: 'county', label: 'County', description: 'Target one or more counties', icon: Layers },
  { type: 'statewide', label: 'Statewide', description: 'Target an entire state', icon: Landmark },
  {
    type: 'nationwide',
    label: 'Nationwide',
    description: 'Reach customers anywhere in the US',
    icon: Globe,
  },
  {
    type: 'radius',
    label: 'Service Radius',
    description: 'Target a radius from your address',
    icon: CircleDot,
  },
]

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]

const US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]

const TEXT_INPUT_PLACEHOLDER: Partial<Record<CoverageType, string>> = {
  local: 'e.g. Austin, TX',
  cities: 'e.g. Dallas, TX — press Enter to add',
  zips: 'e.g. 78701 — press Enter to add',
  county: 'e.g. Travis County, TX',
}

// ── Step 3 coverage helpers ────────────────────────────────────────────────────

type CoverageEstimates = {
  population: string
  households: string
  businesses: string
  counties: string
  sqMiles: string
  audienceSize: string
  citiesCovered?: string
}

function getCoverageEstimates(
  type: CoverageType,
  count: number,
  radiusMiles: number
): CoverageEstimates {
  const n = Math.max(1, count)
  switch (type) {
    case 'local':
      return {
        population: '50,000 – 350,000',
        households: '18,000 – 130,000',
        businesses: '1,500 – 12,000',
        counties: '1',
        sqMiles: '20 – 150',
        audienceSize: '15,000 – 75,000',
      }
    case 'cities':
      return {
        population: `${50 * n}K – ${350 * n}K`,
        households: `${18 * n}K – ${130 * n}K`,
        businesses: `${(1.5 * n).toFixed(0)}K – ${12 * n}K`,
        counties: `${n} – ${n * 3}`,
        sqMiles: `${20 * n} – ${150 * n}`,
        audienceSize: `${15 * n}K – ${75 * n}K`,
        citiesCovered: `${n}`,
      }
    case 'zips':
      return {
        population: `${8 * n}K – ${35 * n}K`,
        households: `${3 * n}K – ${13 * n}K`,
        businesses: `${250 * n} – ${1500 * n}`,
        counties: `${Math.ceil(n / 3)} – ${Math.ceil(n / 2)}`,
        sqMiles: `${2 * n} – ${20 * n}`,
        audienceSize: `${2 * n}K – ${10 * n}K`,
      }
    case 'county':
      return {
        population: `${75 * n}K – ${600 * n}K`,
        households: `${27 * n}K – ${220 * n}K`,
        businesses: `${3 * n}K – ${30 * n}K`,
        counties: `${n}`,
        sqMiles: `${100 * n} – ${3000 * n}`,
        audienceSize: `${22 * n}K – ${180 * n}K`,
        citiesCovered: `${5 * n} – ${50 * n}`,
      }
    case 'statewide':
      return {
        population: n === 1 ? '1M – 20M' : `${n}M – ${20 * n}M`,
        households: n === 1 ? '400K – 7M' : `${400 * n}K – ${7 * n}M`,
        businesses: n === 1 ? '30K – 1.5M' : `${30 * n}K – ${1500 * n}K`,
        counties: n === 1 ? '10 – 250' : `${10 * n} – ${250 * n}`,
        sqMiles: n === 1 ? '1,000 – 100,000' : `${1000 * n} – ${100000 * n}`,
        audienceSize: n === 1 ? '300K – 6M' : `${300 * n}K – ${6 * n}M`,
        citiesCovered: n === 1 ? '50 – 2,000' : `${50 * n} – ${2000 * n}`,
      }
    case 'nationwide':
      return {
        population: '331M+',
        households: '128M+',
        businesses: '30M+',
        counties: '3,000+',
        sqMiles: '3.8M',
        audienceSize: '250M+',
        citiesCovered: '30,000+',
      }
    case 'radius': {
      const TABLE: Record<number, CoverageEstimates> = {
        5: {
          population: '50K – 200K',
          households: '18K – 75K',
          businesses: '1K – 8K',
          counties: '1',
          sqMiles: '~80',
          audienceSize: '15K – 60K',
        },
        10: {
          population: '150K – 600K',
          households: '55K – 220K',
          businesses: '3K – 25K',
          counties: '1 – 2',
          sqMiles: '~315',
          audienceSize: '45K – 180K',
        },
        25: {
          population: '500K – 2M',
          households: '180K – 750K',
          businesses: '10K – 80K',
          counties: '2 – 5',
          sqMiles: '~2,000',
          audienceSize: '150K – 600K',
        },
        50: {
          population: '1M – 5M',
          households: '380K – 1.9M',
          businesses: '25K – 200K',
          counties: '5 – 15',
          sqMiles: '~7,850',
          audienceSize: '300K – 1.5M',
        },
        100: {
          population: '3M – 15M',
          households: '1.1M – 5.7M',
          businesses: '75K – 600K',
          counties: '15 – 50',
          sqMiles: '~31,400',
          audienceSize: '900K – 4.5M',
        },
      }
      return TABLE[radiusMiles] ?? TABLE[25]
    }
  }
}

function getTargetingSummary(
  type: CoverageType | null,
  locations: string[],
  radiusMiles: number,
  radiusAddress: string
): string | null {
  if (!type) return null
  switch (type) {
    case 'nationwide':
      return 'Nationwide (United States)'
    case 'local':
      return locations[0] ?? null
    case 'cities':
      if (!locations.length) return null
      if (locations.length === 1) return locations[0]
      if (locations.length <= 3) return locations.join(', ')
      return `${locations.slice(0, 2).join(', ')} + ${locations.length - 2} more`
    case 'zips':
      if (!locations.length) return null
      return locations.length === 1 ? `ZIP ${locations[0]}` : `${locations.length} ZIP codes`
    case 'county':
      if (!locations.length) return null
      return locations.length === 1 ? locations[0] : `${locations.length} counties`
    case 'statewide':
      if (!locations.length) return null
      return locations.length === 1 ? `${locations[0]} (Statewide)` : `${locations.length} states`
    case 'radius':
      if (!radiusAddress.trim()) return null
      return `${radiusMiles}-mile radius from ${radiusAddress}`
  }
}

// ── Wizard state ───────────────────────────────────────────────────────────────

type WizardState = {
  goalType: string
  businessType?: string
  serviceArea?: ServiceAreaState
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

// ── Step 3 ─────────────────────────────────────────────────────────────────────

function Step3({
  initial,
  onBack,
  onNext,
}: {
  initial?: Partial<ServiceAreaState>
  onBack: () => void
  onNext: (state: ServiceAreaState) => void
}) {
  const [coverageType, setCoverageType] = useState<CoverageType | null>(
    initial?.coverageType ?? null
  )
  const [locations, setLocations] = useState<string[]>(initial?.locations ?? [])
  const [inputValue, setInputValue] = useState('')
  const [radiusAddress, setRadiusAddress] = useState(initial?.radiusAddress ?? '')
  const [radiusMiles, setRadiusMiles] = useState(initial?.radiusMiles ?? 25)
  const [stateQuery, setStateQuery] = useState('')

  function changeCoverageType(type: CoverageType) {
    if (type === coverageType) return
    setCoverageType(type)
    setLocations([])
    setInputValue('')
    setStateQuery('')
  }

  function addLocation(loc: string) {
    const trimmed = loc.trim()
    if (trimmed && !locations.includes(trimmed)) {
      setLocations((prev) => [...prev, trimmed])
    }
    setInputValue('')
  }

  function removeLocation(loc: string) {
    setLocations((prev) => prev.filter((l) => l !== loc))
  }

  function handleTextKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addLocation(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && locations.length > 0) {
      removeLocation(locations[locations.length - 1])
    }
  }

  const filteredStates = stateQuery.trim()
    ? US_STATES.filter((s) => s.toLowerCase().includes(stateQuery.toLowerCase()))
    : US_STATES

  const isValid =
    coverageType === 'nationwide' ||
    (coverageType === 'radius' && radiusAddress.trim().length > 0) ||
    (coverageType !== null && locations.length > 0)

  const showTextInput =
    coverageType !== null && ['local', 'cities', 'zips', 'county'].includes(coverageType)
  const showStateInput = coverageType === 'statewide'
  const showRadiusInput = coverageType === 'radius'
  const showNationwideMessage = coverageType === 'nationwide'

  const showLiveMap = isValid
  const showPlaceholder = coverageType !== null && !isValid

  const targetingSummary = getTargetingSummary(coverageType, locations, radiusMiles, radiusAddress)

  const estimates =
    coverageType && isValid
      ? getCoverageEstimates(
          coverageType,
          coverageType === 'radius' ? 1 : locations.length,
          radiusMiles
        )
      : null

  const coverageStats = estimates
    ? [
        { label: 'Est. Population Reached', value: estimates.population },
        { label: 'Est. Households', value: estimates.households },
        { label: 'Est. Businesses', value: estimates.businesses },
        { label: 'Counties Covered', value: estimates.counties },
        ...(estimates.citiesCovered
          ? [{ label: 'Cities Covered', value: estimates.citiesCovered }]
          : []),
        { label: 'Est. Service Area', value: `${estimates.sqMiles} sq mi` },
        { label: 'Est. Audience Size', value: estimates.audienceSize },
      ]
    : []

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Where do you serve customers?</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose the area where you&apos;d like the AI to focus your campaigns.
        </p>
      </div>

      {/* Coverage type grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COVERAGE_OPTIONS.map(({ type, label, description, icon: Icon }) => {
          const isSelected = coverageType === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => changeCoverageType(type)}
              className={`group relative flex items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-150 ${
                isSelected
                  ? 'bg-primary/8 border-2 border-primary shadow-sm'
                  : 'hover:bg-primary/4 border border-border bg-card hover:border-primary/40'
              }`}
            >
              {isSelected && (
                <Check className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-primary" />
              )}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium leading-snug ${isSelected ? 'text-primary' : 'text-foreground'}`}
                >
                  {label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Nationwide confirmation */}
      {showNationwideMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            Your campaigns will target customers{' '}
            <span className="font-medium">across the entire United States</span>.
          </p>
        </div>
      )}

      {/* Text input — local / cities / zips / county */}
      {showTextInput && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleTextKeyDown}
                placeholder={TEXT_INPUT_PLACEHOLDER[coverageType!] ?? 'Type and press Enter'}
                className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={() => addLocation(inputValue)}
              disabled={!inputValue.trim()}
              className="rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <span
                  key={loc}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {loc}
                  <button
                    type="button"
                    onClick={() => removeLocation(loc)}
                    className="hover:text-primary/60"
                    aria-label={`Remove ${loc}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* State selector */}
      {showStateInput && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={stateQuery}
              onChange={(e) => setStateQuery(e.target.value)}
              placeholder="Search states…"
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="max-h-52 overflow-y-auto rounded-xl border border-border">
            {filteredStates.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No states match.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredStates.map((state) => {
                  const isStateSelected = locations.includes(state)
                  return (
                    <li key={state}>
                      <button
                        type="button"
                        onClick={() =>
                          isStateSelected ? removeLocation(state) : addLocation(state)
                        }
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          isStateSelected
                            ? 'bg-primary/8 font-medium text-primary'
                            : 'text-foreground hover:bg-muted/60'
                        }`}
                      >
                        {state}
                        {isStateSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <span
                  key={loc}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {loc}
                  <button
                    type="button"
                    onClick={() => removeLocation(loc)}
                    className="hover:text-primary/60"
                    aria-label={`Remove ${loc}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Radius input */}
      {showRadiusInput && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Business address</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={radiusAddress}
                  onChange={(e) => setRadiusAddress(e.target.value)}
                  placeholder="Enter your business address"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="button"
                onClick={() => setRadiusAddress('My Business Address')}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Building2 className="h-3.5 w-3.5" />
                Use mine
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Service radius</label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((miles) => (
                <button
                  key={miles}
                  type="button"
                  onClick={() => setRadiusMiles(miles)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    radiusMiles === miles
                      ? 'bg-primary/8 border-primary text-primary'
                      : 'hover:bg-primary/4 border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  {miles} mi
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Targeting summary */}
      {targetingSummary && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-sm text-muted-foreground">Targeting:</span>
          <span className="text-sm font-semibold text-foreground">{targetingSummary}</span>
        </div>
      )}

      {/* Estimated coverage panel */}
      {estimates && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Estimated Coverage</p>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Estimated
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {coverageStats.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive map */}
      {showLiveMap && (
        <ServiceAreaMap
          coverageType={coverageType}
          locations={locations}
          radiusMiles={radiusMiles}
          radiusAddress={radiusAddress}
        />
      )}

      {/* Map placeholder — type selected but no location yet */}
      {showPlaceholder && (
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20">
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Add a location to see the map
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
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
            disabled={!isValid}
            onClick={() =>
              isValid &&
              coverageType &&
              onNext({ coverageType, locations, radiusMiles, radiusAddress })
            }
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

// ── Step 4 placeholder ────────────────────────────────────────────────────────

function Step4({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Step 4</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Coming soon.</p>
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
        <Link
          href="/tower/dogfooding/objectives"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NewObjectivePage() {
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedServiceArea, setSelectedServiceArea] = useState<ServiceAreaState | undefined>()
  const [wizardState, setWizardState] = useState<Partial<WizardState>>({})

  function advanceToStep2() {
    if (!selectedGoal) return
    setWizardState((prev) => ({ ...prev, goalType: selectedGoal }))
    setStep(2)
  }

  function advanceToStep3() {
    if (!selectedBusiness) return
    setWizardState((prev) => ({ ...prev, businessType: selectedBusiness }))
    setStep(3)
  }

  function advanceToStep4(serviceArea: ServiceAreaState) {
    setSelectedServiceArea(serviceArea)
    setWizardState((prev) => ({ ...prev, serviceArea }))
    setStep(4)
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

      {step === 3 && (
        <Step3 initial={selectedServiceArea} onBack={() => setStep(2)} onNext={advanceToStep4} />
      )}

      {step === 4 && <Step4 onBack={() => setStep(3)} />}
    </div>
  )
}
