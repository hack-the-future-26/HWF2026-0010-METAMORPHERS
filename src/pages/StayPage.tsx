import { useEffect, useMemo, useState } from 'react'
import { fetchHotels, type LiveHotel } from '@/services/backend'
import { catalogParentCity, getDestination, lodgingCityName, needsCityHeal } from '@/data/destinations'
import { useAppStore } from '@/store/useAppStore'
import { formatInr, formatKm } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { PlaceImage } from '@/components/ui/PlaceImage'

type SortKey = 'distance' | 'price' | 'rating' | 'stars'

export function StayPage() {
  const destId = useAppStore((s) => s.trip?.destinationId ?? s.planner.destinationId)
  const dest = destId ? getDestination(destId) : { name: 'your destination', lat: 0, lng: 0, city: undefined as string | undefined }
  const parent = destId && needsCityHeal(dest) ? catalogParentCity(dest) : undefined
  const cityName = parent ? parent.name : lodgingCityName(dest)
  const cityLat = parent?.lat ?? dest.lat
  const cityLng = parent?.lng ?? dest.lng
  const hotelCityId = parent?.id || destId
  const [hotels, setHotels] = useState<LiveHotel[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('distance')
  const [offset, setOffset] = useState(0)

  const load = (nextOffset: number, append: boolean) => {
    setLoading(true)
    setError(null)
    if (!hotelCityId) {
      setLoading(false)
      setError('Pick a destination first.')
      return
    }
    void fetchHotels(hotelCityId, nextOffset, 20, {
      lat: cityLat,
      lng: cityLng,
      name: cityName,
      city: parent?.city || dest.city || cityName,
    })
      .then((pack) => {
        setTotal(pack.total)
        setHotels((prev) => (append ? [...prev, ...pack.hotels] : pack.hotels))
        setOffset(nextOffset + pack.hotels.length)
      })
      .catch(() => setError('Could not load hotels from the live map feed. Retry in a moment.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setHotels([])
    setOffset(0)
    load(0, false)
  }, [destId, hotelCityId, cityLat, cityLng])

  const list = useMemo(() => {
    const copy = [...hotels]
    copy.sort((a, b) => {
      if (sort === 'price') return a.price.low - b.price.low
      if (sort === 'rating') return (b.rating ?? -1) - (a.rating ?? -1)
      if (sort === 'stars') return (b.stars ?? 0) - (a.stars ?? 0)
      return a.distanceKm - b.distanceKm
    })
    return copy
  }, [hotels, sort])

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sunset-600">Stay the night</p>
      <h1 className="mt-1 font-display text-4xl sm:text-5xl">Hotels in {cityName}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">
        Live lodging from OpenStreetMap{total ? ` · ${total} properties` : ''}. Ratings come from Google Places when a
        server key is set; otherwise review count is 0. Nightly figures are labeled estimates, not live booking rates.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {(['distance', 'price', 'rating', 'stars'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${sort === k ? 'bg-teal-800 text-white' : 'bg-white shadow-card dark:bg-ink-800'}`}
          >
            {k}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-6 rounded-3xl bg-white p-5 shadow-card">
          <p className="text-sm">{error}</p>
          <Button size="sm" className="mt-3" onClick={() => load(0, false)}>
            Try again
          </Button>
        </div>
      )}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {list.map((h) => (
          <article key={h.id} className="overflow-hidden rounded-[1.6rem] bg-white shadow-card ring-1 ring-black/5 dark:bg-ink-800">
            <PlaceImage src={h.photo || ''} name={h.name} city={cityName} lat={h.lat} lng={h.lng} category="hotel" imgClassName="h-48 w-full" />
            <div className="p-5">
              <p className="font-display text-2xl leading-tight">{h.name}</p>
              <p className="mt-1 text-sm text-ink-500">{h.area || h.address || cityName}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-sand-100 px-2.5 py-1 dark:bg-white/8">{formatKm(h.distanceKm)} from centre</span>
                <span className="rounded-full bg-sand-100 px-2.5 py-1 dark:bg-white/8">
                  {h.rating != null ? `★ ${h.rating.toFixed(1)} · ${h.reviewCount} reviews` : `0 reviews`}
                </span>
                {h.stars ? <span className="rounded-full bg-sand-100 px-2.5 py-1 dark:bg-white/8">{h.stars}★ class</span> : null}
              </div>
              <p className="mt-3 text-sm">
                {formatInr(h.price.low)}–{formatInr(h.price.high)}
                <span className="ml-2 text-xs text-ink-400">{h.price.label}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {h.phone && (
                  <a href={`tel:${h.phone.replace(/\s/g, '')}`} className="rounded-full bg-teal-800 px-3 py-1.5 text-xs text-white">
                    {h.phone}
                  </a>
                )}
                {h.website && (
                  <a href={h.website} target="_blank" rel="noreferrer" className="rounded-full bg-sand-100 px-3 py-1.5 text-xs text-teal-800 dark:bg-white/8">
                    Official site
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {loading && <p className="mt-6 text-sm text-ink-500">Loading hotels…</p>}
      {!loading && hotels.length < total && (
        <div className="mt-8 text-center">
          <Button onClick={() => load(offset, true)}>Load more</Button>
        </div>
      )}
      {!loading && !error && hotels.length === 0 && (
        <p className="mt-8 text-sm text-ink-500">No named hotels returned for this city yet. Try another Indian city.</p>
      )}
    </div>
  )
}
