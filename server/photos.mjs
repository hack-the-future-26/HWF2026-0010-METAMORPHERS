const cache = new Map()

const SKIP = /flag_of|coat_of_arms|locator_map|icon\.|logo\.svg|wordmark|seal_of/i
const STOP = new Set([
  'hotel',
  'the',
  'and',
  'guest',
  'house',
  'lodge',
  'restaurant',
  'cafe',
  'hostel',
  'inn',
  'residency',
  'palace',
  'india',
  'city',
  'nagar',
  'hyderabad',
  'bengaluru',
  'bangalore',
  'mumbai',
  'delhi',
  'chennai',
  'jaipur',
  'kolkata',
  'pune',
  'goa',
])

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleFits(title, name, city, kind) {
  const n = norm(name)
  const t = norm(title)
  if (!n || !t) return false
  if (t === n || t.includes(n)) return true
  const titleWords = t.split(' ').length
  if (n.includes(t) && titleWords >= 2 && t.length >= 10) return true
  const words = n.split(' ').filter((w) => w.length > 2 && !STOP.has(w))
  if (!words.length) return false
  const hits = words.filter((w) => t.includes(w)).length
  if (hits < Math.min(2, words.length)) return false
  if (kind === 'hotel' && !/(hotel|resort|palace|lodge|inn|hostel|guest house|stay)/i.test(title)) {
    return false
  }
  if (city && words.length === 1 && !t.includes(norm(city))) return false
  return true
}

function usableUrl(url) {
  return Boolean(url) && !SKIP.test(url)
}

async function googlePhoto(name, city, kind) {
  const key = process.env.GOOGLE_PLACES_KEY || process.env.GOOGLE_MAPS_API_KEY
  if (!key) return null
  const hint = kind === 'hotel' ? 'hotel' : kind === 'food' ? 'restaurant' : ''
  const input = [name, city, hint].filter(Boolean).join(' ')
  const url =
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(input)}&inputtype=textquery&fields=name,photos,place_id&key=${key}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const hit =
    (data.candidates || []).find((c) => titleFits(c.name || '', name, city, kind)) ||
    data.candidates?.[0]
  const ref = hit?.photos?.[0]?.photo_reference
  if (!ref) return null
  return `/api/places-photo?ref=${encodeURIComponent(ref)}`
}

async function wikiPhoto(name, city, kind) {
  const queries = [
    city ? `${name} ${city}` : name,
    kind === 'hotel' && city ? `${name} hotel ${city}` : null,
    kind === 'food' && city ? `${name} ${city} restaurant` : null,
    city ? `${name} ${city} India` : null,
  ].filter(Boolean)
  for (const q of queries) {
    const api =
      `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json` +
      `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=8` +
      `&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=1400&pilimit=8`
    const res = await fetch(api, { headers: { 'User-Agent': 'YatraSense/1.0 (travel companion)' } })
    if (!res.ok) continue
    const data = await res.json()
    const pages = Object.values(data.query?.pages || {})
    for (const page of pages) {
      const src = page.thumbnail?.source
      if (!usableUrl(src)) continue
      if (!titleFits(page.title || '', name, city, kind) && !titleFits(page.title || '', `${name} ${city || ''}`, city, kind)) continue
      return src
    }
  }
  return null
}

async function commonsPhoto(name, city, kind = 'place') {
  const q = city ? `${name} ${city}` : name
  const url =
    `https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=10` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1400`
  const res = await fetch(url, { headers: { 'User-Agent': 'YatraSense/1.0 (travel companion)' } })
  if (!res.ok) return null
  const data = await res.json()
  const pages = Object.values(data.query?.pages || {})
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    const src = info?.thumburl || info?.url
    const title = page.title || info?.extmetadata?.ObjectName?.value || ''
    if (!usableUrl(src)) continue
    if (titleFits(title.replace(/^File:/i, ''), name, city, kind)) return src
  }
  return null
}

export async function findVenuePhoto(name, city, kind = 'place') {
  const key = `${kind}|${name}|${city}`.toLowerCase()
  if (cache.has(key)) return cache.get(key)
  let url = await googlePhoto(name, city, kind)
  if (!url) url = await wikiPhoto(name, city, kind)
  if (!url) url = await commonsPhoto(name, city, kind)
  cache.set(key, url)
  return url
}
