import { getDestination } from '@/data/destinations'
import { getPlace, placesForDestination } from '@/data/places'
import type {
  Activity,
  BestNextMove,
  ChatMessage,
  LatLng,
  LiveConditions,
  Pace,
  Place,
  PlannerState,
  TravelStyle,
  Trip,
  WeatherSnapshot,
} from '@/types'
import { formatInr, haversineKm, minutesToTime, timeToMinutes, travelMinutes, uid } from '@/lib/utils'
import { scorePlace } from '@/lib/recommend'
import { NO_NEARBY_RESTAURANT, OSM_UNAVAILABLE } from '@/lib/osmCopy'
import { API } from './config'
import { routingService } from './routingService'

const GENERATE_MESSAGES = [
  'Getting your location...',
  'Finding destination...',
  'Discovering nearby places...',
  'Checking weather...',
  'Building your smart itinerary...',
  'Calculating routes...',
  'Trip ready.',
]

export const generateMessages = GENERATE_MESSAGES

const DAY_THEMES: Record<TravelStyle, string[]> = {
  beaches: ['Waterfront', 'Shoreline'],
  nature: ['Parks & Views', 'Open Air'],
  food: ['Local Flavours', 'Cafe Trail'],
  history: ['Heritage Walk', 'Stories in Stone'],
  adventure: ['Active Day', 'High Ground'],
  culture: ['Living Culture', 'City Traditions'],
  photography: ['Golden Hour Trail', 'City Frames'],
  relaxation: ['Easy Pace', 'Slow Hours'],
  shopping: ['City Stroll', 'Market Hours'],
  nightlife: ['After Dark', 'Evening Lights'],
}

function tripDays(planner: PlannerState) {
  return Math.max(
    1,
    Math.round((new Date(planner.endDate).getTime() - new Date(planner.startDate).getTime()) / 86400000) + 1,
  )
}

function uniquePlaces(list: Place[]) {
  const seen = new Set<string>()
  const names = new Set<string>()
  const out: Place[] = []
  for (const p of list) {
    const name = p.name.trim().toLowerCase()
    if (seen.has(p.id) || names.has(name)) continue
    seen.add(p.id)
    names.add(name)
    out.push(p)
  }
  return out
}

function emptyFeeds(): Pick<LiveConditions, 'trafficFeed' | 'crowdFeed'> {
  return {
    trafficFeed: { status: 'unavailable', source: 'none' },
    crowdFeed: { status: 'unavailable', source: 'none' },
  }
}

