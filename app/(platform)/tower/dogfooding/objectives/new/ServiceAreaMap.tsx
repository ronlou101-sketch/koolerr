'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON as GeoJSONLayer,
  Circle,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { GeoJsonObject } from 'geojson'

// ── Types ─────────────────────────────────────────────────────────────────────

type CoverageType = 'local' | 'cities' | 'zips' | 'county' | 'statewide' | 'nationwide' | 'radius'

interface ServiceAreaMapProps {
  coverageType: CoverageType | null
  locations: string[]
  radiusMiles: number
  radiusAddress: string
}

interface GeoPoint {
  lat: number
  lng: number
  label: string
  geojson?: GeoJsonObject
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

const CACHE = new Map<string, GeoPoint | null>()

async function geocode(query: string, polygon = false): Promise<GeoPoint | null> {
  const key = `${query}:${polygon}`
  if (CACHE.has(key)) return CACHE.get(key) ?? null

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'us',
    addressdetails: '0',
    ...(polygon ? { polygon_geojson: '1' } : {}),
  })

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'Koolerr Campaign Wizard/1.0 (koolerr.com)' },
    })
    if (!res.ok) throw new Error('Nominatim error')
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      CACHE.set(key, null)
      return null
    }
    const pt: GeoPoint = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: query,
      geojson: data[0].geojson,
    }
    CACHE.set(key, pt)
    return pt
  } catch {
    CACHE.set(key, null)
    return null
  }
}

// ── Custom icons ──────────────────────────────────────────────────────────────

function numberIcon(n: number) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#6366f1;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(99,102,241,0.45)">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const radiusCenterIcon = L.divIcon({
  className: '',
  html: `<div style="background:#fff;border:3px solid #6366f1;border-radius:50%;width:12px;height:12px;box-shadow:0 2px 8px rgba(99,102,241,0.45)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

// ── Map controller — adjusts view when data changes ───────────────────────────

function MapController({
  points,
  coverageType,
  radiusMiles,
}: {
  points: GeoPoint[]
  coverageType: CoverageType | null
  radiusMiles: number
}) {
  const map = useMap()

  useEffect(() => {
    if (coverageType === 'nationwide') {
      map.setView([39.5, -98.35], 4)
      return
    }

    if (!points.length) return

    if (coverageType === 'radius') {
      const { lat, lng } = points[0]
      const m = radiusMiles * 1609.344 * 1.6
      const dlat = m / 111320
      const dlng = m / (111320 * Math.cos((lat * Math.PI) / 180))
      map.fitBounds(
        [
          [lat - dlat, lng - dlng],
          [lat + dlat, lng + dlng],
        ],
        { padding: [30, 30] }
      )
      return
    }

    if (points.length === 1) {
      const zoom = coverageType === 'statewide' ? 7 : coverageType === 'county' ? 10 : 12
      map.setView([points[0].lat, points[0].lng], zoom)
      return
    }

    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])), {
      padding: [40, 40],
    })
  }, [map, points, coverageType, radiusMiles])

  return null
}

// ── ServiceAreaMap ────────────────────────────────────────────────────────────

export default function ServiceAreaMap({
  coverageType,
  locations,
  radiusMiles,
  radiusAddress,
}: ServiceAreaMapProps) {
  const [points, setPoints] = useState<GeoPoint[]>([])
  const [loading, setLoading] = useState(false)
  const prevKey = useRef('')

  useEffect(() => {
    if (!coverageType) return

    const needsPolygon = coverageType === 'statewide' || coverageType === 'county'
    const queries =
      coverageType === 'nationwide'
        ? []
        : coverageType === 'radius'
          ? radiusAddress.trim()
            ? [radiusAddress.trim()]
            : []
          : locations

    const stateKey = `${coverageType}|${queries.join(',')}|${radiusMiles}`
    if (stateKey === prevKey.current) return
    prevKey.current = stateKey

    if (coverageType === 'nationwide') {
      setPoints([])
      return
    }

    if (!queries.length) {
      setPoints([])
      return
    }

    setLoading(true)
    Promise.all(queries.map((q) => geocode(q, needsPolygon)))
      .then((results) => setPoints(results.filter(Boolean) as GeoPoint[]))
      .finally(() => setLoading(false))
  }, [coverageType, locations, radiusAddress, radiusMiles])

  const usePolygons = coverageType === 'statewide' || coverageType === 'county'
  const useRadius = coverageType === 'radius'
  const isNationwide = coverageType === 'nationwide'

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border"
      style={{ height: 300 }}
    >
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapController points={points} coverageType={coverageType} radiusMiles={radiusMiles} />

        {/* City / ZIP markers */}
        {!usePolygons &&
          !useRadius &&
          !isNationwide &&
          points.map((p, i) => (
            <Marker key={p.label} position={[p.lat, p.lng]} icon={numberIcon(i + 1)} />
          ))}

        {/* State / county polygon overlays */}
        {usePolygons &&
          points.map((p) =>
            p.geojson ? (
              <GeoJSONLayer
                key={p.label}
                data={p.geojson}
                style={{ color: '#6366f1', weight: 2, fillColor: '#6366f1', fillOpacity: 0.18 }}
              />
            ) : (
              <Marker key={p.label} position={[p.lat, p.lng]} icon={numberIcon(1)} />
            )
          )}

        {/* Service radius */}
        {useRadius && points.length > 0 && (
          <>
            <Marker position={[points[0].lat, points[0].lng]} icon={radiusCenterIcon} />
            <Circle
              center={[points[0].lat, points[0].lng]}
              radius={radiusMiles * 1609.344}
              pathOptions={{
                color: '#6366f1',
                weight: 2,
                fillColor: '#6366f1',
                fillOpacity: 0.15,
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Nationwide badge */}
      {isNationwide && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-primary/90 px-5 py-1.5 text-sm font-semibold text-white shadow-lg">
            Nationwide Coverage
          </span>
        </div>
      )}

      {/* Geocoding loader */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <span className="text-sm text-muted-foreground">Finding location…</span>
        </div>
      )}
    </div>
  )
}
