import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { spentTotal, useAppStore } from '@/store/useAppStore'
import { estimateTripBudget, scaleEstimate } from '@/lib/budgetEstimate'
import type { ExpenseCategory } from '@/types'
import { formatInr } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

const CATS: { id: ExpenseCategory; label: string }[] = [
  { id: 'stay', label: 'Stay' },
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Local rides' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'other', label: 'Other' },
]

export function BudgetPage() {
  const trip = useAppStore((s) => s.trip)
  const expenses = useAppStore((s) => s.expenses)
  const add = useAppStore((s) => s.addExpense)
  const optimize = useAppStore((s) => s.optimize)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState(trip?.budget || 0)

  const base = useMemo(() => (trip ? trip.budgetEstimate ?? estimateTripBudget(trip, trip.hotel) : null), [trip])
  const estimate = useMemo(() => {
    if (!base) return null
    if (!target || target <= 0) return base
    return scaleEstimate(base, target)
  }, [base, target])
  const spent = spentTotal(expenses)

  if (!trip || !base || !estimate) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl">Trip cost</h1>
        <p className="mt-3 text-sm text-ink-500">Generate an itinerary first. The estimate is built from that plan — not a seeded total.</p>
        <Button className="mt-5" onClick={() => navigate('/plan')}>
          Plan a trip
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sunset-600">Cost of this plan</p>
      <h1 className="mt-1 font-display text-4xl">Live estimate</h1>
      <p className="mt-2 text-sm text-ink-500">
        Built from {trip.days} days, {trip.placeCount} stops, meals, and hops. Hotel nights are estimate bands, not live
        booking quotes.
      </p>

      <div className="mt-6 rounded-[2rem] bg-ink-900 p-6 text-white sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-sunset-400">Estimated cost — not a live quote</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-white/60">Budget</p>
            <p className="font-display text-3xl">{formatInr(trip.budget)}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Estimated</p>
            <p className="font-display text-3xl">{formatInr(estimate.mid ?? Math.round((estimate.low + estimate.high) / 2))}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Remaining</p>
            <p className="font-display text-3xl">
              {formatInr(trip.budget - (estimate.mid ?? Math.round((estimate.low + estimate.high) / 2)))}
            </p>
          </div>
        </div>
        {(estimate.overBy ?? 0) > 0 && (
          <p className="mt-3 text-sm text-sunset-300">
            This plan exceeds your budget by {formatInr(estimate.overBy ?? 0)}.
          </p>
        )}
        <p className="mt-2 font-display text-2xl text-white/70">
          Range {formatInr(estimate.low)}–{formatInr(estimate.high)}
        </p>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
        <p className="font-medium">Target budget — watch the band move</p>
        <input
          type="range"
          min={Math.max(3000, Math.round(base.low * 0.55))}
          max={Math.round(base.high * 1.6)}
          step={500}
          value={target || Math.round((base.low + base.high) / 2)}
          onChange={(e) => {
            const n = Number(e.target.value)
            setTarget(n)
            setPlanner({ budget: n })
          }}
          className="mt-4 w-full accent-teal-700"
        />
        <p className="mt-2 text-sm text-ink-500">Aim {formatInr(target || Math.round((base.low + base.high) / 2))} · swap hotel tier or meal count on Plan to rebuild the itinerary.</p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Line k="Hotel" v={`${formatInr(estimate.hotelLow)}–${formatInr(estimate.hotelHigh)}`} n={`${estimate.nights} nights`} />
        <Line k="Food" v={`${formatInr(estimate.foodLow)}–${formatInr(estimate.foodHigh)}`} n="Meals on the plan" />
        <Line k="Tickets" v={`${formatInr(estimate.ticketsLow)}–${formatInr(estimate.ticketsHigh)}`} n="Stops without a published fee use a labeled band" />
        <Line k="Local rides" v={`${formatInr(estimate.transitLow)}–${formatInr(estimate.transitHigh)}`} n="Autos / cabs between stops" />
        <Line k="Miscellaneous" v={`${formatInr(estimate.miscLow ?? 0)}–${formatInr(estimate.miscHigh ?? 0)}`} n="Buffer · estimated" />
      </div>
      {(estimate.overBy ?? 0) > 0 && (
        <Button className="mt-4" onClick={optimize}>
          Optimize my trip
        </Button>
      )}

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl">Actuals vs estimate</h2>
            <p className="mt-1 text-sm text-ink-500">Optional. Logged {formatInr(spent)} against the band above.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            Log a real spend
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm dark:bg-ink-800">
              <span>
                {e.description}
                <span className="block text-[11px] capitalize text-ink-400">{e.category}</span>
              </span>
              <span>{formatInr(e.amount)}</span>
            </div>
          ))}
          {!expenses.length && <p className="text-sm text-ink-400">No actuals yet.</p>}
        </div>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Log actual spend">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full px-3 py-1 text-sm ${category === c.id ? 'bg-teal-800 text-white' : 'bg-sand-100'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Input className="mt-4" type="number" placeholder="Amount in ₹" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input className="mt-3" placeholder="What was it?" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button
          className="mt-5 w-full"
          onClick={() => {
            const n = Number(amount)
            if (!n) return
            add(category, n, description || category)
            setOpen(false)
            setAmount('')
          }}
        >
          Save
        </Button>
      </Modal>
    </div>
  )
}

function Line({ k, v, n }: { k: string; v: string; n: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-card dark:bg-ink-800">
      <p className="text-xs uppercase tracking-[0.16em] text-ink-400">{k}</p>
      <p className="mt-1 font-display text-2xl">{v}</p>
      <p className="mt-1 text-xs text-ink-400">{n}</p>
    </div>
  )
}

