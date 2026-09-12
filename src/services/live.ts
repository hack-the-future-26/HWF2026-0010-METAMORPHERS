import { DESTINATIONS, getDestination, registerDestination } from '@/data/destinations'
import { PLACES, registerPlaces } from '@/data/places'
import type { Destination, LatLng, Place, PlaceCategory, NearbyKind, TravelStyle, RoutePath, WeatherSnapshot } from '@/types'
import { haversineKm, travelMinutes } from '@/lib/utils'
import { satellitePhoto } from '@/lib/media'
import { cacheGet, cacheSet } from '@/lib/cache'
import { OSM_UNAVAILABLE, WEATHER_UNAVAILABLE } from '@/lib/osmCopy'
import { API } from './config'

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController()
  const timer = globalThis.setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { ...init, signal: init?.signal ?? ctrl.signal })
    if (!res.ok) throw new Error(`Request failed ${res.status}`)
    return (await res.json()) as T
  } finally {
    globalThis.clearTimeout(timer)
  }
}

const NOMINATIM = API.nominatimUrl || API.geocodingUrl || 'https://nominatim.openstreetmap.org'
const OVERPASS = API.overpassUrl || API.placesUrl || 'https://overpass-api.de/api/interpreter'
const OVERPASS_MIRRORS = [
  ...new Set(
    [
      'https://overpass.kumi.systems/api/interpreter',
      OVERPASS,
      'https://overpass-api.de/api/interpreter',
    ].filter(Boolean),
  ),
]
const PHOTON = (API.photonUrl || 'https://photon.komoot.io/api/').replace(/\/?$/, '/')
const OSRM = API.osrmUrl || API.routingUrl || 'https://router.project-osrm.org'

async function overpassElements(query: string): Promise<{ elements: OsmEl[]; ok: boolean }> {
  for (const url of OVERPASS_MIRRORS) {
    try {
      const ctrl = new AbortController()
      const timer = globalThis.setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
      })
      globalThis.clearTimeout(timer)
      if (!res.ok) continue
      const data = (await res.json()) as { elements?: OsmEl[]; remark?: string }
      const elements = data.elements ?? []
      if (!elements.length) continue
      return { elements, ok: true }
    } catch {
      /* try next mirror */
    }
  }
  return { elements: [], ok: false }
}

let lastNominatim = 0
async function nominatim<T>(path: string): Promise<T> {
  const wait = 1100 - (Date.now() - lastNominatim)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastNominatim = Date.now()
  return getJson<T>(`${NOMINATIM}${path}`, {
    headers: { Accept: 'application/json' },
  })
}

function toDestination(input: {
  lat: number
  lng: number
  name: string
  city: string
  state: string
  country: string
  displayName: string
  index: number
}): Destination {
  const country = input.country
  const tz = /india/i.test(country) ? 'Asia/Kolkata' : 'UTC'
  return {
    id: `geo_${input.lat.toFixed(5)}_${input.lng.toFixed(5)}_${input.index}`,
    name: input.name,
    state: input.state,
    country,
    tagline: input.displayName,
    image: DESTINATIONS[0].image,
    lat: input.lat,
    lng: input.lng,
    timezone: tz,
  }
}

function inIndia(lat: number, lng: number) {
  return lat >= 6.4 && lat <= 37.2 && lng >= 68 && lng <= 97.5
}

async function photonGeocode(q: string): Promise<Destination[]> {
  try {
    const data = await getJson<{
      features?: {
        geometry?: { coordinates?: [number, number] }
        properties?: {
          name?: string
          city?: string
          state?: string
          country?: string
          osm_value?: string
        }
      }[]
    }>(`${PHOTON}?q=${encodeURIComponent(q)}&limit=8&bbox=68.1,6.5,97.4,37.1`)
    const out: Destination[] = []
    for (const [i, f] of (data.features ?? []).entries()) {
      const [lng, lat] = f.geometry?.coordinates ?? []
      const name = f.properties?.name?.trim()
      if (lat == null || lng == null || !name) continue
      if (!inIndia(lat, lng)) continue
      const city = f.properties?.city || name
      const state = f.properties?.state || ''
      const country = f.properties?.country || 'India'
      if (country && !/india/i.test(country)) continue
      const display = [name, city, state, country].filter(Boolean).join(', ')
      out.push(toDestination({ lat, lng, name, city, state, country, displayName: display, index: i }))
    }
    return out
  } catch {
    return []
  }
}