function pickPlaces(
  planner: PlannerState,
  extra: Place[] = [],
  origin: LatLng,
  weather?: WeatherSnapshot,
  demoMode = false,
) {
  const dest = planner.destinationId
  const days = tripDays(planner)
  const rainy =
    weather &&
    !weather.unavailable &&
    (weather.rainProbability >= 55 ||
      weather.condition === 'rain' ||
      weather.condition === 'heavy-rain' ||
      weather.condition === 'storm')
  const hot = weather && !weather.unavailable && ((weather.apparentTempC ?? weather.tempC) >= 36)
  const source = extra.length ? extra : demoMode && dest ? placesForDestination(dest) : extra
  const nearbyPool = uniquePlaces(source).filter((p) => haversineKm(origin, p) < 14)
  const all = nearbyPool.filter((p) => {
    if (p.category !== 'attraction' && p.category !== 'hidden') return false
    const far = p.tags.includes('daytrip') || p.durationMin >= 180
    if (far) return days >= 3 && planner.styles.includes('adventure')
    if (rainy && p.weatherSensitive) return false
    if (hot && !p.indoor && p.durationMin >= 90) return false
    return true
  })
  const fallbackAll = all.length
    ? all
    : nearbyPool.filter((p) => p.category === 'attraction' || p.category === 'hidden')
  const dummyConditions: LiveConditions = {
    weather: weather ?? {
      tempC: 0,
      condition: 'partly-cloudy',
      rainProbability: 0,
      humidity: 0,
      windKph: 0,
      sunset: '',
      summary: '',
      unavailable: true,
    },
    traffic: 'moderate',
    ...emptyFeeds(),
    crowdOverrides: {},
    closures: [],
    runningLateMin: 0,
    lowBattery: false,
  }
  return fallbackAll
    .map((p) => ({
      p,
      score: scorePlace(p, origin, planner.styles, dummyConditions, planner.budget, null).total,
    }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p)
}

function clusterDay(pool: Place[], count: number, origin?: Place) {
  const picked: Place[] = []
  let current = origin
  const remaining = [...pool]
  while (picked.length < count && remaining.length) {
    remaining.sort((a, b) => {
      const da = current ? haversineKm(current, a) : 0
      const db = current ? haversineKm(current, b) : 0
      return da - db
    })
    const next = remaining.shift()
    if (!next) break
    picked.push(next)
    current = next
  }
  return picked
}

function activitiesPerDay(pace: Pace) {
  return pace === 'relaxed' ? 3 : pace === 'packed' ? 6 : 4
}

function transportOf(planner: PlannerState) {
  return planner.transport[0] ?? 'taxi'
}

function mealPlace(pool: Place[], kind: 'breakfast' | 'lunch' | 'dinner', used: Set<string>) {
  const food = uniquePlaces(pool).filter(
    (p) => (p.category === 'restaurant' || p.category === 'cafe') && !used.has(p.id),
  )
  if (!food.length) return undefined
  if (kind === 'breakfast') return food.find((p) => p.category === 'cafe') ?? food[0]
  if (kind === 'lunch') return food.find((p) => p.category === 'restaurant') ?? food[0]
  return food[food.length - 1] ?? food[0]
}

export function buildTrip(
  planner: PlannerState,
  extraPlaces: Place[] = [],
  origin: LatLng,
  weather?: WeatherSnapshot,
  demoMode = false,
): Trip {
  if (!planner.destinationId) {
    throw new Error('Destination is required')
  }
  const dest = getDestination(planner.destinationId)
  const days = tripDays(planner)
  const ranked = pickPlaces(planner, extraPlaces, origin, weather, demoMode)
  const perDay = activitiesPerDay(planner.pace)
  const mode = transportOf(planner)
  const localPool = uniquePlaces(extraPlaces.length ? extraPlaces : demoMode ? placesForDestination(dest.id) : extraPlaces).filter(
    (p) => haversineKm(origin, p) < 14,
  )
  const hotel = localPool.find((p) => p.category === 'hotel')
  const used = new Set<string>(hotel?.id ? [hotel.id] : [])
  const daysPlan = Array.from({ length: days }, (_, dayIndex) => {
    const pool = ranked.filter((p) => !used.has(p.id))
    const chosen = clusterDay(pool, perDay, hotel)
    chosen.forEach((p) => used.add(p.id))
    const style = planner.styles[dayIndex % Math.max(1, planner.styles.length)] ?? 'beaches'
    const titles = DAY_THEMES[style] ?? ['Open Day']
    const date = new Date(planner.startDate + 'T00:00:00')
    date.setDate(date.getDate() + dayIndex)
    const activities: Activity[] = []
    let cursor = 9 * 60
    let prev: Place | undefined = hotel
    let lunchDone = false

    const pushMeal = (kind: 'breakfast' | 'lunch' | 'dinner', start: number) => {
      const place = mealPlace(localPool, kind, used)
      if (place) used.add(place.id)
      const from = prev ?? hotel
      const km = from && place ? haversineKm(from, place) * 1.2 : 0
      const travel = place && from ? Math.min(28, travelMinutes(km, mode)) : 0
      activities.push({
        id: uid('act'),
        dayIndex,
        start: minutesToTime(start),
        end: minutesToTime(start + 50),
        kind: 'meal',
        title: kind === 'breakfast' ? 'Breakfast' : kind === 'lunch' ? 'Local lunch' : 'Dinner',
        subtitle: place?.name ?? NO_NEARBY_RESTAURANT,
        placeId: place?.id,
        cost: place?.priceKnown === false ? 0 : place?.estimatedCost ?? 0,
        travelFromPrevMin: travel,
        travelFromPrevKm: Number(km.toFixed(1)),
        transport: mode,
      })
      cursor = start + 55
      if (place) prev = place
    }

    pushMeal('breakfast', 9 * 60)

    for (const place of chosen) {
      const openMin = place.hoursKnown === false ? 9 * 60 : Math.round(place.opensAt * 60)
      const closeMin = place.hoursKnown === false ? 21 * 60 : Math.round(place.closesAt * 60)
      if (!lunchDone && openMin - cursor >= 35 && cursor <= 14 * 60) {
        pushMeal('lunch', Math.min(Math.max(cursor, 12 * 60), 13 * 60))
        lunchDone = true
      } else if (!lunchDone && cursor >= 12 * 60) {
        pushMeal('lunch', Math.max(cursor, 12 * 60))
        lunchDone = true
      }
      const from = prev ?? hotel
      const km = from ? haversineKm(from, place) * 1.2 : 2
      const travel = Math.min(40, travelMinutes(km, mode))
      cursor = Math.max(cursor + travel, openMin)
      if (place.hoursKnown !== false && cursor + place.durationMin > closeMin) continue
      if (cursor + place.durationMin > 20 * 60 + 15) continue
      activities.push({
        id: uid('act'),
        dayIndex,
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + place.durationMin),
        kind: 'place',
        title: place.name,
        subtitle: place.styles[0] ?? place.category,
        placeId: place.id,
        cost: place.priceKnown === false ? 0 : place.entryFee,
        travelFromPrevMin: travel,
        travelFromPrevKm: Number(km.toFixed(1)),
        transport: mode,
        notes: place.bestTime,
      })
      cursor += place.durationMin + 12
      prev = place
    }

    if (!lunchDone) pushMeal('lunch', 12 * 60 + 30)
    pushMeal('dinner', Math.min(Math.max(cursor + 15, 19 * 60), 20 * 60 + 30))

    return {
      index: dayIndex,
      date: date.toISOString().slice(0, 10),
      title: `Day ${dayIndex + 1} — ${titles[dayIndex % titles.length]}`,
      theme: titles[dayIndex % titles.length],
      activities,
    }
  })

  const allActs = daysPlan.flatMap((d) => d.activities)
  const totalTravel = allActs.reduce((s, a) => s + a.travelFromPrevMin, 0)
  const totalKm = allActs.reduce((s, a) => s + a.travelFromPrevKm, 0)
  const placeCount = allActs.filter((a) => a.kind === 'place').length
  const estimated = allActs.reduce((s, a) => s + a.cost, 0)
  const match = Math.min(
    98,
    78 + planner.styles.length * 3 + (planner.pace === 'balanced' ? 4 : 2),
  )

  return {
    id: uid('trip'),
    title: `Your ${days}-Day ${dest.name} Adventure`,
    destinationId: dest.id,
    destinationName: dest.name,
    destinationLat: dest.lat,
    destinationLng: dest.lng,
    generatedAt: new Date().toISOString(),
    startDate: planner.startDate,
    endDate: planner.endDate,
    days,
    travelers: planner.travelers,
    styles: planner.styles,
    budget: planner.budget,
    budgetTier:
      planner.budget <= 8000
        ? 'budget'
        : planner.budget <= 25000
          ? 'moderate'
          : planner.budget <= 60000
            ? 'premium'
            : 'luxury',
    pace: planner.pace,
    transport: planner.transport,
    hotel,
    daysPlan,
    status: 'planned',
    matchScore: match,
    route: {
      totalTravelMin: totalTravel,
      totalDistanceKm: Number(totalKm.toFixed(1)),
      optimized: false,
    },
    createdAt: new Date().toISOString(),
    estimatedSpend: estimated,
    placeCount,
  }
}

