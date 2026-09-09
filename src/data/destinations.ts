import type { Destination } from '@/types'

const extras = new Map<string, Destination>()

export function registerDestination(d: Destination) {
  extras.set(d.id, d)
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'vizag',
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    country: 'India',
    tagline: 'The City of Destiny — beaches, hills and harbour light.',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    lat: 17.6868,
    lng: 83.2185,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    country: 'India',
    tagline: 'Sun, spice and slow coastal evenings.',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=80',
    lat: 15.4909,
    lng: 73.8278,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    tagline: 'Pink City palaces, bazaars and desert light.',
    image:
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=80',
    lat: 26.9124,
    lng: 75.7873,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'pondy',
    name: 'Pondicherry',
    state: 'Puducherry',
    country: 'India',
    tagline: 'French quarter lanes and Bay of Bengal breeze.',
    image:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74216?auto=format&fit=crop&w=1600&q=80',
    lat: 11.9416,
    lng: 79.8083,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'munnar',
    name: 'Munnar',
    state: 'Kerala',
    country: 'India',
    tagline: 'Tea hills, mist and quiet mornings.',
    image:
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1600&q=80',
    lat: 10.0889,
    lng: 77.0595,
    timezone: 'Asia/Kolkata',
  },
]

export function getDestination(id: string) {
  const found = extras.get(id) ?? DESTINATIONS.find((d) => d.id === id)
  if (found) return found
  const m = /^geo_(-?\d+\.?\d*)_(-?\d+\.?\d*)/.exec(id)
  if (m) {
    return {
      id,
      name: 'Selected location',
      state: '',
      country: '',
      tagline: `${m[1]}, ${m[2]}`,
      image: DESTINATIONS[0].image,
      lat: Number(m[1]),
      lng: Number(m[2]),
      timezone: 'Asia/Kolkata',
    }
  }
  return {
    id,
    name: 'Unknown destination',
    state: '',
    country: '',
    tagline: '',
    image: DESTINATIONS[0].image,
    lat: 0,
    lng: 0,
    timezone: 'UTC',
  }
}

export function searchDestinations(q: string) {
  const s = q.trim().toLowerCase()
  const extra = [...extras.values()]
  const catalog = [...extra, ...DESTINATIONS]
  if (!s) return DESTINATIONS
  return catalog.filter(
    (d) =>
      d.name.toLowerCase().includes(s) ||
      d.state.toLowerCase().includes(s) ||
      d.tagline.toLowerCase().includes(s),
  )
}
