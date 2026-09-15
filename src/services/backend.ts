export type ArrivalHour = { id: string; t: string; title: string; detail: string }
export type ArrivalKit = { id: string; icon: string; title: string; body: string }
export type ArrivalPhrase = { en: string; local: string; lang: string }
export type ArrivalAction = { id: string; label: string; prompt: string }

export type ArrivalGuide = {
  id: string
  name: string
  state: string
  lat: number
  lng: number
  lang: string
  langCode: string
  airport: string
  fromAirport: string
  firstWalk: string
  firstMeal: string
  sim: string
  money: string
  dont: string
  stayArea: string
  emergency: string
  hours: ArrivalHour[]
  kit: ArrivalKit[]
  phrases: ArrivalPhrase[]
  actions: ArrivalAction[]
}

export type BackendWeather = {
  tempC: number
  apparentTempC?: number
  rainProbability: number
  windKph: number
  humidity: number
  summary: string
  unavailable: boolean
}

export type CityFoodPick = { dish: string; place: string; phone?: string; website?: string }
export type CityHotelPick = { name: string; phone?: string; website?: string; area?: string }

export type ArrivalPayload = {
  arrival: ArrivalGuide
  weather: BackendWeather
  foods?: CityFoodPick[]
  hotels?: CityHotelPick[]
  source: string
}

const base = ''

export async function backendHealth() {
  const res = await fetch(`${base}/api/health`)
  if (!res.ok) throw new Error('backend-down')
  return (await res.json()) as { ok: boolean; service: string; cities: number; ai?: string }
}

export async function fetchArrival(cityId: string) {
  const res = await fetch(`${base}/api/arrival/${encodeURIComponent(cityId)}`)
  if (!res.ok) throw new Error('arrival')
  return (await res.json()) as ArrivalPayload
}

export async function fetchCityPlan(cityId: string) {
  const res = await fetch(`${base}/api/plan/${encodeURIComponent(cityId)}`)
  if (!res.ok) throw new Error('plan')
  return (await res.json()) as {
    city: string
    plan: string
    foods: CityFoodPick[]
    hotels: CityHotelPick[]
  }
}

export async function askCompanion(prompt: string, destinationId: string) {
  const res = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, destinationId, context: { destinationId } }),
  })
  if (!res.ok) throw new Error('ask')
  return (await res.json()) as { reply: string; city?: string }
}

export async function fetchChecklist(cityId: string) {
  const res = await fetch(`${base}/api/checklist/${encodeURIComponent(cityId)}`)
  if (!res.ok) return [] as string[]
  const data = (await res.json()) as { done?: string[] }
  return data.done ?? []
}

export async function saveChecklist(cityId: string, done: string[]) {
  await fetch(`${base}/api/checklist/${encodeURIComponent(cityId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  })
}

export type LiveHotel = {
  id: string
  destinationId?: string
  name: string
  address: string
  area: string
  lat: number
  lng: number
  phone: string | null
  website: string | null
  rating: number | null
  reviewCount: number
  stars: number | null
  photo: string | null
  source: string
  distanceKm: number
  price: { low: number; high: number; label: string; stars: number | null }
}

const tokenKey = 'ys_token'

export function authToken() {
  return localStorage.getItem(tokenKey) || ''
}

function authHeaders(): HeadersInit {
  const token = authToken()
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new Error(res.ok ? 'Unexpected response from the companion API' : 'Companion API is offline. Run npm run dev.')
  }
}

export async function fetchHotels(
  cityId: string,
  offset = 0,
  limit = 20,
  hint?: { lat?: number; lng?: number; name?: string; city?: string },
) {
  const q = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  if (hint?.lat != null) q.set('lat', String(hint.lat))
  if (hint?.lng != null) q.set('lon', String(hint.lng))
  if (hint?.name) q.set('name', hint.name)
  if (hint?.city) q.set('city', hint.city)
  const res = await fetch(`${base}/api/hotels/${encodeURIComponent(cityId)}?${q}`)
  if (!res.ok) throw new Error('hotels')
  return (await res.json()) as { city: string; total: number; hotels: LiveHotel[]; source: string }
}

export async function fetchVenuePhoto(name: string, city?: string, kind: 'hotel' | 'food' | 'place' = 'place') {
  const q = new URLSearchParams({ name, city: city || '', kind })
  const res = await fetch(`${base}/api/venue-photo?${q}`)
  if (!res.ok) return null
  const data = (await res.json()) as { url?: string | null }
  return data.url || null
}

export async function fetchMapStyle() {
  const res = await fetch(`${base}/api/map-style`)
  if (!res.ok) throw new Error('map-style')
  return (await res.json()) as { light: string; dark: string; attribution: string }
}

export type AuthUser = { id: string; name: string; email: string }

export async function signupAccount(body: { name: string; email: string; password: string }) {
  const res = await fetch(`${base}/api/auth/signup`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.error || 'Could not create that account')
  if (data.token) localStorage.setItem(tokenKey, data.token)
  return data as { user: AuthUser; token: string }
}

export async function loginAccount(email: string, password: string) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await readJson(res)
  if (!res.ok) throw new Error(data.error || 'Email or password is wrong')
  if (data.token) localStorage.setItem(tokenKey, data.token)
  return data as { user: AuthUser; token: string }
}

export async function logoutAccount() {
  await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: authHeaders() })
  localStorage.removeItem(tokenKey)
}

export async function fetchMe() {
  const res = await fetch(`${base}/api/me`, { credentials: 'include', headers: authHeaders() })
  if (!res.ok) return null
  return (await res.json()) as { user: AuthUser; match: number | null; trips: { id: string; trip: unknown }[]; feedback: unknown[] }
}

export async function saveTripRemote(trip: unknown) {
  if (!authToken()) return
  await fetch(`${base}/api/trips`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(trip) })
}

export async function sendFeedback(body: { tripId?: string; dayIndex?: number; rating: number; comment: string; styles?: string[] }) {
  const res = await fetch(`${base}/api/feedback`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'feedback')
  return data
}

export async function patchMe(body: { name?: string }) {
  const res = await fetch(`${base}/api/me`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'profile')
  return data
}

export async function savePlaceRemote(place: unknown) {
  if (!authToken()) return
  await fetch(`${base}/api/places/save`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(place) })
}

export async function fetchSavedPlaces() {
  if (!authToken()) return []
  const res = await fetch(`${base}/api/places/saved`, { headers: authHeaders() })
  if (!res.ok) return []
  const data = (await res.json()) as { places?: unknown[] }
  return data.places ?? []
}
