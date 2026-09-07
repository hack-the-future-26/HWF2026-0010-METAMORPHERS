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
import { GripVertical } from 'lucide-react'
import type { Activity } from '@/types'
import { getPlace } from '@/data/places'
import { crowdOf, useAppStore } from '@/store/useAppStore'
import { CrowdDot } from '@/components/ui/Feedback'
import { formatInr } from '@/lib/utils'

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
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink-400">DAY {day.index + 1}</p>
          <h3 className="font-display text-2xl">{day.theme}</h3>
        </div>
        {saved > 0 && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Route optimized · saved {saved}m
          </span>
        )}
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={day.activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {day.activities.map((a) => (
              <SortableActivity key={a.id} activity={a} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableActivity({ activity }: { activity: Activity }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })
  const select = useAppStore((s) => s.setSelectedPlace)
  const conditions = useAppStore((s) => s.conditions)
  const appMode = useAppStore((s) => s.appMode)
  const place = activity.placeId ? getPlace(activity.placeId) : undefined
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`flex gap-3 rounded-3xl bg-white p-3 shadow-card ring-1 ring-black/5 dark:bg-ink-800 dark:ring-white/8 ${isDragging ? 'z-10 scale-[1.01]' : ''}`}
    >
      <button className="text-ink-400" {...attributes} {...listeners} aria-label="Reorder">
        <GripVertical className="size-4" />
      </button>
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => activity.placeId && select(activity.placeId)}
      >
        <p className="text-xs text-teal-800 dark:text-teal-300">{activity.start}</p>
        <p className="font-medium">{activity.kind === 'meal' ? `${mealEmoji(activity.title)} ${activity.title}` : activity.title}</p>
        <p className="text-xs text-ink-500">{activity.subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink-400">
          {place && appMode === 'demo' && place.crowdKnown !== false ? (
            <CrowdDot level={crowdOf(place, conditions.crowdOverrides)} />
          ) : (
            <span>Live crowd data unavailable</span>
          )}
          <span>
            {activity.travelFromPrevMin
              ? `${activity.travelFromPrevMin} min travel`
              : 'Route estimate unavailable'}
          </span>
          <span>{place?.priceKnown === false || !activity.cost ? 'Price unavailable' : formatInr(activity.cost)}</span>
        </div>
      </button>
      {place && (
        <img src={place.image} alt="" className="size-16 rounded-2xl object-cover" />
      )}
    </article>
  )
}

function mealEmoji(title: string) {
  if (title.toLowerCase().includes('break')) return '🍳'
  if (title.toLowerCase().includes('lunch')) return '🍛'
  if (title.toLowerCase().includes('dinner')) return '🍽️'
  return '🍴'
}
