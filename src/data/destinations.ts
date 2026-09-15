import { commonsFile } from '@/lib/media'
import type { Destination } from '@/types'

const extras = new Map<string, Destination>()

export function registerDestination(d: Destination) {
  extras.set(d.id, d)
}

const img = (file: string) => commonsFile(file, 1600)

/** City-center WGS84 coordinates (not neighbourhood placeholders). */
export const DESTINATIONS: Destination[] = [
  {
    id: 'delhi',
    name: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    tagline: 'Capital boulevards, forts and street food.',
    image: img('India Gate in New Delhi 03-2016.jpg'),
    lat: 28.6139,
    lng: 77.209,
    timezone: 'Asia/Kolkata',
    famousFor: 'India Gate, Qutub Minar, Humayun’s Tomb, Chandni Chowk',
    highlights: ['India Gate', 'Qutub Minar', 'Red Fort', 'Lotus Temple', 'Humayun’s Tomb'],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    tagline: 'Gateway of India, marine drive and city nights.',
    image: img('Gateway_of_India.jpg'),
    lat: 19.076,
    lng: 72.8777,
    timezone: 'Asia/Kolkata',
    famousFor: 'Gateway of India, Marine Drive, Elephanta Caves',
    highlights: ['Gateway of India', 'Marine Drive', 'Chhatrapati Shivaji Terminus', 'Juhu Beach'],
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    tagline: 'Gardens, cafes and a cooler Deccan plateau.',
    image: img('Bangalore Palace.jpg'),
    lat: 12.9716,
    lng: 77.5946,
    timezone: 'Asia/Kolkata',
    famousFor: 'Lalbagh, Cubbon Park, Bangalore Palace',
    highlights: ['Lalbagh Botanical Garden', 'Cubbon Park', 'Bangalore Palace', 'ISKCON Temple'],
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    tagline: 'Charminar, biryani and Hussain Sagar light.',
    image: img('Charminar Hyderabad.jpg'),
    lat: 17.385,
    lng: 78.4867,
    timezone: 'Asia/Kolkata',
    famousFor: 'Charminar, Golconda Fort, Hussain Sagar',
    highlights: ['Charminar', 'Golconda Fort', 'Hussain Sagar', 'Chowmahalla Palace'],
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    tagline: 'Marina Beach, temples and Carnatic evenings.',
    image: img('Marina Beach, Chennai.jpg'),
    lat: 13.0827,
    lng: 80.2707,
    timezone: 'Asia/Kolkata',
    famousFor: 'Marina Beach, Kapaleeshwarar Temple, Fort St. George',
    highlights: ['Marina Beach', 'Kapaleeshwarar Temple', 'Fort St. George', 'Mahabalipuram day trip'],
  },
  {
    id: 'madurai',
    name: 'Madurai',
    city: 'Madurai',
    state: 'Tamil Nadu',
    country: 'India',
    tagline: 'Meenakshi Temple and jasmine-scented streets.',
    image: img('Meenakshi Amman Temple.jpg'),
    lat: 9.9252,
    lng: 78.1198,
    timezone: 'Asia/Kolkata',
    famousFor: 'Meenakshi Amman Temple, Thirumalai Nayakkar Palace, jigarthanda',
    highlights: ['Meenakshi Amman Temple', 'Thirumalai Nayakkar Palace', 'Gandhi Memorial Museum', 'Vaigai'],
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
    tagline: 'Howrah Bridge, tram lines and adda culture.',
    image: img('Victoria Memorial, Kolkata.jpg'),
    lat: 22.5726,
    lng: 88.3639,
    timezone: 'Asia/Kolkata',
    famousFor: 'Victoria Memorial, Howrah Bridge, Dakshineswar',
    highlights: ['Victoria Memorial', 'Howrah Bridge', 'Indian Museum', 'Park Street'],
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    tagline: 'Pink City palaces, bazaars and desert light.',
    image: img('Hawa Mahal 2011.jpg'),
    lat: 26.9124,
    lng: 75.7873,
    timezone: 'Asia/Kolkata',
    famousFor: 'Hawa Mahal, Amber Fort, City Palace',
    highlights: ['Hawa Mahal', 'Amber Fort', 'City Palace', 'Jantar Mantar'],
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    country: 'India',
    tagline: 'Taj Mahal sunrise and Yamuna mist.',
    image: img('Taj Mahal (Edited).jpeg'),
    lat: 27.1767,
    lng: 78.0081,
    timezone: 'Asia/Kolkata',
    famousFor: 'Taj Mahal, Agra Fort, Mehtab Bagh',
    highlights: ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh', 'Itimad-ud-Daulah'],
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    country: 'India',
    tagline: 'Ganga aarti, ghats and oldest living city.',
    image: img('Varanasi Ghats.jpg'),
    lat: 25.3176,
    lng: 82.9739,
    timezone: 'Asia/Kolkata',
    famousFor: 'Dashashwamedh Ghat, Kashi Vishwanath, Ganga aarti',
    highlights: ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Assi Ghat', 'Sarnath'],
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    tagline: 'Sun, spice and slow coastal evenings.',
    image: img('Palolem Beach, Goa.jpg'),
    lat: 15.4909,
    lng: 73.8278,
    timezone: 'Asia/Kolkata',
    famousFor: 'Baga and Calangute beaches, Old Goa churches, Panaji',
    highlights: ['Baga Beach', 'Calangute', 'Basilica of Bom Jesus', 'Fort Aguada'],
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    country: 'India',
    tagline: 'Lake palaces and Aravalli sunsets.',
    image: img('Lake Palace, Udaipur.jpg'),
    lat: 24.5854,
    lng: 73.7125,
    timezone: 'Asia/Kolkata',
    famousFor: 'City Palace, Lake Pichola, Jag Mandir',
    highlights: ['City Palace', 'Lake Pichola', 'Jag Mandir', 'Saheliyon ki Bari'],
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    country: 'India',
    tagline: 'Chinese fishing nets and spice-port history.',
    image: img('Chinese Fishing Nets in Kochi.jpg'),
    lat: 9.9312,
    lng: 76.2673,
    timezone: 'Asia/Kolkata',
    famousFor: 'Fort Kochi, Chinese nets, Mattancherry Palace',
    highlights: ['Fort Kochi', 'Chinese Fishing Nets', 'Mattancherry Palace', 'Jew Town'],
  },
  {
    id: 'munnar',
    name: 'Munnar',
    state: 'Kerala',
    country: 'India',
    tagline: 'Tea hills, mist and quiet mornings.',
    image: img('Munnar hillstation kerala.jpg'),
    lat: 10.0889,
    lng: 77.0595,
    timezone: 'Asia/Kolkata',
    famousFor: 'Tea estates, Eravikulam National Park, Mattupetty Dam',
    highlights: ['Tea Museum', 'Eravikulam National Park', 'Mattupetty Dam', 'Top Station'],
  },
  {
    id: 'pondy',
    name: 'Puducherry',
    state: 'Puducherry',
    country: 'India',
    tagline: 'French quarter lanes and Bay of Bengal breeze.',
    image: img('Promenade Beach Pondicherry.jpg'),
    lat: 11.9416,
    lng: 79.8083,
    timezone: 'Asia/Kolkata',
    famousFor: 'Promenade Beach, White Town, Auroville',
    highlights: ['Promenade Beach', 'White Town', 'Auroville', 'Sri Aurobindo Ashram'],
  },
  {
    id: 'vizag',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    country: 'India',
    tagline: 'The City of Destiny — beaches, hills and harbour.',
    image: img('RK Beach Visakhapatnam.jpg'),
    lat: 17.7041,
    lng: 83.2977,
    timezone: 'Asia/Kolkata',
    famousFor: 'RK Beach, Kailasagiri, INS Kursura, Rushikonda',
    highlights: ['RK Beach', 'Kailasagiri', 'INS Kursura Submarine Museum', 'Rushikonda Beach', 'Yarada Beach'],
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    country: 'India',
    tagline: 'Golden Temple and Wagah evening.',
    image: img('Harmandir Sahib.jpg'),
    lat: 31.634,
    lng: 74.8723,
    timezone: 'Asia/Kolkata',
    famousFor: 'Golden Temple, Jallianwala Bagh, Wagah Border',
    highlights: ['Golden Temple', 'Jallianwala Bagh', 'Wagah Border', 'Partition Museum'],
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    country: 'India',
    tagline: 'Ganga rafting, yoga and Laxman Jhula.',
    image: img('Lakshman Jhula, Rishikesh.jpg'),
    lat: 30.0869,
    lng: 78.2676,
    timezone: 'Asia/Kolkata',
    famousFor: 'Laxman Jhula, Beatles Ashram, river rafting',
    highlights: ['Laxman Jhula', 'Ram Jhula', 'Triveni Ghat', 'Beatles Ashram'],
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    tagline: 'Beas valley, snow and Solang meadows.',
    image: img('Manali Himachal.jpg'),
    lat: 32.2396,
    lng: 77.1887,
    timezone: 'Asia/Kolkata',
    famousFor: 'Hadimba Temple, Solang Valley, Rohtang',
    highlights: ['Hadimba Temple', 'Solang Valley', 'Old Manali', 'Jogini Falls'],
  },
  {
    id: 'shimla',
    name: 'Shimla',
    state: 'Himachal Pradesh',
    country: 'India',
    tagline: 'Ridge walks and Himalayan toy-train air.',
    image: img('The Ridge Shimla.jpg'),
    lat: 31.1048,
    lng: 77.1734,
    timezone: 'Asia/Kolkata',
    famousFor: 'The Ridge, Mall Road, Jakhu Temple',
    highlights: ['The Ridge', 'Mall Road', 'Jakhu Temple', 'Christ Church'],
  },
  {
    id: 'mysuru',
    name: 'Mysuru',
    state: 'Karnataka',
    country: 'India',
    tagline: 'Palace lights, silk and Chamundi Hill.',
    image: img('Mysore Palace Morning.jpg'),
    lat: 12.2958,
    lng: 76.6394,
    timezone: 'Asia/Kolkata',
    famousFor: 'Mysore Palace, Chamundi Hill, Brindavan Gardens',
    highlights: ['Mysore Palace', 'Chamundi Hill', 'Devaraja Market', 'Brindavan Gardens'],
  },
  {
    id: 'jaisalmer',
    name: 'Jaisalmer',
    state: 'Rajasthan',
    country: 'India',
    tagline: 'Golden fort and Thar dunes.',
    image: img('Jaisalmer Fort.jpg'),
    lat: 26.9157,
    lng: 70.9083,
    timezone: 'Asia/Kolkata',
    famousFor: 'Jaisalmer Fort, Sam Sand Dunes, Patwon Ki Haveli',
    highlights: ['Jaisalmer Fort', 'Sam Sand Dunes', 'Patwon Ki Haveli', 'Gadisar Lake'],
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    country: 'India',
    tagline: 'Vijayanagara ruins on the Tungabhadra.',
    image: img('Vittala Temple Hampi.jpg'),
    lat: 15.335,
    lng: 76.46,
    timezone: 'Asia/Kolkata',
    famousFor: 'Virupaksha Temple, Stone Chariot, Vittala Temple',
    highlights: ['Virupaksha Temple', 'Vittala Temple', 'Stone Chariot', 'Lotus Mahal'],
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    tagline: 'Sahyadri weekends and old-city lanes.',
    image: img('Shaniwar Wada.jpg'),
    lat: 18.5204,
    lng: 73.8567,
    timezone: 'Asia/Kolkata',
    famousFor: 'Shaniwar Wada, Aga Khan Palace, Sinhagad',
    highlights: ['Shaniwar Wada', 'Aga Khan Palace', 'Sinhagad Fort', 'FC Road'],
  },
  {
    id: 'darjeeling',
    name: 'Darjeeling',
    state: 'West Bengal',
    country: 'India',
    tagline: 'Tea ridges and Kanchenjunga views.',
    image: img('Darjeeling from Tiger Hill.jpg'),
    lat: 27.036,
    lng: 88.2627,
    timezone: 'Asia/Kolkata',
    famousFor: 'Tiger Hill sunrise, tea estates, toy train',
    highlights: ['Tiger Hill', 'Batasia Loop', 'Happy Valley Tea Estate', 'Mall Road'],
  },
  {
    id: 'leh',
    name: 'Leh',
    state: 'Ladakh',
    country: 'India',
    tagline: 'High-altitude monasteries and desert mountains.',
    image: img('Leh Palace.jpg'),
    lat: 34.1526,
    lng: 77.5771,
    timezone: 'Asia/Kolkata',
    famousFor: 'Leh Palace, Magnetic Hill, Pangong Tso (day trip)',
    highlights: ['Leh Palace', 'Shanti Stupa', 'Magnetic Hill', 'Thiksey Monastery'],
  },
]

