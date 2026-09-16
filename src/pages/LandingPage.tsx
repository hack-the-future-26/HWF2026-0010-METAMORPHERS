import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CloudRain, Compass, MapPinned, Radio, Search, Sparkles, Wallet } from 'lucide-react'
import { DESTINATIONS, featuredDestinations } from '@/data/destinations'
import { commonsFile } from '@/lib/media'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { PlaceImage } from '@/components/ui/PlaceImage'
import type { Destination } from '@/types'

const RAIN_IN = commonsFile('Salar Jung Museum.jpg', 1280)

const SUGGESTED = ['Hyderabad', 'Jaipur', 'Goa', 'Udaipur', 'Varanasi', 'Mumbai', 'Kochi', 'Leh']

/** Famous catalog cities first, then every other Indian destination with a real image. */
const HERO_CITY_IDS = [
  'hyderabad',
  'jaipur',
  'agra',
  'varanasi',
  'mumbai',
  'delhi',
  'amritsar',
  'udaipur',
  'goa',
  'kochi',
  'leh',
  'madurai',
  'kolkata',
  'jaisalmer',
  'mysuru',
  'hampi',
  'chennai',
  'bengaluru',
  'rishikesh',
  'darjeeling',
  'shimla',
  'manali',
  'munnar',
  'pondy',
  'vizag',
  'pune',
] as const

const HERO_INTERVAL_MS = 3800

function heroSlides(): Destination[] {
  const seen = new Set<string>()
  const ordered = HERO_CITY_IDS.map((id) => DESTINATIONS.find((d) => d.id === id)).filter(
    (d): d is Destination => Boolean(d?.image),
  )
  const rest = DESTINATIONS.filter((d) => d.image && !ordered.some((s) => s.id === d.id))
  return [...ordered, ...rest].filter((d) => {
    if (seen.has(d.image)) return false
    seen.add(d.image)
    return true
  })
}

function landmarkLabel(d: Destination) {
  const landmark = d.highlights?.[0] || d.famousFor?.split(',')[0]?.trim() || d.name
  return landmark === d.name ? d.name : `${landmark}, ${d.name}`
}

