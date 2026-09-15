import { CITIES } from './guides.mjs'
import { geocode } from './liveApis.mjs'

const OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const PHOTON = 'https://photon.komoot.io/api/'

function priceBand(stars) {
  const s = Number(stars)
  if (s >= 5) return { low: 16000, high: 42000, stars: 5, label: 'Estimate · 5★ nightly, not a live rate' }
  if (s >= 4) return { low: 7500, high: 18000, stars: 4, label: 'Estimate · 4★ nightly, not a live rate' }
  if (s >= 3) return { low: 3200, high: 8500, stars: 3, label: 'Estimate · 3★ nightly, not a live rate' }
  if (s >= 2) return { low: 1600, high: 4200, stars: 2, label: 'Estimate · 2★ nightly, not a live rate' }
  return { low: 2200, high: 7800, stars: s || null, label: 'Estimate · midscale nightly, not a live rate' }
}

function starsFromTags(tags) {
  const raw = tags.stars || tags['stars:hotel'] || tags.rating
  const n = Number(String(raw || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

async function overpassHotels(lat, lng, radiusM) {
  const queries = [
    `
[out:json][timeout:12];
(
  node["tourism"="hotel"](around:${radiusM},${lat},${lng});
  node["tourism"="guest_house"](around:${radiusM},${lat},${lng});
  node["tourism"="hostel"](around:${radiusM},${lat},${lng});
);
out 50;
`,
    `
[out:json][timeout:18];
(
  nwr["tourism"="hotel"](around:${radiusM},${lat},${lng});
  nwr["tourism"="guest_house"](around:${radiusM},${lat},${lng});
  nwr["tourism"="hostel"](around:${radiusM},${lat},${lng});
);
out center 60;
`,
  ]
  for (const q of queries) {
    for (const url of OVERPASS) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 16000)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: `data=${encodeURIComponent(q)}`,
          signal: ctrl.signal,
        })
        clearTimeout(t)
        if (!res.ok) continue
        const data = await res.json()
        if (data.elements?.length) return data.elements
      } catch {
        /* next mirror / query */
      }
    }
  }
  return []
}

function lodgingName(name) {
  if (!name || /^(hotel|guest house|hostel)$/i.test(name)) return false
  if (/tiffin|sweets|dhaba|mess\b|biryani|idli/i.test(name)) return false
  return true
}

const STREET_LIKE = /\b(lane|street|road|nagar|colony|layout|sector|block|avenue|marg)\b/i

function isStreetName(name) {
  return STREET_LIKE.test(String(name || ''))
}

function cityishQuery(name) {
  return String(name || '')
    .replace(STREET_LIKE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function photonHotels(city, lat, lng) {
  const bbox = `${lng - 0.12},${lat - 0.12},${lng + 0.12},${lat + 0.12}`
  const queries = [`hotel ${city}`, `hotel ${city} India`]
  const batches = await Promise.all(
    queries.map(async (q) => {
      try {
        const res = await fetch(
          `${PHOTON}?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&bbox=${encodeURIComponent(bbox)}&limit=20`,
        )
        if (!res.ok) return []
        const data = await res.json()
        return data.features || []
      } catch {
        return []
      }
    }),
  )
  const lodging = new Set(['hotel', 'guest_house', 'hostel', 'motel'])
  const food = new Set(['restaurant', 'cafe', 'fast_food', 'food_court'])
  const out = []
  for (const f of batches.flat()) {
    const p = f.properties || {}
    const name = String(p.name || '').trim()
    const [lng2, lat2] = f.geometry?.coordinates || []
    if (!lodgingName(name) || lat2 == null || lng2 == null) continue
    const value = String(p.osm_value || '').toLowerCase()
    const key = String(p.osm_key || '').toLowerCase()
    if (food.has(value)) continue
    if (!lodging.has(value) && key !== 'tourism' && value !== 'hotel') continue
    out.push({
      id: `photon_${p.osm_type || 'n'}_${p.osm_id}`,
      name,
      address: [p.street, p.locality || p.city].filter(Boolean).join(', '),
      area: p.locality || p.district || p.city || city,
      lat: lat2,
      lng: lng2,
      phone: null,
      website: null,
      rating: null,
      reviewCount: 0,
      stars: null,
      photo: null,
      source: 'photon',
      price: priceBand(null),
    })
  }
  return out
}

async function googleLodging(lat, lng) {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!key) return []
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=9000&type=lodging&key=${key}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    return (data.results || []).map((r) => ({
      id: `g_${r.place_id}`,
      name: r.name,
      address: r.vicinity || '',
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      rating: typeof r.rating === 'number' ? r.rating : null,
      reviewCount: r.user_ratings_total ?? 0,
      photo: r.photos?.[0]?.photo_reference
        ? `/api/places-photo?ref=${encodeURIComponent(r.photos[0].photo_reference)}`
        : null,
      phone: null,
      website: null,
      source: 'google',
      stars: r.rating >= 4.6 ? 5 : r.rating >= 4.1 ? 4 : r.rating >= 3.5 ? 3 : null,
    }))
  } catch {
    return []
  }
}

