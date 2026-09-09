import { useEffect } from 'react'
import { placesForDestination } from '@/data/places'
import { PlacesBrowser, type PlaceFilter } from '@/components/places/PlacesBrowser'
import { useAppStore } from '@/store/useAppStore'
import type { Place } from '@/types'

const FILTERS: PlaceFilter[] = [
  { id: 'all', label: '✨ All', match: () => true },
  { id: 'attractions', label: '🌴 Attractions', match: (p) => p.category === 'attraction' || p.category === 'hidden' },
  { id: 'beaches', label: '🏖️ Beaches', match: (p) => p.styles.includes('beaches') || p.tags.includes('beach') },
  { id: 'nature', label: '🌳 Nature', match: (p) => p.styles.includes('nature') },
  { id: 'culture', label: '🏛️ Culture', match: (p) => p.styles.includes('culture') || p.styles.includes('history') },
  { id: 'food', label: '🍴 Food', match: (p) => p.category === 'restaurant' || p.category === 'cafe' || p.styles.includes('food') },
  { id: 'shopping', label: '🛍️ Shopping', match: (p) => p.category === 'shopping' || p.styles.includes('shopping') },
  {
    id: 'experiences',
    label: '🎭 Experiences',
    match: (p) => p.category === 'attraction' || p.styles.includes('adventure') || p.styles.includes('photography'),
  },
]

const browseable = (p: Place) => p.category !== 'emergency'

export function ExplorePage() {
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId) ?? 'vizag'
  const loading = useAppStore((s) => s.nearbyLoading)
  const error = useAppStore((s) => s.nearbyError)
  const refresh = useAppStore((s) => s.refreshNearby)
  const catalog = destId === 'vizag' ? placesForDestination('vizag') : []
  const seen = new Set<string>()
  const places = [...nearby, ...catalog].filter(browseable).filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))

  useEffect(() => {
    void refresh()
  }, [refresh])

  return (
    <PlacesBrowser
      title="Explore Nearby"
      subtitle="Real OpenStreetMap places around Visakhapatnam. Missing fields stay unavailable."
      filters={FILTERS}
      places={places}
      loading={loading}
      error={error}
      onRetry={() => void refresh(true)}
      showNavigate
    />
  )
}
