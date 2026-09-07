import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

export function greeting(name: string, date = new Date()) {
  const h = date.getHours()
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${part}, ${name}`
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function travelMinutes(km: number, mode: string) {
  const kph =
    mode === 'walking' ? 4.5 : mode === 'public' ? 22 : mode === 'rental' ? 32 : 28
  return Math.max(6, Math.round((km / kph) * 60) + 4)
}

export function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

export function minutesToTime(mins: number) {
  const n = ((mins % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(n / 60)
  const m = n % 60
  const hour = ((h + 11) % 12) + 1
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatKm(n: number) {
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(n >= 10 ? 0 : 1)} km`
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m}m`
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}

export function daysBetween(start: string, end: string) {
  const a = new Date(start + 'T00:00:00')
  const b = new Date(end + 'T00:00:00')
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1)
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function crowdLabel(level: 'low' | 'moderate' | 'high') {
  return level === 'low' ? 'Low' : level === 'high' ? 'High' : 'Moderate'
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
