/**
 * Backend proxies for Photon, Overpass, Open-Meteo, and OSRM.
 * Keep browser traffic off public OSM endpoints where possible (CORS + rate limits).
 * Cache repeated requests. Debounce belongs on the client; we still cap burst traffic here.
 */

const PHOTON = 'https://photon.komoot.io/api/'
const OVERPASS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]
const OSRM = 'https://router.project-osrm.org'
const WEATHER = 'https://api.open-meteo.com/v1/forecast'

const cache = new Map()
const buckets = new Map()

export function rateLimit(ip, max = 90, windowMs = 60_000) {
  const now = Date.now()
  const hit = buckets.get(ip)
  if (!hit || now - hit.start > windowMs) {
    buckets.set(ip, { start: now, count: 1 })
    return { ok: true, remaining: max - 1 }
  }
  hit.count += 1
  if (hit.count > max) return { ok: false, remaining: 0 }
  return { ok: true, remaining: max - hit.count }
}

function cacheGet(key, ttlMs) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > ttlMs) {
    cache.delete(key)
    return null
  }
  return hit.value
}

function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value })
  if (cache.size > 400) {
    const first = cache.keys().next().value
    cache.delete(first)
  }
}

async function timedJson(url, init = {}, ms = 9000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal })
    if (!res.ok) {
      const err = new Error(`upstream ${res.status}`)
      err.status = res.status
      throw err
    }
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

function codeToCondition(code) {
  if (code >= 95) return 'storm'
  if (code >= 80) return 'heavy-rain'
  if (code >= 61) return 'rain'
  if (code >= 45) return 'cloudy'
  if (code >= 2) return 'partly-cloudy'
  return 'clear'
}

function weatherSummary(condition, tempC) {
  const sky = {
    clear: 'Clear',
    'partly-cloudy': 'Partly cloudy',
    cloudy: 'Cloudy',
    rain: 'Rainy',
    'heavy-rain': 'Heavy rain',
    storm: 'Stormy',
  }[condition]
  return `${sky || 'Mixed'} · ${tempC}°C`
}