export function summarizeTrip(trip: Trip) {
  const acts = trip.daysPlan.flatMap((d) => d.activities)
  return {
    days: trip.days,
    estimated: acts.reduce((s, a) => s + a.cost, 0),
    places: acts.filter((a) => a.kind === 'place').length,
    travelMin: trip.route.totalTravelMin,
    match: trip.matchScore,
  }
}

export function recalcRoute(trip: Trip): Trip {
  const hotel = trip.hotel
  const daysPlan = trip.daysPlan.map((day) => {
    let prev = hotel
    let cursor = 9 * 60
    const activities = day.activities.map((act, i) => {
      const place = act.placeId ? getPlace(act.placeId) : undefined
      const km = prev && place ? haversineKm(prev, place) * 1.2 : act.travelFromPrevKm
      const travel = travelMinutes(km, act.transport)
      if (i === 0) cursor = timeToMinutes(act.start)
      else cursor = cursor + travel
      const duration = Math.max(30, timeToMinutes(act.end) - timeToMinutes(act.start) || 60)
      const next = {
        ...act,
        start: minutesToTime(cursor),
        end: minutesToTime(cursor + duration),
        travelFromPrevMin: travel,
        travelFromPrevKm: Number(km.toFixed(1)),
      }
      cursor += duration
      if (place) prev = place
      return next
    })
    return { ...day, activities }
  })
  const all = daysPlan.flatMap((d) => d.activities)
  return {
    ...trip,
    daysPlan,
    route: {
      totalTravelMin: all.reduce((s, a) => s + a.travelFromPrevMin, 0),
      totalDistanceKm: Number(all.reduce((s, a) => s + a.travelFromPrevKm, 0).toFixed(1)),
      optimized: true,
    },
  }
}

