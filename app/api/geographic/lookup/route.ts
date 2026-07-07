/**
 * Geographic Lookup API
 *
 * Returns real demographic data for US cities, states, counties, and ZIP codes
 * stored in Supabase by the Manus ingestion pipeline.
 *
 * All data originates from authoritative public sources (US Census Bureau, ACS).
 * No external API calls are made at request time — this is a pure Supabase read.
 *
 * No authentication required: Census data is public information.
 *
 * Query params:
 *   type=city|state|county|zip
 *   names[]=Austin|TX   (pipe-separated name|state_abbr, repeatable)
 *   zips[]=78701        (repeatable, for type=zip)
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'

export const dynamic = 'force-dynamic'

export type GeographicMetrics = {
  population?: number | null
  households?: number | null
  businesses?: number | null
  medianHouseholdIncome?: number | null
  medianAge?: number | null
  homeownershipRate?: number | null
  medianHomeValue?: number | null
  populationDensity?: number | null
  landAreaSqMiles?: number | null
  county?: string | null
  msaName?: string | null
  dataYear?: number | null
}

export type PlaceLookupResult = {
  key: string // "Austin|TX", "78701", "Travis County|TX", "TX", or "US"
  found: boolean
  metrics: GeographicMetrics
}

export type LookupResponse = {
  results: PlaceLookupResult[]
  aggregate?: GeographicMetrics // summed/averaged when multiple results exist
}

function sumMetrics(rows: GeographicMetrics[]): GeographicMetrics {
  if (rows.length === 0) return {}
  if (rows.length === 1) return rows[0]

  const total = {
    population: 0,
    households: 0,
    businesses: 0,
  }
  const weightedIncome: number[] = []
  const weights: number[] = []
  let medianAgeSum = 0
  let medianAgeCount = 0
  let homeownershipSum = 0
  let homeownershipCount = 0
  let medianHomeValueSum = 0
  let medianHomeValueCount = 0
  let landAreaSum = 0
  let landAreaCount = 0
  let dataYear: number | null = null

  for (const row of rows) {
    if (row.population) {
      total.population += row.population
      weights.push(row.population)
    } else weights.push(0)
    if (row.households) total.households += row.households
    if (row.businesses) total.businesses += row.businesses
    if (row.medianHouseholdIncome && row.population)
      weightedIncome.push(row.medianHouseholdIncome * row.population)
    if (row.medianAge) {
      medianAgeSum += row.medianAge
      medianAgeCount++
    }
    if (row.homeownershipRate) {
      homeownershipSum += row.homeownershipRate
      homeownershipCount++
    }
    if (row.medianHomeValue) {
      medianHomeValueSum += row.medianHomeValue
      medianHomeValueCount++
    }
    if (row.landAreaSqMiles) {
      landAreaSum += row.landAreaSqMiles
      landAreaCount++
    }
    if (row.dataYear && (!dataYear || row.dataYear > dataYear)) dataYear = row.dataYear
  }

  const totalPop = total.population || 1
  const medianIncome =
    weightedIncome.length > 0
      ? Math.round(weightedIncome.reduce((a, b) => a + b, 0) / totalPop)
      : null

  return {
    population: total.population || null,
    households: total.households || null,
    businesses: total.businesses || null,
    medianHouseholdIncome: medianIncome,
    medianAge: medianAgeCount > 0 ? parseFloat((medianAgeSum / medianAgeCount).toFixed(1)) : null,
    homeownershipRate:
      homeownershipCount > 0
        ? parseFloat((homeownershipSum / homeownershipCount).toFixed(1))
        : null,
    medianHomeValue:
      medianHomeValueCount > 0 ? Math.round(medianHomeValueSum / medianHomeValueCount) : null,
    landAreaSqMiles: landAreaCount > 0 ? parseFloat(landAreaSum.toFixed(1)) : null,
    dataYear,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'city' | 'state' | 'county' | 'zip' | 'nationwide' | null
  const names = searchParams.getAll('names') // "Austin|TX", "Miami|FL", …
  const zips = searchParams.getAll('zips') // "78701", "90210", …

  if (!type) {
    return NextResponse.json({ error: 'type param required' }, { status: 400 })
  }

  const db = createServerSupabaseClient()
  const results: PlaceLookupResult[] = []

  // ── Nationwide ────────────────────────────────────────────────────────────
  if (type === 'nationwide') {
    results.push({
      key: 'US',
      found: true,
      metrics: {
        population: 331449281,
        households: 128451000,
        businesses: 32540000,
        medianHouseholdIncome: 74580,
        medianAge: 38.9,
        homeownershipRate: 64.8,
        medianHomeValue: 301500,
        landAreaSqMiles: 3531905,
        dataYear: 2023,
      },
    })
    return NextResponse.json({ results, aggregate: results[0].metrics } satisfies LookupResponse)
  }

  // ── Cities ────────────────────────────────────────────────────────────────
  if (type === 'city' && names.length > 0) {
    for (const key of names) {
      const [name, stateAbbr] = key.split('|')
      if (!name || !stateAbbr) {
        results.push({ key, found: false, metrics: {} })
        continue
      }

      const { data } = await db
        .from('geographic_places')
        .select(
          'population,households,businesses,median_household_income,median_age,homeownership_rate,median_home_value,population_density,land_area_sq_miles,county,msa_name,data_year'
        )
        .ilike('name', name.trim())
        .eq('state_abbr', stateAbbr.trim().toUpperCase())
        .limit(1)
        .maybeSingle()

      if (data) {
        results.push({
          key,
          found: true,
          metrics: {
            population: data.population,
            households: data.households,
            businesses: data.businesses,
            medianHouseholdIncome: data.median_household_income,
            medianAge: data.median_age,
            homeownershipRate: data.homeownership_rate,
            medianHomeValue: data.median_home_value,
            populationDensity: data.population_density,
            landAreaSqMiles: data.land_area_sq_miles,
            county: data.county,
            msaName: data.msa_name,
            dataYear: data.data_year,
          },
        })
      } else {
        results.push({ key, found: false, metrics: {} })
      }
    }
  }

  // ── States ────────────────────────────────────────────────────────────────
  if (type === 'state' && names.length > 0) {
    for (const key of names) {
      const { data } = await db
        .from('geographic_states')
        .select(
          'population,households,businesses,median_household_income,median_age,homeownership_rate,median_home_value,land_area_sq_miles,data_year'
        )
        .eq('abbr', key.trim().toUpperCase())
        .limit(1)
        .maybeSingle()

      if (data) {
        results.push({
          key,
          found: true,
          metrics: {
            population: data.population,
            households: data.households,
            businesses: data.businesses,
            medianHouseholdIncome: data.median_household_income,
            medianAge: data.median_age,
            homeownershipRate: data.homeownership_rate,
            medianHomeValue: data.median_home_value,
            landAreaSqMiles: data.land_area_sq_miles,
            dataYear: data.data_year,
          },
        })
      } else {
        results.push({ key, found: false, metrics: {} })
      }
    }
  }

  // ── Counties ──────────────────────────────────────────────────────────────
  if (type === 'county' && names.length > 0) {
    for (const key of names) {
      const [name, stateAbbr] = key.split('|')
      if (!name || !stateAbbr) {
        results.push({ key, found: false, metrics: {} })
        continue
      }

      const { data } = await db
        .from('geographic_counties')
        .select(
          'population,households,businesses,median_household_income,median_age,homeownership_rate,median_home_value,land_area_sq_miles,data_year'
        )
        .ilike('name', name.trim())
        .eq('state_abbr', stateAbbr.trim().toUpperCase())
        .limit(1)
        .maybeSingle()

      if (data) {
        results.push({
          key,
          found: true,
          metrics: {
            population: data.population,
            households: data.households,
            businesses: data.businesses,
            medianHouseholdIncome: data.median_household_income,
            medianAge: data.median_age,
            homeownershipRate: data.homeownership_rate,
            medianHomeValue: data.median_home_value,
            landAreaSqMiles: data.land_area_sq_miles,
            dataYear: data.data_year,
          },
        })
      } else {
        results.push({ key, found: false, metrics: {} })
      }
    }
  }

  // ── ZIP codes ─────────────────────────────────────────────────────────────
  if (type === 'zip' && zips.length > 0) {
    for (const zip of zips) {
      const { data } = await db
        .from('geographic_zips')
        .select(
          'population,households,median_household_income,median_age,land_area_sq_miles,county,data_year'
        )
        .eq('zip', zip.trim())
        .limit(1)
        .maybeSingle()

      if (data) {
        results.push({
          key: zip,
          found: true,
          metrics: {
            population: data.population,
            households: data.households,
            medianHouseholdIncome: data.median_household_income,
            medianAge: data.median_age,
            landAreaSqMiles: data.land_area_sq_miles,
            county: data.county,
            dataYear: data.data_year,
          },
        })
      } else {
        results.push({ key: zip, found: false, metrics: {} })
      }
    }
  }

  const aggregate = sumMetrics(results.filter((r) => r.found).map((r) => r.metrics))

  return NextResponse.json({ results, aggregate } satisfies LookupResponse)
}
