import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import type { Place } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { getDestination } from '@/data/destinations'
import { areaOrigin } from '@/lib/origin'
import { formatKm, haversineKm } from '@/lib/utils'
import { HOURS_UNAVAILABLE, OSM_UNAVAILABLE, PRICE_UNAVAILABLE, honestRating } from '@/lib/osmCopy'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PlaceMiniMap } from '@/components/map/PlaceMiniMap'
import { PlaceImage } from '@/components/ui/PlaceImage'

export type PlaceFilter = {
  id: string
  label: string
  match: (p: Place) => boolean
}

export function PlacesBrowser({
  title,
  subtitle,
  filters,
  places,
  loading,
  error,
  onRetry,
  showNavigate,
}: {
  title: string
  subtitle: string
  filters: PlaceFilter[]
  places: Place[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  showNavigate?: boolean
}) {
  const [cat, setCat] = useState(filters[0]?.id ?? 'all')
  const [mapId, setMapId] = useState<string | null>(null)
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId)
  const origin = areaOrigin(destId)
  const destName = destId ? getDestination(destId).name : undefined
  const add = useAppStore((s) => s.addPlaceToTrip)
  const save = useAppStore((s) => s.savePlace)
  const unsave = useAppStore((s) => s.unsavePlace)
  const saved = useAppStore((s) => s.saved)
  const select = useAppStore((s) => s.setSelectedPlace)
  const online = useAppStore((s) => s.online)
  const navigate = useNavigate()
  const live = true

  const list = useMemo(() => {
    const fn = filters.find((f) => f.id === cat)?.match ?? (() => true)
    return [...places]
      .filter(fn)
      .sort((a, b) => haversineKm(origin, a) - haversineKm(origin, b))
  }, [places, cat, filters, origin.lat, origin.lng])

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">{subtitle}</p>
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {filters.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
              cat === c.id ? 'bg-teal-800 text-white' : 'bg-white hover:bg-sand-100 dark:bg-ink-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-8 text-sm text-ink-500">Finding nearby places...</p>}
      {error && !loading && list.length === 0 && (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-card dark:bg-ink-800">
          <p className="text-sm">{error || 'Unable to load places right now.'}</p>
          {onRetry && (
            <Button size="sm" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}
      {!loading && list.length === 0 && !error && (
        <p className="mt-8 text-sm text-ink-500">No matching places from OSM in this area.</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => {
          const km = haversineKm(origin, p)
          const loved = saved.some((s) => s.placeId === p.id)
          return (
            <article key={p.id} className="overflow-hidden rounded-3xl bg-white shadow-card dark:bg-ink-800">
              <PlaceImage
                src={p.image}
                name={p.name}
                city={destName}
                lat={p.lat}
                lng={p.lng}
                category={p.category}
                imgClassName="h-40 w-full"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium">{p.name}</h3>
                  <Badge>{honestRating(p, live)}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {p.styles[0] ?? p.category} · {formatKm(km)} · {p.address || OSM_UNAVAILABLE}
                  {p.source === 'osm' ? ' · OSM' : ''}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-ink-500">{p.description || OSM_UNAVAILABLE}</p>
                <div className="mt-2 space-y-1 text-[11px] text-ink-400">
                  <p>Hours: {p.hoursKnown === true ? p.openingHours : HOURS_UNAVAILABLE}</p>
                  <p>Price: {PRICE_UNAVAILABLE}</p>
                  {p.website ? (
                    <a href={p.website} className="text-teal-800 underline" target="_blank" rel="noreferrer">
                      {p.website}
                    </a>
                  ) : (
                    <p>Website: {OSM_UNAVAILABLE}</p>
                  )}
                  {p.phone ? <p>{p.phone}</p> : <p>Contact: {OSM_UNAVAILABLE}</p>}
                </div>
                {mapId === p.id && <div className="mt-3"><PlaceMiniMap lat={p.lat} lng={p.lng} /></div>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      add(p.id)
                      toast.success(`Added ${p.name} to trip`)
                      navigate('/trip')
                    }}
                  >
                    Add to Trip
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => select(p.id)}>
                    View
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setMapId(mapId === p.id ? null : p.id)}>
                    Map
                  </Button>
                  {showNavigate && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!online) return toast.error('Navigation needs a connection.')
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`, '_blank')
                      }}
                    >
                      Navigate
                    </Button>
                  )}
                  <button
                    className={`ml-auto grid size-9 place-items-center rounded-full ${loved ? 'bg-sunset-500/15 text-sunset-600' : 'bg-sand-100 text-ink-400'}`}
                    aria-label="Save"
                    onClick={() => {
                      if (loved) unsave(p.id)
                      else {
                        save(p.id)
                        toast.success('Saved')
                      }
                    }}
                  >
                    <Heart className={`size-4 ${loved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
