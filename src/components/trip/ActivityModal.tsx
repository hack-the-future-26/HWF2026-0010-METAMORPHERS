import { getPlace } from '@/data/places'
import { crowdOf, useAppStore } from '@/store/useAppStore'
import { activeOrigin } from '@/lib/origin'
import { formatInr, formatKm, haversineKm, travelMinutes } from '@/lib/utils'
import { whyRecommended } from '@/services/aiService'
import { geocodingService } from '@/services/geocodingService'
import { PlaceMiniMap } from '@/components/map/PlaceMiniMap'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CrowdDot } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export function ActivityModal() {
  const id = useAppStore((s) => s.selectedPlaceId)
  const set = useAppStore((s) => s.setSelectedPlace)
  const place = id ? getPlace(id) : undefined
  const conditions = useAppStore((s) => s.conditions)
  const styles = useAppStore((s) => s.trip?.styles ?? s.user.preferences.styles)
  const save = useAppStore((s) => s.savePlace)
  const add = useAppStore((s) => s.addPlaceToTrip)
  const goToPlace = useAppStore((s) => s.goToPlace)
  const setAi = useAppStore((s) => s.setAiOpen)
  const send = useAppStore((s) => s.sendChat)
  const online = useAppStore((s) => s.online)
  const location = useAppStore((s) => s.location)
  const trip = useAppStore((s) => s.trip)
  const liveRoute = useAppStore((s) => s.liveRoute)
  const appMode = useAppStore((s) => s.appMode)
  const origin = activeOrigin(location, trip?.destinationId)
  const navigate = useNavigate()
  const [exactAddress, setExactAddress] = useState(place?.address ?? '')

  useEffect(() => {
    if (!place) return
    if (place.address && place.address !== 'Not available from OSM' && place.address !== 'Information unavailable') {
      setExactAddress(place.address)
      return
    }
    setExactAddress(`${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`)
    void geocodingService.reverseAddress(place).then(setExactAddress)
  }, [place?.id, place?.address, place?.lat, place?.lng])

  if (!place) return null

  const km = haversineKm(origin, place)
  const nextId = trip?.daysPlan[0]?.activities.find((a) => a.kind === 'place')?.placeId
  const distLabel = nextId === place.id && liveRoute ? formatKm(liveRoute.km) : formatKm(km)
  const timeLabel =
    nextId === place.id && liveRoute
      ? `${liveRoute.minutes} min ${liveRoute.source === 'osrm' ? 'by road' : 'estimate'}`
      : `${travelMinutes(km, 'taxi')} min by cab`
  const crowd = crowdOf(place, conditions.crowdOverrides)
  const closed = conditions.closures.includes(place.id)

  return (
    <Modal open={Boolean(place)} onClose={() => set(null)} title={place.name} wide>
      {place.image ? (
        <img src={place.image} alt="" className="mb-4 h-52 w-full rounded-3xl object-cover" />
      ) : (
        <PlaceMiniMap lat={place.lat} lng={place.lng} />
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge>{place.ratingKnown === false ? 'Rating unavailable' : `⭐ ${place.rating}`}</Badge>
        <Badge tone="sand">{place.category}</Badge>
        {appMode === 'demo' && place.crowdKnown !== false ? (
          <CrowdDot level={crowd} />
        ) : (
          <Badge tone="sand">Live crowd data unavailable</Badge>
        )}
        {closed && <Badge tone="red">Temporarily closed</Badge>}
        {place.source === 'osm' && <Badge tone="sand">OpenStreetMap</Badge>}
      </div>
      <p className="text-sm leading-relaxed text-ink-700 dark:text-sand-200">{place.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info k="Location" v={`${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} />
        <Info k="Address" v={exactAddress || `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} />
        <Info k="Opening hours" v={place.hoursKnown === false ? 'Not available from OSM' : place.openingHours} />
        <Info
          k="Entry fee"
          v={place.priceKnown === false ? 'Price unavailable' : place.entryFee ? formatInr(place.entryFee) : 'Free'}
        />
        <Info k="Best time" v={place.hoursKnown === false ? 'Not available from OSM' : place.bestTime} />
        <Info k="Duration" v={`${place.durationMin} min`} />
        <Info k="Distance" v={distLabel} />
        <Info k="Travel time" v={timeLabel} />
        <Info
          k="Est. cost"
          v={place.priceKnown === false ? 'Price unavailable' : formatInr(place.estimatedCost)}
        />
        <Info
          k="Weather"
          v={
            place.weatherSensitive && conditions.weather.rainProbability > 50
              ? 'Poor in rain'
              : 'Good today'
          }
        />
        {place.website && <Info k="Website" v={place.website} />}
        {place.phone && <Info k="Phone" v={place.phone} />}
      </dl>
      <div className="mt-5 rounded-2xl bg-teal-50 p-4 text-sm dark:bg-teal-950">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
          Why we’re recommending this
        </p>
        <p className="mt-1 leading-relaxed">{whyRecommended(place, styles, conditions, origin)}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button
          onClick={() => {
            if (!online) return toast.error('Navigation needs a live connection.')
            goToPlace(place.id)
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`,
              '_blank',
            )
          }}
        >
          Navigate
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            add(place.id)
            toast.success(`Added ${place.name} to your trip`)
            set(null)
            navigate('/trip')
          }}
        >
          Add to Trip
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            save(place.id, 'want')
            toast.success('Saved to wishlist')
          }}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            goToPlace(place.id)
            set(null)
            toast.success(`${place.name} is now your next stop`)
          }}
        >
          Go There
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            set(null)
            setAi(true)
            void send(`Suggest a replacement for ${place.name}`)
          }}
        >
          Replace
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setAi(true)
            void send(`Tell me more about ${place.name} given my current trip.`)
          }}
        >
          Ask AI
        </Button>
      </div>
    </Modal>
  )
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-sand-100 px-3 py-2 dark:bg-white/5">
      <p className="text-[11px] text-ink-400">{k}</p>
      <p className="font-medium break-all">{v}</p>
    </div>
  )
}