const UNRESOLVED: Destination = {
  id: 'unresolved',
  name: 'Unknown destination',
  state: '',
  country: '',
  tagline: '',
  image: DESTINATIONS[0].image,
  lat: 0,
  lng: 0,
  timezone: 'UTC',
}

export function findDestination(id?: string | null): Destination | undefined {
  if (!id) return undefined
  const found = extras.get(id) ?? DESTINATIONS.find((d) => d.id === id)
  if (found) return found
  const m = /^geo_(-?\d+\.?\d*)_(-?\d+\.?\d*)/.exec(id)
  if (m) {
    return {
      id,
      name: extras.get(id)?.name || 'Selected location',
      displayName: extras.get(id)?.displayName,
      city: extras.get(id)?.city,
      state: extras.get(id)?.state || '',
      country: extras.get(id)?.country || '',
      tagline: extras.get(id)?.tagline || `${Number(m[1]).toFixed(4)}, ${Number(m[2]).toFixed(4)}`,
      image: DESTINATIONS[0].image,
      lat: Number(m[1]),
      lng: Number(m[2]),
      timezone: extras.get(id)?.timezone || 'UTC',
    }
  }
  return undefined
}

/** Never substitutes Visakhapatnam for an unknown id. */
export function getDestination(id: string): Destination {
  return findDestination(id) ?? { ...UNRESOLVED, id, name: id || 'Unknown destination' }
}

