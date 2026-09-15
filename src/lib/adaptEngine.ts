import { getPlace, placesForDestination } from '@/data/places'
import type { Activity, AdaptationSuggestion, Place, Trip, WeatherSnapshot } from '@/types'
import { uid } from '@/lib/utils'

export const RAIN_THRESHOLD = 70
export const HEAT_THRESHOLD_C = 38

function resolvePlace(act: Activity, nearby: Place[] = []) {
  return (act.placeId ? getPlace(act.placeId) : undefined) ?? nearby.find((p) => p.id === act.placeId)
}

export function outdoorStop(act: Activity, nearby: Place[] = []) {
  const p = resolvePlace(act, nearby)
  if (p && p.indoor === false && (p.weatherSensitive || p.styles.includes('beaches') || p.styles.includes('nature'))) {
    return true
  }
  const blob = `${act.title} ${act.subtitle ?? ''}`.toLowerCase()
  return /beach|park|garden|viewpoint|fort|fortress|boating|statue|trail|outdoor/.test(blob)
}

function dayActivities(trip: Trip, nearby: Place[] = [], dayIndex = 0) {
  const one = trip.daysPlan[dayIndex]?.activities ?? []
  if (one.some((a) => outdoorStop(a, nearby))) return one
  return trip.daysPlan.flatMap((d) => d.activities)
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
  if (!demoMode || destId !== 'vizag') return undefined
  return placesForDestination('vizag').find(
    (p) => p.indoor && p.category === 'attraction' && !avoid.includes(p.id) && p.durationMin < 150,
  )
}

function explanationFor(opts: {
  rain: boolean
  heat: boolean
  weather: WeatherSnapshot
  hit: Activity
  alt: Place
  kmDelta?: number
  minDelta?: number
  savings?: number
}) {
  const triggerLine = opts.rain
    ? `Rain probability increased to ${opts.weather.rainProbability}%.`
    : `Temperature is ${opts.weather.tempC}°C (extreme heat threshold ${HEAT_THRESHOLD_C}°C).`
  const lines = [
    'PLAN UPDATED',
    'Your itinerary was automatically adjusted.',
    '',
    'Why?',
    triggerLine,
    `${opts.hit.title} is an outdoor activity.`,
    `We replaced it with ${opts.alt.name}, an indoor alternative.`,
  ]
  if (opts.kmDelta != null && opts.kmDelta !== 0) {
    lines.push(`The new route is ${Math.abs(opts.kmDelta).toFixed(1)} km ${opts.kmDelta < 0 ? 'shorter' : 'longer'}.`)
  }
  if (opts.minDelta != null && opts.minDelta !== 0) {
    lines.push(`Estimated time ${opts.minDelta < 0 ? 'saved' : 'added'}: ${Math.abs(Math.round(opts.minDelta))} minutes.`)
  }
  if (opts.savings) lines.push(`Estimated savings: ₹${Math.round(opts.savings)}.`)
  return lines.join('\n')
}

function suggestionForSwap(
  hit: Activity,
  alt: Place,
  title: string,
  message: string,
  reason: string,
  trigger: AdaptationSuggestion['trigger'],
  extra?: Partial<AdaptationSuggestion>,
): AdaptationSuggestion {
  return {
    id: uid('adp'),
    type: trigger?.type === 'heat' ? 'heat' : 'weather',
    title,
    message,
    reason,
    explanation: extra?.explanation,
    changed: true,
    trigger,
    original: { time: hit.start, title: hit.title, placeId: hit.placeId },
    recommended: [{ time: hit.start, title: alt.name, placeId: alt.id }],
    timeSavedMin: extra?.timeSavedMin ?? 0,
    replacementPlaceId: alt.id,
    affectedActivityId: hit.id,
    routeChanges: extra?.routeChanges,
    budgetChanges: extra?.budgetChanges,
  }
}

export function evaluateTripConditions(opts: {
  itinerary: Trip
  weather: WeatherSnapshot
  availablePlaces: Place[]
  currentTime?: Date
  demoMode?: boolean
}): AdaptationSuggestion | null {
  return adaptItinerary(opts)
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
  const acts = dayActivities(itinerary, availablePlaces)
  const avoid = acts.map((a) => a.placeId).filter(Boolean) as string[]
  const rainy =
    weather.rainProbability >= RAIN_THRESHOLD ||
    weather.condition === 'rain' ||
    weather.condition === 'heavy-rain' ||
    weather.condition === 'storm'
  const hot = (weather.apparentTempC ?? weather.tempC) >= HEAT_THRESHOLD_C || weather.tempC >= HEAT_THRESHOLD_C

  if (rainy) {
    const hit = acts.find((a) => a.kind === 'place' && outdoorStop(a, availablePlaces))
    if (!hit) return null
    const alt = indoorAlternative(availablePlaces, avoid.filter((id) => id !== hit.placeId), itinerary.destinationId, demoMode)
    if (!alt) return null
    const explanation = explanationFor({ rain: true, heat: false, weather, hit, alt })
    return suggestionForSwap(
      hit,
      alt,
      'PLAN UPDATED',
      `Rain probability is ${weather.rainProbability}%. ${hit.title} (outdoor) was replaced with ${alt.name} (indoor).`,
      explanation,
      { type: 'weather', severity: weather.rainProbability >= 80 ? 'high' : 'medium', value: weather.rainProbability },
      { explanation },
    )
  }

  if (hot) {
    const hit = acts.find((act) => {
      const p = resolvePlace(act, availablePlaces)
      return act.kind === 'place' && Boolean(p && !p.indoor)
    })
    if (!hit) return null
    const alt = indoorAlternative(availablePlaces, avoid.filter((id) => id !== hit.placeId), itinerary.destinationId, demoMode)
    if (!alt) return null
    const explanation = explanationFor({ rain: false, heat: true, weather, hit, alt })
    return suggestionForSwap(
      hit,
      alt,
      'PLAN UPDATED',
      `It's ${weather.tempC}°C. ${hit.title} is outdoors; ${alt.name} is a shaded indoor alternative.`,
      explanation,
      { type: 'heat', severity: 'high', value: weather.tempC },
      { explanation },
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
      rainProbability: 82,
      humidity: 0,
      windKph: 0,
      sunset: '',
      summary: 'Heavy rain',
      source: 'Open-Meteo',
    },
    availablePlaces: nearby,
    demoMode,
  })
}

