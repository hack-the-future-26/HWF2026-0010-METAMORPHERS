import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { placesForDestination } from '@/data/places'
import { getDestination } from '@/data/destinations'
import { crowdOf, spentTotal, useAppStore } from '@/store/useAppStore'
import { activeOrigin } from '@/lib/origin'
import { rankPlaces } from '@/lib/recommend'
import { formatInr, formatKm, haversineKm } from '@/lib/utils'
import { whyRecommended } from '@/services/aiService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CrowdDot } from '@/components/ui/Feedback'
import { toast } from 'sonner'

const CATS = ['All', 'Nature', 'Food', 'History', 'Adventure', 'Shopping', 'Hidden Gems'] as const

export function ExplorePage() {
  const trip = useAppStore((s) => s.trip)
  const plannerDest = useAppStore((s) => s.planner.destinationId)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const destId = trip?.destinationId ?? plannerDest ?? nearbyPlaces[0]?.destinationId ?? null
  const conditions = useAppStore((s) => s.conditions)
  const userStyles = useAppStore((s) => s.user.preferences.styles)
  const styles = trip?.styles.length ? trip.styles : userStyles
  const select = useAppStore((s) => s.setSelectedPlace)
  const add = useAppStore((s) => s.addPlaceToTrip)
  const online = useAppStore((s) => s.online)
  const nearbyLoading = useAppStore((s) => s.nearbyLoading)
  const location = useAppStore((s) => s.location)
  const appMode = useAppStore((s) => s.appMode)
  const expenses = useAppStore((s) => s.expenses)
  const remaining = (trip?.budget ?? 5000) - spentTotal(expenses)
  const origin = activeOrigin(location, destId)
  const dest = destId ? getDestination(destId) : { name: origin.label || 'Nearby', tagline: 'Places from OpenStreetMap' }
  const [cat, setCat] = useState<(typeof CATS)[number]>('All')
  const navigate = useNavigate()

  const places = useMemo(() => {
    const seen = new Set<string>()
    const source =
      nearbyPlaces.length || appMode !== 'demo' || !destId ? nearbyPlaces : placesForDestination(destId)
    const pool = source.filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      if (haversineKm(origin, p) > 14) return false
      if (p.category === 'emergency' || p.category === 'transport') return false
      if (cat === 'All') return p.category === 'attraction' || p.category === 'hidden' || p.category === 'restaurant'
      if (cat === 'Hidden Gems') return p.category === 'hidden' || p.tags.includes('hidden')
      if (cat === 'Food') return p.styles.includes('food') || p.category === 'restaurant' || p.category === 'cafe'
      if (cat === 'Nature') return p.styles.includes('nature')
      if (cat === 'History') return p.styles.includes('history')
      if (cat === 'Adventure') return p.styles.includes('adventure')
      if (cat === 'Shopping') return p.styles.includes('shopping') || p.category === 'shopping'
      return true
    })
    return rankPlaces(pool, origin, styles, conditions, remaining, trip).map((r) => r.place)
  }, [cat, destId, nearbyPlaces, origin.lat, origin.lng, styles, conditions, remaining, trip, appMode])

  const featured = places[0]
  const featuredScore = featured
    ? rankPlaces([featured], origin, styles, conditions, remaining, trip)[0]?.score
    : undefined

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-4xl">Explore {origin.source === 'gps' ? origin.label.split(',')[0] : dest.name}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {origin.source === 'gps' ? `Places near ${origin.label}` : dest.tagline}
        {nearbyLoading ? ' · Finding OSM places…' : ''}
      </p>
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${cat === c ? 'bg-teal-800 text-white' : 'bg-white dark:bg-ink-800'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {featured && (
        <div className="mt-6 rounded-3xl bg-teal-50 p-5 dark:bg-teal-950">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Why we’re recommending this</p>
          <p className="mt-2 text-sm leading-relaxed">{whyRecommended(featured, styles, conditions, origin)}</p>
          {featuredScore && (
            <ul className="mt-2 space-y-1 text-xs text-teal-900 dark:text-teal-200">
              {featuredScore.reasons.map((r) => (
                <li key={r}>✓ {r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((p) => {
          const km = haversineKm(origin, p)
          const crowd = crowdOf(p, conditions.crowdOverrides)
          return (
            <article key={p.id} className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-ink-800">
              {p.image ? (
                <img src={p.image} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="grid h-40 place-items-center bg-teal-50 text-3xl dark:bg-teal-950">📍</div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{p.name}</h3>
                  <Badge>{p.ratingKnown === false ? 'Rating n/a' : `⭐ ${p.rating}`}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {p.styles[0] ?? p.category} · {formatKm(km)} ·{' '}
                  {p.priceKnown === false ? 'Price unavailable' : p.entryFee ? formatInr(p.entryFee) : '₹0'}
                  {p.source === 'osm' ? ' · OSM' : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {appMode === 'demo' && p.crowdKnown !== false ? (
                    <CrowdDot level={crowd} />
                  ) : (
                    <span className="text-ink-400">Live crowd data unavailable</span>
                  )}
                  <span>🌤️ {p.hoursKnown === false ? 'Not available from OSM' : p.bestTime}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => select(p.id)}>
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      add(p.id)
                      toast.success(`Added ${p.name}`)
                      navigate('/trip')
                    }}
                  >
                    Add to Trip
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!online) return toast.error('Navigation needs a connection.')
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank')
                    }}
                  >
                    Navigate
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
