/**
 * Geographic Search API
 *
 * Fast prefix-ranked autocomplete backed entirely by Supabase.
 * No external API calls at request time.
 *
 * Ranking order (per group):
 *   1. name starts with the query  (uses text_pattern_ops index)
 *   2. any word in name starts with the query  (uses trigram index)
 *   Within each tier: sorted by population DESC
 *
 * Query params:
 *   q=Miami           search term (required)
 *   type=city|zip|county|state  (required)
 *   limit=8           max results (default 8, max 15)
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/shared/lib/supabase-server'
import type { ValidatedPlace } from '@/app/(platform)/tower/dogfooding/objectives/new/ServiceAreaMap'

export const dynamic = 'force-dynamic'

const MAX_LIMIT = 15

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()
  const type = searchParams.get('type') as 'city' | 'zip' | 'county' | 'state' | null
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8', 10), MAX_LIMIT)

  if (!q || q.length < 1) return NextResponse.json({ results: [] })
  if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

  const db = createServerSupabaseClient()

  // ── States ────────────────────────────────────────────────────────────────
  if (type === 'state') {
    const { data: prefixRows } = await db
      .from('geographic_states')
      .select('name, abbr, lat, lng')
      .ilike('name', `${q}%`)
      .not('lat', 'is', null)
      .order('population', { ascending: false, nullsFirst: false })
      .limit(limit)

    const results: ValidatedPlace[] = (prefixRows ?? []).map((r) => ({
      label: r.name,
      lat: Number(r.lat),
      lng: Number(r.lng),
      osmId: `state_${r.abbr}`,
      osmType: 'relation',
    }))

    return NextResponse.json({ results })
  }

  // ── ZIP codes ─────────────────────────────────────────────────────────────
  if (type === 'zip') {
    const { data: rows } = await db
      .from('geographic_zips')
      .select('zip, name, state_abbr, lat, lng')
      .like('zip', `${q}%`)
      .not('lat', 'is', null)
      .order('zip', { ascending: true })
      .limit(limit)

    const results: ValidatedPlace[] = (rows ?? []).map((r) => {
      const parts = [r.zip, r.name, r.state_abbr].filter(Boolean)
      return {
        label: parts.join(', '),
        lat: Number(r.lat),
        lng: Number(r.lng),
        osmId: `zip_${r.zip}`,
        osmType: 'node',
      }
    })

    return NextResponse.json({ results })
  }

  // ── Counties ──────────────────────────────────────────────────────────────
  if (type === 'county') {
    const term = q
      .toLowerCase()
      .replace(/\s+county$/i, '')
      .trim()

    // Phase 1: prefix matches — fast (text_pattern_ops index)
    const { data: prefixRows } = await db
      .from('geographic_counties')
      .select('name, state_abbr, lat, lng, osm_id, population')
      .ilike('name', `${term}%`)
      .not('lat', 'is', null)
      .order('population', { ascending: false, nullsFirst: false })
      .limit(limit)

    const seen = new Set<string>()
    const results: ValidatedPlace[] = []

    for (const r of prefixRows ?? []) {
      const key = `${r.name}|${r.state_abbr}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(toPlace(r.name, r.state_abbr, r.lat, r.lng, r.osm_id, 'relation'))
    }

    // Phase 2: word-boundary matches if we need more
    if (results.length < limit) {
      const { data: wordRows } = await db
        .from('geographic_counties')
        .select('name, state_abbr, lat, lng, osm_id, population')
        .ilike('name', `% ${term}%`)
        .not('lat', 'is', null)
        .order('population', { ascending: false, nullsFirst: false })
        .limit(limit)

      for (const r of wordRows ?? []) {
        if (results.length >= limit) break
        const key = `${r.name}|${r.state_abbr}`
        if (seen.has(key)) continue
        seen.add(key)
        results.push(toPlace(r.name, r.state_abbr, r.lat, r.lng, r.osm_id, 'relation'))
      }
    }

    return NextResponse.json({ results })
  }

  // ── Cities ────────────────────────────────────────────────────────────────
  // Phase 1: prefix matches — fast (text_pattern_ops index)
  const { data: prefixRows } = await db
    .from('geographic_places')
    .select('name, state_abbr, lat, lng, osm_id, population')
    .ilike('name', `${q}%`)
    .not('lat', 'is', null)
    .order('population', { ascending: false, nullsFirst: false })
    .limit(limit)

  const seen = new Set<string>()
  const results: ValidatedPlace[] = []

  for (const r of prefixRows ?? []) {
    const key = `${r.name}|${r.state_abbr}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push(toPlace(r.name, r.state_abbr, r.lat, r.lng, r.osm_id, 'node'))
  }

  // Phase 2: word-boundary matches if prefix didn't fill the limit
  if (results.length < limit) {
    const { data: wordRows } = await db
      .from('geographic_places')
      .select('name, state_abbr, lat, lng, osm_id, population')
      .ilike('name', `% ${q}%`)
      .not('lat', 'is', null)
      .order('population', { ascending: false, nullsFirst: false })
      .limit(limit)

    for (const r of wordRows ?? []) {
      if (results.length >= limit) break
      const key = `${r.name}|${r.state_abbr}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push(toPlace(r.name, r.state_abbr, r.lat, r.lng, r.osm_id, 'node'))
    }
  }

  return NextResponse.json({ results })
}

function toPlace(
  name: string,
  stateAbbr: string,
  lat: unknown,
  lng: unknown,
  osmId: string | null,
  osmType: string
): ValidatedPlace {
  return {
    label: `${name}, ${stateAbbr}`,
    lat: Number(lat),
    lng: Number(lng),
    osmId: osmId ?? `place_${name}_${stateAbbr}`.replace(/\s+/g, '_'),
    osmType,
  }
}
