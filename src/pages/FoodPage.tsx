import { useEffect } from 'react'
import { foodCityId, foodsAsPlaces } from '@/data/cityEssentials'
import { placesForDestination } from '@/data/places'
import { destDisplayLabel, getDestination } from '@/data/destinations'
import { PlacesBrowser } from '@/components/places/PlacesBrowser'
import { useAppStore } from '@/store/useAppStore'
import type { Place } from '@/types'

const foody = (p: Place) =>
  p.category === 'restaurant' ||
  p.category === 'cafe' ||
  p.nearbyKind === 'cafe' ||
  p.nearbyKind === 'restaurant' ||
  p.tags.includes('fast_food') ||
  p.tags.includes('streetfood') ||
  p.tags.includes('famous') ||
  p.styles.includes('food')

export function FoodPage() {
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId)
  const destLabel = destId ? destDisplayLabel(getDestination(destId)) : 'your destination'
  const loading = useAppStore((s) => s.nearbyLoading)
  const error = useAppStore((s) => s.nearbyError)
  const refresh = useAppStore((s) => s.refreshNearby)
  const foodKey = destId ? foodCityId(destId) : ''
  const catalog = [
    ...(destId ? foodsAsPlaces(destId) : []),
    ...(foodKey === 'vizag' ? placesForDestination('vizag').filter(foody) : []),
  ]
  const seen = new Set<string>()
  const places = [...catalog, ...nearby.filter(foody)].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
  const hasFamous = places.some((p) => p.tags.includes('famous'))

  useEffect(() => {
    void refresh(true)
  }, [destId, refresh])

  return (
    <PlacesBrowser
      key={destId || 'food'}
      title="Famous food"
      subtitle={`Signature dishes in ${destLabel} when we have them, then live-map restaurants and cafes.`}
      filters={[
        ...(hasFamous ? [{ id: 'famous', label: '★ Famous', match: (p: Place) => p.tags.includes('famous') }] : []),
        { id: 'all', label: '🍴 All', match: foody },
        { id: 'cafe', label: '☕ Cafe', match: (p: Place) => p.category === 'cafe' || p.nearbyKind === 'cafe' },
        { id: 'restaurant', label: '🍛 Restaurant', match: (p: Place) => p.category === 'restaurant' && !p.tags.includes('fast_food') },
      ]}
      places={places}
      loading={loading}
      error={error}
      onRetry={() => void refresh(true)}
    />
  )
}
