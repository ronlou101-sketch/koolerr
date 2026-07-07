'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect, useRef, useCallback } from 'react'
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
  Map as MapIcon,
  Hash,
  Layers,
  Landmark,
  Globe,
  CircleDot,
  X,
  Building2,
} from 'lucide-react'
import type { ValidatedPlace } from './ServiceAreaMap'

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
  locations: ValidatedPlace[]
  radiusMiles: number
  radiusPlace: ValidatedPlace | null
}

const COVERAGE_OPTIONS: {
  type: CoverageType
  label: string
  description: string
  icon: React.ElementType
}[] = [
  { type: 'local', label: 'Single City', description: 'Target one specific city', icon: MapPin },
  {
    type: 'cities',
    label: 'Multiple Cities',
    description: 'Target a list of cities',
    icon: MapIcon,
  },
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

// Approximate geographic centers for states (used to build ValidatedPlace from the list)
const STATE_CENTERS: Record<string, { lat: number; lng: number; abbr: string }> = {
  Alabama: { lat: 32.806671, lng: -86.79113, abbr: 'AL' },
  Alaska: { lat: 61.370716, lng: -152.404419, abbr: 'AK' },
  Arizona: { lat: 33.729759, lng: -111.431221, abbr: 'AZ' },
  Arkansas: { lat: 34.969704, lng: -92.373123, abbr: 'AR' },
  California: { lat: 36.116203, lng: -119.681564, abbr: 'CA' },
  Colorado: { lat: 39.059811, lng: -105.311104, abbr: 'CO' },
  Connecticut: { lat: 41.597782, lng: -72.755371, abbr: 'CT' },
  Delaware: { lat: 39.318523, lng: -75.507141, abbr: 'DE' },
  Florida: { lat: 27.766279, lng: -81.686783, abbr: 'FL' },
  Georgia: { lat: 33.040619, lng: -83.643074, abbr: 'GA' },
  Hawaii: { lat: 21.094318, lng: -157.498337, abbr: 'HI' },
  Idaho: { lat: 44.240459, lng: -114.478828, abbr: 'ID' },
  Illinois: { lat: 40.349457, lng: -88.986137, abbr: 'IL' },
  Indiana: { lat: 39.849426, lng: -86.258278, abbr: 'IN' },
  Iowa: { lat: 42.011539, lng: -93.210526, abbr: 'IA' },
  Kansas: { lat: 38.5266, lng: -96.726486, abbr: 'KS' },
  Kentucky: { lat: 37.66814, lng: -84.670067, abbr: 'KY' },
  Louisiana: { lat: 31.16996, lng: -91.867805, abbr: 'LA' },
  Maine: { lat: 44.693947, lng: -69.381927, abbr: 'ME' },
  Maryland: { lat: 39.063946, lng: -76.802101, abbr: 'MD' },
  Massachusetts: { lat: 42.230171, lng: -71.530106, abbr: 'MA' },
  Michigan: { lat: 43.326618, lng: -84.536095, abbr: 'MI' },
  Minnesota: { lat: 45.694454, lng: -93.900192, abbr: 'MN' },
  Mississippi: { lat: 32.741646, lng: -89.678696, abbr: 'MS' },
  Missouri: { lat: 38.456085, lng: -92.288368, abbr: 'MO' },
  Montana: { lat: 46.921925, lng: -110.454353, abbr: 'MT' },
  Nebraska: { lat: 41.492537, lng: -99.90181, abbr: 'NE' },
  Nevada: { lat: 38.313515, lng: -117.055374, abbr: 'NV' },
  'New Hampshire': { lat: 43.452492, lng: -71.563896, abbr: 'NH' },
  'New Jersey': { lat: 40.298904, lng: -74.521011, abbr: 'NJ' },
  'New Mexico': { lat: 34.840515, lng: -106.248482, abbr: 'NM' },
  'New York': { lat: 42.165726, lng: -74.948051, abbr: 'NY' },
  'North Carolina': { lat: 35.630066, lng: -79.806419, abbr: 'NC' },
  'North Dakota': { lat: 47.528912, lng: -99.784012, abbr: 'ND' },
  Ohio: { lat: 40.388783, lng: -82.764915, abbr: 'OH' },
  Oklahoma: { lat: 35.565342, lng: -96.928917, abbr: 'OK' },
  Oregon: { lat: 44.572021, lng: -122.070938, abbr: 'OR' },
  Pennsylvania: { lat: 40.590752, lng: -77.209755, abbr: 'PA' },
  'Rhode Island': { lat: 41.680893, lng: -71.51178, abbr: 'RI' },
  'South Carolina': { lat: 33.856892, lng: -80.945007, abbr: 'SC' },
  'South Dakota': { lat: 44.299782, lng: -99.438828, abbr: 'SD' },
  Tennessee: { lat: 35.747845, lng: -86.692345, abbr: 'TN' },
  Texas: { lat: 31.054487, lng: -97.563461, abbr: 'TX' },
  Utah: { lat: 40.150032, lng: -111.862434, abbr: 'UT' },
  Vermont: { lat: 44.045876, lng: -72.710686, abbr: 'VT' },
  Virginia: { lat: 37.769337, lng: -78.169968, abbr: 'VA' },
  Washington: { lat: 47.400902, lng: -121.490494, abbr: 'WA' },
  'West Virginia': { lat: 38.491226, lng: -80.954453, abbr: 'WV' },
  Wisconsin: { lat: 44.268543, lng: -89.616508, abbr: 'WI' },
  Wyoming: { lat: 42.755966, lng: -107.30249, abbr: 'WY' },
}

// ── Autocomplete ───────────────────────────────────────────────────────────────
//
// City / ZIP / county: Supabase-backed with prefix-first ranking (fast, no rate limits)
// Address (radius field): Nominatim — arbitrary addresses not stored in the DB

type AutocompleteType = 'city' | 'zip' | 'county' | 'address'

const SUGGESTION_CACHE: Map<string, ValidatedPlace[]> = new Map()

async function fetchSuggestions(query: string, type: AutocompleteType): Promise<ValidatedPlace[]> {
  const key = `${type}:${query.toLowerCase()}`
  if (SUGGESTION_CACHE.has(key)) return SUGGESTION_CACHE.get(key)!

  // Structured geography: query our Supabase DB (prefix-ranked, population-sorted)
  if (type !== 'address') {
    try {
      const params = new URLSearchParams({ q: query, type, limit: '8' })
      const res = await fetch(`/api/geographic/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        const results: ValidatedPlace[] = data.results ?? []
        SUGGESTION_CACHE.set(key, results)
        return results
      }
    } catch {
      // fall through to empty
    }
    SUGGESTION_CACHE.set(key, [])
    return []
  }

  // Freeform address (radius field only) — still uses Nominatim
  const params = new URLSearchParams({
    format: 'json',
    limit: '6',
    countrycodes: 'us',
    addressdetails: '1',
    q: query,
  })

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'Koolerr Campaign Wizard/1.0 (koolerr.com)' },
    })
    if (!res.ok) {
      SUGGESTION_CACHE.set(key, [])
      return []
    }
    const data: Array<{
      osm_type: string
      osm_id: string
      lat: string
      lon: string
      display_name: string
    }> = await res.json()

    const results: ValidatedPlace[] = data
      .map((item) => {
        const parts = item.display_name.split(', ').filter((p) => p !== 'United States')
        return {
          label: parts.slice(0, 4).join(', '),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          osmId: `${item.osm_type[0].toUpperCase()}${item.osm_id}`,
          osmType: item.osm_type,
        }
      })
      .filter((p, i, arr) => arr.findIndex((q) => q.label === p.label) === i)

    SUGGESTION_CACHE.set(key, results)
    return results
  } catch {
    SUGGESTION_CACHE.set(key, [])
    return []
  }
}

// ── LocationAutocomplete ───────────────────────────────────────────────────────
//
// Controlled input that shows Nominatim-backed suggestions.
// onSelect is ONLY called when the user actively picks a suggestion (keyboard or mouse).
// Raw typed text is never returned as a valid place.

function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  onKeyDown,
  onBlur,
  placeholder,
  searchType,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  onSelect: (place: ValidatedPlace) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onBlur?: () => void
  placeholder?: string
  searchType: AutocompleteType
  autoFocus?: boolean
}) {
  const [suggestions, setSuggestions] = useState<ValidatedPlace[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      const results = await fetchSuggestions(value, searchType)
      setSuggestions(results)
      setActiveIndex(-1)
      setOpen(results.length > 0)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, searchType])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function select(place: ValidatedPlace) {
    onSelect(place)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
        return
      }
      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        select(suggestions[activeIndex])
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
    }
    // Pass through to parent handler (e.g., blur commit for radius)
    onKeyDown?.(e)
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        autoFocus={autoFocus}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.osmId + s.label}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault() // prevent blur before select
                select(s)
              }}
              className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                i === activeIndex
                  ? 'bg-primary/8 text-primary'
                  : 'text-foreground hover:bg-muted/60'
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Coverage data from Supabase ────────────────────────────────────────────────

type CoverageMetrics = {
  population?: number | null
  households?: number | null
  businesses?: number | null
  medianHouseholdIncome?: number | null
  medianAge?: number | null
  homeownershipRate?: number | null
  medianHomeValue?: number | null
  landAreaSqMiles?: number | null
  county?: string | null
  msaName?: string | null
  dataYear?: number | null
}

type CoverageState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; metrics: CoverageMetrics; anyFound: boolean }

function formatNum(n: number | null | undefined): string {
  if (n == null) return 'Data unavailable'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function formatDollar(n: number | null | undefined): string {
  if (n == null) return 'Data unavailable'
  return `$${n.toLocaleString()}`
}

function formatPct(n: number | null | undefined): string {
  if (n == null) return 'Data unavailable'
  return `${n.toFixed(1)}%`
}

function buildLookupUrl(coverageType: CoverageType, locations: ValidatedPlace[]): string | null {
  if (coverageType === 'nationwide') return '/api/geographic/lookup?type=nationwide'

  if (coverageType === 'local' || coverageType === 'cities') {
    if (!locations.length) return null
    const names = locations.map((l) => {
      const parts = l.label.split(', ')
      const city = parts[0]
      const stateAbbr = parts[parts.length - 1]
      return `names=${encodeURIComponent(`${city}|${stateAbbr}`)}`
    })
    return `/api/geographic/lookup?type=city&${names.join('&')}`
  }

  if (coverageType === 'statewide') {
    if (!locations.length) return null
    const names = locations.map((l) => {
      const center = STATE_CENTERS[l.label]
      return `names=${encodeURIComponent(center?.abbr ?? l.label)}`
    })
    return `/api/geographic/lookup?type=state&${names.join('&')}`
  }

  if (coverageType === 'county') {
    if (!locations.length) return null
    const names = locations.map((l) => {
      const parts = l.label.split(', ')
      const county = parts[0]
      const stateAbbr = parts[parts.length - 1]
      return `names=${encodeURIComponent(`${county}|${stateAbbr}`)}`
    })
    return `/api/geographic/lookup?type=county&${names.join('&')}`
  }

  if (coverageType === 'zips') {
    if (!locations.length) return null
    const zips = locations.map((l) => {
      const zip = l.label.split(',')[0].trim()
      return `zips=${encodeURIComponent(zip)}`
    })
    return `/api/geographic/lookup?type=zip&${zips.join('&')}`
  }

  return null
}

// ── Radius static estimates (no real address-specific data without Census block data)

function radiusEstimates(miles: number): CoverageMetrics {
  const TABLE: Record<number, CoverageMetrics> = {
    5: { population: 75000, households: 27000, landAreaSqMiles: 79 },
    10: { population: 250000, households: 92000, landAreaSqMiles: 314 },
    25: { population: 900000, households: 330000, landAreaSqMiles: 1963 },
    50: { population: 2500000, households: 930000, landAreaSqMiles: 7854 },
    100: { population: 7000000, households: 2600000, landAreaSqMiles: 31416 },
  }
  return TABLE[miles] ?? TABLE[25]
}

// ── Targeting summary ──────────────────────────────────────────────────────────

function getTargetingSummary(
  type: CoverageType | null,
  locations: ValidatedPlace[],
  radiusMiles: number,
  radiusPlace: ValidatedPlace | null
): string | null {
  if (!type) return null
  switch (type) {
    case 'nationwide':
      return 'Nationwide (United States)'
    case 'local':
      return locations[0]?.label ?? null
    case 'cities':
      if (!locations.length) return null
      if (locations.length === 1) return locations[0].label
      if (locations.length <= 3) return locations.map((l) => l.label).join(', ')
      return `${locations
        .slice(0, 2)
        .map((l) => l.label)
        .join(', ')} + ${locations.length - 2} more`
    case 'zips':
      if (!locations.length) return null
      return locations.length === 1
        ? `ZIP ${locations[0].label.split(',')[0]}`
        : `${locations.length} ZIP codes`
    case 'county':
      if (!locations.length) return null
      return locations.length === 1 ? locations[0].label : `${locations.length} counties`
    case 'statewide':
      if (!locations.length) return null
      return locations.length === 1
        ? `${locations[0].label} (Statewide)`
        : `${locations.length} states`
    case 'radius':
      if (!radiusPlace) return null
      return `${radiusMiles}-mile radius from ${radiusPlace.label}`
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
              className={`group relative flex items-start gap-3 rounded-xl p-4 text-left transition-all duration-150 ${isSelected ? 'bg-primary/8 border-2 border-primary shadow-sm' : primary ? 'hover:bg-primary/4 border border-border bg-card shadow-sm hover:border-primary/40' : 'hover:bg-primary/4 border border-border bg-card hover:border-primary/40'}`}
            >
              {isSelected && <Check className="absolute right-3 top-3 h-4 w-4 text-primary" />}
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : primary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}
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
    ? BUSINESS_TYPES.filter((b) => b.toLowerCase().includes(query.toLowerCase()))
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
            if (e.key === 'Enter' && filtered.length === 1) onSelect(filtered[0])
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
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${isSelected ? 'bg-primary/8 font-medium text-primary' : 'text-foreground hover:bg-muted/60'}`}
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
  const [locations, setLocations] = useState<ValidatedPlace[]>(initial?.locations ?? [])

  // Text input: live typed value (display only; NOT added until a suggestion is selected)
  const [inputValue, setInputValue] = useState('')
  // Last place selected from autocomplete — the gate for Add/Enter
  const [pendingPlace, setPendingPlace] = useState<ValidatedPlace | null>(null)
  // Shown when user tries to Add without selecting from autocomplete
  const [showValidationError, setShowValidationError] = useState(false)

  // Radius: separate typed value from committed value (committed controls the map/summary)
  const [radiusInputValue, setRadiusInputValue] = useState('')
  const [radiusPlace, setRadiusPlace] = useState<ValidatedPlace | null>(
    initial?.radiusPlace ?? null
  )
  const [radiusMiles, setRadiusMiles] = useState(initial?.radiusMiles ?? 25)

  // Statewide list
  const [stateQuery, setStateQuery] = useState('')

  // Real demographic data from Supabase
  const [coverage, setCoverage] = useState<CoverageState>({ status: 'idle' })
  const coverageFetchRef = useRef(0)

  // Fetch real demographics whenever valid selections change
  useEffect(() => {
    const isRadiusValid = coverageType === 'radius' && radiusPlace !== null
    const isLocationValid =
      coverageType === 'nationwide' ||
      (coverageType !== null && coverageType !== 'radius' && locations.length > 0)

    if (!isRadiusValid && !isLocationValid) {
      setCoverage({ status: 'idle' })
      return
    }

    if (coverageType === 'radius') {
      // Static estimates for radius (no per-address Census block data available)
      setCoverage({ status: 'done', metrics: radiusEstimates(radiusMiles), anyFound: true })
      return
    }

    const url = buildLookupUrl(coverageType!, locations)
    if (!url) {
      setCoverage({ status: 'idle' })
      return
    }

    const fetchId = ++coverageFetchRef.current
    setCoverage({ status: 'loading' })

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (fetchId !== coverageFetchRef.current) return
        const agg = data.aggregate as CoverageMetrics | undefined
        const anyFound =
          Array.isArray(data.results) && data.results.some((r: { found: boolean }) => r.found)
        setCoverage({ status: 'done', metrics: agg ?? {}, anyFound })
      })
      .catch(() => {
        if (fetchId === coverageFetchRef.current)
          setCoverage({ status: 'done', metrics: {}, anyFound: false })
      })
  }, [coverageType, locations, radiusPlace, radiusMiles])

  function changeCoverageType(type: CoverageType) {
    if (type === coverageType) return
    setCoverageType(type)
    setLocations([])
    setInputValue('')
    setPendingPlace(null)
    setShowValidationError(false)
    setStateQuery('')
    // Don't clear radius place when switching away — preserve if they come back
  }

  // Called when user selects from autocomplete dropdown for text/chip inputs
  function handleSuggestionSelect(place: ValidatedPlace) {
    setInputValue(place.label)
    setPendingPlace(place)
    setShowValidationError(false)
  }

  // Called when user types (clears the validated place)
  function handleInputChange(value: string) {
    setInputValue(value)
    setPendingPlace(null)
    if (showValidationError) setShowValidationError(false)
  }

  function addPendingLocation() {
    if (!pendingPlace) {
      if (inputValue.trim()) setShowValidationError(true)
      return
    }
    if (coverageType === 'local') {
      setLocations([pendingPlace]) // single city: replace
    } else if (!locations.find((l) => l.osmId === pendingPlace.osmId)) {
      setLocations((prev) => [...prev, pendingPlace])
    }
    setInputValue('')
    setPendingPlace(null)
    setShowValidationError(false)
  }

  function removeLocation(osmId: string) {
    setLocations((prev) => prev.filter((l) => l.osmId !== osmId))
  }

  // Statewide: pick from the predefined list (no Nominatim needed)
  function toggleState(stateName: string) {
    const center = STATE_CENTERS[stateName]
    if (!center) return
    const existing = locations.find((l) => l.label === stateName)
    if (existing) {
      removeLocation(existing.osmId)
    } else {
      const place: ValidatedPlace = {
        label: stateName,
        lat: center.lat,
        lng: center.lng,
        osmId: `state_${center.abbr}`, // synthetic id for state list
        osmType: 'relation',
      }
      setLocations((prev) => [...prev, place])
    }
  }

  // Radius: commit address only when suggestion is selected, Enter, or blur
  function handleRadiusSuggestionSelect(place: ValidatedPlace) {
    setRadiusInputValue(place.label)
    setRadiusPlace(place)
  }

  function commitRadiusAddress() {
    // Called on blur/Enter without an autocomplete selection —
    // only keeps the committed value if a suggestion was already selected
    // (radiusPlace is set by handleRadiusSuggestionSelect above)
  }

  const textInputPlaceholder =
    coverageType === 'local'
      ? 'e.g. Austin, TX'
      : coverageType === 'cities'
        ? 'e.g. Dallas, TX — press Enter or Add'
        : coverageType === 'zips'
          ? 'e.g. 78701 — press Enter or Add'
          : 'e.g. Travis County, TX'

  const textSearchType: AutocompleteType =
    coverageType === 'zips' ? 'zip' : coverageType === 'county' ? 'county' : 'city'

  const filteredStates = stateQuery.trim()
    ? US_STATES.filter((s) => s.toLowerCase().includes(stateQuery.toLowerCase()))
    : US_STATES

  const isValid =
    coverageType === 'nationwide' ||
    (coverageType === 'radius' && radiusPlace !== null) ||
    (coverageType !== null && coverageType !== 'radius' && locations.length > 0)

  const showLiveMap =
    coverageType === 'nationwide' ||
    (coverageType === 'radius' && radiusPlace !== null) ||
    (coverageType !== null && coverageType !== 'radius' && locations.length > 0)

  const showTextInput =
    coverageType !== null && ['local', 'cities', 'zips', 'county'].includes(coverageType)
  const showPlaceholder = coverageType !== null && !showLiveMap

  const targetingSummary = getTargetingSummary(coverageType, locations, radiusMiles, radiusPlace)
  const hasCoverage = coverage.status === 'done'
  const coverageMetrics = hasCoverage
    ? (coverage as { status: 'done'; metrics: CoverageMetrics }).metrics
    : null
  const anyFound = hasCoverage
    ? (coverage as { status: 'done'; anyFound: boolean }).anyFound
    : false

  // Build coverage stats from real or estimated data
  const coverageStats = coverageMetrics
    ? ([
        coverageMetrics.population !== undefined
          ? { label: 'Population', value: formatNum(coverageMetrics.population) }
          : null,
        coverageMetrics.households !== undefined
          ? { label: 'Households', value: formatNum(coverageMetrics.households) }
          : null,
        coverageMetrics.businesses !== undefined
          ? { label: 'Businesses', value: formatNum(coverageMetrics.businesses) }
          : null,
        coverageMetrics.medianHouseholdIncome !== undefined
          ? {
              label: 'Median Household Income',
              value: formatDollar(coverageMetrics.medianHouseholdIncome),
            }
          : null,
        coverageMetrics.medianAge !== undefined
          ? {
              label: 'Median Age',
              value:
                coverageMetrics.medianAge != null
                  ? `${coverageMetrics.medianAge}`
                  : 'Data unavailable',
            }
          : null,
        coverageMetrics.homeownershipRate !== undefined
          ? { label: 'Homeownership Rate', value: formatPct(coverageMetrics.homeownershipRate) }
          : null,
        coverageMetrics.medianHomeValue !== undefined
          ? { label: 'Median Home Value', value: formatDollar(coverageMetrics.medianHomeValue) }
          : null,
        coverageMetrics.landAreaSqMiles !== undefined
          ? {
              label: 'Land Area',
              value:
                coverageMetrics.landAreaSqMiles != null
                  ? `${coverageMetrics.landAreaSqMiles.toLocaleString()} sq mi`
                  : 'Data unavailable',
            }
          : null,
        coverageMetrics.county ? { label: 'County', value: coverageMetrics.county } : null,
        coverageMetrics.msaName
          ? { label: 'Metro Area (MSA)', value: coverageMetrics.msaName }
          : null,
      ].filter(Boolean) as { label: string; value: string }[])
    : []

  // Keyboard handler for text chip inputs — Enter adds pending place OR shows validation error
  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addPendingLocation()
      }
      if (e.key === 'Backspace' && !inputValue && locations.length > 0) {
        removeLocation(locations[locations.length - 1].osmId)
      }
    },
    [inputValue, locations, pendingPlace]
  )

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
              className={`group relative flex items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-150 ${isSelected ? 'bg-primary/8 border-2 border-primary shadow-sm' : 'hover:bg-primary/4 border border-border bg-card hover:border-primary/40'}`}
            >
              {isSelected && (
                <Check className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-primary" />
              )}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}
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

      {/* Nationwide */}
      {coverageType === 'nationwide' && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            Your campaigns will target customers{' '}
            <span className="font-medium">across the entire United States</span>.
          </p>
        </div>
      )}

      {/* Text chips input — local / cities / zips / county */}
      {showTextInput && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <LocationAutocomplete
              value={inputValue}
              onChange={handleInputChange}
              onSelect={handleSuggestionSelect}
              onKeyDown={handleTextKeyDown}
              placeholder={textInputPlaceholder}
              searchType={textSearchType}
            />
            <button
              type="button"
              onClick={addPendingLocation}
              disabled={!inputValue.trim()}
              className="rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {showValidationError && (
            <p className="text-xs font-medium text-destructive">
              Please select a valid location from the suggestions.
            </p>
          )}

          {locations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <span
                  key={loc.osmId}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {loc.label}
                  <button
                    type="button"
                    onClick={() => removeLocation(loc.osmId)}
                    className="hover:text-primary/60"
                    aria-label={`Remove ${loc.label}`}
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
      {coverageType === 'statewide' && (
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
                  const isStateSelected = locations.some((l) => l.label === state)
                  return (
                    <li key={state}>
                      <button
                        type="button"
                        onClick={() => toggleState(state)}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${isStateSelected ? 'bg-primary/8 font-medium text-primary' : 'text-foreground hover:bg-muted/60'}`}
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
                  key={loc.osmId}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                >
                  {loc.label}
                  <button
                    type="button"
                    onClick={() => removeLocation(loc.osmId)}
                    className="hover:text-primary/60"
                    aria-label={`Remove ${loc.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Radius input — address ONLY committed after selecting from autocomplete, blur, or Enter */}
      {coverageType === 'radius' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Business address</label>
            <div className="flex gap-2">
              <LocationAutocomplete
                value={radiusInputValue}
                onChange={(v) => {
                  setRadiusInputValue(v)
                  // Typing clears the committed radius place (must re-select from suggestions)
                  setRadiusPlace(null)
                }}
                onSelect={handleRadiusSuggestionSelect}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitRadiusAddress()
                  }
                }}
                onBlur={commitRadiusAddress}
                placeholder="Enter your business address"
                searchType="address"
              />
              <button
                type="button"
                onClick={commitRadiusAddress}
                disabled={!radiusInputValue.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Building2 className="h-3.5 w-3.5" />
                Use mine
              </button>
            </div>
            {radiusInputValue.trim() && !radiusPlace && (
              <p className="text-xs font-medium text-destructive">
                Please select a valid address from the suggestions.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Service radius</label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((miles) => (
                <button
                  key={miles}
                  type="button"
                  onClick={() => setRadiusMiles(miles)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${radiusMiles === miles ? 'bg-primary/8 border-primary text-primary' : 'hover:bg-primary/4 border-border bg-card text-foreground hover:border-primary/40'}`}
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

      {/* Coverage panel — real data from Supabase */}
      {isValid && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Coverage Data</p>
            <div className="flex items-center gap-2">
              {coverage.status === 'loading' && (
                <span className="text-xs text-muted-foreground">Loading…</span>
              )}
              {coverageType === 'radius' && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Estimated
                </span>
              )}
              {coverageType !== 'radius' && hasCoverage && anyFound && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Census Data
                </span>
              )}
            </div>
          </div>

          {coverage.status === 'loading' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {hasCoverage && (
            <>
              {!anyFound && coverageType !== 'radius' && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Demographic data is currently unavailable for this location.
                </p>
              )}
              {coverageStats.length > 0 && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  {coverageStats.map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p
                        className={`mt-0.5 text-sm font-semibold ${value === 'Data unavailable' ? 'text-muted-foreground' : 'text-foreground'}`}
                      >
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Interactive map */}
      {showLiveMap && (
        <ServiceAreaMap
          coverageType={coverageType}
          locations={locations}
          radiusMiles={radiusMiles}
          radiusPlace={radiusPlace}
        />
      )}

      {/* Placeholder — type selected but no location yet */}
      {showPlaceholder && (
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/20">
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {coverageType === 'radius'
                ? 'Select your address from the suggestions above'
                : 'Select a location from the suggestions above'}
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
              onNext({ coverageType, locations, radiusMiles, radiusPlace })
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

// ── Step 4 placeholder ─────────────────────────────────────────────────────────

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

  function advanceToStep2() {
    if (!selectedGoal) return
    setStep(2)
  }

  function advanceToStep3() {
    if (!selectedBusiness) return
    setStep(3)
  }

  function advanceToStep4(serviceArea: ServiceAreaState) {
    setSelectedServiceArea(serviceArea)
    setStep(4)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
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
