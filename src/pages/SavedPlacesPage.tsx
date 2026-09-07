import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlace } from '@/data/places'
import { useAppStore } from '@/store/useAppStore'
import type { SavedList } from '@/types'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Feedback'
import { toast } from 'sonner'

const TABS: { id: SavedList; label: string }[] = [
  { id: 'want', label: 'Want to Visit' },
  { id: 'visited', label: 'Visited' },
  { id: 'favorites', label: 'Favorites' },
]

export function SavedPlacesPage() {
  const saved = useAppStore((s) => s.saved)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const unsave = useAppStore((s) => s.unsavePlace)
  const move = useAppStore((s) => s.moveSaved)
  const add = useAppStore((s) => s.addPlaceToTrip)
  const select = useAppStore((s) => s.setSelectedPlace)
  const [tab, setTab] = useState<SavedList>('want')
  const navigate = useNavigate()
  const list = saved.filter((s) => s.list === tab)
  const resolve = (id: string) =>
    getPlace(id) ?? nearbyPlaces.find((p) => p.id === id) ?? saved.find((s) => s.placeId === id)?.snapshot

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl">Saved Places</h1>
      <div className="mt-5 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm ${tab === t.id ? 'bg-teal-800 text-white' : 'bg-white dark:bg-ink-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="You haven’t saved any places yet."
            body="Heart a viewpoint, beach or cafe while exploring — they’ll live here after refresh."
            action={{ label: 'Explore destinations', onClick: () => navigate('/explore') }}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((s) => {
            const p = resolve(s.placeId)
            if (!p) {
              return (
                <article key={s.placeId} className="flex gap-3 rounded-3xl bg-white p-3 shadow-card dark:bg-ink-800">
                  <div className="grid h-20 w-24 place-items-center rounded-2xl bg-teal-50 text-lg dark:bg-teal-950">📍</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Saved place</p>
                    <p className="text-xs text-ink-500">Details unavailable — open Live to refresh nearby OSM data.</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => unsave(s.placeId)}>
                      Remove
                    </Button>
                  </div>
                </article>
              )
            }
            return (
              <article key={s.placeId} className="flex gap-3 rounded-3xl bg-white p-3 shadow-card dark:bg-ink-800">
                {p.image ? (
                  <img src={p.image} alt="" className="h-20 w-24 rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-20 w-24 place-items-center rounded-2xl bg-teal-50 text-lg dark:bg-teal-950">📍</div>
                )}
                <div className="min-w-0 flex-1">
                  <button className="font-medium" onClick={() => select(p.id)}>
                    {p.name}
                  </button>
                  <p className="text-xs text-ink-500">
                    {p.ratingKnown === false ? 'Not available from OSM' : `⭐ ${p.rating}`} · {p.address}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => { add(p.id); toast.success('Added to trip'); navigate('/trip') }}>
                      Add to Trip
                    </Button>
                    {tab !== 'favorites' && (
                      <Button size="sm" variant="secondary" onClick={() => move(p.id, 'favorites')}>
                        Favorite
                      </Button>
                    )}
                    {tab !== 'visited' && (
                      <Button size="sm" variant="secondary" onClick={() => move(p.id, 'visited')}>
                        Visited
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => unsave(p.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
