import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { getDestination } from '@/data/destinations'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function ShareTripModal() {
  const open = useAppStore((s) => s.shareOpen)
  const set = useAppStore((s) => s.setShareOpen)
  const trip = useAppStore((s) => s.trip)
  const user = useAppStore((s) => s.user)
  const url = useAppStore((s) => s.shareUrl())
  const dest = trip ? getDestination(trip.destinationId).name : 'your trip'

  return (
    <Modal open={open} onClose={() => set(false)} title="Share Trip">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-teal-800 to-ink-900 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-200">YatraSense</p>
        <h3 className="mt-2 font-display text-2xl">
          {user.name}’s {dest} Trip
        </h3>
        <div className="mt-4 space-y-2 text-sm text-white/80">
          {trip?.daysPlan.map((d) => (
            <p key={d.index}>
              {d.title} — {d.activities.filter((a) => a.kind === 'place').map((a) => a.title).slice(0, 3).join(', ')}
            </p>
          )) ?? <p>Generate a trip first to share a live card.</p>}
        </div>
      </div>
      <p className="mt-4 break-all rounded-2xl bg-sand-100 px-3 py-2 text-xs dark:bg-white/8">{url}</p>
      <div className="mt-4 flex gap-2">
        <Button
          className="flex-1"
          onClick={async () => {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied')
          }}
        >
          Copy Link
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ title: `${user.name}’s ${dest} Trip`, url })
            } else {
              await navigator.clipboard.writeText(url)
              toast.success('Share link copied')
            }
          }}
        >
          Share
        </Button>
      </div>
    </Modal>
  )
}

export function AdaptationCard() {
  const adaptation = useAppStore((s) => s.adaptation)
  const accept = useAppStore((s) => s.acceptAdaptation)
  const keep = useAppStore((s) => s.keepOriginal)
  const why = useAppStore((s) => s.askWhy)
  if (!adaptation) return null
  return (
    <div className="rounded-3xl bg-ink-900 p-5 text-white shadow-float">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-400">⚡ Trip Optimization</p>
      <h3 className="mt-2 font-display text-2xl">{adaptation.title}</h3>
      <p className="mt-1 text-sm text-white/75">{adaptation.message}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/8 p-3 text-sm">
          <p className="text-[11px] text-white/50">Original</p>
          <p className="mt-1">
            {adaptation.original.time} → {adaptation.original.title}
          </p>
        </div>
        <div className="rounded-2xl bg-teal-700/40 p-3 text-sm">
          <p className="text-[11px] text-teal-100">New recommendation</p>
          {adaptation.recommended.map((r) => (
            <p key={r.time + r.title} className="mt-1">
              {r.time} → {r.title}
            </p>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-teal-100">Reason: {adaptation.reason}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="sunset" onClick={accept}>
          {adaptation.type === 'weather' ? 'Replace Activity' : 'Accept Change'}
        </Button>
        <Button variant="secondary" onClick={keep}>
          Keep Original Plan
        </Button>
        <Button variant="ghost" className="text-white" onClick={() => toast.message(why())}>
          Ask Why
        </Button>
      </div>
    </div>
  )
}
