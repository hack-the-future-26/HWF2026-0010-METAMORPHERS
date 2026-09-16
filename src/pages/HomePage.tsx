import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Compass,
  Hotel,
  LocateFixed,
  MapPin,
  Radio,
  Sparkles,
  UtensilsCrossed,
  Volume2,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DESTINATIONS, featuredDestinations, getDestination } from '@/data/destinations'
import { CITY_FOODS } from '@/data/cityEssentials'
import { QUICK_PRESETS, useAppStore } from '@/store/useAppStore'
import { addDays, formatInr, todayIso } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { PlaceImage } from '@/components/ui/PlaceImage'
import { AdaptationCard } from '@/components/trip/ShareTripModal'
import { getPlace } from '@/data/places'
import {
  fetchArrival,
  fetchChecklist,
  saveChecklist,
  type ArrivalGuide,
  type BackendWeather,
  type CityFoodPick,
} from '@/services/backend'

const CITIES = ['Hyderabad', 'Jaipur', 'Goa', 'Udaipur', 'Varanasi', 'Mumbai', 'Kochi', 'Leh']

export function HomePage() {
  const user = useAppStore((s) => s.user)
  const trip = useAppStore((s) => s.trip)
  const query = useAppStore((s) => s.planner.destinationQuery)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const applyPreset = useAppStore((s) => s.applyPreset)
  const destId = useAppStore((s) => s.planner.destinationId)
  const requestLocation = useAppStore((s) => s.requestLocation)
  const generate = useAppStore((s) => s.generateTrip)
  const start = useAppStore((s) => s.startTrip)
  const liveStarted = useAppStore((s) => s.liveStarted)
  const conditions = useAppStore((s) => s.conditions)
  const navigate = useNavigate()
  const dest = destId ? getDestination(destId) : null
  const featured = featuredDestinations()
  const cityName = dest?.name ?? query ?? 'your next city'

  const [guide, setGuide] = useState<ArrivalGuide | null>(null)
  const [weather, setWeather] = useState<BackendWeather | null>(null)
  const [loading, setLoading] = useState(false)
  const [hour, setHour] = useState(0)
  const [done, setDone] = useState<string[]>([])
  const [foods, setFoods] = useState<CityFoodPick[]>([])
  const [planning, setPlanning] = useState(false)

  const pickHour = (count: number) => {
    const h = new Date().getHours()
    if (!count) return 0
    if (h < 6 || h >= 21) return Math.min(4, count - 1)
    if (h < 11) return 0
    if (h < 15) return Math.min(2, count - 1)
    return Math.min(3, count - 1)
  }

  useEffect(() => {
    let live = true
    if (!destId) {
      setLoading(false)
      setGuide(null)
      setWeather(null)
      setFoods([])
      return () => {
        live = false
      }
    }
    setLoading(true)
    setFoods((CITY_FOODS[destId] ?? []).map((f) => ({ dish: f.dish, place: f.place, phone: f.phone, website: f.website })))
    setGuide(null)
    void fetchArrival(destId)
      .then((payload) => {
        if (!live) return
        setGuide(payload.arrival)
        setWeather(payload.weather)
        setFoods(payload.foods ?? [])
        setHour(pickHour(payload.arrival.hours.length))
      })
      .catch(() => {
        if (!live) return
        setGuide(null)
        setWeather(null)
      })
      .finally(() => {
        if (live) setLoading(false)
      })
    void fetchChecklist(destId).then((list) => {
      if (live) setDone(list)
    })
    return () => {
      live = false
    }
  }, [destId])

  const goPlan = (destinationId?: string, name?: string) => {
    const picked = destinationId ?? destId
    const city = DESTINATIONS.find((d) => d.id === picked)
    setPlanner({
      destinationId: picked,
      destinationQuery: name ?? city?.name ?? query,
      step: 1,
    })
    navigate('/plan')
  }

  const searchCity = (name: string) => {
    const hit = DESTINATIONS.find((d) => d.name.toLowerCase() === name.toLowerCase())
    setPlanner({
      destinationId: hit?.id ?? null,
      destinationQuery: name,
      step: 1,
    })
    navigate('/plan')
  }

  const buildTrip = async () => {
    if (!dest) {
      navigate('/plan')
      return
    }
    setPlanning(true)
    setPlanner({
      destinationId: destId,
      destinationQuery: dest.name,
      startDate: todayIso(),
      endDate: addDays(todayIso(), 2),
      step: 4,
    })
    try {
      await generate()
      const err = useAppStore.getState().planner.generateError
      if (useAppStore.getState().trip && !err) navigate('/trip')
      else navigate('/plan')
    } finally {
      setPlanning(false)
    }
  }

  const pickCity = (id: string, name: string) => {
    setPlanner({ destinationId: id, destinationQuery: name })
  }

  const toggleStep = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]
    setDone(next)
    if (destId) void saveChecklist(destId, next)
  }

  const speak = (text: string, lang: string) => {
    if (!window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = `${lang}-IN`
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  }

  const step = guide?.hours[hour]
  const doneCount = guide ? guide.hours.filter((h) => done.includes(h.id)).length : 0
  const donePct = guide?.hours.length ? Math.round((doneCount / guide.hours.length) * 100) : 0
  const hello = user.name && user.name !== 'Guest' ? user.name.split(' ')[0] : 'there'
  const liveWeather = weather && !weather.unavailable ? weather : conditions.weather.unavailable ? null : conditions.weather
  const nextAct = trip?.daysPlan[0]?.activities.find((a) => a.kind === 'place')
  const nextPlace = nextAct?.placeId ? getPlace(nextAct.placeId) : undefined
  const band = trip?.budgetEstimate

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.section
        key={dest?.id ?? 'discover'}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-ink-900 text-white shadow-float"
      >
        {dest ? (
          <PlaceImage
            src={dest.image}
            name={dest.name}
            city={dest.name}
            lat={dest.lat}
            lng={dest.lng}
            className="absolute inset-0 h-full w-full opacity-45"
            imgClassName="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/75 to-teal-950/30" />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sunset-400">
            {trip ? 'Your living itinerary' : dest ? `Destination · ${dest.name}` : 'Adaptive travel'}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl leading-[1.08] sm:text-5xl">
            {trip
              ? `${trip.title} is watching the weather with you.`
              : dest
                ? `Build a day in ${dest.name} that can change when the city does.`
                : `Hi ${hello}. Name a city — maps, booking apps, and reviews still leave the day frozen.`}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
            {trip
              ? 'Open Live when you start walking. Rain and heat run the same rewrite engine as Demo Mode.'
              : 'Search any city, score a plan to your budget, then let live weather rewrite outdoor stops — with a reason.'}
          </p>
          {liveWeather && (
            <div className="mt-5 inline-flex rounded-full bg-white/12 px-3 py-1.5 text-xs backdrop-blur">
              {liveWeather.tempC}°C · {liveWeather.summary}
              {'rainProbability' in liveWeather ? ` · rain ${liveWeather.rainProbability}%` : ''}
              {' · Open-Meteo'}
            </div>
          )}
          {!trip && (
            <>
              <div className="mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 text-ink-900 shadow-float">
                <MapPin className="ml-3 size-4 text-teal-800" />
                <input
                  value={query}
                  onChange={(e) => setPlanner({ destinationQuery: e.target.value, destinationId: null })}
                  onKeyDown={(e) => e.key === 'Enter' && goPlan()}
                  placeholder="An Indian city — Hyderabad, Jaipur, Goa…"
                  className="h-11 flex-1 bg-transparent text-sm outline-none"
                />
                <button className="grid size-10 place-items-center rounded-full hover:bg-sand-100" onClick={() => void requestLocation()} aria-label="Use GPS">
                  <LocateFixed className="size-4 text-teal-800" />
                </button>
                <Button size="sm" onClick={() => (dest ? void buildTrip() : goPlan())} disabled={planning}>
                  {planning ? 'Planning…' : dest ? 'Build trip' : 'Plan'}
                </Button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {CITIES.map((name) => (
                  <button
                    key={name}
                    onClick={() => searchCity(name)}
                    className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/16"
                  >
                    {name}
                  </button>
                ))}
              </div>
              {featured.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {featured.slice(0, 8).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => pickCity(d.id, d.name)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                        destId === d.id ? 'bg-white text-ink-900' : 'bg-white/10 hover:bg-white/16'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {trip && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button className="bg-white text-ink-900 hover:bg-sand-100" onClick={() => (liveStarted ? navigate('/live') : (start(), navigate('/live')))}>
                <Radio className="size-4" /> {liveStarted ? 'Open live trip' : 'Start live trip'}
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/trip')}>
                Full itinerary
              </Button>
            </div>
          )}
        </div>
      </motion.section>

      <AdaptationCard />

      {trip && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Next stop" value={nextPlace?.name ?? nextAct?.title ?? 'Open itinerary'} />
          <Stat
            label="Estimate"
            value={
              band
                ? `${formatInr(band.low)}–${formatInr(band.high)}`
                : trip.estimatedSpend > 0
                  ? formatInr(trip.estimatedSpend)
                  : '—'
            }
          />
          <Stat label="Days" value={`${trip.days}`} />
          <Stat label="Match" value={trip.matchScore > 0 ? `${trip.matchScore}%` : 'Rate a day'} />
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { to: '/plan', label: trip ? 'Edit the plan' : 'Build my days', icon: Sparkles, hint: 'Scored itinerary' },
          { to: '/explore', label: 'Places around you', icon: Compass, hint: 'Live OSM map' },
          { to: '/food', label: 'Where to eat', icon: UtensilsCrossed, hint: guide?.firstMeal.slice(0, 42) ?? 'Food near the plan' },
          { to: '/stay', label: 'Where to sleep', icon: Hotel, hint: guide?.stayArea ?? 'Live hotel pins' },
          { to: '/budget', label: 'Watch the ₹ range', icon: Wallet, hint: 'Optimize if you overshoot' },
        ].map((x) => (
          <motion.button
            key={x.to}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => (x.to === '/plan' ? goPlan() : navigate(x.to))}
            className="rounded-3xl bg-white p-4 text-left shadow-card ring-1 ring-black/5 dark:bg-ink-800"
          >
            <x.icon className="size-5 text-teal-800" />
            <p className="mt-3 font-medium">{x.label}</p>
            <p className="mt-1 line-clamp-2 text-xs text-ink-500">{x.hint}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-teal-800">
              Open <ArrowRight className="size-3" />
            </span>
          </motion.button>
        ))}
      </section>

      {!trip && (
        <section>
          <h2 className="font-display text-2xl">Or start from a trip shape</h2>
          <p className="mt-1 text-sm text-ink-500">Presets fill pace and budget. You still pick the city.</p>
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
      )}

      {dest && (
        <>
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">Food that exists in {dest.name}</h2>
                <p className="mt-1 text-sm text-ink-500">Named halls when we have them — then live map cafes on Food.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/food')}>
                All food
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(foods.length
                ? foods
                : (CITY_FOODS[destId ?? ''] ?? []).map((f) => ({ dish: f.dish, place: f.place, phone: f.phone, website: f.website }))
              ).map((f) => (
                <div key={`${f.dish}-${f.place}`} className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-ink-800">
                  <PlaceImage name={f.place} city={dest.name} category="restaurant" imgClassName="h-36 w-full" />
                  <div className="p-4">
                    <p className="font-display text-xl">{f.dish}</p>
                    <p className="mt-1 text-sm text-ink-500">{f.place}</p>
                    {f.phone && (
                      <a href={`tel:${f.phone.replace(/\s/g, '')}`} className="mt-2 inline-block text-sm text-teal-800">
                        {f.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-gradient-to-br from-teal-800 to-ink-900 p-6 text-white sm:p-8">
            <h2 className="font-display text-3xl">Stay pins from the live map</h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              Hotels for {dest.name} load from OpenStreetMap — distance, price band when listed, rating when listed. Not a pair of
              hardcoded names, and not a booking checkout.
            </p>
            <Button className="mt-5 bg-white text-ink-900 hover:bg-sand-100" onClick={() => navigate('/stay')}>
              Open hotels
            </Button>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl">First hours in {cityName}</h2>
                <p className="mt-1 text-sm text-ink-500">Check steps off — they save with this destination.</p>
              </div>
              {loading ? (
                <span className="text-xs text-ink-400">Writing your briefing…</span>
              ) : guide ? (
                <div className="min-w-[8rem] text-right">
                  <p className="text-xs font-medium text-teal-800">
                    {doneCount}/{guide.hours.length} done
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200 dark:bg-white/10">
                    <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${donePct}%` }} />
                  </div>
                </div>
              ) : (
                <span className="text-xs text-ink-400">Briefing uses the API when it is online.</span>
              )}
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(guide?.hours ?? []).map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => setHour(i)}
                  className={`min-w-[9.5rem] rounded-2xl px-3 py-3 text-left text-xs shadow-card ring-1 transition ${
                    hour === i ? 'bg-teal-800 text-white ring-teal-800' : 'bg-white ring-black/5 dark:bg-ink-800 dark:ring-white/10'
                  }`}
                >
                  <span className="block font-semibold uppercase tracking-wider opacity-70">{h.t}</span>
                  <span className="mt-1 block text-sm font-medium">{h.title}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              {step && (
                <motion.div key={step.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-sunset-600">{step.t}</p>
                        <h3 className="mt-1 font-display text-2xl">{step.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-sand-200">{step.detail}</p>
                      </div>
                      <Button size="sm" variant={done.includes(step.id) ? 'secondary' : 'primary'} onClick={() => toggleStep(step.id)}>
                        <Check className="size-4" />
                        {done.includes(step.id) ? 'Done' : 'Mark done'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {guide && (
            <section>
              <h2 className="font-display text-2xl">Say this on the street</h2>
              <p className="mt-1 text-sm text-ink-500">{guide.lang} — tap listen if you do not want to guess the sound.</p>
              <div className="mt-4 space-y-2">
                {guide.phrases.map((p) => (
                  <div key={p.en} className="flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-3 shadow-card dark:bg-ink-800">
                    <div>
                      <p className="text-xs text-ink-400">{p.en}</p>
                      <p className="font-medium">{p.local}</p>
                    </div>
                    <button className="grid size-10 place-items-center rounded-full bg-sand-100 dark:bg-white/8" onClick={() => speak(p.local, p.lang)} aria-label="Listen">
                      <Volume2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <PackingList destName={dest.name} done={done} onToggle={toggleStep} />
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white p-4 shadow-card dark:bg-ink-800">
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-400">{label}</p>
      <p className="mt-1 font-display text-lg sm:text-xl">{value}</p>
    </div>
  )
}

function PackingList({
  destName,
  done,
  onToggle,
}: {
  destName: string
  done: string[]
  onToggle: (id: string) => void
}) {
  const [custom, setCustom] = useState('')
  const [extras, setExtras] = useState<string[]>([])
  const base = [
    { id: 'pack-docs', label: 'Travel documents' },
    { id: 'pack-weather', label: `Weather-specific items for ${destName}` },
    { id: 'pack-meds', label: 'Medication' },
    { id: 'pack-power', label: 'Power bank' },
    { id: 'pack-id', label: 'ID' },
  ]
  return (
    <section>
      <h2 className="font-display text-2xl">Packing checklist</h2>
      <p className="mt-1 text-sm text-ink-500">Saved with this destination. Add your own items.</p>
      <ul className="mt-4 space-y-2">
        {[...base, ...extras.map((label) => ({ id: `pack-custom-${label}`, label }))].map((item) => (
          <li key={item.id}>
            <button
              className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left text-sm shadow-card dark:bg-ink-800"
              onClick={() => onToggle(item.id)}
            >
              <span>{item.label}</span>
              <span>{done.includes(item.id) ? '✓' : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const label = custom.trim()
          if (!label) return
          setExtras((xs) => [...xs, label])
          setCustom('')
        }}
      >
        <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add a custom item" />
        <Button type="submit" variant="secondary">
          Add
        </Button>
      </form>
    </section>
  )
}