const SEARCH_ALIASES: Record<string, string> = {
  madhurai: 'madurai',
  bangalore: 'bengaluru',
  bombay: 'mumbai',
  madras: 'chennai',
  calcutta: 'kolkata',
  benares: 'varanasi',
  pondicherry: 'pondy',
  visakhapatnam: 'vizag',
}

const STREET_LIKE = /\b(lane|street|road|nagar|colony|layout|sector|block|avenue|marg)\b/i
const OFF_CITY = /\b(moka|mauritius)\b/i
const INDIA_LAT = { min: 6.5, max: 35.7 }
const INDIA_LNG = { min: 68.1, max: 97.4 }

export function isStreetLevelName(name?: string | null) {
  return STREET_LIKE.test(String(name || ''))
}

export type CityHealHint = {
  name?: string
  city?: string
  country?: string
  displayName?: string
  state?: string
  lat?: number
  lng?: number
}

function healBlob(d?: CityHealHint | null, query?: string) {
  return `${d?.name ?? ''} ${d?.city ?? ''} ${d?.country ?? ''} ${d?.displayName ?? ''} ${query ?? ''}`
}

export function coordsOutsideIndia(lat?: number, lng?: number) {
  if (lat == null || lng == null) return false
  if (lat === 0 && lng === 0) return false
  return lat < INDIA_LAT.min || lat > INDIA_LAT.max || lng < INDIA_LNG.min || lng > INDIA_LNG.max
}

