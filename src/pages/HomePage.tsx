import { motion } from 'framer-motion'
import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DESTINATIONS } from '@/data/destinations'
import { QUICK_PRESETS, useAppStore } from '@/store/useAppStore'
import { greeting } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AdaptStory } from '@/components/home/AdaptStory'

export function HomePage() {
  const user = useAppStore((s) => s.user)
  const query = useAppStore((s) => s.planner.destinationQuery)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const applyPreset = useAppStore((s) => s.applyPreset)
  const navigate = useNavigate()
  const matches = DESTINATIONS.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()) || d.state.toLowerCase().includes(query.toLowerCase()),
  )

  const requestLocation = useAppStore((s) => s.requestLocation)
  const location = useAppStore((s) => s.location)

  const goPlan = (destinationId?: string, name?: string) => {
    const guessed =
      destinationId ??
      (query.toLowerCase().includes('vizag') || query.toLowerCase().includes('visakh') ? 'vizag' : null)
    setPlanner({
      destinationId: guessed,
      destinationQuery: name ?? query,
      step: guessed || query.trim() ? 2 : 1,
    })
    navigate('/plan')
  }

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
            YatraSense plans your journey, understands what’s happening around you, and adapts your itinerary when
            reality changes.
          </p>
          <p className="mt-6 text-lg font-medium">Where are you going next?</p>
          <div className="mt-3 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 text-ink-900 shadow-float">
            <MapPin className="ml-3 size-4 text-teal-800" />
            <input
              value={query}
              onChange={(e) => setPlanner({ destinationQuery: e.target.value, destinationId: null })}
              onKeyDown={(e) => e.key === 'Enter' && goPlan()}
              placeholder="Search a city, landmark or destination..."
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              className="grid size-10 place-items-center rounded-full hover:bg-sand-100"
              aria-label="Use current location"
              onClick={() => {
                if (location.permission === 'granted' && location.fix) {
                  const id = `geo_${location.fix.lat.toFixed(4)}_${location.fix.lng.toFixed(4)}`
                  setPlanner({
                    destinationQuery: location.label || 'Current location',
                    destinationId: id,
                  })
                  goPlan(id, location.label || 'Current location')
                  return
                }
                void requestLocation()
              }}
            >
              <LocateFixed className="size-4 text-teal-800" />
            </button>
            <Button size="sm" onClick={() => goPlan()}>
              <Search className="size-4" /> Search
            </Button>
          </div>
          {query && (
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" variant="sunset" onClick={() => goPlan('vizag', 'Visakhapatnam')}>
              Plan My Trip ✨
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/explore')}>
              Explore Destinations
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm text-ink-500">Ready to explore somewhere new?</p>
          <p className="mt-2 rounded-2xl bg-teal-50 p-4 text-sm dark:bg-teal-950">
            Based on your preferences, you may enjoy {user.preferences.styles.join(' + ')} experiences.
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Travel insight</p>
          <p className="mt-2 font-display text-xl">Nature + local food is your sweet spot.</p>
        </Card>
      </div>

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