export function parseCoords(lat, lon) {
  const latitude = Number(lat)
  const longitude = Number(lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { lat: latitude, lng: longitude }
}

const CITY_LAYERS = 'layer=city&layer=district&layer=locality&layer=county'
const STREET_LIKE = /\b(lane|street|road|nagar|colony|layout|sector|block|avenue|marg)\b/i
const GEO_SPELLINGS = {
  madhurai: 'Madurai',
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  madras: 'Chennai',
  calcutta: 'Kolkata',
  benares: 'Varanasi',
  pondicherry: 'Puducherry',
  visakhapatnam: 'Visakhapatnam',
}

function isStreetLike(name, layer) {
  const n = String(name || '')
  const l = String(layer || '').toLowerCase()
  if (['house', 'street', 'highway'].includes(l)) return true
  return STREET_LIKE.test(n)
}

export async function geocode(q) {
  const raw = String(q || '').trim()
  if (raw.length < 2) {
    const err = new Error('Query too short')
    err.status = 400
    throw err
  }
  const canonical = GEO_SPELLINGS[raw.toLowerCase()] || raw
  const key = `geo:v4:${canonical.toLowerCase()}`
  const cached = cacheGet(key, 30 * 60 * 1000)
  if (cached) return cached

  const queries = canonical === raw ? [canonical, `${canonical} India`] : [canonical, raw, `${canonical} India`]
  const urls = []
  for (const query of queries) {
    urls.push(
      `${PHOTON}?q=${encodeURIComponent(query)}&limit=10&${CITY_LAYERS}&lat=22.5&lon=79&bbox=${encodeURIComponent('68.1,6.5,97.4,35.7')}`,
      `${PHOTON}?q=${encodeURIComponent(query)}&limit=10&${CITY_LAYERS}&lat=22.5&lon=79`,
    )
  }
  let features = []
  for (const url of urls) {
    try {
      const data = await timedJson(url, {}, 8000)
      const next = (data.features || []).filter((f) => {
        const props = f.properties || {}
        const name = String(props.name || '').trim()
        const layer = String(props.type || props.osm_value || '').toLowerCase()
        return Boolean(name) && !isStreetLike(name, layer)
      })
      if (next.length) {
        features = next
        break
      }
    } catch {
      /* next */
    }
  }

  const results = []
  for (const [i, f] of features.entries()) {
    const [lng, lat] = f.geometry?.coordinates || []
    const props = f.properties || {}
    const name = String(props.name || '').trim()
    const layer = String(props.type || props.osm_value || '').toLowerCase()
    if (lat == null || lng == null || !name) continue
    if (isStreetLike(name, layer)) continue
    const city = props.city || props.county || name
    const country = props.country || ''
    const state = props.state || ''
    const displayName = [name, city !== name ? city : '', state, country].filter(Boolean).join(', ')
    const qn = canonical.toLowerCase()
    let score = 0
    if (/india/i.test(country)) score += 50
    if (name.toLowerCase() === qn) score += 40
    if (name.toLowerCase() === raw.toLowerCase()) score += 30
    if (name.toLowerCase().startsWith(qn)) score += 20
    if (['city', 'town', 'administrative'].includes(layer)) score += 15
    results.push({
      id: `geo_${Number(lat).toFixed(5)}_${Number(lng).toFixed(5)}_${i}`,
      name,
      displayName,
      city,
      country,
      state,
      latitude: Number(lat),
      longitude: Number(lng),
      lat: Number(lat),
      lng: Number(lng),
      tagline: displayName,
      timezone: /india/i.test(country) ? 'Asia/Kolkata' : 'UTC',
      score,
    })
  }
  results.sort((a, b) => b.score - a.score)
  const trimmed = results.slice(0, 8).map(({ score: _s, ...row }) => row)
  cacheSet(key, trimmed)
  return trimmed
}

export async function fetchWeather(lat, lng) {
  const coords = parseCoords(lat, lng)
  if (!coords) {
    const err = new Error('lat and lon are required')
    err.status = 400
    throw err
  }
  const key = `wx:${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`
  const cached = cacheGet(key, 10 * 60 * 1000)
  if (cached) return { ...cached, stale: false, cache: 'hit' }

  const url =
    `${WEATHER}?latitude=${coords.lat}&longitude=${coords.lng}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m' +
    '&hourly=temperature_2m,precipitation_probability' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,sunset' +
    '&forecast_hours=24&timezone=auto'
  const data = await timedJson(url)
  const c = data.current || {}
  const condition = codeToCondition(c.weather_code)
  const tempC = Math.round(c.temperature_2m ?? 0)
  const hourly = (data.hourly?.time || []).slice(0, 12).map((time, i) => ({
    time,
    tempC: Math.round(data.hourly.temperature_2m?.[i] ?? 0),
    rainProbability: data.hourly.precipitation_probability?.[i] ?? 0,
  }))
  const daily = (data.daily?.time || []).slice(0, 7).map((date, i) => ({
    date,
    tempMax: Math.round(data.daily.temperature_2m_max?.[i] ?? 0),
    tempMin: Math.round(data.daily.temperature_2m_min?.[i] ?? 0),
    rainProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
    weatherCode: data.daily.weather_code?.[i] ?? 0,
  }))
  const sunsetRaw = data.daily?.sunset?.[0]
  const snap = {
    tempC,
    apparentTempC: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
    condition,
    rainProbability: c.precipitation_probability ?? hourly[0]?.rainProbability ?? 0,
    precipitationMm: c.precipitation ?? 0,
    humidity: c.relative_humidity_2m ?? null,
    windKph: Math.round(c.wind_speed_10m ?? 0),
    sunset: sunsetRaw ? String(sunsetRaw).slice(11, 16) : '',
    summary: weatherSummary(condition, tempC),
    fetchedAt: new Date().toISOString(),
    stale: false,
    unavailable: false,
    weatherCode: c.weather_code,
    hourly,
    daily,
    source: 'Open-Meteo',
    latitude: coords.lat,
    longitude: coords.lng,
  }
  cacheSet(key, snap)
  return snap
}

const CATEGORY_FILTERS = {
  attractions: '["tourism"~"attraction|viewpoint|artwork|theme_park"]',
  museums: '["tourism"~"museum|gallery"]',
  restaurants: '["amenity"~"restaurant|fast_food|food_court"]',
  cafes: '["amenity"="cafe"]',
  parks: '["leisure"~"park|garden|nature_reserve"]',
  shopping: '["shop"]',
  religious: '["amenity"="place_of_worship"]',
  entertainment: '["amenity"~"cinema|theatre|nightclub"]',
  indoor: '["tourism"~"museum|gallery"]',
}

function classify(tags = {}) {
  const amenity = tags.amenity
  const tourism = tags.tourism
  const leisure = tags.leisure
  if (amenity === 'cafe') return { category: 'cafe', indoor: true, weatherSensitive: false, styles: ['food', 'relaxation'] }
  if (amenity === 'restaurant' || amenity === 'fast_food' || amenity === 'food_court') {
    return { category: 'restaurant', indoor: true, weatherSensitive: false, styles: ['food'] }
  }
  if (tags.shop) return { category: 'shopping', indoor: true, weatherSensitive: false, styles: ['shopping'] }
  if (tourism === 'hotel' || tourism === 'guest_house' || tourism === 'hostel') {
    return { category: 'hotel', indoor: true, weatherSensitive: false, styles: ['relaxation'] }
  }
  if (tourism === 'museum' || tourism === 'gallery' || amenity === 'cinema' || amenity === 'theatre') {
    return { category: 'attraction', indoor: true, weatherSensitive: false, styles: ['culture', 'history'] }
  }
  if (leisure === 'park' || leisure === 'garden' || tags.natural === 'beach') {
    return { category: 'attraction', indoor: false, weatherSensitive: true, styles: ['nature'] }
  }
  if (amenity === 'place_of_worship') return { category: 'attraction', indoor: true, weatherSensitive: false, styles: ['culture'] }
  if (tags.historic) return { category: 'attraction', indoor: tourism === 'museum', weatherSensitive: tourism !== 'museum', styles: ['history'] }
  return { category: 'attraction', indoor: false, weatherSensitive: true, styles: ['culture'] }
}

function elCoords(el) {
  if (el.lat != null && el.lon != null) return { lat: el.lat, lng: el.lon }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon }
  return null
}

function toPlace(el, destId) {
  const coords = elCoords(el)
  const tags = el.tags || {}
  const name = tags.name || tags['name:en']
  if (!coords || !name) return null
  const meta = classify(tags)
  const address = [tags['addr:housename'], tags['addr:street'], tags['addr:city']].filter(Boolean).join(', ')
  return {
    id: `osm_${el.type}_${el.id}`,
    destinationId: destId,
    name,
    category: meta.category,
    latitude: coords.lat,
    longitude: coords.lng,
    lat: coords.lat,
    lng: coords.lng,
    address: address || 'Not available from OSM',
    openingHours: tags.opening_hours || 'Not available from OSM',
    website: tags.website || tags['contact:website'] || null,
    phone: tags.phone || tags['contact:phone'] || null,
    tags: [tags.amenity, tags.tourism, tags.leisure, tags.shop, tags.historic].filter(Boolean),
    indoor: meta.indoor,
    weatherSensitive: meta.weatherSensitive,
    styles: meta.styles,
    source: 'osm',
    hoursKnown: Boolean(tags.opening_hours),
    priceKnown: false,
    ratingKnown: false,
    crowdKnown: false,
  }
}

async function overpass(query) {
  for (const url of OVERPASS) {
    try {
      const data = await timedJson(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: `data=${encodeURIComponent(query)}`,
        },
        16000,
      )
      if (data.elements?.length) return data.elements
    } catch {
      /* next mirror */
    }
  }
  return []
}

function haversineKm(a, b) {
  const toRad = (n) => (n * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(s)))
}

async function photonPlaces(lat, lng, destId, radiusM) {
  const deg = Math.max(0.05, Math.min(0.12, radiusM / 111000))
  const bbox = `${lng - deg},${lat - deg},${lng + deg},${lat + deg}`
  const queries = ['museum', 'attraction', 'monument', 'park', 'restaurant', 'cafe']
  const features = []
  for (let i = 0; i < queries.length; i += 2) {
    const batch = await Promise.all(
      queries.slice(i, i + 2).map(async (q) => {
        try {
          const data = await timedJson(
            `${PHOTON}?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&bbox=${encodeURIComponent(bbox)}&limit=12`,
            {},
            7000,
          )
          return data.features || []
        } catch {
          return []
        }
      }),
    )
    features.push(...batch.flat())
  }
  const seen = new Set()
  const places = []
  for (const f of features) {
    const name = f.properties?.name?.trim()
    const [plng, plat] = f.geometry?.coordinates || []
    if (!name || plat == null || plng == null) continue
    if (/^(park|atm|cafe|restaurant|hospital|hotel|pharmacy|fuel|supermarket|museum|beach|toilets)$/i.test(name)) continue
    if (haversineKm({ lat, lng }, { lat: plat, lng: plng }) > radiusM / 1000 + 1.2) continue
    const osmType = f.properties.osm_type === 'W' ? 'way' : f.properties.osm_type === 'R' ? 'relation' : 'node'
    const el = {
      type: osmType,
      id: f.properties.osm_id,
      lat: plat,
      lon: plng,
      tags: {
        name,
        [f.properties.osm_key || 'tourism']: f.properties.osm_value || 'attraction',
        'addr:street': f.properties.street || '',
        'addr:city': f.properties.city || '',
      },
    }
    const p = toPlace(el, destId)
    if (!p || seen.has(p.name.toLowerCase())) continue
    seen.add(p.name.toLowerCase())
    places.push(p)
  }
  return places
}

export async function fetchPlaces(lat, lon, category = '', radius = 8000, destId = 'live') {
  const coords = parseCoords(lat, lon)
  if (!coords) {
    const err = new Error('lat and lon are required')
    err.status = 400
    throw err
  }
  const r = Math.min(12000, Math.max(800, Number(radius) || 8000))
  const cat = String(category || '').toLowerCase()
  const key = `poi:v3:${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}:${cat}:${r}`
  const cached = cacheGet(key, 4 * 60 * 1000)
  if (cached) return cached

  const photon = await photonPlaces(coords.lat, coords.lng, destId, r)
  const around = `(around:${Math.min(8000, r)},${coords.lat},${coords.lng})`
  const filter = CATEGORY_FILTERS[cat]
  const body = filter
    ? `node${filter}${around};`
    : `
  node["tourism"="museum"]${around};
  node["tourism"="attraction"]${around};
  node["tourism"="gallery"]${around};
  node["amenity"="restaurant"]${around};
  node["amenity"="cafe"]${around};
`
  const places = [...photon]
  const seen = new Set(places.map((p) => p.name.toLowerCase()))
  const foodCount = () => places.filter((p) => p.category === 'restaurant' || p.category === 'cafe').length
  if (places.length < 16) {
    const q = `[out:json][timeout:12];(${body});out 50;`
    const elements = await overpass(q)
    for (const el of elements) {
      const p = toPlace(el, destId)
      if (!p || seen.has(p.name.toLowerCase())) continue
      seen.add(p.name.toLowerCase())
      places.push(p)
    }
  }
  if (foodCount() < 6 && (!cat || ['restaurants', 'cafes', 'attractions', ''].includes(cat))) {
    const foodQ = `[out:json][timeout:12];(node["amenity"="restaurant"]${around};node["amenity"="cafe"]${around};);out 40;`
    const elements = await overpass(foodQ)
    for (const el of elements) {
      const p = toPlace(el, destId)
      if (!p || seen.has(p.name.toLowerCase())) continue
      seen.add(p.name.toLowerCase())
      places.push(p)
    }
  }
  cacheSet(key, places)
  return places
}

export async function fetchRoute(points, mode = 'taxi') {
  if (!Array.isArray(points) || points.length < 2) {
    const err = new Error('At least two {lat,lng} points are required')
    err.status = 400
    throw err
  }
  const parsed = points.map((p) => parseCoords(p.lat ?? p.latitude, p.lng ?? p.lon ?? p.longitude)).filter(Boolean)
  if (parsed.length < 2) {
    const err = new Error('Invalid coordinates')
    err.status = 400
    throw err
  }
  const profile = mode === 'walking' ? 'foot' : 'driving'
  const path = parsed.map((p) => `${p.lng},${p.lat}`).join(';')
  const key = `rt:${profile}:${path}`
  const cached = cacheGet(key, 8 * 60 * 1000)
  if (cached) return cached
  const data = await timedJson(
    `${OSRM}/route/v1/${profile}/${path}?overview=full&geometries=geojson&steps=true`,
    {},
    10000,
  )
  const route = data.routes?.[0]
  if (!route) {
    const err = new Error('Route unavailable')
    err.status = 502
    throw err
  }
  const result = {
    km: Number((route.distance / 1000).toFixed(2)),
    minutes: Math.max(1, Math.round(route.duration / 60)),
    geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    steps:
      route.legs?.[0]?.steps?.map((s) => ({
        instruction: s.maneuver?.instruction || s.name || s.maneuver?.type || 'Continue',
        km: Number((s.distance / 1000).toFixed(2)),
      })) || [],
    source: 'osrm',
    mode,
  }
  cacheSet(key, result)
  return result
}

export function scorePlace(place, origin, interests = [], weather = {}, remainingBudget = 8000) {
  const toRad = (n) => (n * Math.PI) / 180
  const dLat = toRad((place.lat ?? place.latitude) - origin.lat)
  const dLng = toRad((place.lng ?? place.longitude) - origin.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(place.lat ?? place.latitude)) * Math.sin(dLng / 2) ** 2
  const km = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)))
  const styles = place.styles || []
  const interestMatch = Math.min(30, styles.filter((s) => interests.includes(s)).length * 22 + (place.category === 'attraction' ? 8 : 4))
  const distanceScore = Math.max(0, Math.min(22, 22 - km * 3.2))
  const rainy = (weather.rainProbability || 0) >= 70 || ['rain', 'heavy-rain', 'storm'].includes(weather.condition)
  const hot = (weather.apparentTempC ?? weather.tempC ?? 0) >= 38
  let weatherSuitability = 16
  if (rainy && place.weatherSensitive) weatherSuitability = 2
  else if (rainy && place.indoor) weatherSuitability = 22
  else if (hot && place.indoor) weatherSuitability = 20
  else if (hot && !place.indoor) weatherSuitability = 6
  const openingHoursScore = place.hoursKnown === false || place.openingHours === 'Not available from OSM' ? 10 : 16
  const cost = place.estimatedCost || place.entryFee || 0
  const budgetScore = place.priceKnown === false ? 10 : cost > remainingBudget ? 2 : cost === 0 ? 14 : 12
  const activityScore = place.indoor ? 10 : 12
  const total = Math.round(interestMatch + distanceScore + weatherSuitability + openingHoursScore + budgetScore + activityScore)
  return {
    placeId: place.id,
    total,
    breakdown: { interestMatch, distanceScore, weatherSuitability, openingHoursScore, budgetScore, activityScore },
    km,
  }
}
