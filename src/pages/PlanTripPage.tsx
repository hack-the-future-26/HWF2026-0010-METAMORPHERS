import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, daysBetween, formatInr, todayIso } from '@/lib/utils'
import { searchDestinations } from '@/data/destinations'
import type { Destination } from '@/types'
import { BUDGET_TIERS, PACE, STYLES, TRANSPORT } from '@/data/catalog'
import { useAppStore } from '@/store/useAppStore'
import { geocodingService } from '@/services/geocodingService'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { PlaceImage } from '@/components/ui/PlaceImage'

export function PlanTripPage() {
  const planner = useAppStore((s) => s.planner)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const generate = useAppStore((s) => s.generateTrip)
  const navigate = useNavigate()
  const days = daysBetween(planner.startDate, planner.endDate)
  const daily = Math.round(planner.budget / days)
  const tier = BUDGET_TIERS.find((t) => planner.budget <= t.max) ?? BUDGET_TIERS[3]
  const catalog = searchDestinations(planner.destinationQuery)
  const [geo, setGeo] = useState<Destination[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const results = [...geo, ...catalog.filter((d) => !geo.some((g) => g.id === d.id))]

  useEffect(() => {
    const q = planner.destinationQuery.trim()
    if (planner.step !== 1 || q.length < 3) {
      setGeo([])
      return
    }
    const t = window.setTimeout(() => {
      setGeoLoading(true)
      void geocodingService
        .search(q)
        .then((list) => setGeo(list))
        .catch(() => setGeo([]))
        .finally(() => setGeoLoading(false))
    }, 600)
    return () => window.clearTimeout(t)
  }, [planner.destinationQuery, planner.step])

  const next = () => setPlanner({ step: Math.min(8, planner.step + 1) })
  const back = () => setPlanner({ step: Math.max(1, planner.step - 1) })

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Step {planner.step} of 8</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-200 dark:bg-white/10">
        <div className="h-full bg-teal-700" style={{ width: `${(planner.step / 8) * 100}%` }} />
      </div>

      {planner.generating ? (
        <Card className="mt-8 p-8 text-center">
          <div className="mx-auto size-16 animate-pulse rounded-full bg-teal-100 dark:bg-teal-950" />
          <h2 className="mt-6 font-display text-3xl">YatraSense is planning your perfect day...</h2>
          <p className="mt-3 text-sm text-ink-500">{planner.generateMessage}</p>
          <p className="mt-2 text-xs text-ink-400">{planner.generateProgress}%</p>
        </Card>
      ) : (
        <Card className="mt-6 p-6 sm:p-8">
          {planner.step === 1 && (
            <Step title="Where do you want to go?">
              <p className="mb-3 text-sm text-ink-500">Pick an Indian city. Coordinates are city-center WGS84.</p>
              <Input
                value={planner.destinationQuery}
                onChange={(e) => {
                  const q = e.target.value
                  const hit = searchDestinations(q)[0]
                  const vizag = q.toLowerCase().includes('visakh') || q.toLowerCase().includes('vizag')
                  setPlanner({ destinationQuery: q, destinationId: vizag ? 'vizag' : hit && q.length >= 2 ? hit.id : planner.destinationId })
                }}
                placeholder="Delhi, Mumbai, Goa, Jaipur…"
              />
              {geoLoading && <p className="mt-2 text-xs text-ink-400">Searching OpenStreetMap…</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(planner.destinationQuery.trim().length < 2 ? searchDestinations('') : results).slice(0, 18).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setPlanner({ destinationId: d.id, destinationQuery: d.name, step: 2 })}
                    className={`overflow-hidden rounded-2xl text-left ring-2 ${planner.destinationId === d.id ? 'ring-teal-700' : 'ring-transparent'} hover:ring-teal-600/40`}
                  >
                    <PlaceImage src={d.image} name={d.name} city={d.name} lat={d.lat} lng={d.lng} imgClassName="h-20 w-full" />
                    <span className="block p-2">
                      <span className="block font-medium">{d.name}</span>
                      <span className="text-[11px] text-ink-500">
                        {d.lat.toFixed(2)}°, {d.lng.toFixed(2)}°
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {planner.step === 2 && (
            <Step title="When are you travelling?">
              <Calendar
                start={planner.startDate}
                end={planner.endDate}
                onChange={(start, end) => setPlanner({ startDate: start, endDate: end })}
              />
              <p className="mt-4 text-sm text-ink-500">
                {days} day{days > 1 ? 's' : ''} selected
              </p>
            </Step>
          )}

          {planner.step === 3 && (
            <Step title="Who’s coming along?">
              {(['adults', 'children', 'seniors'] as const).map((k) => (
                <div key={k} className="mt-3 flex items-center justify-between rounded-2xl bg-sand-100 px-4 py-3 dark:bg-white/5">
                  <span className="capitalize">{k}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() =>
                        setPlanner({ travelers: { ...planner.travelers, [k]: Math.max(k === 'adults' ? 1 : 0, planner.travelers[k] - 1) } })
                      }
                    >
                      −
                    </Button>
                    <span className="w-6 text-center">{planner.travelers[k]}</span>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => setPlanner({ travelers: { ...planner.travelers, [k]: planner.travelers[k] + 1 } })}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </Step>
          )}

          {planner.step === 4 && (
            <Step title="What’s your travel style?">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STYLES.map((s) => {
                  const on = planner.styles.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        setPlanner({
                          styles: on ? planner.styles.filter((x) => x !== s.id) : [...planner.styles, s.id],
                        })
                      }
                      className={`rounded-2xl p-4 text-left ring-2 ${on ? 'ring-teal-700 bg-teal-50 dark:bg-teal-950' : 'ring-transparent bg-sand-100 dark:bg-white/5'}`}
                    >
                      <p className="text-xl">{s.icon}</p>
                      <p className="mt-1 text-sm font-medium">{s.label}</p>
                    </button>
                  )
                })}
              </div>
            </Step>
          )}

          {planner.step === 5 && (
            <Step title="What’s your budget?">
              <input
                type="range"
                min={1000}
                max={100000}
                step={500}
                value={planner.budget}
                onChange={(e) => setPlanner({ budget: Number(e.target.value) })}
                className="mt-4 w-full accent-teal-700"
              />
              <p className="mt-2 font-display text-3xl">
                {formatInr(planner.budget)}
                {planner.budget >= 100000 ? '+' : ''}
              </p>
              <p className="text-sm text-ink-500">
                {tier.label} · ~{formatInr(daily)} per day
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {BUDGET_TIERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPlanner({ budget: t.max === 100000 ? 80000 : t.max - 2000 })}
                    className={`rounded-full px-3 py-1 text-xs ${tier.id === t.id ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Step>
          )}

          {planner.step === 6 && (
            <Step title="How packed should the days feel?">
              <div className="space-y-3">
                {PACE.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlanner({ pace: p.id })}
                    className={`w-full rounded-2xl p-4 text-left ring-2 ${planner.pace === p.id ? 'ring-teal-700 bg-teal-50 dark:bg-teal-950' : 'ring-transparent bg-sand-100 dark:bg-white/5'}`}
                  >
                    <p className="font-medium">{p.label}</p>
                    <p className="text-sm text-ink-500">{p.hint}</p>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {planner.step === 7 && (
            <Step title="How do you like to move?">
              <div className="grid grid-cols-2 gap-3">
                {TRANSPORT.map((t) => {
                  const on = planner.transport.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        setPlanner({
                          transport: on ? planner.transport.filter((x) => x !== t.id) : [...planner.transport, t.id],
                        })
                      }
                      className={`rounded-2xl p-4 text-left ring-2 ${on ? 'ring-teal-700 bg-teal-50 dark:bg-teal-950' : 'ring-transparent bg-sand-100 dark:bg-white/5'}`}
                    >
                      <p className="text-xl">{t.icon}</p>
                      <p className="mt-1 text-sm">{t.label}</p>
                    </button>
                  )
                })}
              </div>
            </Step>
          )}

          {planner.step === 8 && (
            <Step title="Ready when you are">
              <ul className="space-y-2 text-sm text-ink-600">
                <li>{planner.destinationQuery || 'Your destination'} · {days} days</li>
                <li>
                  {planner.travelers.adults} adults
                  {planner.travelers.children ? ` · ${planner.travelers.children} children` : ''}
                </li>
                <li>{planner.styles.join(', ') || 'Your saved preferences'}</li>
                <li>
                  {formatInr(planner.budget)} · {planner.pace} · {planner.transport.join(', ')}
                </li>
              </ul>
              {planner.generateError && (
                <p className="mt-4 text-sm text-sunset-600">{planner.generateError}</p>
              )}
              <Button
                size="lg"
                className="mt-6 w-full"
                onClick={async () => {
                  await generate()
                  const err = useAppStore.getState().planner.generateError
                  const ready = useAppStore.getState().trip
                  if (ready && !err) navigate('/trip')
                  else toast.error(err || "We couldn't build that trip.")
                }}
              >
                ✨ Create My Smart Trip
              </Button>
            </Step>
          )}

          {planner.step !== 8 && (
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={back} disabled={planner.step === 1}>
                Back
              </Button>
              <Button onClick={next}>Continue</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl">{title}</h1>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function Calendar({
  start,
  end,
  onChange,
}: {
  start: string
  end: string
  onChange: (s: string, e: string) => void
}) {
  const [cursor, setCursor] = useState(() => new Date(start + 'T00:00:00'))
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startPad = first.getDay()
    const daysIn = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    return Array.from({ length: startPad + daysIn }, (_, i) => {
      if (i < startPad) return null
      const d = i - startPad + 1
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      return iso
    })
  }, [cursor])

  const pick = (iso: string) => {
    if (!start || (start && end && start !== end)) onChange(iso, iso)
    else if (iso < start) onChange(iso, start)
    else onChange(start, iso)
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          ←
        </Button>
        <p className="font-medium">
          {cursor.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
        <Button size="sm" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          →
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-400">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />
          const inRange = iso >= start && iso <= end
          const edge = iso === start || iso === end
          const disabled = iso < todayIso()
          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => pick(iso)}
              className={`h-10 rounded-xl text-sm ${edge ? 'bg-teal-800 text-white' : inRange ? 'bg-teal-100 dark:bg-teal-950' : ''} ${disabled ? 'opacity-30' : ''}`}
            >
              {Number(iso.slice(-2))}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-ink-400">
        {start} → {end || start}
        {end && start !== end ? ` · ${daysBetween(start, end)} days` : ''}
      </p>
      <button className="mt-2 text-xs text-teal-800" onClick={() => onChange(todayIso(), addDays(todayIso(), 1))}>
        Use this weekend
      </button>
    </div>
  )
}