/** Street / Photon house hit / Mauritius-Moka — Food and Stay need the parent Indian city. */
export function needsCityHeal(d?: CityHealHint | null, query?: string) {
  const blob = healBlob(d, query)
  if (isStreetLevelName(blob)) return true
  if (OFF_CITY.test(blob)) return true
  if (d?.country && !/india/i.test(d.country) && OFF_CITY.test(d.country + ' ' + (d.city ?? ''))) return true
  if (coordsOutsideIndia(d?.lat, d?.lng) && (isStreetLevelName(blob) || OFF_CITY.test(blob) || cityHealQuery(d, query))) {
    return true
  }
  return false
}

/** First Indian city token we can recover from a street-level Photon label. */
export function cityHealQuery(d?: CityHealHint | null, query?: string) {
  const parts = [query, d?.displayName, d?.name, d?.city]
    .filter(Boolean)
    .join(', ')
    .split(/[,/|]/)
    .map((s) => s.replace(STREET_LIKE, ' ').replace(OFF_CITY, ' ').replace(/\s+/g, ' ').trim())
    .filter((s) => s && !/^selected location$/i.test(s))
  for (const part of parts) {
    const lower = part.toLowerCase()
    if (SEARCH_ALIASES[lower]) return SEARCH_ALIASES[lower]
    const catalog = DESTINATIONS.find(
      (c) => c.id === lower || c.name.toLowerCase() === lower || (c.city ?? '').toLowerCase() === lower,
    )
    if (catalog) return catalog.id
    const first = lower.split(/\s+/)[0]
    if (SEARCH_ALIASES[first]) return SEARCH_ALIASES[first]
    const firstHit = DESTINATIONS.find((c) => c.id === first || c.name.toLowerCase() === first)
    if (firstHit) return firstHit.id
  }
  return parts[0] || ''
}

