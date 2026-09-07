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
import { toast } from 'sonner'

export function MyTripPage() {
  const trip = useAppStore((s) => s.trip)
  const regenerate = useAppStore((s) => s.regenerateTrip)
  const start = useAppStore((s) => s.startTrip)
  const optimize = useAppStore((s) => s.optimize)
  const wins = useAppStore((s) => s.lastOptimizeWins)
  const setShare = useAppStore((s) => s.setShareOpen)
  const setPlanner = useAppStore((s) => s.setPlanner)
  const navigate = useNavigate()
  const [day, setDay] = useState(0)

  if (!trip) {
    return (
      <EmptyState
        title="No trip yet"
        body="Create a smart itinerary in under a minute."
        action={{ label: 'Plan My Trip ✨', onClick: () => navigate('/plan') }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">Itinerary</p>
          <h1 className="font-display text-4xl">{trip.title}</h1>
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
          <Button onClick={optimize}>
            <Sparkles className="size-4" /> Optimize
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Days" value={`📅 ${trip.days}`} />
        <Stat label="Estimated" value={trip.estimatedSpend > 0 ? `💰 ${formatInr(trip.estimatedSpend)}` : '💰 Price unavailable'} />
        <Stat label="Places" value={`📍 ${trip.placeCount}`} />
        <Stat label="Travel" value={`🚗 ${formatDuration(trip.route.totalTravelMin)}`} />
        <Stat label="Match" value={`⭐ Personalized ${trip.matchScore}%`} />
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
    <div className="rounded-3xl bg-white p-4 shadow-card dark:bg-ink-800">
      <p className="text-[11px] text-ink-400">{label}</p>
      <p className="mt-1 text-sm font-medium sm:text-base">{value}</p>
    </div>
  )
}
