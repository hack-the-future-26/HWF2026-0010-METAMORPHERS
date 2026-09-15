import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import type { Place } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { getDestination, lodgingCityName } from '@/data/destinations'
import { areaOrigin } from '@/lib/origin'
import { formatKm, haversineKm } from '@/lib/utils'
import { honestHours, honestPrice, honestRating } from '@/lib/osmCopy'
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
  const filterIds = filters.map((f) => f.id).join(',')
  useEffect(() => {
    if (!filters.some((f) => f.id === cat)) {
      setCat(filters[0]?.id ?? 'all')
      return
    }
    const fn = filters.find((f) => f.id === cat)?.match
    if (cat === 'famous' && fn && places.length && !places.some(fn)) {
      const allId = filters.some((f) => f.id === 'all') ? 'all' : filters[0]?.id
      if (allId && allId !== cat) setCat(allId)
    }
  }, [filterIds, cat, places, filters])
  const [mapId, setMapId] = useState<string | null>(null)
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId)
  const origin = areaOrigin(destId)
  const destName = destId ? lodgingCityName(getDestination(destId)) : undefined
  const add = useAppStore((s) => s.addPlaceToTrip)
  const save = useAppStore((s) => s.savePlace)
  const unsave = useAppStore((s) => s.unsavePlace)
  const saved = useAppStore((s) => s.saved)
  const select = useAppStore((s) => s.setSelectedPlace)
  const online = useAppStore((s) => s.online)
  const navigate = useNavigate()
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
        <p className="mt-8 text-sm text-ink-500">No matching named places in this area yet. Try a wider city or retry.</p>
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
                  <Badge>{honestRating(p)}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {p.styles[0] ?? p.category} · {formatKm(km)}
                  {p.address ? ` · ${p.address}` : ''}
                </p>
                {p.description ? <p className="mt-2 line-clamp-2 text-xs text-ink-500">{p.description}</p> : null}
                <div className="mt-2 space-y-1 text-[11px] text-ink-400">
                  {honestHours(p) ? <p>Hours: {honestHours(p)}</p> : null}
                  {honestPrice(p) ? <p>{honestPrice(p)}</p> : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {p.phone ? (
                      <a href={`tel:${p.phone.replace(/\s/g, '')}`} className="rounded-full bg-teal-800 px-2.5 py-1 text-[11px] text-white">
                        Call {p.phone}
                      </a>
                    ) : null}
                    {p.website ? (
                      <a href={p.website} className="rounded-full bg-sand-100 px-2.5 py-1 text-[11px] text-teal-800 dark:bg-white/8" target="_blank" rel="noreferrer">
                        Official site
                      </a>
                    ) : null}
                  </div>
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
