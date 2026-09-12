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

export type ArrivalPayload = {
  arrival: ArrivalGuide
  weather: BackendWeather
  source: string
}

const base = ''

export async function backendHealth() {
  const res = await fetch(`${base}/api/health`)
  if (!res.ok) throw new Error('backend-down')
  return (await res.json()) as { ok: boolean; service: string; cities: number }
}

export async function fetchArrival(cityId: string) {
  const res = await fetch(`${base}/api/arrival/${encodeURIComponent(cityId)}`)
  if (!res.ok) throw new Error('arrival')
  return (await res.json()) as ArrivalPayload
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
