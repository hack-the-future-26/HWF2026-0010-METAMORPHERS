import { useEffect } from 'react'
import { getPlace, placesForDestination } from '@/data/places'
import { getDestination } from '@/data/destinations'
import { PlacesBrowser } from '@/components/places/PlacesBrowser'
import { useAppStore } from '@/store/useAppStore'
import { LIVE_TRAFFIC_UNAVAILABLE } from '@/lib/osmCopy'
import type { Place } from '@/types'

const hubs = ['railway', 'vtz-airport', 'rtc-complex']
const transport = (p: Place) =>
  p.category === 'transport' ||
  p.tags.includes('airport') ||
  p.tags.includes('train') ||
  p.tags.includes('bus') ||
  p.tags.includes('aeroway') ||
  p.tags.includes('station')

export function TransportPage() {
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId) ?? 'vizag'
  const dest = getDestination(destId)
  const loading = useAppStore((s) => s.nearbyLoading)
  const error = useAppStore((s) => s.nearbyError)
  const refresh = useAppStore((s) => s.refreshNearby)
  const catalog =
    destId === 'vizag'
      ? [
          ...(hubs.map((id) => getPlace(id)).filter(Boolean) as Place[]),
          ...placesForDestination('vizag').filter(transport),
        ]
      : nearby.filter(transport)
  const seen = new Set<string>()
  const places = [...catalog, ...nearby.filter(transport)].filter((p) =>
    seen.has(p.id) ? false : (seen.add(p.id), true),
  )

  useEffect(() => {
    void refresh(true)
  }, [destId, refresh])

  return (
    <div>
      <p className="mx-auto mb-2 max-w-6xl text-xs text-ink-400">{LIVE_TRAFFIC_UNAVAILABLE}</p>
      <PlacesBrowser
        title="Transport"
        subtitle={`Airport, railway and bus points around ${dest.name}. Use Navigate for road directions.`}
        filters={[{ id: 'all', label: '🚌 Hubs', match: transport }]}
        places={places}
        loading={loading}
        error={error}
        onRetry={() => void refresh(true)}
        showNavigate
      />
    </div>
  )
}
