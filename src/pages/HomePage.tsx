import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Compass, Hotel, Languages, LocateFixed, MapPin, Sparkles, UtensilsCrossed, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DESTINATIONS, featuredDestinations, getDestination } from '@/data/destinations'
import { QUICK_PRESETS, useAppStore } from '@/store/useAppStore'
import { DEFAULT_CITY } from '@/lib/demoLocation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PlaceImage } from '@/components/ui/PlaceImage'
import {
  askCompanion,
  fetchArrival,
  fetchChecklist,
  saveChecklist,
  type ArrivalGuide,
  type BackendWeather,
} from '@/services/backend'

export function HomePage() {
  const user = useAppStore((s) => s.user)
  const query = useAppStore((s) => s.planner.destinationQuery)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const applyPreset = useAppStore((s) => s.applyPreset)
  const destId = useAppStore((s) => s.planner.destinationId) ?? DEFAULT_CITY.destinationId
  const requestLocation = useAppStore((s) => s.requestLocation)
  const navigate = useNavigate()
  const dest = getDestination(destId)
  const featured = featuredDestinations()

  const [guide, setGuide] = useState<ArrivalGuide | null>(null)
  const [weather, setWeather] = useState<BackendWeather | null>(null)
  const [loading, setLoading] = useState(true)
  const [hour, setHour] = useState(0)
  const [openKit, setOpenKit] = useState<string | null>('ride')
  const [done, setDone] = useState<string[]>([])
  const [help, setHelp] = useState('')
  const [asking, setAsking] = useState(false)
  const [ownAsk, setOwnAsk] = useState('')

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
    setLoading(true)
    void fetchArrival(destId)
      .then((payload) => {
        if (!live) return
        setGuide(payload.arrival)
        setWeather(payload.weather)
        setHour(pickHour(payload.arrival.hours.length))
        setOpenKit('ride')
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
      destinationQuery: name ?? city?.name ?? dest.name,
      step: 2,
    })
    navigate('/plan')
  }

  const pickCity = (id: string, name: string) => {
    setPlanner({ destinationId: id, destinationQuery: name })
  }

  const toggleStep = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]
    setDone(next)
    void saveChecklist(destId, next)
  }

  const ask = async (prompt: string) => {
    setAsking(true)
    setHelp('')
    try {
      const r = await askCompanion(prompt, destId)
      setHelp(r.reply)
    } catch {
      setHelp('Companion is offline. Start the API with npm run dev so /api is available.')
    } finally {
      setAsking(false)
    }
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.section
        key={dest.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-ink-900 text-white shadow-float"
      >
        <PlaceImage
          src={dest.image}
          name={dest.name}
          city={dest.name}
          lat={dest.lat}
          lng={dest.lng}
          className="absolute inset-0 h-full w-full opacity-45"
          imgClassName="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-teal-950/30" />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sunset-400">Just landed · first visit</p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.08] sm:text-5xl">
            You are new in {dest.name}. We will walk you through the first day.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
            Hi {user.name.split(' ')[0]}. The companion backend built this briefing for someone who does not know the
            streets, the language, or which taxi to trust.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {weather && !weather.unavailable && (
              <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs backdrop-blur">
                {weather.tempC}°C · {weather.summary} · rain {weather.rainProbability}%
              </span>
            )}
            <span className="rounded-full bg-teal-500/20 px-3 py-1.5 text-xs text-teal-100">
              {guide?.lang ?? dest.state} · 112 emergency
            </span>
          </div>
          <div className="mt-6 flex max-w-xl items-center gap-2 rounded-full bg-white p-1.5 text-ink-900 shadow-float">
            <MapPin className="ml-3 size-4 text-teal-800" />
            <input
              value={query}
              onChange={(e) => setPlanner({ destinationQuery: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && goPlan()}
              placeholder="I just arrived in…"
              className="h-11 flex-1 bg-transparent text-sm outline-none"
            />
            <button className="grid size-10 place-items-center rounded-full hover:bg-sand-100" onClick={() => void requestLocation()} aria-label="Use GPS">
              <LocateFixed className="size-4 text-teal-800" />
            </button>
            <Button size="sm" onClick={() => goPlan()}>
              Arrive
            </Button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {featured.map((d) => (
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
        </div>
      </motion.section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Your first 24 hours</h2>
            <p className="mt-1 text-sm text-ink-500">
              We opened the hour that matches now. Check steps off — they save on the companion server.
            </p>
          </div>
          {loading ? (
            <span className="text-xs text-ink-400">Companion is writing your briefing…</span>
          ) : guide ? (
            <div className="min-w-[8rem] text-right">
              <p className="text-xs font-medium text-teal-800">{doneCount}/{guide.hours.length} done</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${donePct}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-xs text-sunset-600">API offline — run npm run dev</span>
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
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4"
            >
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-sunset-600">{step.t}</p>
                    <h3 className="mt-1 font-display text-2xl">{step.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-sand-200">{step.detail}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={done.includes(step.id) ? 'secondary' : 'primary'}
                    onClick={() => toggleStep(step.id)}
                  >
                    <Check className="size-4" />
                    {done.includes(step.id) ? 'Done' : 'Mark done'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section>
        <h2 className="font-display text-2xl">Survival kit</h2>
        <p className="mt-1 text-sm text-ink-500">Everything a first-timer asks in the taxi queue.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(guide?.kit ?? []).map((item) => {
            const open = openKit === item.id
            return (
              <motion.button
                key={item.id}
                layout
                onClick={() => setOpenKit(open ? null : item.id)}
                className={`rounded-3xl p-4 text-left shadow-card ring-1 transition ${
                  open ? 'bg-teal-800 text-white ring-teal-800' : 'bg-white ring-black/5 dark:bg-ink-800 dark:ring-white/10'
                }`}
              >
                <p className="text-2xl">{item.icon}</p>
                <p className="mt-2 font-medium">{item.title}</p>
                <AnimatePresence>
                  {open && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 text-sm leading-relaxed opacity-90"
                    >
                      {item.body}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl">Need help right now?</h2>
        {guide?.dont && (
          <p className="mb-3 rounded-2xl bg-sunset-500/10 px-4 py-3 text-sm text-ink-700 dark:text-sand-100">
            <span className="font-semibold text-sunset-600">First-day rule. </span>
            {guide.dont}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {(guide?.actions ?? []).map((a) => (
            <Button key={a.id} size="sm" variant="secondary" disabled={asking} onClick={() => void ask(a.prompt)}>
              {a.label}
            </Button>
          ))}
        </div>
        <form
          className="mt-3 flex max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!ownAsk.trim()) return
            void ask(ownAsk)
            setOwnAsk('')
          }}
        >
          <input
            value={ownAsk}
            onChange={(e) => setOwnAsk(e.target.value)}
            placeholder={`Ask anything about arriving in ${dest.name}…`}
            className="h-11 flex-1 rounded-full bg-white px-4 text-sm shadow-card outline-none ring-1 ring-black/5 dark:bg-ink-800 dark:ring-white/10"
          />
          <Button type="submit" size="sm" disabled={asking || !ownAsk.trim()}>
            Ask
          </Button>
        </form>
        <AnimatePresence>
          {(asking || help) && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <Card className="border-0 bg-gradient-to-br from-teal-50 to-white p-5 dark:from-teal-950 dark:to-ink-800">
                <p className="text-xs uppercase tracking-[0.16em] text-teal-800">Companion · live API</p>
                <p className="mt-2 text-sm leading-relaxed">{asking ? 'Thinking as a local…' : help}</p>
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
                <button
                  className="grid size-10 place-items-center rounded-full bg-sand-100 dark:bg-white/8"
                  onClick={() => speak(p.local, p.lang)}
                  aria-label="Listen"
                >
                  <Volume2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { to: '/plan', label: 'Build my days', icon: Sparkles, hint: 'Smart itinerary' },
          { to: '/explore', label: 'What is around me', icon: Compass, hint: 'Map places' },
          { to: '/food', label: 'First meal', icon: UtensilsCrossed, hint: guide?.firstMeal.slice(0, 42) ?? 'Eat' },
          { to: '/stay', label: 'Where I sleep', icon: Hotel, hint: guide?.stayArea ?? 'Hotels' },
          { to: '/translate', label: 'Talk to people', icon: Languages, hint: 'Live translate' },
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

      <section>
        <h2 className="font-display text-2xl">Or jump in with a trip shape</h2>
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
    </div>
  )
}
