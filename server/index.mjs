import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { loadEnv, corsOrigins } from './env.mjs'
import { CITIES, buildArrival } from './guides.mjs'
import { cityPicks, planAnswer } from './catalog.mjs'
import { listHotels } from './hotels.mjs'
import { findVenuePhoto } from './photos.mjs'
import * as store from './store.mjs'
import {
  rateLimit,
  geocode,
  fetchWeather,
  fetchPlaces,
  fetchRoute,
  parseCoords,
  scorePlace,
} from './liveApis.mjs'
import { evaluateTripConditions } from './adapt.mjs'
import { askLlm, aiConfigured } from './ai.mjs'

loadEnv()

const __dir = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8787)
const dataDir = join(__dir, 'data')
const checklistFile = join(dataDir, 'checklists.json')

mkdirSync(dataDir, { recursive: true })
if (!existsSync(checklistFile)) writeFileSync(checklistFile, '{}')

function readChecks() {
  try {
    return JSON.parse(readFileSync(checklistFile, 'utf8'))
  } catch {
    return {}
  }
}

const app = express()
app.use(cors({ origin: corsOrigins(), credentials: true }))
app.use(express.json({ limit: '2mb' }))

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local')
    .split(',')[0]
    .trim()
}

function limitProxy(req, res, next) {
  const hit = rateLimit(clientIp(req))
  if (!hit.ok) return res.status(429).json({ error: 'Too many requests. Slow down search a little.' })
  res.setHeader('X-RateLimit-Remaining', String(hit.remaining))
  next()
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `ys=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; HttpOnly`,
  )
}

function tokenOf(req) {
  const auth = String(req.headers.authorization || '')
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  const cookie = String(req.headers.cookie || '')
  const m = cookie.match(/(?:^|;\s*)ys=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

function requireUser(req, res) {
  const user = store.userFromToken(tokenOf(req))
  if (!user) {
    res.status(401).json({ error: 'Sign in required' })
    return null
  }
  return user
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'yatrasense-companion',
    role: 'adaptive travel backend',
    cities: Object.keys(CITIES).length,
    ai: aiConfigured() ? 'connected' : 'unconfigured',
    time: new Date().toISOString(),
  })
})

app.get('/api/geocode', limitProxy, async (req, res) => {
  const q = String(req.query.q || '').trim()
  if (q.length < 2) return res.status(400).json({ error: 'Query too short', results: [] })
  try {
    const results = await geocode(q)
    if (!results.length) {
      return res.status(404).json({
        error: "We couldn't find this destination. Try another city or location.",
        results: [],
      })
    }
    res.json({ results })
  } catch (err) {
    const status = err.status === 400 ? 400 : 502
    res.status(status).json({ error: err.message || 'Geocoding failed', results: [] })
  }
})

app.get('/api/weather', limitProxy, async (req, res) => {
  const coords = parseCoords(req.query.lat, req.query.lon ?? req.query.lng)
  if (!coords) return res.status(400).json({ error: 'lat and lon are required' })
  try {
    const weather = await fetchWeather(coords.lat, coords.lng)
    res.json({ weather, source: 'Open-Meteo' })
  } catch {
    res.status(502).json({ error: 'Weather service is temporarily unavailable. Retry.', weather: { unavailable: true } })
  }
})

app.get('/api/places', limitProxy, async (req, res) => {
  const coords = parseCoords(req.query.lat, req.query.lon ?? req.query.lng)
  if (!coords) return res.status(400).json({ error: 'lat and lon are required' })
  try {
    const places = await fetchPlaces(coords.lat, coords.lng, req.query.category, req.query.radius, req.query.destId)
    res.json({ places, source: 'OpenStreetMap' })
  } catch {
    res.status(502).json({ error: 'OSM places unavailable', places: [] })
  }
})

app.post('/api/route', limitProxy, async (req, res) => {
  try {
    const route = await fetchRoute(req.body?.points || req.body?.waypoints, req.body?.mode)
    res.json({ route })
  } catch (err) {
    const status = err.status === 400 ? 400 : 502
    res.status(status).json({ error: status === 400 ? err.message : 'Route unavailable', route: null })
  }
})

