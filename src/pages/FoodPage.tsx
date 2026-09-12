import { useEffect } from 'react'
import { placesForDestination } from '@/data/places'
import { getDestination } from '@/data/destinations'
import { PlacesBrowser } from '@/components/places/PlacesBrowser'
import { useAppStore } from '@/store/useAppStore'
import type { Place } from '@/types'

const foody = (p: Place) =>
  p.category === 'restaurant' ||
  p.category === 'cafe' ||
  p.nearbyKind === 'cafe' ||
  p.nearbyKind === 'restaurant' ||
  p.tags.includes('fast_food') ||
  p.tags.includes('streetfood')

export function FoodPage() {
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId) ?? 'vizag'
  const dest = getDestination(destId)
  const loading = useAppStore((s) => s.nearbyLoading)
  const error = useAppStore((s) => s.nearbyError)
  const refresh = useAppStore((s) => s.refreshNearby)
  const catalog = destId === 'vizag' ? placesForDestination('vizag').filter(foody) : []
  const seen = new Set<string>()
  const places = [...nearby.filter(foody), ...catalog].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))

  useEffect(() => {
    void refresh(true)
  }, [destId, refresh])

  return (
    <PlacesBrowser
      title="Find Food"
      subtitle={`Restaurants, cafes and food places from OpenStreetMap around ${dest.name}.`}
      filters={[
        { id: 'all', label: '🍴 All', match: foody },
        { id: 'cafe', label: '☕ Cafe', match: (p) => p.category === 'cafe' || p.nearbyKind === 'cafe' },
        { id: 'restaurant', label: '🍛 Restaurant', match: (p) => p.category === 'restaurant' && !p.tags.includes('fast_food') },
        { id: 'fast', label: '🥤 Fast Food', match: (p) => p.tags.includes('fast_food') },
      ]}
      places={places}
      loading={loading}
      error={error}
      onRetry={() => void refresh(true)}
    />
  )
}
