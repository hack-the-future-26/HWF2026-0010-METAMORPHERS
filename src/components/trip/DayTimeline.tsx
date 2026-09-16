import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import type { Activity } from '@/types'
import { getPlace } from '@/data/places'
import { useAppStore } from '@/store/useAppStore'
import { formatDuration, formatKm, formatInr } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { PlaceImage } from '@/components/ui/PlaceImage'
import { honestPrice, honestRating } from '@/lib/osmCopy'

export function DayTimeline({ dayIndex }: { dayIndex: number }) {
  const trip = useAppStore((s) => s.trip)
  const reorder = useAppStore((s) => s.reorderDay)
  const saved = useAppStore((s) => s.lastRouteSavedMin)
  const day = trip?.daysPlan[dayIndex]
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  if (!day) return null

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = day.activities.map((a) => a.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from < 0 || to < 0) return
    reorder(dayIndex, from, to)
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-sunset-600">Day {day.index + 1}</p>
        <h3 className="mt-1 font-display text-3xl leading-tight">{day.theme}</h3>
        <p className="mt-1 text-sm text-ink-500">{day.title}</p>
        {saved > 0 && (
          <span className="mt-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Route tightened · saved {saved}m
          </span>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={day.activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="relative space-y-0 pl-4">
            <div className="absolute bottom-6 left-[7px] top-3 w-px bg-gradient-to-b from-teal-700 via-sunset-400 to-transparent" />
            {day.activities.map((a) => (
              <SortableActivity key={a.id} activity={a} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function hopLine(activity: Activity) {
  if (!activity.travelFromPrevMin && !activity.travelFromPrevKm) return null
  const mode =
    activity.transport === 'walking'
      ? 'walk'
      : activity.transport === 'public'
        ? 'metro / bus'
        : activity.transport === 'rental'
          ? 'rental'
          : 'cab or auto'
  const bits = [`How to get here: ${activity.travelFromPrevMin || 8} min ${mode}`]
  if (activity.travelFromPrevKm) bits.push(formatKm(activity.travelFromPrevKm))
  return bits.join(' · ')
}

function SortableActivity({ activity }: { activity: Activity }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })
  const select = useAppStore((s) => s.setSelectedPlace)
  const remove = useAppStore((s) => s.removeActivity)
  const replace = useAppStore((s) => s.replaceActivity)
  const goTo = useAppStore((s) => s.goToPlace)
  const nearby = useAppStore((s) => s.nearbyPlaces)
  const navigate = useNavigate()
  const place = activity.placeId
    ? (getPlace(activity.placeId) ?? nearby.find((p) => p.id === activity.placeId))
    : undefined
  const style = { transform: CSS.Transform.toString(transform), transition }
  const duration = place?.durationMin ?? 60
  const hop = hopLine(activity)
  const price = activity.cost ? formatInr(activity.cost) : place ? honestPrice(place) : ''

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`relative pb-8 ${isDragging ? 'z-10' : ''}`}
    >
      <span className="absolute -left-4 top-3 size-3.5 rounded-full border-2 border-white bg-teal-800 shadow-card dark:border-ink-900" />
      <div className="overflow-hidden rounded-[1.6rem] bg-white/90 shadow-card ring-1 ring-black/5 dark:bg-ink-800 dark:ring-white/8">
        <button
          className="flex w-full gap-4 p-4 text-left"
          onClick={() => activity.placeId && select(activity.placeId)}
          {...attributes}
          {...listeners}
        >
          {place && (
            <PlaceImage
              src={place.image}
              name={place.name}
              lat={place.lat}
              lng={place.lng}
              imgClassName="size-20 rounded-2xl"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.16em] text-teal-800 dark:text-teal-300">
              {activity.start} — {activity.end}
            </p>
            <p className="mt-1 font-display text-xl leading-tight">
              {activity.kind === 'meal' ? `${mealEmoji(activity.title)} ${activity.title}` : activity.title}
            </p>
            <p className="mt-1 text-xs text-ink-500">{activity.subtitle}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-400">
              <span>{formatDuration(duration)}</span>
              {place ? <span>{honestRating(place)}</span> : null}
              {price ? <span>{price}</span> : null}
            </div>
            {hop ? <p className="mt-2 text-xs text-sunset-700 dark:text-sunset-300">{hop}</p> : null}
            {activity.reasons?.length ? (
              <details className="mt-2 text-xs text-ink-500">
                <summary className="cursor-pointer font-medium text-teal-800 dark:text-teal-300">Why recommended?</summary>
                <ul className="mt-1 space-y-0.5">
                  {activity.reasons.map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        </button>
        <div className="flex flex-wrap gap-1.5 border-t border-sand-100 px-4 py-3 dark:border-white/8">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (place) {
                goTo(place.id)
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`, '_blank')
              }
            }}
          >
            Directions
          </Button>
          <Button size="sm" variant="ghost" onClick={() => remove(activity.id)}>
            Remove
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const alt = nearby.find((p) => p.id !== activity.placeId && (p.indoor || p.category === 'attraction'))
              if (!alt || !activity.placeId) return toast.error('No replacement from current map data.')
              replace(activity.id, alt.id)
              toast.success(`Swapped for ${alt.name}`)
            }}
          >
            Swap stop
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (activity.placeId) select(activity.placeId)
              navigate('/trip')
            }}
          >
            Open map
          </Button>
        </div>
      </div>
    </article>
  )
}

function mealEmoji(title: string) {
  if (title.toLowerCase().includes('break')) return '🍳'
  if (title.toLowerCase().includes('lunch')) return '🍛'
  if (title.toLowerCase().includes('dinner')) return '🍽️'
  return '🍴'
}