export function heatAdaptation(trip: Trip, nearby: Place[] = [], demoMode = false): AdaptationSuggestion | null {
  return adaptItinerary({
    itinerary: trip,
    weather: {
      tempC: 39,
      apparentTempC: 41,
      condition: 'clear',
      rainProbability: 5,
      humidity: 20,
      windKph: 8,
      sunset: '',
      summary: 'Extreme heat',
      source: 'Open-Meteo',
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

export function trafficAdaptation(_trip: Trip): AdaptationSuggestion | null {
  return null
}

export function crowdAdaptation(_place: Place): AdaptationSuggestion | null {
  return null
}

export function closureAdaptation(trip: Trip, placeId: string, nearby: Place[] = [], demoMode = false): AdaptationSuggestion | null {
  const acts = trip.daysPlan.flatMap((d) => d.activities)
  const hit = acts.find((a) => a.placeId === placeId)
  if (!hit) return null
  const alt = indoorAlternative(nearby, [placeId], trip.destinationId, demoMode)
  if (!alt) return null
  return {
    id: uid('adp'),
    type: 'closure',
    title: 'Place closed',
    message: `${hit.title} is unavailable.`,
    reason: `${alt.name} is open and a short detour away.`,
    changed: true,
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
    message: 'You’re behind the original plan.',
    reason: 'Dropping a low-priority stop keeps later stops intact.',
    original: { time: next.start, title: next.title, placeId: next.placeId },
    recommended: [{ time: next.start, title: 'Keep later blocks, skip one stop', placeId: next.placeId }],
    affectedActivityId: next.id,
  }
}

export function applyReplacement(trip: Trip, suggestion: AdaptationSuggestion): Trip {
  const replacement =
    (suggestion.replacementPlaceId ? getPlace(suggestion.replacementPlaceId) : undefined) ??
    undefined
  const daysPlan = trip.daysPlan.map((day) => ({
    ...day,
    activities: day.activities.map((act) => {
      if (act.id !== suggestion.affectedActivityId && act.placeId !== suggestion.original.placeId) {
        return act
      }
      const rec = suggestion.recommended[0]
      return {
        ...act,
        title: replacement?.name ?? rec?.title ?? act.title,
        placeId: replacement?.id ?? rec?.placeId ?? act.placeId,
        cost: replacement?.priceKnown === false ? 0 : replacement?.entryFee ?? act.cost,
        subtitle: 'Weather reroute',
        notes: suggestion.reason,
        reasons: ['Replaced after a live weather change', suggestion.reason.split('\n')[0] || suggestion.message],
        weatherSuitability: 'good' as const,
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

export function withRouteBudgetDeltas(
  suggestion: AdaptationSuggestion,
  before: { km: number; min: number; spend: number },
  after: { km: number; min: number; spend: number },
): AdaptationSuggestion {
  const kmDelta = Number((after.km - before.km).toFixed(2))
  const minDelta = after.min - before.min
  const savings = before.spend - after.spend
  const extras = [
    kmDelta !== 0 ? `The new route is ${Math.abs(kmDelta).toFixed(1)} km ${kmDelta < 0 ? 'shorter' : 'longer'}.` : '',
    minDelta !== 0 ? `Estimated time ${minDelta < 0 ? 'saved' : 'added'}: ${Math.abs(minDelta)} minutes.` : '',
    savings ? `Estimated savings: ₹${Math.round(savings)}.` : '',
  ].filter(Boolean)
  return {
    ...suggestion,
    timeSavedMin: minDelta < 0 ? Math.abs(minDelta) : 0,
    routeChanges: { kmDelta, minutesDelta: minDelta },
    budgetChanges: { estimatedSavings: Math.max(0, Math.round(savings)) },
    explanation: [suggestion.explanation || suggestion.reason, ...extras].filter(Boolean).join('\n'),
    reason: [suggestion.reason, ...extras].filter(Boolean).join('\n'),
  }
}