app.post('/api/plan', limitProxy, async (req, res) => {
  const coords = parseCoords(req.body?.lat, req.body?.lon ?? req.body?.lng)
  if (!coords) return res.status(400).json({ error: 'lat and lng are required' })
  const interests = Array.isArray(req.body?.interests) ? req.body.interests : []
  const budget = Number(req.body?.budget) || 8000
  try {
    const [weather, places] = await Promise.all([
      fetchWeather(coords.lat, coords.lng),
      fetchPlaces(coords.lat, coords.lng, '', 12000, req.body?.destinationId || 'live'),
    ])
    const ranked = places
      .map((place) => ({ place, score: scorePlace(place, coords, interests, weather, budget) }))
      .sort((a, b) => b.score.total - a.score.total)
    res.json({ weather, places, ranked, source: { weather: 'Open-Meteo', places: 'OpenStreetMap' } })
  } catch {
    res.status(502).json({ error: 'Planning data is temporarily unavailable. Retry.' })
  }
})

app.post('/api/adapt', async (req, res) => {
  try {
    const result = evaluateTripConditions({
      itinerary: req.body?.itinerary || req.body?.trip,
      weather: req.body?.weather,
      places: req.body?.places || [],
    })
    res.json(result)
  } catch {
    res.status(400).json({ error: 'Invalid adaptation payload' })
  }
})

app.get('/api/cities', (_req, res) => {
  res.json(
    Object.entries(CITIES).map(([id, c]) => ({
      id,
      name: c.name,
      state: c.state,
      lat: c.lat,
      lng: c.lng,
      lang: c.lang,
    })),
  )
})

app.get('/api/arrival/:cityId', async (req, res) => {
  const id = String(req.params.cityId || '')
  if (!CITIES[id]) {
    return res.status(404).json({
      error: 'No companion briefing for this destination. Search a city, then use live weather and OSM places.',
    })
  }
  const arrival = buildArrival(id)
  let weather
  try {
    weather = await fetchWeather(arrival.lat, arrival.lng)
  } catch {
    weather = { tempC: 0, rainProbability: 0, windKph: 0, humidity: 0, summary: 'Weather unavailable', unavailable: true }
  }
  const picks = cityPicks(arrival.id)
  res.json({
    arrival,
    weather,
    foods: picks.foods,
    hotels: picks.hotels,
    source: 'yatrasense-backend',
  })
})

app.get('/api/plan/:cityId', async (req, res) => {
  const id = String(req.params.cityId || '')
  if (!CITIES[id]) return res.status(404).json({ error: 'Unknown catalog city. Use POST /api/plan with coordinates.' })
  const arrival = buildArrival(id)
  let weather
  try {
    weather = await fetchWeather(arrival.lat, arrival.lng)
  } catch {
    weather = { unavailable: true, summary: 'Weather unavailable' }
  }
  const picks = cityPicks(id)
  res.json({
    city: arrival.name,
    plan: planAnswer(id, arrival, weather),
    foods: picks.foods,
    hotels: picks.hotels,
    weather,
  })
})

app.get('/api/weather/:cityId', async (req, res) => {
  const id = String(req.params.cityId || '')
  const city = CITIES[id]
  if (!city) return res.status(404).json({ error: 'Unknown catalog city. Use GET /api/weather?lat=&lon=' })
  try {
    const weather = await fetchWeather(city.lat, city.lng)
    res.json({ id, ...city, weather })
  } catch {
    res.status(502).json({ error: 'Weather service is temporarily unavailable. Retry.' })
  }
})

