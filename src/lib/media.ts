const photoCache = new Map<string, string | null>()

export function commonsFile(file: string, width = 1280) {
  const name = file.replace(/^File:/i, '').trim()
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${width}`
}

export function latLngToTile(lat: number, lng: number, z: number) {
  const n = 2 ** z
  const x = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x: Math.min(n - 1, Math.max(0, x)), y: Math.min(n - 1, Math.max(0, y)) }
}

/** Aerial photograph of the exact coordinates (always available). */
export function satellitePhoto(lat: number, lng: number, z = 17) {
  const { x, y } = latLngToTile(lat, lng, z)
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
}

export function streetPhoto(lat: number, lng: number, z = 16) {
  const { x, y } = latLngToTile(lat, lng, z)
  return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png`
}

export function immediatePlacePhoto(lat?: number, lng?: number) {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return satellitePhoto(lat, lng)
}

function queriesFor(name: string, city?: string) {
  const clean = name.replace(/\s+/g, ' ').trim()
  const short = clean.split(/[,(–—-]/)[0]?.trim() || clean
  const words = short.split(' ').slice(0, 4).join(' ')
  const out = [clean, short, words]
  if (city) {
    out.unshift(`${short} ${city}`, `${clean} ${city}`)
    out.push(`${short} India`)
  }
  return [...new Set(out.filter((q) => q.length >= 3))]
}

async function wikiSearchImage(query: string): Promise<string | null> {
  const url =
    `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json` +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=1200&pilimit=5`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { thumbnail?: { source?: string } }> }
  }
  const pages = Object.values(data.query?.pages ?? {})
  return pages.find((p) => p.thumbnail?.source)?.thumbnail?.source ?? null
}

async function commonsSearchImage(query: string): Promise<string | null> {
  const url =
    `https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=1200`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { imageinfo?: { thumburl?: string; url?: string }[] }> }
  }
  const pages = Object.values(data.query?.pages ?? {})
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    const src = info?.thumburl || info?.url
    if (src && !/\.svg($|\?)/i.test(src)) return src
  }
  return null
}

export async function lookupPlacePhoto(name: string, city?: string): Promise<string | null> {
  const key = `${name}|${city ?? ''}`.trim()
  if (!key) return null
  if (photoCache.has(key)) return photoCache.get(key) ?? null

  try {
    for (const q of queriesFor(name, city)) {
      const wiki = await wikiSearchImage(q)
      if (wiki) {
        photoCache.set(key, wiki)
        return wiki
      }
    }
    const commons = await commonsSearchImage(city ? `${name} ${city}` : name)
    photoCache.set(key, commons)
    return commons
  } catch {
    photoCache.set(key, null)
    return null
  }
}

export async function wikiImage(title: string): Promise<string | null> {
  return lookupPlacePhoto(title)
}
