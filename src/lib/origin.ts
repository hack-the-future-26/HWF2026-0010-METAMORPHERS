import { PLACES } from '@/data/places'
import { getDestination } from '@/data/destinations'
import type { LocationState, Place } from '@/types'
import { haversineKm } from '@/lib/utils'

/** Neutral map center — never treated as the user's GPS or a destination. */
const UNLOCATED = { lat: 20.5937, lng: 78.9629, label: 'Choose a destination to begin' }

export function activeOrigin(
  location: LocationState,
  destinationId?: string | null,
): { lat: number; lng: number; label: string; source: 'gps' | 'destination' | 'fallback'; accuracy: number | null } {
  if (location.fix && location.permission === 'granted') {
    return {
      lat: location.fix.lat,
      lng: location.fix.lng,
      label: location.label || 'You are here',
      source: 'gps',
      accuracy: location.fix.accuracy,
    }
  }
  if (destinationId) {
    const d = getDestination(destinationId)
    if (d.lat !== 0 || d.lng !== 0) {
      return { lat: d.lat, lng: d.lng, label: d.name, source: 'destination', accuracy: null }
    }
  }
  if (location.fix) {
    return {
      lat: location.fix.lat,
      lng: location.fix.lng,
      label: location.label || 'Last known location',
      source: location.permission === 'granted' ? 'gps' : 'fallback',
      accuracy: location.fix.accuracy,
    }
  }
  return { ...UNLOCATED, source: 'fallback', accuracy: null }
}

/** Origin for itinerary generation: destination city unless GPS is already there. */
export function planningOrigin(
  location: LocationState,
  destinationId?: string | null,
): { lat: number; lng: number; label: string; source: 'gps' | 'destination' | 'fallback'; accuracy: number | null } {
  if (destinationId) {
    const d = getDestination(destinationId)
    if (d.lat === 0 && d.lng === 0) return activeOrigin(location, destinationId)
    if (location.fix && location.permission === 'granted' && haversineKm(location.fix, d) < 50) {
      return {
        lat: location.fix.lat,
        lng: location.fix.lng,
        label: location.label || d.name,
        source: 'gps',
        accuracy: location.fix.accuracy,
      }
    }
    return { lat: d.lat, lng: d.lng, label: d.name, source: 'destination', accuracy: null }
  }
  return activeOrigin(location, destinationId)
}

export function queryMatchesDestination(query: string, destinationId?: string | null) {
  if (!destinationId) return false
  const q = query.trim().toLowerCase()
  if (!q) return true
  const d = getDestination(destinationId)
  const blob = `${d.name} ${d.state} ${d.country} ${d.tagline} ${d.id}`.toLowerCase()
  return blob.includes(q) || q.includes(d.name.toLowerCase())
}

export function tripMatchesPlanner(
  trip: { destinationId: string; destinationName?: string } | null | undefined,
  planner: { destinationId: string | null; destinationQuery: string } | null | undefined,
) {
  if (!trip || !planner) return false
  if (planner.destinationId && trip.destinationId !== planner.destinationId) return false
  const q = planner.destinationQuery.trim().toLowerCase()
  if (!q) return Boolean(planner.destinationId && trip.destinationId === planner.destinationId)
  const name = (trip.destinationName || '').toLowerCase()
  if (name && (name.includes(q) || q.includes(name.split(',')[0] || name))) return true
  return queryMatchesDestination(planner.destinationQuery, trip.destinationId)
}

/** Prefer a named nearby attraction over a neighbourhood string. */
export function landmarkLabel(
  origin: { lat: number; lng: number },
  places: Place[],
  reverseLabel: string,
) {
  const hit = places
    .filter((p) => p.category === 'attraction' || p.styles.includes('beaches'))
    .map((p) => ({ p, km: haversineKm(origin, p) }))
    .filter((x) => x.km <= 0.65)
    .sort((a, b) => a.km - b.km)[0]
  if (!hit) return reverseLabel
  return hit.p.name
}

export function localCatalogNear(origin: { lat: number; lng: number }, radiusKm: number) {
  return PLACES.filter((p) => haversineKm(origin, p) <= radiusKm)
}
