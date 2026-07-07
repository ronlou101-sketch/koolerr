/**
 * Geographic Data Ingestion Endpoint
 *
 * Called by the Manus offline pipeline to import authoritative US Census data.
 * Manus periodically downloads datasets from:
 *   - US Census Bureau Decennial Census
 *   - ACS 5-Year Estimates
 *   - Census SUSB (business counts)
 *   - Census Gazetteer Files (area)
 *
 * and POSTs normalized rows here for upsert into Supabase.
 *
 * Requires INGEST_SECRET header to prevent unauthorized writes.
 * Never exposed to the browser. Never called during user interactions.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'

export const dynamic = 'force-dynamic'

type PlaceRow = {
  name: string
  state_abbr: string
  state_name?: string
  county?: string
  msa_name?: string
  lat?: number
  lng?: number
  osm_id?: string
  population?: number
  households?: number
  businesses?: number
  median_household_income?: number
  median_age?: number
  homeownership_rate?: number
  median_home_value?: number
  population_density?: number
  land_area_sq_miles?: number
  data_source?: string
  data_year?: number
}

type StateRow = {
  name: string
  abbr: string
  fips?: string
  lat?: number
  lng?: number
  population?: number
  households?: number
  businesses?: number
  median_household_income?: number
  median_age?: number
  homeownership_rate?: number
  median_home_value?: number
  land_area_sq_miles?: number
  data_source?: string
  data_year?: number
}

type CountyRow = {
  name: string
  state_abbr: string
  state_name?: string
  fips?: string
  lat?: number
  lng?: number
  osm_id?: string
  population?: number
  households?: number
  businesses?: number
  median_household_income?: number
  median_age?: number
  homeownership_rate?: number
  median_home_value?: number
  land_area_sq_miles?: number
  data_source?: string
  data_year?: number
}

type ZipRow = {
  zip: string
  name?: string
  state_abbr?: string
  county?: string
  lat?: number
  lng?: number
  population?: number
  households?: number
  median_household_income?: number
  median_age?: number
  land_area_sq_miles?: number
  data_source?: string
  data_year?: number
}

type IngestPayload = {
  table: 'places' | 'states' | 'counties' | 'zips'
  rows: PlaceRow[] | StateRow[] | CountyRow[] | ZipRow[]
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-ingest-secret')
  if (!secret || secret !== process.env.GEOGRAPHIC_INGEST_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: IngestPayload
  try {
    payload = (await request.json()) as IngestPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.table || !Array.isArray(payload.rows) || payload.rows.length === 0) {
    return NextResponse.json({ error: 'table and rows required' }, { status: 400 })
  }

  const TABLE_MAP: Record<IngestPayload['table'], string> = {
    places: 'geographic_places',
    states: 'geographic_states',
    counties: 'geographic_counties',
    zips: 'geographic_zips',
  }

  const CONFLICT_KEYS: Record<IngestPayload['table'], string> = {
    places: 'name,state_abbr',
    states: 'name',
    counties: 'name,state_abbr',
    zips: 'zip',
  }

  const tableName = TABLE_MAP[payload.table]
  const conflictKey = CONFLICT_KEYS[payload.table]

  if (!tableName) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  const db = createServerSupabaseClient()

  const { error, data } = await db
    .from(tableName)
    .upsert(payload.rows as Record<string, unknown>[], {
      onConflict: conflictKey,
      ignoreDuplicates: false,
    })
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ upserted: data?.length ?? payload.rows.length, table: tableName })
}
