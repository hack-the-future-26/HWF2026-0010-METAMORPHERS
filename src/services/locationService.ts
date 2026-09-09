import type { GeoFix } from '@/types'
import { haversineKm } from '@/lib/utils'

export type LocationErrorCode = 'denied' | 'unavailable' | 'timeout' | 'unsupported'

export class LocationError extends Error {
  code: LocationErrorCode
  constructor(code: LocationErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

function readFix(pos: GeolocationPosition): GeoFix {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
    heading: pos.coords.heading,
    speed: pos.coords.speed,
    timestamp: pos.timestamp,
  }
}

function mapError(err: GeolocationPositionError): LocationError {
  if (err.code === err.PERMISSION_DENIED) {
    return new LocationError('denied', 'Location permission was denied.')
  }
  if (err.code === err.TIMEOUT) {
    return new LocationError('timeout', 'Location request timed out.')
  }
  return new LocationError('unavailable', 'Location is currently unavailable.')
}

const OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 12000,
  maximumAge: 15000,
}

let watchId: number | null = null
let lastEmitted: GeoFix | null = null

export const locationService = {
  isSupported() {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  },

  getCurrentLocation(): Promise<GeoFix> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new LocationError('unsupported', 'This browser does not support location.'))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fix = readFix(pos)
          lastEmitted = fix
          resolve(fix)
        },
        (err) => reject(mapError(err)),
        OPTIONS,
      )
    })
  },

  watchLocation(onFix: (fix: GeoFix) => void, onError?: (err: LocationError) => void) {
    if (!this.isSupported()) {
      onError?.(new LocationError('unsupported', 'This browser does not support location.'))
      return () => undefined
    }
    this.stopWatchingLocation()
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = readFix(pos)
        if (lastEmitted && haversineKm(lastEmitted, fix) < 0.02 && fix.timestamp - lastEmitted.timestamp < 4000) {
          return
        }
        lastEmitted = fix
        onFix(fix)
      },
      (err) => onError?.(mapError(err)),
      OPTIONS,
    )
    return () => this.stopWatchingLocation()
  },

  stopWatchingLocation() {
    if (watchId != null && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId)
    }
    watchId = null
  },
}
