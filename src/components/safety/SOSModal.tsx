import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { activeOrigin } from '@/lib/origin'
import { getPlace } from '@/data/places'

export function SOSModal() {
  const open = useAppStore((s) => s.sosOpen)
  const set = useAppStore((s) => s.setSosOpen)
  return (
    <Modal open={open} onClose={() => set(false)} title="Confirm SOS">
      <p className="text-sm leading-relaxed text-ink-700 dark:text-sand-200">
        This is demo mode. Confirming will <strong>not</strong> contact emergency services, police, or send a real
        location alert.
      </p>
      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => set(false)}>
          Cancel
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          onClick={() => {
            set(false)
            toast.message('SOS demo complete — no emergency services were contacted.')
          }}
        >
          Send demo SOS
        </Button>
      </div>
    </Modal>
  )
}

export function SafetyPanel() {
  const setSos = useAppStore((s) => s.setSosOpen)
  const online = useAppStore((s) => s.online)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const location = useAppStore((s) => s.location)
  const trip = useAppStore((s) => s.trip)
  const origin = activeOrigin(location, trip?.destinationId)
  const hospital = nearbyPlaces.find((p) => p.nearbyKind === 'hospital') ?? getPlace('kgh')
  const police = getPlace('police-1')

  const openMaps = (lat: number, lng: number) => {
    if (!online) {
      toast.error('Live maps need a connection. Hospital: King George Hospital, Maharanipeta.')
      return
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
      <p className="font-display text-xl">Travel Safety</p>
      <p className="mt-1 text-sm text-ink-500">Emergency shortcuts for this neighbourhood.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button variant="danger" onClick={() => setSos(true)}>
          SOS
        </Button>
        <Button variant="secondary" onClick={() => hospital && openMaps(hospital.lat, hospital.lng)}>
          Nearby Hospital
        </Button>
        <Button variant="secondary" onClick={() => police && openMaps(police.lat, police.lng)}>
          Police
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            const text = `I'm at ${origin.label} (${origin.lat.toFixed(5)}, ${origin.lng.toFixed(5)})`
            await navigator.clipboard.writeText(text)
            toast.success('Location copied — share it with your emergency contact.')
          }}
        >
          Share Location
        </Button>
        <Button variant="ghost" onClick={() => toast.message('Emergency: 112 · Ambulance: 108 · Police: 100')}>
          Emergency
        </Button>
      </div>
    </div>
  )
}
