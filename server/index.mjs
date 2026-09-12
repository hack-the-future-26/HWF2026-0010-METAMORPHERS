import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { CITIES, buildArrival, answerAsLocal } from './guides.mjs'

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
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'yatrasense-companion',
    role: 'first-visit travel backend',
    cities: Object.keys(CITIES).length,
    time: new Date().toISOString(),
  })
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

function weatherCodeSummary(code) {
  if (code == null) return 'Unavailable'
  if (code === 0) return 'Clear'
  if (code <= 3) return 'Partly cloudy'
  if (code <= 48) return 'Fog'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow or ice'
  if (code <= 82) return 'Showers'
  if (code <= 99) return 'Thunderstorm'
  return 'Mixed'
}

async function fetchWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weather_code,precipitation_probability,wind_speed_10m,relative_humidity_2m&timezone=auto`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) throw new Error('weather')
    const data = await r.json()
    const c = data.current || {}
    return {
      tempC: Math.round(c.temperature_2m ?? 0),
      apparentTempC: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
      rainProbability: c.precipitation_probability ?? 0,
      windKph: Math.round(c.wind_speed_10m ?? 0),
      humidity: c.relative_humidity_2m ?? 0,
      summary: weatherCodeSummary(c.weather_code),
      unavailable: false,
    }
  } catch {
    return { tempC: 0, rainProbability: 0, windKph: 0, humidity: 0, summary: 'Weather unavailable', unavailable: true }
  } finally {
    clearTimeout(t)
  }
}

app.get('/api/arrival/:cityId', async (req, res) => {
  const id = String(req.params.cityId || 'vizag')
  const arrival = buildArrival(CITIES[id] ? id : 'vizag')
  const weather = await fetchWeather(arrival.lat, arrival.lng)
  res.json({ arrival, weather, source: 'yatrasense-backend' })
})

app.get('/api/weather/:cityId', async (req, res) => {
  const id = String(req.params.cityId || 'vizag')
  const city = CITIES[id] || CITIES.vizag
  const weather = await fetchWeather(city.lat, city.lng)
  res.json({ id, ...city, weather })
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
  const destId = req.body?.context?.destinationId || req.body?.destinationId || 'vizag'
  const id = CITIES[destId] ? destId : 'vizag'
  const arrival = buildArrival(id)
  const weather = await fetchWeather(arrival.lat, arrival.lng)
  const reply = answerAsLocal(prompt, arrival, weather)
  res.json({ reply, source: 'yatrasense-backend', city: arrival.name })
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

const server = createServer(app)
server.listen(PORT, () => {
  console.log(`YatraSense companion API  http://localhost:${PORT}`)
})
