import { describe, expect, it } from 'vitest'
import {
  addDaysToDate,
  formatDateInTimezone,
  parseLocation,
  resolveBusinessTimezone,
  type ServiceAreaTimezoneTable,
} from './business-timezone'

describe('parseLocation', () => {
  it('parses "City, ST" and full state names, ignoring ZIP and dots', () => {
    expect(parseLocation('West Palm Beach, FL')).toEqual({ city: 'west palm beach', state: 'FL' })
    expect(parseLocation('West Palm Beach, Florida 33401')).toEqual({
      city: 'west palm beach',
      state: 'FL',
    })
    expect(parseLocation('St. Louis, Mo.')).toEqual({ city: 'st louis', state: 'MO' })
  })

  it('returns null for missing or malformed input', () => {
    expect(parseLocation(undefined)).toBeNull()
    expect(parseLocation('')).toBeNull()
    expect(parseLocation('Palm Beach County')).toBeNull()
    expect(parseLocation('Somewhere, Atlantis')).toBeNull()
  })
})

describe('resolveBusinessTimezone (supported service areas only)', () => {
  it('resolves supported Palm Beach County locations to America/New_York', () => {
    expect(resolveBusinessTimezone('West Palm Beach, FL')).toBe('America/New_York')
    expect(resolveBusinessTimezone('Boca Raton, Florida')).toBe('America/New_York')
    expect(resolveBusinessTimezone('Jupiter, FL 33458')).toBe('America/New_York')
  })

  it('omits (null) an unsupported city in a split-timezone state — never guesses', () => {
    expect(resolveBusinessTimezone('Pensacola, FL')).toBeNull()
    expect(resolveBusinessTimezone('Miami, FL')).toBeNull()
  })

  it('omits (null) unsupported states, unknown, or missing locations', () => {
    expect(resolveBusinessTimezone('Phoenix, AZ')).toBeNull()
    expect(resolveBusinessTimezone('Chicago, IL')).toBeNull()
    expect(resolveBusinessTimezone('')).toBeNull()
    expect(resolveBusinessTimezone(null)).toBeNull()
  })

  it('never falls back to America/Chicago', () => {
    for (const loc of ['Austin, TX', 'Chicago, IL', 'nowhere', undefined]) {
      expect(resolveBusinessTimezone(loc)).not.toBe('America/Chicago')
    }
  })

  it('supports single-timezone states by state code (injected table)', () => {
    const table: ServiceAreaTimezoneTable = {
      GA: { kind: 'single', timezone: 'America/New_York' },
      XX: { kind: 'single', timezone: 'Not/AZone' },
    }
    expect(resolveBusinessTimezone('Atlanta, GA', table)).toBe('America/New_York')
    expect(resolveBusinessTimezone('Savannah, Georgia', table)).toBe('America/New_York')
    expect(resolveBusinessTimezone('Town, XX', table)).toBeNull()
  })
})

describe('date helpers', () => {
  it('formats the calendar date in the business timezone', () => {
    // 02:30 UTC on Oct 6 is still Oct 5 in New York.
    const instant = new Date('2026-10-06T02:30:00Z')
    expect(formatDateInTimezone(instant, 'America/New_York')).toBe('2026-10-05')
    expect(formatDateInTimezone(instant, 'UTC')).toBe('2026-10-06')
  })

  it('returns null when the timezone is unknown', () => {
    expect(formatDateInTimezone(new Date(), null)).toBeNull()
    expect(formatDateInTimezone(new Date(), 'Not/AZone')).toBeNull()
  })

  it('adds calendar days across month and year boundaries', () => {
    expect(addDaysToDate('2026-10-05', 7)).toBe('2026-10-12')
    expect(addDaysToDate('2026-10-28', 7)).toBe('2026-11-04')
    expect(addDaysToDate('2026-12-30', 7)).toBe('2027-01-06')
  })
})
