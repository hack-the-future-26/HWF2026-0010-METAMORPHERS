import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Pencil, RefreshCw, Share2, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { formatDuration, formatInr } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { DayTimeline } from '@/components/trip/DayTimeline'
import { AdaptationCard } from '@/components/trip/ShareTripModal'
import { TripMap } from '@/components/map/TripMap'
import { sendFeedback } from '@/services/backend'
import { toast } from 'sonner'

export function MyTripPage() {
  const trip = useAppStore((s) => s.trip)
  const signedIn = useAppStore((s) => s.signedIn)
  const regenerate = useAppStore((s) => s.regenerateTrip)
  const start = useAppStore((s) => s.startTrip)
  const optimize = useAppStore((s) => s.optimize)
  const wins = useAppStore((s) => s.lastOptimizeWins)
  const setShare = useAppStore((s) => s.setShareOpen)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const navigate = useNavigate()
  const [day, setDay] = useState(0)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)

  if (!trip) {
    return (
      <EmptyState
        title="No trip yet"
        body="Search a city and generate a scored itinerary. Maps will not do this for you."
        action={{ label: 'Plan My Trip ✨', onClick: () => navigate('/plan') }}
      />
    )
  }

  const band = trip.budgetEstimate
  const spendLabel = band
    ? `${formatInr(band.low)}–${formatInr(band.high)}`
    : trip.estimatedSpend > 0
      ? formatInr(trip.estimatedSpend)
      : 'Build plan first'
  const matchLabel =
    trip.matchScore > 0 ? `Personalized ${trip.matchScore}%` : 'Rate a day to personalize'

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-sunset-600">Living itinerary</p>
          <h1 className="font-display text-4xl">{trip.title}</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-500">
            This is not a PDF of pins. Start the trip and weather can swap outdoor stops, then the route and ₹ range follow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => { setPlanner({ step: 1 }); navigate('/plan') }}>
            <Pencil className="size-4" /> Edit Trip
          </Button>
          <Button variant="secondary" onClick={() => void regenerate()}>
            <RefreshCw className="size-4" /> Regenerate
          </Button>
          <Button variant="secondary" onClick={() => setShare(true)}>
            <Share2 className="size-4" /> Share
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${trip.id}.json`
              a.click()
              toast.success('Itinerary downloaded')
            }}
          >
            <Download className="size-4" /> Download
          </Button>
          <Button onClick={() => { useAppStore.getState().saveCurrentTrip(); toast.success('Trip saved on this device') }}>
            Save trip
          </Button>
          <Button onClick={optimize}>
            <Sparkles className="size-4" /> Optimize
          </Button>
        </div>
      </div>

      {trip.shortageNote && (
        <div className="mt-5 rounded-[1.4rem] bg-sunset-500/12 px-4 py-3 text-sm">
          {trip.shortageNote}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Days" value={`${trip.days}`} />
        <Stat label="Estimate" value={spendLabel} />
        <Stat label="Places" value={`${trip.placeCount}`} />
        <Stat label="Travel" value={formatDuration(trip.route.totalTravelMin)} />
        <Stat label="Match" value={matchLabel} />
      </div>

      {wins.length > 0 && (
        <div className="mt-4 rounded-3xl bg-emerald-50 p-4 text-sm dark:bg-emerald-500/10">
          <p className="font-medium">Optimization complete</p>
          <ul className="mt-2 space-y-1">
            {wins.map((w) => (
              <li key={w}>✓ {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <AdaptationCard />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-4 flex gap-2">
            {trip.daysPlan.map((d) => (
              <Button key={d.index} size="sm" variant={day === d.index ? 'primary' : 'secondary'} onClick={() => setDay(d.index)}>
                Day {d.index + 1}
              </Button>
            ))}
          </div>
          <DayTimeline dayIndex={day} />
          <section className="mt-6 rounded-[1.6rem] bg-white p-5 shadow-card dark:bg-ink-800">
            <p className="text-xs uppercase tracking-[0.18em] text-sunset-600">How was this day?</p>
            <p className="mt-1 font-display text-2xl">Leave feedback</p>
            <p className="mt-1 text-sm text-ink-500">
              Ratings are stored on your account and raise the personalized match on the next plan.
            </p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`size-9 rounded-full text-sm ${rating === n ? 'bg-teal-800 text-white' : 'bg-sand-100 dark:bg-white/8'}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked, what to skip next time…"
              className="mt-3 w-full rounded-2xl border-0 bg-sand-100 p-3 text-sm outline-none dark:bg-white/8"
              rows={3}
            />
            <Button
              className="mt-3"
              disabled={sending}
              onClick={() => {
                if (!signedIn) {
                  toast.message('Sign in on Profile to store feedback')
                  navigate('/profile')
                  return
                }
                setSending(true)
                void sendFeedback({ tripId: trip.id, dayIndex: day, rating, comment, styles: trip.styles })
                  .then((data) => {
                    const match = Number(data.match)
                    if (Number.isFinite(match)) {
                      useAppStore.setState({
                        personalMatch: match,
                        trip: { ...trip, matchScore: match },
                      })
                    }
                    setComment('')
                    toast.success('Feedback saved')
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : 'Could not save feedback'))
                  .finally(() => setSending(false))
              }}
            >
              {sending ? 'Saving…' : 'Save day feedback'}
            </Button>
          </section>
          <Button className="mt-6 w-full" size="lg" onClick={() => { start(); navigate('/live') }}>
            Start Trip
          </Button>
        </div>
        <TripMap height={560} />
      </div>
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
