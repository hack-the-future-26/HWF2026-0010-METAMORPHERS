import { MapPin } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function LocationPrompt() {
  const permission = useAppStore((s) => s.location.permission)
  const loading = useAppStore((s) => s.location.loading)
  const request = useAppStore((s) => s.requestLocation)
  const fallback = useAppStore((s) => s.useDestinationFallback)

  const open = permission === 'prompting'

  if (!open) return null

  return (
    <Modal open={open} onClose={() => void fallback()} title="📍 Make YatraSense Location-Aware">
      <p className="text-sm leading-relaxed text-ink-700 dark:text-sand-200">
        We use your location to discover nearby places, calculate routes and personalize your journey. If you deny access, routing can still work from the destination you search — live tracking will stay off.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" disabled={loading} onClick={() => void request()}>
          <MapPin className="size-4" /> {loading ? 'Getting your location...' : 'Allow Location'}
        </Button>
        <Button className="flex-1" variant="secondary" onClick={() => void fallback()}>
          Choose Destination Instead
        </Button>
      </div>
    </Modal>
  )
}