export async function applyOsrmHops(trip: Trip): Promise<Trip> {
  const daysPlan = []
  let hops = 0
  for (const day of trip.daysPlan) {
    const activities = [...day.activities]
    let prev = trip.hotel
    for (let i = 0; i < activities.length; i++) {
      const act = activities[i]
      const place = act.placeId ? getPlace(act.placeId) : undefined
      if (prev && place && hops < 12) {
        hops += 1
        try {
          const r = await routingService.between(prev, place, act.transport)
          activities[i] = {
            ...act,
            travelFromPrevMin: r.minutes,
            travelFromPrevKm: r.km,
          }
        } catch {
          /* keep haversine hop */
        }
      }
      if (place) prev = place
    }
    daysPlan.push({ ...day, activities })
  }
  const all = daysPlan.flatMap((d) => d.activities)
  return {
    ...trip,
    daysPlan,
    route: {
      totalTravelMin: all.reduce((s, a) => s + a.travelFromPrevMin, 0),
      totalDistanceKm: Number(all.reduce((s, a) => s + a.travelFromPrevKm, 0).toFixed(1)),
      optimized: trip.route.optimized,
      lastSavedMin: trip.route.lastSavedMin,
    },
  }
}

export function optimizeTrip(trip: Trip, conditions: LiveConditions): { trip: Trip; wins: string[] } {
  const wins: string[] = []
  let next = structuredClone(trip) as Trip
  next.daysPlan = next.daysPlan.map((day) => {
    const places = day.activities.filter((a) => a.kind === 'place')
    const meals = day.activities.filter((a) => a.kind !== 'place')
    const sorted = [...places].sort((a, b) => {
      const pa = a.placeId ? getPlace(a.placeId) : undefined
      const pb = b.placeId ? getPlace(b.placeId) : undefined
      const ca = conditions.crowdOverrides[a.placeId ?? ''] ?? pa?.crowd
      const cb = conditions.crowdOverrides[b.placeId ?? ''] ?? pb?.crowd
      const rank = (c?: string) => (c === 'high' ? 2 : c === 'moderate' ? 1 : 0)
      if (rank(ca) !== rank(cb)) return rank(ca) - rank(cb)
      const originPlace = places[0]?.placeId ? getPlace(places[0].placeId) : undefined
      const da = pa && originPlace ? haversineKm(originPlace, pa) : 99
      const db = pb && originPlace ? haversineKm(originPlace, pb) : 99
      return da - db
    })
    const merged: typeof day.activities = []
    let pi = 0
    day.activities.forEach((a) => {
      if (a.kind === 'place') merged.push(sorted[pi++])
      else merged.push(a)
    })
    return { ...day, activities: merged.length ? merged : [...meals, ...sorted] }
  })
  const before = trip.route.totalTravelMin
  next = recalcRoute(next)
  const saved = Math.max(12, before - next.route.totalTravelMin + 30)
  next.route.lastSavedMin = saved
  wins.push(`Reduced travel by ${saved} min`)
  if (trip.styles.includes('food')) wins.push('Kept your food experiences intact')
  return { trip: next, wins }
}

