import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { spentTotal, useAppStore } from '@/store/useAppStore'
import { getPlace } from '@/data/places'
import { rankPlaces } from '@/lib/recommend'
import { activeOrigin } from '@/lib/origin'
import { formatKm, haversineKm } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { AdaptationCard } from '@/components/trip/ShareTripModal'
import { SafetyPanel } from '@/components/safety/SOSModal'
import { TripMap } from '@/components/map/TripMap'
import { DataSources } from '@/components/status/DataSources'
import { toast } from 'sonner'

export function LiveTripPage() {
  const trip = useAppStore((s) => s.trip)
  const live = useAppStore((s) => s.liveStarted)
  const start = useAppStore((s) => s.startTrip)
  const conditions = useAppStore((s) => s.conditions)
  const expenses = useAppStore((s) => s.expenses)
  const online = useAppStore((s) => s.online)
  const hydrate = useAppStore((s) => s.hydrateWeather)
  const location = useAppStore((s) => s.location)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const liveRoute = useAppStore((s) => s.liveRoute)
  const requestLocation = useAppStore((s) => s.requestLocation)
  const offRoute = useAppStore((s) => s.offRoute)
  const rerouting = useAppStore((s) => s.rerouting)
  const weatherError = Boolean(conditions.weather.unavailable)
  const navigate = useNavigate()
  const origin = activeOrigin(location, trip?.destinationId)
  const remaining = (trip?.budget ?? 5000) - spentTotal(expenses)

  const day = trip?.daysPlan[0]
  const nextAct = day?.activities.find((a) => a.kind === 'place')
  const next = nextAct?.placeId
    ? (getPlace(nextAct.placeId) ?? nearbyPlaces.find((p) => p.id === nextAct.placeId))
    : undefined

  const ranked = useMemo(() => {
    const pool = nearbyPlaces.length ? nearbyPlaces : []
    return rankPlaces(pool, origin, trip?.styles ?? [], conditions, remaining, trip)
  }, [nearbyPlaces, origin.lat, origin.lng, trip, conditions, remaining])

  const top = ranked[0]
  const nextMovePlace = top
    ? (getPlace(top.score.placeId) ?? nearbyPlaces.find((p) => p.id === top.score.placeId) ?? next)
    : next

  if (!trip) {
    return (
      <EmptyState
        title="Start a trip first"
        body="Generate an itinerary, then enter live mode so weather can rewrite the day."
        action={{ label: 'Plan My Trip ✨', onClick: () => navigate('/plan') }}
      />
    )
  }

  if (!live) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-4xl">This is the gap maps leave open</h1>
        <p className="mt-3 text-sm text-ink-500">
          Live mode watches GPS and Open-Meteo. If rain or heat crosses the line, the itinerary changes — and you can ask why.
        </p>
        <Button className="mt-6" size="lg" onClick={start}>
          Start Trip
        </Button>
      </div>
    )
  }

  const etaMin = liveRoute?.minutes ?? (next ? Math.round((haversineKm(origin, next) / 28) * 60) : 0)
  const dist = liveRoute ? formatKm(liveRoute.km) : next ? formatKm(haversineKm(origin, next)) : '—'
  const rain = conditions.weather.rainProbability
  const health =
    conditions.weather.unavailable || location.permission === 'denied'
      ? 'Attention'
      : rain >= 70
        ? 'Action required'
        : 'Good'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-teal-700">LIVE TRIP STATUS</p>
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
              {location.permission === 'denied'
                ? 'GPS permission denied. Never pretending a live fix.'
                : location.permission === 'timeout'
                  ? 'GPS timed out. Using the planned destination.'
                  : 'Using the planned city centre until GPS is allowed. '}
              {location.permission !== 'denied' && (
                <button className="underline" onClick={() => void requestLocation()}>
                  Allow location
                </button>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!online && <span className="rounded-full bg-ink-900 px-3 py-1 text-xs text-white">Offline — saved info</span>}
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
              <p className="text-lg">{liveRoute?.source === 'osrm' ? '🛣️ Road' : 'Route unavailable'}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-teal-100">Trip health: {health}</p>
          {liveRoute?.source === 'haversine' || liveRoute?.source === 'unavailable' ? (
            <p className="mt-2 text-xs text-teal-100">Route unavailable — distance is a straight-line estimate</p>
          ) : null}
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Live conditions</p>
          {weatherError ? (
            <div className="mt-3">
              <p>Weather feed did not respond. Retry to load Open-Meteo.</p>
              <Button size="sm" className="mt-3" onClick={() => void hydrate()}>
                Retry
              </Button>
            </div>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                🌤️ Weather: {conditions.weather.tempC}°C
                {conditions.weather.apparentTempC != null ? ` (feels ${conditions.weather.apparentTempC}°)` : ''}
                {conditions.weather.stale ? ' · CACHED' : ' · LIVE'}
                {' · Open-Meteo'}
              </li>
              {conditions.weather.fetchedAt && (
                <li className="text-ink-400">
                  Last updated:{' '}
                  {new Date(conditions.weather.fetchedAt).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                  {conditions.weather.stale ? ' · cached' : ''}
                </li>
              )}
              <li>🌧️ Rain probability: {conditions.weather.rainProbability}%</li>
              <li>
                Traffic: Unavailable
                <span className="block text-[11px] text-ink-400">Source: No live traffic provider connected</span>
              </li>
              <li>
                Crowd level: Unavailable
                <span className="block text-[11px] text-ink-400">Source: No live crowd provider connected</span>
              </li>
              {next?.hoursKnown === true ? (
                <li>
                  🕐 Hours:{' '}
                  {conditions.closures.includes(next.id) ? 'Closed' : next.openingHours || 'Listed hours on file'}
                </li>
              ) : null}
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
      <DataSources />

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

      <TripMap height={360} />
      <SafetyPanel />
    </div>
  )
}
