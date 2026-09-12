import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import { getPlace, PLACES } from '@/data/places'
import { mapsService } from '@/services/mapsService'
import { useAppStore } from '@/store/useAppStore'
import { activeOrigin, areaOrigin } from '@/lib/origin'
import { Button } from '@/components/ui/Button'
import { cn, haversineKm } from '@/lib/utils'

function pin(color: string, pulse = false) {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 6px 16px rgba(0,0,0,.25)${pulse ? ';outline:6px solid rgba(34,197,94,.35)' : ''}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function Recenter({ lat, lng, enabled }: { lat: number; lng: number; enabled: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!enabled) return
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map, enabled])
  return null
}

function FitCity({ lat, lng, points }: { lat: number; lng: number; points: [number, number][] }) {
  const map = useMap()
  const boundsKey = points.map((p) => p.join(',')).join('|')
  useEffect(() => {
    const t = window.setTimeout(() => {
      map.invalidateSize()
      if (points.length > 1) {
        map.fitBounds(points, { padding: [36, 36], maxZoom: 14 })
      } else {
        map.setView([lat, lng], 13)
      }
    }, 80)
    return () => window.clearTimeout(t)
  }, [lat, lng, map, boundsKey])
  return null
}

const colors: Record<string, string> = {
  attraction: '#0f6e6a',
  restaurant: '#c45c26',
  cafe: '#c45c26',
  hotel: '#1d4ed8',
  shopping: '#7c3aed',
  emergency: '#dc2626',
  transport: '#ca8a04',
  hidden: '#0f6e6a',
}

export function TripMap({ height = 420 }: { height?: number }) {
  const trip = useAppStore((s) => s.trip)
  const mapDay = useAppStore((s) => s.mapDay)
  const setMapDay = useAppStore((s) => s.setMapDay)
  const filters = useAppStore((s) => s.mapFilters)
  const toggle = useAppStore((s) => s.toggleMapFilter)
  const theme = useAppStore((s) => s.theme)
  const select = useAppStore((s) => s.setSelectedPlace)
  const location = useAppStore((s) => s.location)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const liveRoute = useAppStore((s) => s.liveRoute)
  const followUser = useAppStore((s) => s.followUser)
  const plannerDest = useAppStore((s) => s.planner.destinationId)
  const destId = trip?.destinationId ?? plannerDest
  const liveStarted = useAppStore((s) => s.liveStarted)
  const origin = liveStarted ? activeOrigin(location, destId) : areaOrigin(destId)

  const day = trip?.daysPlan[mapDay]
  const itineraryPts = (day?.activities ?? [])
    .map((a) => a.placeId)
    .filter((id): id is string => Boolean(id))
    .map((id) => getPlace(id) ?? nearbyPlaces.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => [p.lat, p.lng] as [number, number])

  const catalog = destId
    ? PLACES.filter(
        (p) => p.destinationId === destId && filters.includes(p.category) && haversineKm(origin, p) < 16,
      )
    : []
  const live = nearbyPlaces.filter((p) => filters.includes(p.category))
  const seen = new Set<string>()
  const markers = [...live, ...catalog].filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })

  const nextId = day?.activities.find((a) => a.kind === 'place')?.placeId
  const road = liveRoute?.geometry?.length ? liveRoute.geometry : itineraryPts

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-ink-800">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <Button size="sm" variant={mapDay === 0 ? 'primary' : 'secondary'} onClick={() => setMapDay(0)}>
          Today
        </Button>
        {trip?.daysPlan.map((d) => (
          <Button
            key={d.index}
            size="sm"
            variant={mapDay === d.index ? 'primary' : 'secondary'}
            onClick={() => setMapDay(d.index)}
          >
            Day {d.index + 1}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {(['attraction', 'restaurant', 'hotel', 'shopping', 'emergency'] as const).map((f) => (
          <button
            key={f}
            onClick={() => toggle(f)}
            className={cn(
              'rounded-full px-3 py-1 text-[11px] capitalize',
              filters.includes(f) ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8',
            )}
          >
            {f === 'attraction' ? 'Attractions' : f === 'restaurant' ? 'Food' : f === 'hotel' ? 'Hotels' : f === 'shopping' ? 'Shopping' : 'Emergency'}
          </button>
        ))}
      </div>
      <div style={{ height }} className="relative">
        <MapContainer
          key={`${destId ?? 'map'}-${origin.lat.toFixed(3)}-${origin.lng.toFixed(3)}`}
          center={[origin.lat, origin.lng]}
          zoom={13}
          className="map-tiles h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution={mapsService.attribution}
            url={theme === 'dark' ? mapsService.darkTiles : mapsService.lightTiles}
          />
          <FitCity lat={origin.lat} lng={origin.lng} points={itineraryPts} />
          <Recenter lat={origin.lat} lng={origin.lng} enabled={followUser} />
          <Marker position={[origin.lat, origin.lng]} icon={pin('#22c55e', true)}>
            <Popup>
              You’re here — {origin.label}
              {origin.source === 'gps' && origin.accuracy != null ? ` (±${Math.round(origin.accuracy)}m)` : ''}
            </Popup>
          </Marker>
          {markers.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={pin(p.id === nextId ? '#16a34a' : colors[p.category] ?? '#0f6e6a')}
              eventHandlers={{ click: () => select(p.id) }}
            >
              <Popup>
                <button className="text-left" onClick={() => select(p.id)}>
                  <strong>{p.name}</strong>
                  <br />
                  {p.ratingKnown === false
                    ? 'Not available from OSM'
                    : `⭐ ${p.rating}`}
                </button>
              </Popup>
            </Marker>
          ))}
          {road.length > 1 && (
            <Polyline
              positions={road}
              pathOptions={{ color: liveRoute?.source === 'osrm' ? '#0f6e6a' : '#94a3b8', weight: 4, opacity: 0.9 }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  )
}