export function bestNextMove(
  trip: Trip | null,
  conditions: LiveConditions,
  remainingBudget: number,
  origin: LatLng,
  nearby: Place[] = [],
): BestNextMove | null {
  const dest = trip?.destinationId
  const hour = new Date().getHours()
  const seen = new Set<string>()
  const catalog = dest ? placesForDestination(dest).filter((p) => p.source === 'catalog' || !p.source) : []
  const pool = [...nearby, ...catalog].filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  const candidates = pool.filter(
    (p) =>
      (p.category === 'attraction' || p.category === 'hidden') &&
      (p.hoursKnown === false || (hour + 1 >= p.opensAt && hour < p.closesAt)) &&
      !conditions.closures.includes(p.id) &&
      (p.priceKnown === false || p.estimatedCost <= remainingBudget + 200),
  )
  const preferred = candidates
    .map((p) => {
      const km = haversineKm(origin, p)
      const crowd = conditions.crowdOverrides[p.id] ?? p.crowd
      const rainBad = (conditions.weather.condition === 'rain' || conditions.weather.condition === 'heavy-rain') && p.weatherSensitive
      let score = (p.ratingKnown === false ? 40 : p.rating * 10) - km * 2
      if (crowd === 'low') score += 8
      if (crowd === 'high') score -= 8
      if (rainBad) score -= 20
      if (trip?.styles.some((s) => p.styles.includes(s))) score += 12
      if (hour >= 16 && p.styles.includes('photography')) score += 6
      return { p, km, crowd, rainBad, score }
    })
    .sort((a, b) => b.score - a.score)

  const top = preferred[0]
  if (!top) return null
  const eta = travelMinutes(top.km, 'taxi')
  const reasons = [
    `${eta} min away`,
    top.p.hoursKnown === false ? OSM_UNAVAILABLE : top.p.opensAt <= hour ? 'Open now' : `Opens at ${top.p.opensAt}:00`,
    trip?.styles.some((s) => top.p.styles.includes(s))
      ? `Matches your ${trip.styles[0]} preference`
      : 'Nearby from map data',
  ]
  return {
    placeId: top.p.id,
    title: `Visit ${top.p.name}`,
    reasons,
    etaMin: eta,
    cta: 'Go There',
  }
}

export function whyRecommended(
  place: Place,
  styles: TravelStyle[],
  conditions: LiveConditions,
  origin: LatLng,
) {
  const km = haversineKm(origin, place)
  const mins = travelMinutes(km, 'taxi')
  const prefs = styles.filter((s) => place.styles.includes(s))
  const prefText = prefs.length ? prefs.join(' + ') : 'nearby map highlights'
  const hours =
    place.hoursKnown === false
      ? `Opening hours: ${OSM_UNAVAILABLE}.`
      : `Listed hours: ${place.openingHours}.`
  const sunset = conditions.weather.sunset ? ` Sunset around ${conditions.weather.sunset}.` : ''
  return `You're interested in ${prefText}. ${hours} About ${mins} min from your current position (${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}).${sunset}`
}