export function LandingPage() {
  const navigate = useNavigate()
  const setPlanner = useAppStore((s) => s.setPlanner)
  const [query, setQuery] = useState('')
  const [heroIndex, setHeroIndex] = useState(0)
  const cities = featuredDestinations().slice(0, 8)
  const slides = useMemo(heroSlides, [])
  const current = slides[heroIndex] ?? slides[0]
  const rainOriginal = DESTINATIONS.find((d) => d.id === 'hyderabad') ?? slides[0]

  useEffect(() => {
    if (slides.length < 2) return
    let intervalId = 0
    const tick = () => setHeroIndex((i) => (i + 1) % slides.length)
    const first = window.setTimeout(() => {
      tick()
      intervalId = window.setInterval(tick, HERO_INTERVAL_MS)
    }, 2200)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(intervalId)
    }
  }, [slides.length])

  const startPlan = (city?: string) => {
    const q = (city ?? query).trim()
    setPlanner({
      destinationQuery: q,
      destinationId: null,
      step: 1,
    })
    navigate('/plan')
  }

  const pickCity = (id: string, name: string) => {
    setPlanner({ destinationId: id, destinationQuery: name, step: 1 })
    navigate('/plan')
  }

  return (
    <div>
      <section
        className="relative isolate min-h-dvh w-full overflow-hidden bg-ink-900 text-white"
        data-hero-place={current ? landmarkLabel(current) : ''}
        data-hero-count={slides.length}
      >
        {slides.map((d, i) => (
          <img
            key={d.id}
            src={d.image}
            alt=""
            aria-hidden={i !== heroIndex}
            loading={i <= 2 ? 'eager' : 'lazy'}
            fetchPriority={i === heroIndex ? 'high' : 'low'}
            className={`hero-slide absolute inset-0 h-full w-full object-cover ${
              i === heroIndex ? 'hero-slide-active hero-ken' : ''
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/88 via-ink-900/50 to-teal-900/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-transparent to-ink-900/35" />
        <div className="absolute -right-16 top-10 hidden h-64 w-64 rounded-full bg-sunset-500/20 blur-3xl lg:block" />

        <div className="relative flex min-h-dvh flex-col px-5 pb-6 pt-24 sm:px-10 sm:pb-8 sm:pt-28 lg:px-16">
          <div className="flex flex-1 flex-col justify-center py-6">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sunset-300 backdrop-blur">
              <Sparkles className="size-3.5" /> Adaptive travel
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.2rem]">
              A living itinerary for the city in front of you.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/78 sm:text-lg">
              Name a destination. YatraSense scores real map places to your pace and budget — then rewrites the day when
              rain or heat hits, and tells you why.
            </p>
            <form
              className="mt-9 flex max-w-xl flex-col gap-2 rounded-[1.7rem] bg-white p-2 text-ink-900 shadow-float sm:flex-row sm:items-center sm:rounded-full sm:p-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                startPlan()
              }}
            >
              <div className="flex flex-1 items-center">
                <Search className="ml-3 size-4 shrink-0 text-teal-800" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Where next? Hyderabad, Jaipur, Goa…"
                  className="h-12 flex-1 bg-transparent px-2 text-sm outline-none"
                />
              </div>
              <Button type="submit" className="shrink-0">
                Plan this trip <ArrowRight className="size-4" />
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => startPlan(city)}
                  className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs backdrop-blur hover:bg-white/20"
                >
                  {city}
                </button>
              ))}
            </div>
            <p className="mt-5 text-xs text-white/55">No account needed to plan. Save later if you want the trip to travel with you.</p>
          </div>

          {current && (
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/85"
              aria-live="polite"
              data-hero-caption
            >
              {landmarkLabel(current)}
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-14">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-600">Pick a city</p>
              <h2 className="mt-1 font-display text-3xl sm:text-4xl">Start from a place that already has a face</h2>
            </div>
            <Button variant="ghost" onClick={() => startPlan()}>
              Search another city <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cities.map((d) => (
              <button
                key={d.id}
                onClick={() => pickCity(d.id, d.name)}
                className="group relative overflow-hidden rounded-[1.6rem] text-left shadow-card"
              >
                <PlaceImage
                  src={d.image}
                  name={d.name}
                  city={d.name}
                  lat={d.lat}
                  lng={d.lng}
                  imgClassName="h-44 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-48"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent" />
                <span className="absolute bottom-3 left-3 right-3">
                  <span className="block font-display text-xl text-white sm:text-2xl">{d.name}</span>
                  <span className="mt-0.5 block text-[11px] text-white/70">{d.tagline}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-16 grid items-center gap-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-600">When the sky flips</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">The plan does not freeze on the outdoor fort.</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-500 sm:text-base">
              Rain at 70% or heat at 38°C runs the same engine as Demo Mode: swap the exposed stop, recast the route, and
              keep the ₹ range honest. You can always ask why.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-600">
              {[
                'Live Open-Meteo weather, not a stock icon',
                'Indoor alternatives scored from the same map pool',
                'OSRM roads after a change — never a fake straight line',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-700" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative pb-10 sm:pb-14">
            <div className="overflow-hidden rounded-[1.8rem] shadow-float">
              <img src={rainOriginal?.image} alt="Outdoor stop on a clear morning" className="h-52 w-full object-cover sm:h-64" />
              <div className="bg-ink-900 px-4 py-3 text-white">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Original</p>
                <p className="font-display text-xl">Charminar at 10:00</p>
              </div>
            </div>
            <div className="absolute -bottom-8 right-0 w-[78%] overflow-hidden rounded-[1.8rem] ring-4 ring-sand-100 shadow-float dark:ring-[#0b1113] sm:w-[70%]">
              <img src={RAIN_IN} alt="Indoor alternative after rain" className="h-40 w-full object-cover sm:h-48" />
              <div className="flex items-center gap-2 bg-teal-800 px-4 py-3 text-white">
                <CloudRain className="size-4 text-teal-100" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-teal-100">After rain ≥ 70%</p>
                  <p className="font-display text-lg leading-tight">Salar Jung Museum</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Compass,
              title: 'Scored, not scraped',
              body: 'Interests, distance, hours, weather and budget pick the stop. Every place can answer “why this one?”',
            },
            {
              icon: CloudRain,
              title: 'The day that adapts',
              body: 'Live weather and Demo Mode share one engine. Outdoor swaps indoor. The explanation stays on the card.',
            },
            {
              icon: Wallet,
              title: 'A ₹ range that follows',
              body: 'Stay, food, travel and activities sit in one estimate. Optimize when you go over — not a booking checkout.',
            },
          ].map((item) => (
            <article key={item.title} className="rounded-[1.8rem] bg-white p-6 shadow-card dark:bg-ink-800">
              <span className="grid size-11 place-items-center rounded-2xl bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                <item.icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-2xl leading-tight">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-14 overflow-hidden rounded-[2rem] bg-white p-6 shadow-card dark:bg-ink-800 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-600">Four beats</p>
          <h2 className="mt-1 font-display text-3xl">From a name on a map to a day that can change</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: '01', t: 'Name a city', d: 'Photon geocodes what you typed. We never silently swap another city.', icon: MapPinned },
              { n: '02', t: 'Shape the trip', d: 'Dates, people, style, pace and budget — four screens, then generate.', icon: Sparkles },
              { n: '03', t: 'Walk the days', d: 'OSM places, Open-Meteo, OSRM roads. Fake straight lines are not routes.', icon: Compass },
              { n: '04', t: 'Go live', d: 'GPS, next stop, and an engine that explains every rewrite.', icon: Radio },
            ].map((s) => (
              <article key={s.n}>
                <s.icon className="size-5 text-teal-800" />
                <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-sunset-600">{s.n}</p>
                <h3 className="mt-1 font-display text-xl">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-800 via-teal-900 to-ink-900 px-6 py-10 text-white sm:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.18em] text-teal-100">Ready when you are</p>
              <p className="mt-2 font-display text-4xl leading-tight">Search a city. Keep the day alive.</p>
              <p className="mt-3 text-sm text-white/70">Indian cities from the catalog — and a search box if yours isn’t listed. Sign in only when you want saved trips.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-white text-ink-900 hover:bg-sand-100" onClick={() => startPlan()}>
                Open planner <ArrowRight className="size-4" />
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => navigate('/login?mode=signup')}>
                Create account
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