function codeToCondition(code: number): WeatherSnapshot['condition'] {
  if (code >= 95) return 'storm'
  if (code >= 80) return 'heavy-rain'
  if (code >= 61) return 'rain'
  if (code >= 45) return 'cloudy'
  if (code >= 2) return 'partly-cloudy'
  return 'clear'
}

function weatherSummary(condition: WeatherSnapshot['condition'], tempC: number): string {
  const sky =
    condition === 'clear'
      ? 'Clear'
      : condition === 'partly-cloudy'
        ? 'Partly cloudy'
        : condition === 'cloudy'
          ? 'Cloudy'
          : condition === 'rain'
            ? 'Rainy'
            : condition === 'heavy-rain'
              ? 'Heavy rain'
              : 'Stormy'
  return `${sky} · ${tempC}°C`
}

const UNAVAILABLE_WEATHER: WeatherSnapshot = {
  tempC: 0,
  apparentTempC: undefined,
  condition: 'partly-cloudy',
  rainProbability: 0,
  precipitationMm: 0,
  humidity: 0,
  windKph: 0,
  sunset: '',
  summary: WEATHER_UNAVAILABLE,
  fetchedAt: undefined,
  stale: true,
  unavailable: true,
}

export const weatherService = {
  async getCurrent(coords: LatLng): Promise<WeatherSnapshot> {
    const key = `wx:${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`
    const cached = cacheGet<WeatherSnapshot>(key, 12 * 60 * 1000)
    if (cached) return { ...cached, stale: false }
    const stale = cacheGet<WeatherSnapshot>(key, 24 * 60 * 60 * 1000)
    try {
      const url = `${API.weatherUrl}?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability&daily=sunset&forecast_hours=12&timezone=auto`
      const data = await getJson<{
        current: {
          temperature_2m: number
          apparent_temperature?: number
          relative_humidity_2m: number
          precipitation?: number
          precipitation_probability?: number
          weather_code: number
          wind_speed_10m: number
        }
        hourly?: { time: string[]; temperature_2m: number[]; precipitation_probability: number[] }
        daily: { sunset: string[] }
      }>(url)
      const condition = codeToCondition(data.current.weather_code)
      const sunsetRaw = data.daily.sunset?.[0]
      const sunset = sunsetRaw ? sunsetRaw.slice(11, 16) : ''
      const hourly = data.hourly
        ? data.hourly.time.slice(0, 8).map((time, i) => ({
            time,
            tempC: Math.round(data.hourly!.temperature_2m[i] ?? 0),
            rainProbability: data.hourly!.precipitation_probability[i] ?? 0,
          }))
        : []
      const tempC = Math.round(data.current.temperature_2m)
      const snap: WeatherSnapshot = {
        tempC,
        apparentTempC: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m),
        condition,
        rainProbability: data.current.precipitation_probability ?? hourly[0]?.rainProbability ?? 0,
        precipitationMm: data.current.precipitation ?? 0,
        humidity: data.current.relative_humidity_2m,
        windKph: Math.round(data.current.wind_speed_10m),
        sunset,
        summary: weatherSummary(condition, tempC),
        fetchedAt: new Date().toISOString(),
        stale: false,
        unavailable: false,
        weatherCode: data.current.weather_code,
        hourly,
      }
      cacheSet(key, snap)
      return snap
    } catch {
      if (stale && !stale.unavailable) return { ...stale, stale: true }
      return { ...UNAVAILABLE_WEATHER }
    }
  },
}

export const mapsService = {
  lightTiles: API.mapsTileUrl || 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  darkTiles: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  tileUrl() {
    return API.mapsTileUrl || this.lightTiles
  },
}