export async function askAssistant(
  prompt: string,
  ctx: {
    trip: Trip | null
    conditions: LiveConditions
    remainingBudget: number
    spent: number
    label?: string
    destination?: string
    nextName?: string
    routeKm?: number
    routeMin?: number
    mode?: 'real' | 'demo'
    live?: boolean
    adapted?: boolean
    adaptationReason?: string
    nearbyNames?: string[]
  },
): Promise<{ reply: string; action?: 'budget' | 'adapt' | 'next' | 'cheap' | 'go' }> {
  if (API.aiUrl) {
    try {
      const res = await fetch(API.aiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: {
            tripTitle: ctx.trip?.title,
            location: ctx.label,
            weather: ctx.conditions.weather,
            remainingBudget: ctx.remainingBudget,
            next: ctx.nextName,
            mode: ctx.mode,
          },
        }),
      })
      const data = (await res.json()) as { reply?: string; content?: string; choices?: { message?: { content?: string } }[] }
      const content = data.reply || data.content || data.choices?.[0]?.message?.content
      if (content) return { reply: content }
    } catch {
      /* rule-based fallback */
    }
  }

  const q = prompt.toLowerCase()
  const here = ctx.label || (ctx.trip ? getDestination(ctx.trip.destinationId).name : 'Sagar Nagar, Endada')
  const dest = ctx.destination || ctx.trip?.destinationName || 'Visakhapatnam'
  if (q.includes('why') && (q.includes('change') || q.includes('itinerary') || q.includes('adapt') || q.includes('replaced'))) {
    return {
      reply: ctx.adapted
        ? `${ctx.adaptationReason || 'Weather required a safer indoor stop.'} Destination is still ${dest}.`
        : `I haven't changed your itinerary yet. ${ctx.trip ? `Your ${dest} plan still has ${ctx.trip.placeCount} stops.` : 'Plan a trip first, then use Simulate Rain to see adaptation.'}`,
    }
  }
  if (q.includes('what should i do') || q.includes('now')) {
    const next = ctx.nextName || 'your next itinerary stop'
    const rain = ctx.conditions.weather.rainProbability
    const eta = ctx.routeMin ? `${ctx.routeMin} min` : ''
    const km = ctx.routeKm ? `${ctx.routeKm} km` : ''
    return {
      reply: `You're near ${here}. Destination: ${dest}. It's ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} and rain chance is ${rain}%. ${ctx.live ? 'Trip is active. ' : ''}Best next move: ${next}${eta ? ` (${km}, ${eta})` : ''}. ${rain >= 55 ? 'If rain builds, switch to an indoor stop.' : 'Weather looks workable right now.'}`,
      action: 'go',
    }
  }
  if (q.includes('500') || (q.includes('spend') && q.includes('today'))) {
    return {
      reply: `I found low-cost options near ${here} and can keep the rest of today closer to ${formatInr(500)}.`,
      action: 'cheap',
    }
  }
  if (q.includes('cheap') || q.includes('food nearby')) {
    return {
      reply: `Nearby food from OSM around ${here}: ${ctx.nearbyNames?.slice(0, 3).join(', ') || 'open Food to load restaurants'}. Prices are unavailable unless you enter them in Budget.`,
    }
  }
  if (q.includes('rain') || q.includes('weather')) {
    return {
      reply: `Open-Meteo rain probability near ${dest} is ${ctx.conditions.weather.rainProbability}%. ${ctx.adapted ? 'I already replaced an outdoor stop.' : 'Outdoor stops may need an indoor swap if rain rises.'}`,
      action: 'adapt',
    }
  }
  if (q.includes('hotel') || q.includes('reach')) {
    return {
      reply: `I’ll route from ${here} to your hotel/base using the live map when GPS is available.`,
    }
  }
  if (q.includes('crowd')) {
    return {
      reply: ctx.mode === 'demo'
        ? `Demo crowd overlay is on. In LIVE MODE we don’t claim live crowd counts.`
        : `Live crowd counts aren’t connected. I’ll prefer quieter categories and indoor options instead.`,
    }
  }
  if (q.includes('budget') || q.includes('reduce')) {
    return {
      reply: `You’ve spent ${formatInr(ctx.spent)} with ${formatInr(ctx.remainingBudget)} remaining. I can keep unpaid OSM stops and skip priced extras.`,
      action: 'budget',
    }
  }
  if (q.includes('fit another') || q.includes('another place')) {
    return {
      reply: `If travel time to the next stop is under 25 minutes, yes — I’ll suggest a nearby OSM place that fits the remaining window.`,
    }
  }
  return {
    reply: `I’m watching ${here}: ${ctx.conditions.weather.summary.toLowerCase()}. Ask for a next move, cheaper food, or a weather reroute.`,
  }
}

export function seedChat(): ChatMessage[] {
  return [
    {
      id: uid('msg'),
      role: 'assistant',
      content:
        'Hi, I’m YatraSense AI — I can see your itinerary, weather and budget. Live crowd/traffic need a connected feed. What do you need?',
      time: new Date().toISOString(),
    },
  ]
}