function fromOsm(el, destId) {
  const tags = el.tags || {}
  const name = tags.name?.trim()
  if (!lodgingName(name)) return null
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) return null
  const stars = starsFromTags(tags)
  return {
    id: `osm_hotel_${el.type}_${el.id}`,
    destinationId: destId,
    name,
    address: [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'] || tags['addr:city']].filter(Boolean).join(', '),
    area: tags['addr:suburb'] || tags['addr:district'] || tags['addr:city'] || '',
    lat,
    lng,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    rating: null,
    reviewCount: 0,
    stars,
    photo: null,
    source: 'osm',
    price: priceBand(stars),
  }
}

function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

async function resolveCity(cityId, hint = {}) {
  if (CITIES[cityId]) return { ...CITIES[cityId], id: cityId }
  let name = String(hint.name || '').trim() || String(cityId)
  let lat = hint.lat != null && Number.isFinite(Number(hint.lat)) ? Number(hint.lat) : null
  let lng = hint.lng != null && Number.isFinite(Number(hint.lng)) ? Number(hint.lng) : null
  const parent = String(hint.city || '').trim()
  if (isStreetName(name)) {
    const q = !isStreetName(parent) && parent ? parent : `${cityishQuery(name) || name} India`
    try {
      const hits = await geocode(q)
      const india = hits.find((h) => /india/i.test(h.country || '') && !isStreetName(h.name)) || hits.find((h) => !isStreetName(h.name))
      if (india) {
        name = india.name
        lat = india.lat
        lng = india.lng
      } else if (parent && !isStreetName(parent)) {
        name = parent
      }
    } catch {
      if (parent && !isStreetName(parent)) name = parent
    }
  }
  if (lat != null && lng != null) {
    return { name, lat, lng, id: cityId }
  }
  const m = /^geo_(-?\d+\.?\d*)_(-?\d+\.?\d*)/.exec(String(cityId))
  if (m) return { name: isStreetName(name) && parent && !isStreetName(parent) ? parent : name || 'Selected location', lat: Number(m[1]), lng: Number(m[2]), id: cityId }
  return null
}

export async function listHotels(cityId, offset = 0, limit = 20, hint = {}) {
  const city = await resolveCity(cityId, hint)
  if (!city) {
    return { city: cityId, cityId, total: 0, hotels: [], source: 'none' }
  }
  const id = cityId
  const [osmEls, google, photon] = await Promise.all([
    overpassHotels(city.lat, city.lng, 8000),
    googleLodging(city.lat, city.lng),
    isStreetName(city.name) ? Promise.resolve([]) : photonHotels(city.name, city.lat, city.lng),
  ])
  const osm = osmEls.map((el) => fromOsm(el, id)).filter(Boolean)
  const seen = new Set()
  const merged = []
  for (const h of [...google, ...osm, ...photon]) {
    const key = h.name.trim().toLowerCase()
    if (seen.has(key) || h.lat == null) continue
    const origin = { lat: city.lat, lng: city.lng }
    const distanceKm = Number(haversineKm(origin, h).toFixed(2))
    if (distanceKm > 12) continue
    seen.add(key)
    merged.push({
      ...h,
      destinationId: id,
      area: h.area || h.address || city.name,
      distanceKm,
      price: h.price || priceBand(h.stars),
      rating: h.rating,
      reviewCount: h.reviewCount ?? 0,
    })
  }
  merged.sort((a, b) => a.distanceKm - b.distanceKm)
  return {
    city: city.name,
    cityId: id,
    total: merged.length,
    hotels: merged.slice(offset, offset + limit),
    source: google.length ? 'google+osm+photon' : osm.length ? 'osm+photon' : 'photon',
  }
}
