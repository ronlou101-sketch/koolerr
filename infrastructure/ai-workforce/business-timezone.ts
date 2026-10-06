/**
 * Business timezone derivation (Founder policy 1, report-truth inventory).
 *
 * Deterministic and data-driven: a business location "City, ST" is resolved to an
 * IANA timezone only from the static service-area table below.
 *
 * - The location is split on its LAST comma into city and state.
 * - A state marked `single` resolves state-only (single-timezone states only).
 * - A state marked `split` resolves only through an explicit city entry — a city
 *   outside the table is unknown, never guessed.
 * - Anything unknown, missing, or malformed resolves to null; callers must then omit
 *   customer-facing dates and times rather than assume a zone.
 *
 * The table is intentionally limited to Koolerr's supported service-area locations
 * (not a nationwide hand-maintained list). Add a location here as data when a new
 * service area is supported; there are no per-business special cases in code.
 */

export type ServiceAreaTimezoneEntry =
  | { kind: 'single'; timezone: string }
  | { kind: 'split'; cities: Readonly<Record<string, string>> }

export type ServiceAreaTimezoneTable = Readonly<Record<string, ServiceAreaTimezoneEntry>>

const EASTERN = 'America/New_York'

/**
 * Supported service-area locations. Florida spans two zones (the panhandle west of
 * the Apalachicola River observes Central time), so it is `split` and resolves by
 * city only. Cities: the municipalities of Palm Beach County, FL (Eastern).
 */
export const SERVICE_AREA_TIMEZONES: ServiceAreaTimezoneTable = {
  FL: {
    kind: 'split',
    cities: {
      atlantis: EASTERN,
      'belle glade': EASTERN,
      'boca raton': EASTERN,
      'boynton beach': EASTERN,
      'briny breezes': EASTERN,
      'cloud lake': EASTERN,
      'delray beach': EASTERN,
      'glen ridge': EASTERN,
      golf: EASTERN,
      greenacres: EASTERN,
      'gulf stream': EASTERN,
      haverhill: EASTERN,
      'highland beach': EASTERN,
      hypoluxo: EASTERN,
      'juno beach': EASTERN,
      jupiter: EASTERN,
      'jupiter inlet colony': EASTERN,
      'lake clarke shores': EASTERN,
      'lake park': EASTERN,
      'lake worth': EASTERN,
      'lake worth beach': EASTERN,
      lantana: EASTERN,
      'loxahatchee groves': EASTERN,
      manalapan: EASTERN,
      'mangonia park': EASTERN,
      'north palm beach': EASTERN,
      'ocean ridge': EASTERN,
      pahokee: EASTERN,
      'palm beach': EASTERN,
      'palm beach gardens': EASTERN,
      'palm beach shores': EASTERN,
      'palm springs': EASTERN,
      'riviera beach': EASTERN,
      'royal palm beach': EASTERN,
      'south bay': EASTERN,
      'south palm beach': EASTERN,
      tequesta: EASTERN,
      wellington: EASTERN,
      'west palm beach': EASTERN,
      westlake: EASTERN,
    },
  },
}

/** Full state names accepted in place of the two-letter code (lower-case). */
const STATE_NAME_TO_CODE: Readonly<Record<string, string>> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
}

export interface ParsedLocation {
  city: string
  state: string
}

function normaliseCity(value: string): string {
  return value.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Parses "City, ST" (or "City, State Name", optional trailing ZIP) by splitting on
 * the last comma. Returns null for missing, non-string, or malformed input.
 */
export function parseLocation(location: unknown): ParsedLocation | null {
  if (typeof location !== 'string') return null
  const commaIndex = location.lastIndexOf(',')
  if (commaIndex <= 0) return null

  const city = normaliseCity(location.slice(0, commaIndex))
  const stateRaw = location
    .slice(commaIndex + 1)
    .replace(/\b\d{5}(?:-\d{4})?\b/, '')
    .replace(/\./g, '')
    .trim()
    .toLowerCase()
  if (!city || !stateRaw) return null

  const state = /^[a-z]{2}$/.test(stateRaw)
    ? stateRaw.toUpperCase()
    : (STATE_NAME_TO_CODE[stateRaw.replace(/\s+/g, ' ')] ?? null)
  if (!state) return null

  return { city, state }
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Resolves a business location to an IANA timezone, or null when it cannot be
 * determined from the service-area table. Never guesses for split states.
 */
export function resolveBusinessTimezone(
  location: unknown,
  table: ServiceAreaTimezoneTable = SERVICE_AREA_TIMEZONES
): string | null {
  const parsed = parseLocation(location)
  if (!parsed) return null

  const entry = table[parsed.state]
  if (!entry) return null

  const timezone = entry.kind === 'single' ? entry.timezone : entry.cities[parsed.city]
  if (!timezone || !isValidTimezone(timezone)) return null
  return timezone
}

/**
 * Converts a clock instant into the calendar date (YYYY-MM-DD) in `timezone`.
 * Returns null when no timezone is known — dates must then be omitted.
 */
export function formatDateInTimezone(now: Date, timezone: string | null): string | null {
  if (!timezone || !isValidTimezone(timezone)) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const year = get('year')
  const month = get('month')
  const day = get('day')
  return year && month && day ? `${year}-${month}-${day}` : null
}

/** Adds whole days to a YYYY-MM-DD calendar date (calendar arithmetic, zone-free). */
export function addDaysToDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1, d + days))
  return shifted.toISOString().slice(0, 10)
}
