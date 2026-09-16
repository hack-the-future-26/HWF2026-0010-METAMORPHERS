import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = join(dirname(fileURLToPath(import.meta.url)), 'data')
const file = join(dir, 'app.json')
mkdirSync(dir, { recursive: true })

function empty() {
  return { users: [], sessions: {}, trips: [], places: [], feedback: [] }
}

function load() {
  if (!existsSync(file)) return empty()
  try {
    return { ...empty(), ...JSON.parse(readFileSync(file, 'utf8')) }
  } catch {
    return empty()
  }
}

function save(db) {
  writeFileSync(file, JSON.stringify(db, null, 2))
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const next = scryptSync(password, salt, 32)
  const prev = Buffer.from(hash, 'hex')
  return prev.length === next.length && timingSafeEqual(prev, next)
}

export function signup({ name, email, password }) {
  const db = load()
  const mail = String(email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new Error('Enter a real email address')
  if (!password || String(password).length < 6) throw new Error('Password must be at least 6 characters')
  if (db.users.some((u) => u.email === mail)) throw new Error('An account with that email already exists')
  const user = {
    id: `user_${randomBytes(6).toString('hex')}`,
    name: String(name || mail.split('@')[0]),
    email: mail,
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  save(db)
  return publicUser(user)
}

export function login(email, password) {
  const db = load()
  const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase())
  if (!user || !verifyPassword(password, user.password)) throw new Error('Email or password is wrong')
  const token = randomBytes(24).toString('hex')
  db.sessions[token] = { userId: user.id, at: Date.now() }
  save(db)
  return { token, user: publicUser(user) }
}

export function logout(token) {
  const db = load()
  delete db.sessions[token]
  save(db)
}

export function userFromToken(token) {
  if (!token) return null
  const db = load()
  const session = db.sessions[token]
  if (!session) return null
  const user = db.users.find((u) => u.id === session.userId)
  return user ? publicUser(user) : null
}

export function patchUser(userId, patch) {
  const db = load()
  const user = db.users.find((u) => u.id === userId)
  if (!user) throw new Error('Not signed in')
  if (patch.name) user.name = String(patch.name)
  save(db)
  return publicUser(user)
}

export function saveTrip(userId, trip) {
  const db = load()
  const row = { id: trip.id, userId, trip, savedAt: new Date().toISOString() }
  db.trips = db.trips.filter((t) => !(t.userId === userId && t.id === trip.id))
  db.trips.push(row)
  save(db)
  return row
}

export function listTrips(userId) {
  return load().trips.filter((t) => t.userId === userId)
}

export function savePlace(userId, place) {
  const db = load()
  if (!db.places.some((p) => p.userId === userId && p.place?.id === place.id)) {
    db.places.push({ userId, place, savedAt: new Date().toISOString() })
    save(db)
  }
}

export function listPlaces(userId) {
  return load().places.filter((p) => p.userId === userId).map((p) => p.place)
}

export function addFeedback(userId, body) {
  const db = load()
  const row = {
    id: `fb_${randomBytes(5).toString('hex')}`,
    userId,
    tripId: body.tripId || null,
    dayIndex: Number.isFinite(body.dayIndex) ? body.dayIndex : null,
    rating: Math.max(1, Math.min(5, Number(body.rating) || 3)),
    comment: String(body.comment || '').slice(0, 800),
    styles: Array.isArray(body.styles) ? body.styles : [],
    createdAt: new Date().toISOString(),
  }
  db.feedback.push(row)
  save(db)
  return row
}

export function listFeedback(userId) {
  return load().feedback.filter((f) => f.userId === userId)
}

export function matchFromFeedback(userId, styles = []) {
  const rows = listFeedback(userId)
  if (!rows.length) return null
  const avg = rows.reduce((s, r) => s + r.rating, 0) / rows.length
  const liked = rows.filter((r) => r.rating >= 4).flatMap((r) => r.styles)
  const boost = styles.filter((s) => liked.includes(s)).length * 3
  return Math.round(Math.min(97, 62 + avg * 6 + boost + Math.min(8, rows.length)))
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}
