import type { LatLng } from '@/types'
import { haversineKm } from '@/lib/utils'

/** Minimum distance from a point to an OSRM polyline (sampled). */
export function minKmToRoute(point: LatLng, geometry: [number, number][]): number {
  if (!geometry.length) return Number.POSITIVE_INFINITY
  const step = Math.max(1, Math.floor(geometry.length / 80))
  let min = Number.POSITIVE_INFINITY
  for (let i = 0; i < geometry.length; i += step) {
    const [lat, lng] = geometry[i]
    min = Math.min(min, haversineKm(point, { lat, lng }))
  }
  const last = geometry[geometry.length - 1]
  min = Math.min(min, haversineKm(point, { lat: last[0], lng: last[1] }))
  return min
}

export const OFF_ROUTE_KM = 0.35
