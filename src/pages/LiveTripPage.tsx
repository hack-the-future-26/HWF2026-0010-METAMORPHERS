import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { crowdOf, spentTotal, useAppStore } from '@/store/useAppStore'
import { getPlace } from '@/data/places'
import { rankPlaces } from '@/lib/recommend'
import { activeOrigin } from '@/lib/origin'
import { crowdLabel, formatKm, formatInr, haversineKm } from '@/lib/utils'
import type { NearbyKind } from '@/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { AdaptationCard } from '@/components/trip/ShareTripModal'
import { SafetyPanel } from '@/components/safety/SOSModal'
import { TripMap } from '@/components/map/TripMap'
import { toast } from 'sonner'

const NEAR: { id: NearbyKind; label: string; icon: string }[] = [
  { id: 'restaurant', label: 'Restaurants', icon: '🍛' },
  { id: 'cafe', label: 'Cafes', icon: '☕' },
  { id: 'hospital', label: 'Hospitals', icon: '🏥' },
  { id: 'pharmacy', label: 'Pharmacies', icon: '💊' },
  { id: 'restroom', label: 'Restrooms', icon: '🚻' },
  { id: 'fuel', label: 'Fuel', icon: '⛽' },
  { id: 'atm', label: 'ATMs', icon: '🏧' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
]

export function LiveTripPage() {
  const trip = useAppStore((s) => s.trip)
  const live = useAppStore((s) => s.liveStarted)
  const start = useAppStore((s) => s.startTrip)
  const conditions = useAppStore((s) => s.conditions)
  const expenses = useAppStore((s) => s.expenses)
  const crowdSuggestion = useAppStore((s) => s.crowdSuggestion)
  const acceptCrowd = useAppStore((s) => s.acceptCrowdMove)
  const select = useAppStore((s) => s.setSelectedPlace)
  const nearbyFilter = useAppStore((s) => s.nearbyFilter)
  const setNearby = useAppStore((s) => s.setNearby)
  const nearbySort = useAppStore((s) => s.nearbySort)
  const setSort = useAppStore((s) => s.setNearbySort)
  const online = useAppStore((s) => s.online)
  const hydrate = useAppStore((s) => s.hydrateWeather)
  const location = useAppStore((s) => s.location)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const nearbyLoading = useAppStore((s) => s.nearbyLoading)
  const liveRoute = useAppStore((s) => s.liveRoute)
  const appMode = useAppStore((s) => s.appMode)
  const requestLocation = useAppStore((s) => s.requestLocation)
  const offRoute = useAppStore((s) => s.offRoute)
  const rerouting = useAppStore((s) => s.rerouting)
  const weatherError = Boolean(conditions.weather.unavailable)
  const navigate = useNavigate()
  const origin = activeOrigin(location, trip?.destinationId)
  const remaining = (trip?.budget ?? 5000) - spentTotal(expenses)

  const day = trip?.daysPlan[0]
  const nextAct = day?.activities.find((a) => a.kind === 'place')
  const next = nextAct?.placeId ? getPlace(nextAct.placeId) : undefined

  const ranked = useMemo(() => {
    const pool = nearbyPlaces.length ? nearbyPlaces : []
    return rankPlaces(pool, origin, trip?.styles ?? [], conditions, remaining, trip)
  }, [nearbyPlaces, origin.lat, origin.lng, trip, conditions, remaining])

  const top = ranked[0]
  const nextMovePlace = top ? getPlace(top.score.placeId) : next

  const nearby = useMemo(() => {
    let list = nearbyPlaces
    if (nearbyFilter !== 'all') list = list.filter((p) => p.nearbyKind === nearbyFilter)
    return [...list].sort((a, b) => {
      if (nearbySort === 'rating') return (b.ratingKnown === false ? -1 : b.rating) - (a.ratingKnown === false ? -1 : a.rating)
      if (nearbySort === 'price') return a.estimatedCost - b.estimatedCost
      return haversineKm(origin, a) - haversineKm(origin, b)
    })
  }, [nearbyFilter, nearbySort, nearbyPlaces, origin.lat, origin.lng])

  if (!trip) {
    return (
      <EmptyState
        title="Start a trip first"
        body="Generate an itinerary, then enter live mode."
        action={{ label: 'Plan My Trip ✨', onClick: () => navigate('/plan') }}
      />
    )
  }

  if (!live) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-4xl">Ready when you are</h1>
        <p className="mt-3 text-sm text-ink-500">
          Live mode starts GPS tracking, watches weather, and keeps your next stop in sync.
        </p>
        <Button className="mt-6" size="lg" onClick={start}>
          Enter Live Trip Mode
        </Button>
      </div>
    )
  }

  const etaMin = liveRoute?.minutes ?? (next ? Math.round((haversineKm(origin, next) / 28) * 60) : 0)
  const dist = liveRoute ? formatKm(liveRoute.km) : next ? formatKm(haversineKm(origin, next)) : '—'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-teal-700">Live Trip Mode</p>
          <h1 className="font-display text-4xl">
            {location.loading ? 'Getting your location...' : 'You’re here 📍'}
          </h1>
          <p className="text-sm text-ink-500">{origin.label}</p>
          {location.fix && origin.source === 'gps' && (
            <p className="text-xs text-ink-400">
              {location.fix.lat.toFixed(5)}, {location.fix.lng.toFixed(5)}
              {origin.accuracy != null ? ` · ±${Math.round(origin.accuracy)}m` : ''}
              {origin.accuracy != null && origin.accuracy > 100 ? ' · low accuracy' : ''}
              {' · '}
              {location.permission}
            </p>
          )}
          {origin.source !== 'gps' && (
            <p className="text-xs text-ink-400">
              Using {origin.source === 'destination' ? 'destination' : 'fallback'} ·{' '}
              <button className="underline" onClick={() => void requestLocation()}>
                Allow location
              </button>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!online && <span className="rounded-full bg-ink-900 px-3 py-1 text-xs text-white">Offline — saved info</span>}
          <span className={`rounded-full px-3 py-1 text-xs ${appMode === 'real' ? 'bg-teal-800 text-white' : 'bg-ink-900 text-sunset-400'}`}>
            {appMode === 'real' ? 'LIVE MODE' : 'DEMO MODE'}
          </span>
        </div>
      </div>

      {offRoute && (
        <div className="rounded-3xl bg-sunset-500/15 px-4 py-3 text-sm">
          {rerouting ? 'You appear to be off route. Recalculating...' : 'You appear to be off route. Recalculating...'}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl bg-teal-800 p-5 text-white lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.16em] text-teal-100">Next</p>
          <h2 className="mt-1 font-display text-3xl">{next?.name ?? 'Add a stop'}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-teal-100">ETA</p>
              <p className="text-lg">{etaMin ? `${etaMin} min` : '—'}</p>
            </div>
            <div>
              <p className="text-teal-100">Distance</p>
              <p className="text-lg">{dist}</p>
            </div>
            <div>
              <p className="text-teal-100">Travel</p>
              <p className="text-lg">{liveRoute?.source === 'osrm' ? '🛣️ Road' : '🚕 Estimate'}</p>
            </div>
          </div>
          {liveRoute?.source === 'haversine' && (
            <p className="mt-2 text-xs text-teal-100">Straight-line estimate — routing API unavailable</p>
          )}
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Live conditions</p>
          {weatherError ? (
            <div className="mt-3">
              <p>Live weather is temporarily unavailable.</p>
              <Button size="sm" className="mt-3" onClick={() => void hydrate()}>
                Retry
              </Button>
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                🌤️ Weather: {conditions.weather.tempC}°C
                {conditions.weather.apparentTempC != null ? ` (feels ${conditions.weather.apparentTempC}°)` : ''}
                {conditions.weather.stale ? ' · stale' : ''}
              </li>
              <li>🌧️ Rain probability: {conditions.weather.rainProbability}%</li>
              <li>
                🚦 Traffic:{' '}
                {appMode === 'demo'
                  ? `${conditions.traffic === 'heavy' ? 'Heavy' : conditions.traffic === 'clear' ? 'Clear' : 'Moderate'} (simulated)`
                  : 'Live traffic unavailable'}
              </li>
              <li>
                👥 Crowd:{' '}
                {appMode === 'demo' && next
                  ? crowdLabel(crowdOf(next, conditions.crowdOverrides)) + ' (simulated)'
                  : 'Live crowd data unavailable'}
              </li>
              <li>
                🕐 Opening status:{' '}
                {next?.hoursKnown === false
                  ? 'Not available from OSM'
                  : conditions.closures.includes(next?.id ?? '')
                    ? 'Closed'
                    : next
                      ? 'Listed hours available'
                      : '—'}
              </li>
            </ul>
          )}
          {conditions.weather.hourly && conditions.weather.hourly.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar text-[11px]">
              {conditions.weather.hourly.slice(0, 6).map((h) => (
                <div key={h.time} className="min-w-[4.2rem] rounded-2xl bg-sand-100 px-2 py-1.5 dark:bg-white/8">
                  <p className="text-ink-400">{h.time.slice(11, 16)}</p>
                  <p className="font-medium">{h.tempC}°</p>
                  <p className="text-ink-400">{h.rainProbability}% rain</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdaptationCard />

      {crowdSuggestion && appMode === 'demo' && (
        <div className="rounded-3xl bg-amber-50 p-5 dark:bg-amber-500/10">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Simulated crowd</p>
          <p className="font-medium">
            {crowdSuggestion.original.title} · 🔴 High
          </p>
          <p className="mt-1 text-sm">{crowdSuggestion.message}</p>
          <p className="mt-1 text-sm text-ink-500">Recommendation: {crowdSuggestion.reason}</p>
          <Button className="mt-3" onClick={acceptCrowd}>
            Move to 7:30 AM
          </Button>
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Your Best Next Move</p>
        <h2 className="mt-1 font-display text-3xl">{nextMovePlace ? `Visit ${nextMovePlace.name}` : next?.name ?? 'Explore nearby'}</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {(top?.score.reasons ?? ['Using your itinerary next stop']).map((r) => (
            <li key={r}>✓ {r}</li>
          ))}
        </ul>
        <Button
          className="mt-4"
          onClick={() => {
            const p = nextMovePlace ?? next
            if (!p) return
            useAppStore.getState().goToPlace(p.id)
            toast.success(`${p.name} is now your next stop`)
          }}
        >
          Go There
        </Button>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl">Near You</h2>
          <div className="flex gap-2 text-xs">
            {(['distance', 'rating', 'price'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-3 py-1 capitalize ${nearbySort === s ? 'bg-teal-800 text-white' : 'bg-white dark:bg-ink-800'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {nearbyLoading && <p className="mt-3 text-sm text-ink-400">Finding places around you…</p>}
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setNearby('all')}
            className={`rounded-full px-3 py-1 text-sm ${nearbyFilter === 'all' ? 'bg-teal-800 text-white' : 'bg-white dark:bg-ink-800'}`}
          >
            All
          </button>
          {NEAR.map((n) => (
            <button
              key={n.id}
              onClick={() => setNearby(n.id)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm ${nearbyFilter === n.id ? 'bg-teal-800 text-white' : 'bg-white dark:bg-ink-800'}`}
            >
              {n.icon} {n.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {nearby.slice(0, 12).map((p) => (
            <button
              key={p.id}
              onClick={() => select(p.id)}
              className="flex items-center gap-3 rounded-3xl bg-white p-3 text-left shadow-card dark:bg-ink-800"
            >
              {p.image ? (
                <img src={p.image} alt="" className="size-14 rounded-2xl object-cover" />
              ) : (
                <div className="grid size-14 place-items-center rounded-2xl bg-teal-50 text-lg dark:bg-teal-950">📍</div>
              )}
              <span>
                <span className="block font-medium">{p.name}</span>
                <span className="text-xs text-ink-500">
                  {formatKm(haversineKm(origin, p))}
                  {p.ratingKnown === false ? ' · Not available from OSM' : ` · ⭐ ${p.rating}`}
                  {p.priceKnown === false ? '' : p.estimatedCost ? ` · ${formatInr(p.estimatedCost)}` : ''}
                </span>
              </span>
            </button>
          ))}
          {!nearbyLoading && nearby.length === 0 && (
            <p className="text-sm text-ink-400">No nearby results yet. Allow location or wait for OSM to load.</p>
          )}
        </div>
      </section>

      <TripMap height={360} />
      <SafetyPanel />
    </div>
  )
}
