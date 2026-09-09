import { getPlace, placesForDestination } from '@/data/places'
import type { Activity, AdaptationSuggestion, Place, Trip, WeatherSnapshot } from '@/types'
import { uid } from '@/lib/utils'

function dayActivities(trip: Trip, dayIndex = 0) {
  return trip.daysPlan[dayIndex]?.activities ?? []
}

function outdoorStop(act: Activity) {
  const p = act.placeId ? getPlace(act.placeId) : undefined
  return Boolean(p && p.indoor === false && (p.weatherSensitive || p.styles.includes('beaches') || p.styles.includes('nature')))
}

function indoorBackup(destinationId: string, avoid: string[]) {
  return placesForDestination(destinationId).find(
    (p) =>
      p.indoor &&
      p.category === 'attraction' &&
      !avoid.includes(p.id) &&
      !p.tags.includes('daytrip') &&
      p.durationMin < 150,
  )
}

function indoorAlternative(nearby: Place[], avoid: string[], destId: string, demoMode: boolean): Place | undefined {
  const nearbyIndoor = nearby.find(
    (p) =>
      p.indoor &&
      !avoid.includes(p.id) &&
      !p.tags.includes('daytrip') &&
      (p.category === 'attraction' || p.category === 'cafe' || p.category === 'restaurant' || p.category === 'shopping'),
  )
  if (nearbyIndoor) return nearbyIndoor
  if (!demoMode) return undefined
  if (getPlace('submarine') && !avoid.includes('submarine')) return getPlace('submarine')
  if (getPlace('aircraft-museum') && !avoid.includes('aircraft-museum')) return getPlace('aircraft-museum')
  return indoorBackup(destId, avoid) ?? getPlace('submarine')
}

function suggestionForSwap(
  hit: Activity,
  alt: Place,
  title: string,
  message: string,
  reason: string,
): AdaptationSuggestion {
  return {
    id: uid('adp'),
    type: 'weather',
    title,
    message,
    reason,
    original: { time: hit.start, title: hit.title, placeId: hit.placeId },
    recommended: [{ time: hit.start, title: alt.name, placeId: alt.id }],
    timeSavedMin: 0,
    replacementPlaceId: alt.id,
    affectedActivityId: hit.id,
  }
}

export function adaptItinerary(opts: {
  itinerary: Trip
  weather: WeatherSnapshot
  availablePlaces: Place[]
  currentTime?: Date
  demoMode?: boolean
}): AdaptationSuggestion | null {
  const { itinerary, weather, availablePlaces, demoMode = false } = opts
  if (weather.unavailable) return null
  const acts = dayActivities(itinerary)
  const avoid = acts.map((a) => a.placeId).filter(Boolean) as string[]
  const rainy =
    weather.rainProbability >= 55 ||
    weather.condition === 'rain' ||
    weather.condition === 'heavy-rain' ||
    weather.condition === 'storm'
  const hot = (weather.apparentTempC ?? weather.tempC) >= 36 || weather.tempC >= 36

  if (rainy) {
    const hit = acts.find(outdoorStop)
    if (!hit) return null
    const alt = indoorAlternative(availablePlaces, avoid.filter((id) => id !== hit.placeId), itinerary.destinationId, demoMode)
    if (!alt) return null
    return suggestionForSwap(
      hit,
      alt,
      'Weather alert',
      `Rain is expected (${weather.rainProbability}% probability). Outdoor stops are being swapped for indoor ones.`,
      `${alt.name} is indoor and a better fit for this weather.`,
    )
  }

  if (hot) {
    const hit = acts.find((act) => {
      const p = act.placeId ? getPlace(act.placeId) : undefined
      return Boolean(p && !p.indoor && p.durationMin >= 75)
    })
    if (!hit) return null
    const alt = indoorAlternative(availablePlaces, avoid.filter((id) => id !== hit.placeId), itinerary.destinationId, demoMode)
    if (!alt) return null
    return suggestionForSwap(
      hit,
      alt,
      'Heat alert',
      `It's ${weather.tempC}°C. A long outdoor stop is being shortened with an indoor alternative.`,
      `${alt.name} is indoor and shorter in this heat.`,
    )
  }

  return null
}

export function rainAdaptation(trip: Trip, nearby: Place[] = [], demoMode = false): AdaptationSuggestion | null {
  return adaptItinerary({
    itinerary: trip,
    weather: {
      tempC: 24,
      condition: 'heavy-rain',
      rainProbability: 88,
      humidity: 0,
      windKph: 0,
      sunset: '',
      summary: 'Heavy rain',
    },
    availablePlaces: nearby,
    demoMode,
  })
}

