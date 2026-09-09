import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DESTINATIONS } from '@/data/destinations'
import { placesForDestination } from '@/data/places'
import { QUICK_PRESETS, useAppStore } from '@/store/useAppStore'
import { greeting, formatKm, haversineKm } from '@/lib/utils'
import { DEMO_AREA } from '@/lib/demoLocation'
import { areaOrigin } from '@/lib/origin'
import { HOURS_UNAVAILABLE, OSM_UNAVAILABLE, PRICE_UNAVAILABLE, WEATHER_UNAVAILABLE, honestRating } from '@/lib/osmCopy'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AdaptStory } from '@/components/home/AdaptStory'

const LANDMARKS = ['rk-beach', 'kailasagiri', 'submarine', 'tenneti', 'rushikonda']

export function HomePage() {
  const user = useAppStore((s) => s.user)
  const query = useAppStore((s) => s.planner.destinationQuery)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const applyPreset = useAppStore((s) => s.applyPreset)
  const weather = useAppStore((s) => s.conditions.weather)
  const hydrate = useAppStore((s) => s.hydrateWeather)
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const nearbyLoading = useAppStore((s) => s.nearbyLoading)
  const nearbyError = useAppStore((s) => s.nearbyError)
  const refresh = useAppStore((s) => s.refreshNearby)
  const trip = useAppStore((s) => s.trip)
  const adaptation = useAppStore((s) => s.adaptation)
  const destId = useAppStore((s) => s.planner.destinationId) ?? DEMO_AREA.destinationId
  const appMode = useAppStore((s) => s.appMode)
  const add = useAppStore((s) => s.addPlaceToTrip)
  const save = useAppStore((s) => s.savePlace)
  const navigate = useNavigate()
  const origin = areaOrigin(destId)
  const matches = DESTINATIONS.filter(
    (d) =>
      query &&
      (d.name.toLowerCase().includes(query.toLowerCase()) || d.state.toLowerCase().includes(query.toLowerCase())),
  )

  useEffect(() => {
    void hydrate()
    void refresh()
  }, [hydrate, refresh])

  const goPlan = (destinationId?: string, name?: string) => {
    const guessed =
      destinationId ??
      (query.toLowerCase().includes('vizag') || query.toLowerCase().includes('visakh') ? 'vizag' : null)
    setPlanner({
      destinationId: guessed ?? destId,
      destinationQuery: name ?? query ?? DEMO_AREA.city,
      step: 2,
    })
    navigate('/plan')
  }

  const catalog = destId === 'vizag' ? placesForDestination('vizag') : []
  const recs = (() => {
    const pool = [...nearby, ...catalog]
    const picked = LANDMARKS.map((id) => pool.find((p) => p.id === id)).filter(Boolean)
    const extras = pool.filter(
      (p) =>
        (p.category === 'attraction' || p.styles.includes('beaches') || p.styles.includes('culture')) &&
        !picked.some((x) => x && x.id === p.id),
    )
    return [...picked, ...extras].filter((p): p is NonNullable<typeof p> => Boolean(p)).slice(0, 6)
  })()

  const recLine = adaptation
    ? `YatraSense already adapted your plan: ${adaptation.original.title} → ${adaptation.recommended[0]?.title}.`
    : weather.unavailable
      ? `Based on your location near ${DEMO_AREA.neighbourhood} and your ${user.preferences.styles.join(' + ') || 'travel'} preferences, YatraSense recommends starting with the coast and a nearby indoor stop once weather loads.`
      : `Based on the current weather (${weather.tempC}°C, ${weather.rainProbability}% rain), location near ${DEMO_AREA.neighbourhood} and your trip preferences, YatraSense recommends ${
          weather.rainProbability >= 55 ? 'an indoor museum or cafe first' : recs[0]?.name ?? 'Rushikonda Beach or RK Beach'
        }${trip ? ` — then continue your ${trip.title}.` : '.'}`

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-ink-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/20" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <p className="text-sm text-white/70">{greeting(user.name)} 👋</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.1] sm:text-5xl">
            Your trip. Your preferences. One intelligent plan.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Understand, plan, explore, monitor and adapt — YatraSense keeps Visakhapatnam (and any city you search)
            on one intelligent itinerary.
          </p>
          <p className="mt-6 text-lg font-medium">Where are you going next?</p>
          <div className="mt-3 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 text-ink-900 shadow-float">
            <MapPin className="ml-3 size-4 text-teal-800" />
            <input
              value={query}
              onChange={(e) => setPlanner({ destinationQuery: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && goPlan()}
              placeholder="Search a city — changing destination is explicit"
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              className="grid size-10 place-items-center rounded-full hover:bg-sand-100"
              aria-label="Use current location for GPS only"
              onClick={() => navigate('/live')}
            >
              <LocateFixed className="size-4 text-teal-800" />
            </button>
            <Button size="sm" onClick={() => goPlan()}>
              <Search className="size-4" /> Search
            </Button>
          </div>
          {query && query.toLowerCase() !== 'visakhapatnam' && (
            <div className="mt-3 max-w-xl space-y-1">
              {matches.map((d) => (
                <button
                  key={d.id}
                  onClick={() => goPlan(d.id, d.name)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/16"
                >
                  <img src={d.image} alt="" className="size-9 rounded-lg object-cover" />
                  <span>
                    {d.name}
                    <span className="block text-[11px] text-white/60">{d.state}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Current location</p>
          <p className="mt-2 text-lg font-medium">📍 {DEMO_AREA.shortLabel}</p>
          <p className="text-sm text-ink-500">
            {DEMO_AREA.city}, {DEMO_AREA.state}
          </p>
          <p className="mt-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-[11px] text-teal-800 dark:bg-teal-950 dark:text-teal-200">
            Using current area
          </p>
          <p className="mt-2 text-xs text-ink-400">Destination: {query || DEMO_AREA.city}</p>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Weather · Open-Meteo</p>
          {weather.unavailable ? (
            <div className="mt-3">
              <p className="text-sm">{WEATHER_UNAVAILABLE}</p>
              <Button size="sm" className="mt-3" onClick={() => void hydrate()}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <WeatherStat k="Now" v={`${weather.tempC}°C`} />
              <WeatherStat k="Condition" v={weather.summary || weather.condition} />
              <WeatherStat k="Rain" v={`${weather.rainProbability}%`} />
              <WeatherStat k="Wind" v={`${weather.windKph} km/h`} />
              <WeatherStat k="Feels like" v={`${weather.apparentTempC ?? weather.tempC}°C`} />
            </div>
          )}
        </Card>
      </div>

      <section>
        <h2 className="font-display text-2xl">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="sunset" onClick={() => goPlan('vizag', 'Visakhapatnam')}>
            Plan My Trip ✨
          </Button>
          <Button variant="secondary" onClick={() => navigate('/explore')}>
            Explore Nearby
          </Button>
          <Button variant="secondary" onClick={() => navigate('/food')}>
            Find Food 🍴
          </Button>
          <Button variant="secondary" onClick={() => navigate('/stay')}>
            Hotels 🏨
          </Button>
          <Button variant="secondary" onClick={() => navigate('/transport')}>
            Transport 🚌
          </Button>
        </div>
      </section>

      <Card className="p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-teal-800">AI recommendation</p>
        <p className="mt-2 text-sm leading-relaxed">{recLine}</p>
      </Card>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Recommended experiences</h2>
          {nearbyLoading && <span className="text-xs text-ink-400">Finding nearby places...</span>}
        </div>
        {nearbyError && (
          <div className="mt-3 text-sm">
            Unable to load places right now.{' '}
            <button className="underline" onClick={() => void refresh(true)}>
              Try again
            </button>
          </div>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-ink-800">
              {p.image ? (
                <img src={p.image} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="grid h-36 place-items-center bg-teal-50 text-3xl">📍</div>
              )}
              <div className="p-4">
                <p className="font-medium">{p.name}</p>
                <p className="mt-1 text-xs text-ink-500">
                  {p.styles[0] ?? p.category} · {formatKm(haversineKm(origin, p))}
                </p>
                <p className="mt-2 text-[11px] text-ink-400">
                  {honestRating(p, appMode === 'real')} · {p.hoursKnown === true ? p.openingHours : HOURS_UNAVAILABLE} ·{' '}
                  {PRICE_UNAVAILABLE}
                </p>
                <p className="mt-1 text-[11px] text-ink-400">{p.description ? p.description.slice(0, 90) : OSM_UNAVAILABLE}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => { add(p.id); navigate('/trip') }}>
                    Add to Trip
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => save(p.id)}>
                    ♡ Save
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Quick Trip Planner</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {Object.entries(QUICK_PRESETS).map(([key, p]) => (
            <motion.button
              key={key}
              whileHover={{ y: -3 }}
              onClick={() => {
                applyPreset(key)
                navigate('/plan')
              }}
              className="rounded-3xl bg-white p-4 text-left shadow-card ring-1 ring-black/5 dark:bg-ink-800"
            >
              <p className="text-2xl">{p.emoji}</p>
              <p className="mt-2 font-medium">{p.label}</p>
              <p className="text-xs text-ink-500">{p.blurb}</p>
            </motion.button>
          ))}
        </div>
      </section>

      <AdaptStory />
    </div>
  )
}

function WeatherStat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-sand-100 px-3 py-2 dark:bg-white/5">
      <p className="text-[11px] text-ink-400">{k}</p>
      <p className="text-sm font-medium">{v}</p>
    </div>
  )
}
