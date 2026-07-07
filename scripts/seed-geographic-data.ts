/**
 * Comprehensive US Geographic Data Seed
 *
 * Downloads official Census Bureau data and imports it into Supabase.
 * Run once to populate — re-run anytime to refresh from the latest Census release.
 *
 * Data sources:
 *   Census 2020 Decennial Census (DHC) — population, households
 *   ACS 5-Year 2022 — income, age, homeownership, home value
 *   Census Gazetteer Files 2020 — lat/lng, land area
 *
 * Usage:
 *   npx tsx scripts/seed-geographic-data.ts
 *   npx tsx scripts/seed-geographic-data.ts --type=places
 *   npx tsx scripts/seed-geographic-data.ts --type=counties
 *   npx tsx scripts/seed-geographic-data.ts --type=zips
 *   npx tsx scripts/seed-geographic-data.ts --type=states
 *
 * Prerequisites:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 *   unzip must be available on PATH (macOS/Linux default)
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// Supabase Realtime requires a WebSocket constructor even when realtime isn't used.
// Node.js 20 lacks globalThis.WebSocket — provide a no-op stub so the client initializes.
if (typeof (globalThis as Record<string, unknown>).WebSocket === 'undefined') {
  ;(globalThis as Record<string, unknown>).WebSocket = class NoopWebSocket {}
}

// Parse .env.local manually (avoids dotenv dependency)
function loadEnv(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
}
loadEnv(join(process.cwd(), '.env.local'))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_KEY)

const CACHE_DIR = join(process.cwd(), '.census-cache')
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR)

const args = process.argv.slice(2)
const typeArg = args.find((a) => a.startsWith('--type='))?.split('=')[1]

// ── State FIPS → abbreviation map ─────────────────────────────────────────────

const FIPS_TO_ABBR: Record<string, string> = {
  '01': 'AL',
  '02': 'AK',
  '04': 'AZ',
  '05': 'AR',
  '06': 'CA',
  '08': 'CO',
  '09': 'CT',
  '10': 'DE',
  '11': 'DC',
  '12': 'FL',
  '13': 'GA',
  '15': 'HI',
  '16': 'ID',
  '17': 'IL',
  '18': 'IN',
  '19': 'IA',
  '20': 'KS',
  '21': 'KY',
  '22': 'LA',
  '23': 'ME',
  '24': 'MD',
  '25': 'MA',
  '26': 'MI',
  '27': 'MN',
  '28': 'MS',
  '29': 'MO',
  '30': 'MT',
  '31': 'NE',
  '32': 'NV',
  '33': 'NH',
  '34': 'NJ',
  '35': 'NM',
  '36': 'NY',
  '37': 'NC',
  '38': 'ND',
  '39': 'OH',
  '40': 'OK',
  '41': 'OR',
  '42': 'PA',
  '44': 'RI',
  '45': 'SC',
  '46': 'SD',
  '47': 'TN',
  '48': 'TX',
  '49': 'UT',
  '50': 'VT',
  '51': 'VA',
  '53': 'WA',
  '54': 'WV',
  '55': 'WI',
  '56': 'WY',
}

const ALL_STATE_FIPS = Object.keys(FIPS_TO_ABBR).filter((f) => f !== '11') // exclude DC for place/county queries

// ── Utilities ──────────────────────────────────────────────────────────────────

function download(url: string, dest: string): void {
  if (existsSync(dest)) {
    console.log(`  ↩ cached ${dest}`)
    return
  }
  console.log(`  ↓ ${url}`)
  execSync(`curl -sSL "${url}" -o "${dest}"`, { stdio: 'inherit' })
}

function unzipFirst(zipPath: string, outputPath: string): void {
  if (existsSync(outputPath)) return
  execSync(`unzip -p "${zipPath}" > "${outputPath}"`, { shell: '/bin/sh' })
}

function parseTsv(content: string): string[][] {
  return content
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => l.split('\t').map((c) => c.trim()))
}

async function upsertBatch(
  table: string,
  rows: Record<string, unknown>[],
  conflictKey: string
): Promise<void> {
  const CHUNK = 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await db.from(table).upsert(chunk, {
      onConflict: conflictKey,
      ignoreDuplicates: false,
    })
    if (error) throw new Error(`Upsert error on ${table}: ${error.message}`)
    inserted += chunk.length
    process.stdout.write(`\r  ${inserted}/${rows.length}`)
  }
  console.log()
}

// ── Census API helpers ─────────────────────────────────────────────────────────

const CENSUS_KEY = process.env.CENSUS_API_KEY ?? 'DEMO_KEY'

async function censusGet(url: string): Promise<string[][]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Census API ${res.status}: ${url}`)
  const text = await res.text()
  if (text.trim().startsWith('<')) {
    throw new Error(`Census API returned HTML (rate-limited or blocked)`)
  }
  return JSON.parse(text) as string[][]
}

// ── PLACES (incorporated cities) ──────────────────────────────────────────────

async function seedPlaces() {
  console.log('\n── Seeding places (incorporated US cities) ──')

  // Step 1: Download Gazetteer for lat/lng + area
  const gazZip = join(CACHE_DIR, '2020_gaz_place_national.zip')
  const gazTxt = join(CACHE_DIR, '2020_gaz_place_national.txt')
  download(
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_gaz_place_national.zip',
    gazZip
  )
  unzipFirst(gazZip, gazTxt)

  const gazRows = parseTsv(readFileSync(gazTxt, 'utf8'))
  // Columns: USPS GEOID ANSICODE NAME LSAD FUNCSTAT ALAND AWATER ALAND_SQMI AWATER_SQMI INTPTLAT INTPTLONG
  const gazMap = new Map<string, { lat: number; lng: number; sqmi: number }>()
  for (const cols of gazRows.slice(1)) {
    if (cols.length < 12) continue
    const geoid = cols[1]
    gazMap.set(geoid, {
      lat: parseFloat(cols[10]),
      lng: parseFloat(cols[11]),
      sqmi: parseFloat(cols[8]),
    })
  }

  console.log(`  Gazetteer: ${gazMap.size} places`)

  // Step 2: Fetch 2020 Census population + ACS income/age per state
  const rows: Record<string, unknown>[] = []

  for (const fips of ALL_STATE_FIPS) {
    const abbr = FIPS_TO_ABBR[fips]
    process.stdout.write(`  ${abbr} `)

    // Population (2020 Decennial)
    const popMap = new Map<string, { pop: number; hh: number }>()
    try {
      const popData = await censusGet(
        `https://api.census.gov/data/2020/dec/dhc?get=NAME,P1_001N,H1_001N&for=place:*&in=state:${fips}&key=${CENSUS_KEY}`
      )
      for (const row of popData.slice(1)) {
        // row: [NAME, P1_001N, H1_001N, state, place]
        const geoid = fips + row[4] // state FIPS + place FIPS
        popMap.set(geoid, { pop: parseInt(row[1]) || 0, hh: parseInt(row[2]) || 0 })
      }
    } catch {
      process.stdout.write('(pop err) ')
    }

    // ACS income + age
    const acsMap = new Map<string, { income: number; age: number }>()
    try {
      const acsData = await censusGet(
        `https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B01002_001E&for=place:*&in=state:${fips}&key=${CENSUS_KEY}`
      )
      for (const row of acsData.slice(1)) {
        const geoid = fips + row[4]
        acsMap.set(geoid, {
          income: parseInt(row[1]) > 0 ? parseInt(row[1]) : 0,
          age: parseFloat(row[2]) > 0 ? parseFloat(row[2]) : 0,
        })
      }
    } catch {
      process.stdout.write('(acs err) ')
    }

    // Merge
    for (const [geoid, pop] of popMap) {
      if (pop.pop < 500) continue // skip very small places
      const geo = gazMap.get(geoid)
      if (!geo || isNaN(geo.lat)) continue

      const acs = acsMap.get(geoid)
      const nameParts = (popMap.get(geoid) as unknown as { name?: string }) ? undefined : undefined
      // NAME comes from the census response — we need to re-parse it
      rows.push({
        name: '', // will be set below
        state_abbr: abbr,
        lat: geo.lat,
        lng: geo.lng,
        population: pop.pop,
        households: pop.hh,
        land_area_sq_miles: geo.sqmi,
        median_household_income: acs?.income || null,
        median_age: acs?.age || null,
        data_source: 'Census DHC 2020 / ACS 5-Year 2022',
        data_year: 2022,
      })
    }
  }

  // The above approach needs the NAME from the census row — let's redo with correct parsing
  const rows2: Record<string, unknown>[] = []

  for (const fips of ALL_STATE_FIPS) {
    const abbr = FIPS_TO_ABBR[fips]

    let popRows: string[][] = []
    try {
      popRows = await censusGet(
        `https://api.census.gov/data/2020/dec/dhc?get=NAME,P1_001N,H1_001N&for=place:*&in=state:${fips}&key=${CENSUS_KEY}`
      )
    } catch {
      continue
    }

    let acsRows: string[][] = []
    try {
      acsRows = await censusGet(
        `https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B01002_001E&for=place:*&in=state:${fips}&key=${CENSUS_KEY}`
      )
    } catch {
      // ACS optional
    }

    const acsMap = new Map<string, { income: number; age: number }>()
    for (const row of acsRows.slice(1)) {
      const geoid = fips + row[4]
      acsMap.set(geoid, {
        income: parseInt(row[1]) > 0 ? parseInt(row[1]) : 0,
        age: parseFloat(row[2]) > 0 ? parseFloat(row[2]) : 0,
      })
    }

    for (const row of popRows.slice(1)) {
      const [fullName, popStr, hhStr, , placeFips] = row
      const pop = parseInt(popStr) || 0
      if (pop < 1000) continue // skip hamlets/CDPs under 1k

      const geoid = fips + placeFips
      const geo = gazMap.get(geoid)
      if (!geo || isNaN(geo.lat)) continue

      // Strip state suffix from name: "Austin city, Texas" → "Austin"
      const name = fullName
        .replace(
          /\s+(city|town|village|CDP|borough|municipality|county|consolidated government|unified government),.*$/,
          ''
        )
        .trim()

      const acs = acsMap.get(geoid)

      rows2.push({
        name,
        state_abbr: abbr,
        lat: geo.lat,
        lng: geo.lng,
        population: pop,
        households: parseInt(hhStr) || null,
        land_area_sq_miles: geo.sqmi,
        median_household_income: acs?.income || null,
        median_age: acs?.age || null,
        data_source: 'Census DHC 2020 / ACS 5-Year 2022',
        data_year: 2022,
      })
    }
    process.stdout.write(`${abbr} `)
  }

  // Gazetteer-only fallback: seed any state whose Census API calls failed.
  // Ensures lat/lng is populated even when Census API is rate-limited.
  const seededStates = new Set(rows2.map((r) => r.state_abbr as string))
  const gazOnlyRows: Record<string, unknown>[] = []
  // Re-parse gazetteer TSV for name + state (gazMap only stored coords)
  if (seededStates.size < ALL_STATE_FIPS.length) {
    const rawGazRows = parseTsv(readFileSync(gazTxt, 'utf8'))
    for (const cols of rawGazRows.slice(1)) {
      if (cols.length < 12) continue
      const abbr = cols[0] // USPS
      if (seededStates.has(abbr)) continue
      const rawName = cols[3] // e.g. "Miami city"
      const name = rawName
        .replace(
          /\s+(city|town|village|CDP|borough|municipality|county|consolidated government|unified government|metro government|urban county)$/i,
          ''
        )
        .trim()
      if (!name) continue
      const lat = parseFloat(cols[10])
      const lng = parseFloat(cols[11])
      const sqmi = parseFloat(cols[8])
      if (isNaN(lat) || isNaN(lng)) continue
      gazOnlyRows.push({
        name,
        state_abbr: abbr,
        lat,
        lng,
        land_area_sq_miles: isNaN(sqmi) ? null : sqmi,
        data_source: 'Census Gazetteer 2020 (coordinates only)',
        data_year: 2020,
      })
    }
    if (gazOnlyRows.length > 0) {
      console.log(
        `  Gazetteer-only fallback: ${gazOnlyRows.length} places from ${ALL_STATE_FIPS.length - seededStates.size} states`
      )
      await upsertBatch('geographic_places', gazOnlyRows, 'name,state_abbr')
    }
  }

  console.log(`\n  Upserting ${rows2.length} places…`)
  await upsertBatch('geographic_places', rows2, 'name,state_abbr')
}

// ── COUNTIES ──────────────────────────────────────────────────────────────────

async function seedCounties() {
  console.log('\n── Seeding counties ──')

  const gazZip = join(CACHE_DIR, '2020_gaz_counties_national.zip')
  const gazTxt = join(CACHE_DIR, '2020_gaz_counties_national.txt')
  download(
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_gaz_counties_national.zip',
    gazZip
  )
  unzipFirst(gazZip, gazTxt)

  const gazRows = parseTsv(readFileSync(gazTxt, 'utf8'))
  // Cols: USPS GEOID ANSICODE NAME ALAND AWATER ALAND_SQMI AWATER_SQMI INTPTLAT INTPTLONG
  const gazMap = new Map<
    string,
    { lat: number; lng: number; sqmi: number; name: string; abbr: string }
  >()
  for (const cols of gazRows.slice(1)) {
    if (cols.length < 10) continue
    const geoid = cols[1]
    gazMap.set(geoid, {
      lat: parseFloat(cols[8]),
      lng: parseFloat(cols[9]),
      sqmi: parseFloat(cols[6]),
      name: cols[3],
      abbr: cols[0],
    })
  }

  console.log(`  Gazetteer: ${gazMap.size} counties`)

  // Population (optional — falls back to Gazetteer-only if Census API unavailable)
  const popMap = new Map<string, { pop: number; hh: number }>()
  try {
    const popRows = await censusGet(
      `https://api.census.gov/data/2020/dec/dhc?get=NAME,P1_001N,H1_001N&for=county:*&in=state:*&key=${CENSUS_KEY}`
    )
    for (const row of popRows.slice(1)) {
      const geoid = row[3] + row[4]
      popMap.set(geoid, { pop: parseInt(row[1]) || 0, hh: parseInt(row[2]) || 0 })
    }
    console.log(`  Census pop: ${popMap.size} counties`)
  } catch (err) {
    console.warn(`  Warning: county population unavailable — ${(err as Error).message}`)
  }

  // ACS (optional)
  const acsMap = new Map<string, { income: number; age: number; homeVal: number }>()
  try {
    const acsRows = await censusGet(
      `https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B01002_001E,B25077_001E&for=county:*&in=state:*&key=${CENSUS_KEY}`
    )
    for (const row of acsRows.slice(1)) {
      const geoid = row[4] + row[5]
      acsMap.set(geoid, {
        income: parseInt(row[1]) > 0 ? parseInt(row[1]) : 0,
        age: parseFloat(row[2]) > 0 ? parseFloat(row[2]) : 0,
        homeVal: parseInt(row[3]) > 0 ? parseInt(row[3]) : 0,
      })
    }
    console.log(`  ACS: ${acsMap.size} counties`)
  } catch (err) {
    console.warn(`  Warning: county ACS data unavailable — ${(err as Error).message}`)
  }

  const rows: Record<string, unknown>[] = []
  for (const [geoid, geo] of gazMap) {
    if (isNaN(geo.lat)) continue
    const abbr = FIPS_TO_ABBR[geoid.slice(0, 2)]
    if (!abbr) continue
    const pop = popMap.get(geoid)
    const acs = acsMap.get(geoid)

    rows.push({
      name: geo.name,
      state_abbr: abbr,
      lat: geo.lat,
      lng: geo.lng,
      population: pop?.pop || null,
      households: pop?.hh || null,
      land_area_sq_miles: geo.sqmi,
      median_household_income: acs?.income || null,
      median_age: acs?.age || null,
      median_home_value: acs?.homeVal || null,
      data_source: 'Census DHC 2020 / ACS 5-Year 2022',
      data_year: 2022,
    })
  }

  console.log(`  Upserting ${rows.length} counties…`)
  await upsertBatch('geographic_counties', rows, 'name,state_abbr')
}

// ── ZIP CODES (ZCTAs) ─────────────────────────────────────────────────────────

async function seedZips() {
  console.log('\n── Seeding ZIP codes (ZCTAs) ──')

  const gazZip = join(CACHE_DIR, '2020_gaz_zcta_national.zip')
  const gazTxt = join(CACHE_DIR, '2020_gaz_zcta_national.txt')
  download(
    'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2020_Gazetteer/2020_gaz_zcta_national.zip',
    gazZip
  )
  unzipFirst(gazZip, gazTxt)

  const gazRows = parseTsv(readFileSync(gazTxt, 'utf8'))
  // Cols: GEOID ALAND_SQMI AWATER_SQMI INTPTLAT INTPTLONG
  const gazMap = new Map<string, { lat: number; lng: number; sqmi: number }>()
  for (const cols of gazRows.slice(1)) {
    if (cols.length < 5) continue
    const zip = cols[0].padStart(5, '0')
    gazMap.set(zip, {
      lat: parseFloat(cols[3]),
      lng: parseFloat(cols[4]),
      sqmi: parseFloat(cols[1]),
    })
  }

  console.log(`  Gazetteer: ${gazMap.size} ZCTAs`)

  // Population from 2020 Census (optional)
  const popMap = new Map<string, { pop: number; hh: number }>()
  try {
    const popRows = await censusGet(
      `https://api.census.gov/data/2020/dec/dhc?get=NAME,P1_001N,H1_001N&for=zip+code+tabulation+area:*&key=${CENSUS_KEY}`
    )
    for (const row of popRows.slice(1)) {
      const zip = row[3].padStart(5, '0')
      popMap.set(zip, { pop: parseInt(row[1]) || 0, hh: parseInt(row[2]) || 0 })
    }
    console.log(`  Census pop: ${popMap.size} ZCTAs`)
  } catch (err) {
    console.warn(`  Warning: ZCTA population unavailable — ${(err as Error).message}`)
  }

  // ACS income + age for ZCTAs (optional)
  const acsMap = new Map<string, { income: number; age: number }>()
  try {
    const acsRows = await censusGet(
      `https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B01002_001E&for=zip+code+tabulation+area:*&key=${CENSUS_KEY}`
    )
    for (const row of acsRows.slice(1)) {
      const zip = row[3].padStart(5, '0')
      acsMap.set(zip, {
        income: parseInt(row[1]) > 0 ? parseInt(row[1]) : 0,
        age: parseFloat(row[2]) > 0 ? parseFloat(row[2]) : 0,
      })
    }
    console.log(`  ACS: ${acsMap.size} ZCTAs`)
  } catch (err) {
    console.warn(`  Warning: ZCTA ACS data unavailable — ${(err as Error).message}`)
  }

  // Build rows: Gazetteer is authoritative for coordinates; use Census/ACS when available
  const rows: Record<string, unknown>[] = []
  for (const [zip, geo] of gazMap) {
    if (isNaN(geo.lat)) continue
    const p = popMap.get(zip)
    const pop = p?.pop ?? 0
    if (pop < 100 && popMap.size > 0) continue // skip tiny ZCTAs only when we have pop data
    if (!geo || isNaN(geo.lat)) continue
    const acs = acsMap.get(zip)

    // Extract city/state hint from NAME: "ZCTA5 78701" → name=null
    // Better: leave name null for raw ZCTAs
    rows.push({
      zip,
      lat: geo.lat,
      lng: geo.lng,
      population: pop || null,
      households: p?.hh || null,
      land_area_sq_miles: geo.sqmi,
      median_household_income: acs?.income || null,
      median_age: acs?.age || null,
      data_source: 'Census DHC 2020 / ACS 5-Year 2022',
      data_year: 2022,
    })
  }

  console.log(`  Upserting ${rows.length} ZIP codes…`)
  await upsertBatch('geographic_zips', rows, 'zip')
}

// ── STATES ────────────────────────────────────────────────────────────────────

async function seedStates() {
  console.log('\n── Refreshing state demographics from ACS ──')

  let acsRows: string[][] = []
  let popRows: string[][] = []
  try {
    acsRows = await censusGet(
      `https://api.census.gov/data/2022/acs/acs5?get=NAME,B19013_001E,B01002_001E,B25077_001E,B25003_002E,B25003_001E&for=state:*&key=${CENSUS_KEY}`
    )
    popRows = await censusGet(
      `https://api.census.gov/data/2020/dec/dhc?get=NAME,P1_001N,H1_001N&for=state:*&key=${CENSUS_KEY}`
    )
  } catch (err) {
    console.warn(`  Warning: Census API unavailable — ${(err as Error).message}`)
    console.warn('  State demographics will retain existing values.')
    return
  }

  const popMap = new Map<string, { pop: number; hh: number }>()
  for (const row of popRows.slice(1)) {
    const abbr = FIPS_TO_ABBR[row[3]]
    if (abbr) popMap.set(abbr, { pop: parseInt(row[1]) || 0, hh: parseInt(row[2]) || 0 })
  }

  const rows: Record<string, unknown>[] = []
  for (const row of acsRows.slice(1)) {
    const abbr = FIPS_TO_ABBR[row[6]]
    if (!abbr) continue
    const pop = popMap.get(abbr)
    const ownedHH = parseInt(row[4]) || 0
    const totalHH = parseInt(row[5]) || 1
    const homeownership = totalHH > 0 ? parseFloat(((ownedHH / totalHH) * 100).toFixed(1)) : null

    rows.push({
      abbr,
      median_household_income: parseInt(row[1]) > 0 ? parseInt(row[1]) : null,
      median_age: parseFloat(row[2]) > 0 ? parseFloat(row[2]) : null,
      median_home_value: parseInt(row[3]) > 0 ? parseInt(row[3]) : null,
      homeownership_rate: homeownership,
      population: pop?.pop || null,
      households: pop?.hh || null,
      data_source: 'Census DHC 2020 / ACS 5-Year 2022',
      data_year: 2022,
    })
  }

  console.log(`  Upserting ${rows.length} states…`)
  for (const row of rows) {
    const { error } = await db
      .from('geographic_states')
      .update(row)
      .eq('abbr', row.abbr as string)
    if (error) console.warn(`  State update failed: ${row.abbr} — ${error.message}`)
  }
  console.log('  Done.')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Koolerr Geographic Data Seed')
  console.log('=============================')
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Census API key: ${CENSUS_KEY === 'DEMO_KEY' ? 'DEMO_KEY (rate limited)' : 'custom'}`)
  console.log()

  const run = async (name: string, fn: () => Promise<void>) => {
    if (!typeArg || typeArg === name) {
      await fn()
    }
  }

  try {
    await run('states', seedStates)
    await run('counties', seedCounties)
    await run('places', seedPlaces)
    await run('zips', seedZips)
    console.log('\n✓ Seed complete.')
  } catch (err) {
    console.error('\n✗ Seed failed:', err)
    process.exit(1)
  }
}

main()