export const geocodingService = {
  async reverse(coords: LatLng): Promise<string> {
    const key = `rev:${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`
    const cached = cacheGet<string>(key, 30 * 60 * 1000)
    if (cached) return cached
    try {
      const data = await nominatim<{
        display_name?: string
        address?: { suburb?: string; neighbourhood?: string; city?: string; town?: string; village?: string; state?: string }
      }>(`/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`)
      const a = data.address
      const label =
        [a?.neighbourhood || a?.suburb, a?.city || a?.town || a?.village, a?.state].filter(Boolean).join(', ') ||
        data.display_name?.split(',').slice(0, 3).join(',') ||
        `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
      cacheSet(key, label)
      return label
    } catch {
      return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
    }
  },

  async reverseAddress(coords: LatLng): Promise<string> {
    const key = `revaddr:${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`
    const cached = cacheGet<string>(key, 30 * 60 * 1000)
    if (cached) return cached
    try {
      const data = await nominatim<{ display_name?: string }>(
        `/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&zoom=18&addressdetails=1`,
      )
      const full = data.display_name || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
      cacheSet(key, full)
      return full
    } catch {
      return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
    }
  },

  async search(query: string): Promise<Destination[]> {
    const q = query.trim()
    if (!q) return []
    const key = `geo:v2:${q.toLowerCase()}`
    const cached = cacheGet<Destination[]>(key, 60 * 60 * 1000)
    if (cached?.length) return cached

    const fromPhoton = await photonGeocode(q)
    if (fromPhoton.length) {
      fromPhoton.forEach(registerDestination)
      cacheSet(key, fromPhoton)
      return fromPhoton
    }

    try {
      const data = await nominatim<
        {
          display_name: string
          lat: string
          lon: string
          name?: string
          address?: {
            city?: string
            town?: string
            village?: string
            state?: string
            country?: string
          }
        }[]
      >(`/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=in`)
      if (data?.length) {
        const results = data
          .filter((r) => inIndia(Number(r.lat), Number(r.lon)))
          .map((r, i) =>
          toDestination({
            lat: Number(r.lat),
            lng: Number(r.lon),
            name: r.name || r.display_name.split(',')[0],
            city: r.address?.city || r.address?.town || r.address?.village || r.name || r.display_name.split(',')[0],
            state: r.address?.state || '',
            country: r.address?.country || '',
            displayName: r.display_name,
            index: i,
          }),
        )
        results.forEach(registerDestination)
        cacheSet(key, results)
        return results
      }
    } catch {
      /* user-facing empty — never inject catalog coords */
    }
    return []
  },
}

type OsmEl = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function osmCoords(el: OsmEl): LatLng | null {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lng: el.lon }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon }
  return null
}

function classify(tags: Record<string, string>): { category: PlaceCategory; nearbyKind?: NearbyKind; styles: TravelStyle[]; indoor: boolean; weatherSensitive: boolean } {
  const amenity = tags.amenity
  const tourism = tags.tourism
  const leisure = tags.leisure
  const natural = tags.natural
  const shop = tags.shop
  if (amenity === 'hospital' || amenity === 'clinic') return { category: 'emergency', nearbyKind: 'hospital', styles: [], indoor: true, weatherSensitive: false }
  if (amenity === 'pharmacy') return { category: 'emergency', nearbyKind: 'pharmacy', styles: [], indoor: true, weatherSensitive: false }
  if (amenity === 'atm' || amenity === 'bank') return { category: 'emergency', nearbyKind: 'atm', styles: [], indoor: true, weatherSensitive: false }
  if (amenity === 'toilets') return { category: 'emergency', nearbyKind: 'restroom', styles: [], indoor: true, weatherSensitive: false }
  if (amenity === 'fuel') return { category: 'transport', nearbyKind: 'fuel', styles: [], indoor: false, weatherSensitive: false }
  if (amenity === 'bus_station' || tags.aeroway === 'aerodrome' || tags.railway === 'station' || tags.public_transport === 'station') {
    return { category: 'transport', styles: [], indoor: true, weatherSensitive: false }
  }
  if (amenity === 'cafe') return { category: 'cafe', nearbyKind: 'cafe', styles: ['food', 'relaxation'], indoor: true, weatherSensitive: false }
  if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'food_court') {
    return { category: 'restaurant', nearbyKind: 'restaurant', styles: ['food'], indoor: true, weatherSensitive: false }
  }
  if (shop) return { category: 'shopping', nearbyKind: 'shopping', styles: ['shopping'], indoor: true, weatherSensitive: false }
  if (tourism === 'hotel' || tourism === 'guest_house' || tourism === 'hostel') {
    return { category: 'hotel', styles: ['relaxation'], indoor: true, weatherSensitive: false }
  }
  if (natural === 'beach' || leisure === 'beach_resort' || tags.place === 'beach') {
    return { category: 'attraction', styles: ['beaches', 'nature', 'photography'], indoor: false, weatherSensitive: true }
  }
  if (leisure === 'park' || leisure === 'garden' || leisure === 'nature_reserve') {
    return { category: 'attraction', styles: ['nature', 'relaxation'], indoor: false, weatherSensitive: true }
  }
  if (tourism === 'museum' || tourism === 'gallery') {
    return { category: 'attraction', styles: ['history', 'culture'], indoor: true, weatherSensitive: false }
  }
  if (tourism === 'theme_park') {
    return { category: 'attraction', styles: ['adventure', 'photography'], indoor: false, weatherSensitive: true }
  }
  if (tourism === 'artwork') {
    return { category: 'attraction', styles: ['culture', 'photography'], indoor: false, weatherSensitive: true }
  }
  if (amenity === 'place_of_worship' || tags.building === 'temple' || tags.building === 'church' || tags.building === 'mosque') {
    return { category: 'attraction', styles: ['culture', 'history'], indoor: true, weatherSensitive: false }
  }
  if (tags.historic) {
    return { category: 'attraction', styles: ['history', 'culture'], indoor: tourism === 'museum', weatherSensitive: tourism !== 'museum' }
  }
  if (natural && natural !== 'beach') {
    return { category: 'attraction', styles: ['nature', 'photography'], indoor: false, weatherSensitive: true }
  }
  if (tourism === 'attraction' || tourism === 'viewpoint') {
    return { category: 'attraction', styles: ['photography', 'nature'], indoor: false, weatherSensitive: true }
  }
  return { category: 'attraction', styles: ['culture'], indoor: false, weatherSensitive: true }
}

function parseHours(raw?: string): { openingHours: string; opensAt: number; closesAt: number; hoursKnown: boolean } {
  if (!raw) return { openingHours: OSM_UNAVAILABLE, opensAt: 0, closesAt: 24, hoursKnown: false }
  const m = raw.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
  if (m) {
    const opensAt = Number(m[1]) + Number(m[2]) / 60
    const closesAt = Number(m[3]) + Number(m[4]) / 60
    return { openingHours: raw, opensAt, closesAt, hoursKnown: true }
  }
  return { openingHours: raw, opensAt: 0, closesAt: 24, hoursKnown: true }
}

function toPlace(el: OsmEl, origin: LatLng, destId: string): Place | null {
  const coords = osmCoords(el)
  const tags = el.tags ?? {}
  const name = tags.name || tags['name:en']
  if (!coords || !name) return null
  const meta = classify(tags)
  const hours = parseHours(tags.opening_hours)
  const id = `osm_${el.type}_${el.id}`
  const addr = [tags['addr:housename'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ')
  const commons = tags.wikimedia_commons?.replace(/^File:/i, '')
  const image = commons
    ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(commons)}?width=800`
    : satellitePhoto(coords.lat, coords.lng)
  return {
    id,
    destinationId: destId,
    name,
    category: meta.category,
    nearbyKind: meta.nearbyKind,
    styles: meta.styles,
    description: tags.description || tags.wikipedia || `${name} (OpenStreetMap)`,
    rating: 0,
    reviewCount: 0,
    image,
    images: image ? [image] : [],
    lat: coords.lat,
    lng: coords.lng,
    address: addr || OSM_UNAVAILABLE,
    openingHours: hours.openingHours,
    opensAt: hours.opensAt,
    closesAt: hours.closesAt,
    entryFee: 0,
    bestTime: hours.hoursKnown ? hours.openingHours : OSM_UNAVAILABLE,
    crowd: 'moderate',
    crowdNote: '',
    durationMin: meta.category === 'attraction' ? 75 : 40,
    estimatedCost: 0,
    indoor: meta.indoor,
    weatherSensitive: meta.weatherSensitive,
    tags: [tags.amenity, tags.tourism, tags.leisure, tags.shop, tags.public_transport, tags.aeroway]
      .filter(Boolean)
      .slice(0, 8),
    source: 'osm',
    website: tags.website || tags['contact:website'],
    phone: tags.phone || tags['contact:phone'],
    ratingKnown: false,
    hoursKnown: hours.hoursKnown,
    priceKnown: false,
    crowdKnown: false,
    imageKnown: Boolean(image),
  }
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    osm_id: number
    osm_type?: string
    osm_key?: string
    osm_value?: string
    name?: string
    street?: string
    city?: string
  }
}

const PHOTON_QUERIES = [
  'attraction',
  'museum',
  'gallery',
  'viewpoint',
  'temple',
  'park',
  'monument',
  'artwork',
  'theme park',
  'restaurant',
  'cafe',
  'fast food',
  'hospital',
  'pharmacy',
  'atm',
  'fuel',
  'hotel',
] as const

async function photonNearby(coords: LatLng, radiusM: number, destId: string): Promise<Place[]> {
  const dest = getDestination(destId)
  const city = dest.name && dest.name !== destId ? dest.name : ''
  const degLat = Math.max(0.08, radiusM / 111_000)
  const degLng = Math.max(0.08, radiusM / (111_000 * Math.max(0.2, Math.cos((coords.lat * Math.PI) / 180))))
  const bbox = `${coords.lng - degLng},${coords.lat - degLat},${coords.lng + degLng},${coords.lat + degLat}`
  const batches = await Promise.all(
    PHOTON_QUERIES.map(async (q) => {
      try {
        const query = city ? `${q} ${city}` : q
        const data = await getJson<{ features?: PhotonFeature[] }>(
          `${PHOTON}?q=${encodeURIComponent(query)}&lat=${coords.lat}&lon=${coords.lng}&bbox=${encodeURIComponent(bbox)}&limit=10`,
        )
        return data.features ?? []
      } catch {
        return [] as PhotonFeature[]
      }
    }),
  )
  const seen = new Set<string>()
  const places: Place[] = []
  for (const f of batches.flat()) {
    const name = f.properties.name?.trim()
    const [lng, lat] = f.geometry?.coordinates ?? []
    if (!name || lat == null || lng == null) continue
    if (/^(park|atm|cafe|restaurant|hospital|hotel|pharmacy|fuel|supermarket|museum|beach|toilets)$/i.test(name)) continue
    if (haversineKm(coords, { lat, lng }) > radiusM / 1000 + 0.05) continue
    const osmType = f.properties.osm_type === 'W' ? 'way' : f.properties.osm_type === 'R' ? 'relation' : 'node'
    const key = f.properties.osm_key || 'amenity'
    const value = f.properties.osm_value || ''
    const el: OsmEl = {
      type: osmType,
      id: f.properties.osm_id,
      lat,
      lon: lng,
      tags: {
        name,
        [key]: value,
        'addr:street': f.properties.street || '',
        'addr:city': f.properties.city || '',
      },
    }
    const p = toPlace(el, coords, destId)
    if (!p || seen.has(p.name.toLowerCase())) continue
    seen.add(p.name.toLowerCase())
    places.push(p)
  }
  return places
}

export const placesService = {
  async list(destinationId: string, allowCatalog = false): Promise<Place[]> {
    if (API.placesUrl && !API.placesUrl.includes('overpass')) {
      try {
        return await getJson<Place[]>(`${API.placesUrl}?destination=${destinationId}`)
      } catch {
        /* fall through */
      }
    }
    if (allowCatalog) return PLACES.filter((p) => p.destinationId === destinationId)
    return []
  },

  get(id: string) {
    return PLACES.find((p) => p.id === id)
  },

  async nearby(
    coords: LatLng,
    radiusM = 5000,
    destId = 'live',
    opts?: { allowCatalog?: boolean },
  ): Promise<Place[]> {
    const allowCatalog = Boolean(opts?.allowCatalog)
    const mergeCatalog = (list: Place[]) => {
      if (!allowCatalog) return list
      const seen = new Set(list.map((p) => p.name.toLowerCase()))
      const extra = PLACES.filter((p) => haversineKm(coords, p) <= radiusM / 1000 + 0.2)
      for (const p of extra) {
        if (seen.has(p.name.toLowerCase())) continue
        seen.add(p.name.toLowerCase())
        list.push(p)
      }
      return list
    }
    const key = `near:v6:${destId}:${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}:${radiusM}`
    const cached = cacheGet<Place[]>(key, 4 * 60 * 1000)
    if (cached?.some((p) => p.source === 'osm')) {
      const list = mergeCatalog([...cached])
      list.sort((a, b) => haversineKm(coords, a) - haversineKm(coords, b))
      registerPlaces(list)
      return list
    }
    const photon = await photonNearby(coords, radiusM, destId)
    let overpassPlaces: Place[] = []
    const around = `(around:${radiusM},${coords.lat},${coords.lng})`
    const q = `
[out:json][timeout:20];
(
  nwr["tourism"~"attraction|museum|gallery|viewpoint|theme_park|artwork"]${around};
  nwr["historic"]${around};
  nwr["leisure"~"park|garden"]${around};
  nwr["amenity"="place_of_worship"]${around};
  nwr["natural"]${around};
  nwr["amenity"~"restaurant|cafe|fast_food|food_court"]${around};
  nwr["tourism"~"hotel|guest_house|hostel"]${around};
  nwr["amenity"="bus_station"]${around};
  nwr["aeroway"="aerodrome"]${around};
  nwr["railway"="station"]${around};
);
out center 80;
`
    const { elements } = await overpassElements(q)
    const seen = new Set(photon.map((p) => p.name.toLowerCase()))
    for (const el of elements) {
      const p = toPlace(el, coords, destId)
      if (!p || seen.has(p.name.toLowerCase())) continue
      seen.add(p.name.toLowerCase())
      overpassPlaces.push(p)
    }
    const osm = [...photon, ...overpassPlaces]
    if (!osm.length) {
      const fallback = allowCatalog
        ? PLACES.filter((p) => haversineKm(coords, p) <= radiusM / 1000 + 0.2).slice(0, 40)
        : []
      registerPlaces(fallback)
      return fallback
    }
    osm.sort((a, b) => haversineKm(coords, a) - haversineKm(coords, b))
    const named = osm.filter(
      (p) => !/^(park|atm|cafe|restaurant|hospital|hotel|pharmacy|fuel|supermarket|museum|beach|toilets)$/i.test(p.name),
    )
    const trimmed = mergeCatalog((named.length ? named : osm).slice(0, 80))
    trimmed.sort((a, b) => haversineKm(coords, a) - haversineKm(coords, b))
    registerPlaces(trimmed)
    cacheSet(key, trimmed.filter((p) => p.source === 'osm'))
    return trimmed
  },
}

function osrmProfile(mode: string) {
  if (mode === 'walking') return 'foot'
  if (mode === 'cycling') return 'bike'
  return 'driving'
}

export const routingService = {
  async between(a: LatLng, b: LatLng, mode = 'taxi'): Promise<RoutePath> {
    const key = `rt:${mode}:${a.lat.toFixed(4)},${a.lng.toFixed(4)}:${b.lat.toFixed(4)},${b.lng.toFixed(4)}`
    const cached = cacheGet<RoutePath>(key, 8 * 60 * 1000)
    if (cached) return cached
    const profile = osrmProfile(mode)
    try {
      const url = `${OSRM}/route/v1/${profile}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true`
      const data = await getJson<{
        code: string
        routes?: {
          distance: number
          duration: number
          geometry: { coordinates: [number, number][] }
          legs?: { steps?: { maneuver?: { instruction?: string; type?: string }; distance: number; name?: string }[] }[]
        }[]
      }>(url)
      const route = data.routes?.[0]
      if (!route) throw new Error('no route')
      const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
      const steps =
        route.legs?.[0]?.steps
          ?.map((s) => ({
            instruction: s.maneuver?.instruction || s.name || s.maneuver?.type || 'Continue',
            km: Number((s.distance / 1000).toFixed(2)),
          }))
          .filter((s) => s.instruction) ?? []
      const result: RoutePath = {
        km: Number((route.distance / 1000).toFixed(2)),
        minutes: Math.max(1, Math.round(route.duration / 60)),
        geometry,
        steps,
        source: 'osrm',
        mode,
      }
      cacheSet(key, result)
      return result
    } catch {
      const km = Number((haversineKm(a, b) * 1.25).toFixed(2))
      return {
        km,
        minutes: travelMinutes(km, mode),
        geometry: [
          [a.lat, a.lng],
          [b.lat, b.lng],
        ],
        steps: [],
        source: 'haversine',
        mode,
      }
    }
  },
}

export const eventsService = {
  async happening(_destinationId: string) {
    if (API.eventsUrl) {
      try {
        return await getJson<{ title: string; time: string }[]>(API.eventsUrl)
      } catch {
        /* none */
      }
    }
    return [] as { title: string; time: string }[]
  },
}

export const crowdService = {
  async forPlace(place: Place) {
    if (API.crowdUrl) {
      try {
        return await getJson<{ level: Place['crowd']; note: string }>(`${API.crowdUrl}/${place.id}`)
      } catch {
        /* none */
      }
    }
    if (place.crowdKnown === false) {
      return { level: place.crowd, note: 'Live crowd data unavailable', status: 'unavailable' as const }
    }
    return { level: place.crowd, note: place.crowdNote }
  },
}