export function realWeatherAdaptation(
  trip: Trip,
  nearby: Place[],
  rainProbability: number,
  condition: string,
  weather?: WeatherSnapshot,
  demoMode = false,
) {
  const snap: WeatherSnapshot = weather ?? {
    tempC: 28,
    condition: condition as WeatherSnapshot['condition'],
    rainProbability,
    humidity: 0,
    windKph: 0,
    sunset: '',
    summary: '',
  }
  return adaptItinerary({ itinerary: trip, weather: snap, availablePlaces: nearby, demoMode })
}

export function trafficAdaptation(trip: Trip): AdaptationSuggestion | null {
  const acts = dayActivities(trip)
  const first = acts.find((a) => a.kind === 'place')
  const second = acts.filter((a) => a.kind === 'place')[1]
  if (!first) return null
  return {
    id: uid('adp'),
    type: 'traffic',
    title: 'Trip Optimization',
    message: 'Simulated traffic increase on the way to your next stop.',
    reason: 'Switching order can reduce time in congestion (jury demo).',
    original: { time: first.start, title: first.title, placeId: first.placeId },
    recommended: [
      { time: first.start, title: second?.title ?? first.title, placeId: second?.placeId ?? first.placeId },
      { time: second?.start ?? first.start, title: first.title, placeId: first.placeId },
    ],
    timeSavedMin: 12,
    replacementPlaceId: second?.placeId,
    affectedActivityId: first.id,
  }
}

export function crowdAdaptation(place: Place): AdaptationSuggestion {
  return {
    id: uid('adp'),
    type: 'crowd',
    title: `${place.name} is crowded`,
    message: place.crowdNote || 'High crowd expected later today (estimated / simulated).',
    reason: 'Visit between 7:30–8:30 AM tomorrow for a quieter experience.',
    original: { time: '5:00 PM', title: place.name, placeId: place.id },
    recommended: [{ time: '7:30 AM', title: place.name, placeId: place.id }],
    affectedActivityId: place.id,
  }
}

export function closureAdaptation(trip: Trip, placeId: string, nearby: Place[] = [], demoMode = false): AdaptationSuggestion | null {
  const acts = trip.daysPlan.flatMap((d) => d.activities)
  const hit = acts.find((a) => a.placeId === placeId)
  if (!hit) return null
  const avoid = [placeId]
  const alt = indoorAlternative(nearby, avoid, trip.destinationId, demoMode)
  if (!alt) return null
  return {
    id: uid('adp'),
    type: 'closure',
    title: 'Place closed',
    message: `${hit.title} is unavailable.`,
    reason: `${alt.name} is open and a short detour away.`,
    original: { time: hit.start, title: hit.title, placeId: hit.placeId },
    recommended: [{ time: hit.start, title: alt.name, placeId: alt.id }],
    replacementPlaceId: alt.id,
    affectedActivityId: hit.id,
  }
}

export function lateAdaptation(trip: Trip): AdaptationSuggestion | null {
  const next = dayActivities(trip).find((a) => a.kind === 'place')
  if (!next) return null
  return {
    id: uid('adp'),
    type: 'late',
    title: 'Running behind',
    message: 'You’re about 25 minutes behind the original plan.',
    reason: 'Dropping a low-priority stop keeps later stops intact.',
    original: { time: next.start, title: next.title, placeId: next.placeId },
    recommended: [{ time: next.start, title: 'Keep later blocks, skip one stop', placeId: next.placeId }],
    affectedActivityId: next.id,
  }
}

export function applyReplacement(trip: Trip, suggestion: AdaptationSuggestion): Trip {
  const replacement = suggestion.replacementPlaceId
    ? getPlace(suggestion.replacementPlaceId)
    : undefined
  const daysPlan = trip.daysPlan.map((day) => ({
    ...day,
    activities: day.activities.map((act) => {
      if (act.id !== suggestion.affectedActivityId && act.placeId !== suggestion.original.placeId) {
        return act
      }
      if (!replacement) return act
      return {
        ...act,
        title: replacement.name,
        placeId: replacement.id,
        cost: replacement.priceKnown === false ? 0 : replacement.entryFee,
        subtitle: 'Weather reroute',
        notes: suggestion.reason,
      }
    }),
  }))
  return { ...trip, daysPlan }
}

export function applyCrowdMove(trip: Trip, placeId: string): Trip {
  const daysPlan = trip.daysPlan.map((day) => {
    const idx = day.activities.findIndex((a) => a.placeId === placeId)
    if (idx < 0) return day
    const acts = [...day.activities]
    const [item] = acts.splice(idx, 1)
    acts.unshift({ ...item, start: '7:30 AM', end: '8:30 AM', notes: 'Moved to quieter morning slot' })
    return { ...day, activities: acts }
  })
  return { ...trip, daysPlan }
}