export function catalogParentCity(d?: CityHealHint | null, query?: string): Destination | undefined {
  const q = cityHealQuery(d, query).toLowerCase()
  if (!q) return undefined
  const aliased = SEARCH_ALIASES[q] || q
  return DESTINATIONS.find(
    (c) =>
      c.id === aliased ||
      c.id === q ||
      c.name.toLowerCase() === aliased ||
      c.name.toLowerCase() === q ||
      (c.city ?? '').toLowerCase() === aliased,
  )
}

/** Prefer a parent city over a street-level Photon hit for lodging search. */
export function lodgingCityName(d: { name: string; city?: string; displayName?: string; country?: string; lat?: number; lng?: number }) {
  const parent = needsCityHeal(d) ? catalogParentCity(d) : undefined
  if (parent) return parent.name
  if (OFF_CITY.test(`${d.city ?? ''} ${d.country ?? ''}`)) {
    const stripped = d.name.replace(STREET_LIKE, ' ').split(',')[0].trim()
    const aliased = SEARCH_ALIASES[stripped.toLowerCase()]
    if (aliased) {
      const hit = DESTINATIONS.find((c) => c.id === aliased)
      if (hit) return hit.name
    }
    if (stripped) return stripped
  }
  if (isStreetLevelName(d.name) && d.city && !isStreetLevelName(d.city) && !OFF_CITY.test(d.city)) return d.city
  if (d.city && !isStreetLevelName(d.city) && !OFF_CITY.test(d.city)) return d.city
  return d.name
}

export function destDisplayLabel(d: {
  name: string
  city?: string
  displayName?: string
  country?: string
  state?: string
  lat?: number
  lng?: number
}) {
  const parent = needsCityHeal(d) ? catalogParentCity(d) : undefined
  const name = parent ? parent.name : lodgingCityName(d)
  const state = parent?.state || d.state
  return state ? `${name}, ${state}` : name
}

export function searchDestinations(q: string) {
  const s = q.trim().toLowerCase()
  const aliased = SEARCH_ALIASES[s] || s
  const extra = [...extras.values()]
  const catalog = [...extra, ...DESTINATIONS]
  if (!s) return DESTINATIONS
  const seen = new Set<string>()
  const out: Destination[] = []
  for (const d of catalog) {
    if (seen.has(d.id)) continue
    const hay = `${d.name} ${d.city ?? ''} ${d.state} ${d.country} ${d.tagline} ${d.famousFor ?? ''} ${d.id} ${d.displayName ?? ''}`.toLowerCase()
    if (hay.includes(s) || d.id === aliased || d.name.toLowerCase() === aliased || (d.city ?? '').toLowerCase() === aliased) {
      seen.add(d.id)
      out.push(d)
    }
  }
  return out
}

export function featuredDestinations() {
  return DESTINATIONS.filter((d) =>
    ['delhi', 'mumbai', 'jaipur', 'goa', 'agra', 'varanasi', 'hyderabad', 'bengaluru', 'vizag', 'chennai', 'udaipur', 'kochi'].includes(
      d.id,
    ),
  )
}