app.post('/api/translate', async (req, res) => {
  const q = String(req.body?.q || req.body?.text || '').trim()
  const source = String(req.body?.source || req.body?.from || 'en')
  const target = String(req.body?.target || req.body?.to || 'hi')
  if (!q) return res.status(400).json({ error: 'Missing text' })
  if (source === target) return res.json({ translatedText: q, source: 'same-language' })
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0, 450))}&langpair=${source}|${target}`
    const r = await fetch(url)
    const data = await r.json()
    let text = data.responseData?.translatedText?.trim() || ''
    text = text.replace(/MYMEMORY WARNING:.*/i, '').trim()
    if (!text) throw new Error('empty')
    res.json({ translatedText: text, source: 'mymemory-via-yatrasense' })
  } catch {
    res.status(502).json({ error: 'Translation upstream is unavailable' })
  }
})

app.post('/api/ask', async (req, res) => {
  const prompt = String(req.body?.prompt || req.body?.q || '').trim()
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
  const context = req.body?.context || {}
  try {
    const result = await askLlm(prompt, context)
    res.json(result)
  } catch (err) {
    const status = err.status || 502
    res.status(status).json({
      error: err.message || 'AI request failed',
      source: err.code || 'llm-error',
      configured: aiConfigured(),
    })
  }
})

app.get('/api/checklist/:cityId', (req, res) => {
  const all = readChecks()
  res.json({ cityId: req.params.cityId, done: all[req.params.cityId] || [] })
})

app.post('/api/checklist/:cityId', (req, res) => {
  const all = readChecks()
  const done = Array.isArray(req.body?.done) ? req.body.done.map(String) : []
  all[req.params.cityId] = done
  writeFileSync(checklistFile, JSON.stringify(all, null, 2))
  res.json({ cityId: req.params.cityId, done })
})

app.get('/api/hotels/:cityId', async (req, res) => {
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const limit = Math.min(40, Math.max(10, Number(req.query.limit) || 20))
  const hint = parseCoords(req.query.lat, req.query.lon ?? req.query.lng)
  try {
    const payload = await listHotels(String(req.params.cityId), offset, limit, {
      lat: hint?.lat,
      lng: hint?.lng,
      name: String(req.query.name || ''),
      city: String(req.query.city || ''),
    })
    res.json(payload)
  } catch (err) {
    res.status(502).json({ error: err.message || 'Hotels upstream failed' })
  }
})

app.get('/api/map-style', (_req, res) => {
  const mapbox = process.env.MAPBOX_TOKEN
  const maptiler = process.env.MAPTILER_KEY
  if (mapbox) {
    return res.json({
      light: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapbox}`,
      dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/256/{z}/{x}/{y}@2x?access_token=${mapbox}`,
      attribution: '© Mapbox © OpenStreetMap',
    })
  }
  if (maptiler) {
    return res.json({
      light: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptiler}`,
      dark: `https://api.maptiler.com/maps/dataviz-dark/{z}/{x}/{y}.png?key=${maptiler}`,
      attribution: '© MapTiler © OpenStreetMap',
    })
  }
  res.json({
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OpenStreetMap',
  })
})

app.get('/api/venue-photo', async (req, res) => {
  const name = String(req.query.name || '').trim()
  const city = String(req.query.city || '').trim()
  const kind = String(req.query.kind || 'place')
  if (name.length < 3) return res.status(400).json({ url: null })
  try {
    const url = await findVenuePhoto(name, city, kind)
    res.json({ url: url || null })
  } catch {
    res.json({ url: null })
  }
})

app.get('/api/places-photo', async (req, res) => {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.GOOGLE_MAPS_API_KEY
  const ref = String(req.query.ref || '')
  if (!key || !ref) return res.status(404).end()
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${encodeURIComponent(ref)}&key=${key}`
  const r = await fetch(url)
  res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg')
  res.send(Buffer.from(await r.arrayBuffer()))
})

app.post('/api/auth/signup', (req, res) => {
  try {
    const user = store.signup(req.body || {})
    const { token } = store.login(user.email, req.body.password)
    setSessionCookie(res, token)
    res.json({ user, token })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/auth/login', (req, res) => {
  try {
    const payload = store.login(req.body?.email, req.body?.password)
    setSessionCookie(res, payload.token)
    res.json(payload)
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
})

app.post('/api/auth/logout', (req, res) => {
  store.logout(tokenOf(req))
  res.json({ ok: true })
})

app.get('/api/me', (req, res) => {
  const user = store.userFromToken(tokenOf(req))
  if (!user) return res.status(401).json({ error: 'Sign in required' })
  res.json({ user, trips: store.listTrips(user.id), feedback: store.listFeedback(user.id), match: store.matchFromFeedback(user.id) })
})

app.patch('/api/me', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  try {
    res.json({ user: store.patchUser(user.id, req.body || {}) })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

app.post('/api/trips', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  if (!req.body?.id) return res.status(400).json({ error: 'Trip required' })
  res.json(store.saveTrip(user.id, req.body))
})

app.get('/api/trips', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  res.json({ trips: store.listTrips(user.id) })
})

app.post('/api/places/save', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  store.savePlace(user.id, req.body)
  res.json({ ok: true })
})

app.get('/api/places/saved', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  res.json({ places: store.listPlaces(user.id) })
})

app.post('/api/feedback', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  const row = store.addFeedback(user.id, req.body || {})
  res.json({ ...row, match: store.matchFromFeedback(user.id, req.body?.styles) })
})

app.get('/api/feedback', (req, res) => {
  const user = requireUser(req, res)
  if (!user) return
  res.json({ feedback: store.listFeedback(user.id), match: store.matchFromFeedback(user.id, req.body?.styles) })
})

const server = createServer(app)
server.listen(PORT, () => {
  console.log(`YatraSense companion API  http://localhost:${PORT}`)
})
