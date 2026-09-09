import { useEffect } from 'react'
import { placesForDestination } from '@/data/places'
import { PlacesBrowser } from '@/components/places/PlacesBrowser'
import { useAppStore } from '@/store/useAppStore'
import type { Place } from '@/types'

const stay = (p: Place) => p.category === 'hotel' || p.tags.includes('stay') || p.tags.includes('hotel')

export function StayPage() {
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const destId = useAppStore((s) => s.planner.destinationId) ?? 'vizag'
  const loading = useAppStore((s) => s.nearbyLoading)
  const error = useAppStore((s) => s.nearbyError)
  const refresh = useAppStore((s) => s.refreshNearby)
  const catalog = destId === 'vizag' ? placesForDestination('vizag').filter(stay) : []
  const seen = new Set<string>()
  const places = [...nearby.filter(stay), ...catalog].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))

  useEffect(() => {
    if (!nearby.length) void refresh(true)
  }, [nearby.length, refresh])

  return (
    <PlacesBrowser
      title="Stay"
      subtitle="Hotels and accommodation from OpenStreetMap. Ratings and prices are not invented."
      filters={[{ id: 'all', label: '🏨 Hotels', match: stay }]}
      places={places}
      loading={loading}
      error={error}
      onRetry={() => void refresh(true)}
    />
  )
}
