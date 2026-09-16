import type { LiveConditions, Place, RecommendationScore, TravelStyle, Trip } from '@/types'
import { clamp, haversineKm } from '@/lib/utils'

export function scorePlace(
  place: Place,
  origin: { lat: number; lng: number },
  styles: TravelStyle[],
  conditions: LiveConditions,
  remainingBudget: number,
  trip: Trip | null,
): RecommendationScore {
  const km = haversineKm(origin, place)
  const hour = new Date().getHours() + new Date().getMinutes() / 60
  const interestOverlap = place.styles.filter((s) => styles.includes(s)).length
  const interest = clamp(interestOverlap * 22 + (place.category === 'attraction' ? 8 : 4), 0, 30)

  const distance = clamp(22 - km * 3.2, 0, 22)

  let weather = 16
  const rainy =
    conditions.weather.condition === 'rain' ||
    conditions.weather.condition === 'heavy-rain' ||
    conditions.weather.condition === 'storm' ||
    conditions.weather.rainProbability >= 70
  const hot = (conditions.weather.apparentTempC ?? conditions.weather.tempC) >= 38
  if (rainy && place.weatherSensitive) weather = 2
  else if (rainy && place.indoor) weather = 22
  else if (hot && place.indoor) weather = 20
  else if (hot && !place.indoor) weather = 6
  else if (!rainy && place.styles.includes('beaches')) weather = 20

  let time = 12
  if (place.hoursKnown === false) time = 10
  else if (hour + 0.4 < place.opensAt || hour > place.closesAt) time = 0
  else if (hour >= place.opensAt && hour + 1 < place.closesAt) time = 16

  let budget = 12
  if (place.priceKnown === false) budget = 10
  else if (place.estimatedCost > remainingBudget) budget = 2
  else if (place.estimatedCost === 0) budget = 14

  const visited = new Set(trip?.daysPlan.flatMap((d) => d.activities.map((a) => a.placeId)) ?? [])
  let itinerary = 10
  if (visited.has(place.id)) itinerary = 3
  if (trip?.pace === 'relaxed' && km > 8) itinerary -= 4

  const activity = place.indoor ? 10 : trip?.pace === 'packed' ? 12 : 11

  const total = Math.round(clamp(interest + distance + weather + time + budget + itinerary + activity * 0.15, 0, 100))
  const reasons: string[] = []
  if (interestOverlap) reasons.push(`Matches your interest in ${place.styles.filter((s) => styles.includes(s))[0]}`)
  else reasons.push('Fits the live map around your destination')
  reasons.push(`${km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`} / about ${Math.max(6, Math.round((km / 28) * 60))} min from the previous stop`)
  if (place.priceKnown === true && place.estimatedCost === 0) reasons.push('Fits your budget — no known entry fee')
  else if (place.priceKnown === true) reasons.push('Fits your budget')
  else reasons.push('Fits your budget (estimated — OSM has no ticket price)')
  if (rainy && place.indoor) reasons.push('Suitable for today’s weather (indoor)')
  else if (rainy && place.weatherSensitive) reasons.push('Weather caution — outdoor and rain-sensitive')
  else reasons.push('Suitable for today’s weather')
  if (place.hoursKnown === true && time > 8) reasons.push('Fits your available time')
  else if (place.hoursKnown !== true) reasons.push('Opening hours: Not available from OSM')

  return {
    placeId: place.id,
    total,
    reasons: reasons.slice(0, 5),
    breakdown: { interest, distance, weather, time, budget, itinerary, activity },
  }
}

export function rankPlaces(
  places: Place[],
  origin: { lat: number; lng: number },
  styles: TravelStyle[],
  conditions: LiveConditions,
  remainingBudget: number,
  trip: Trip | null,
) {
  return places
    .map((p) => ({ place: p, score: scorePlace(p, origin, styles, conditions, remainingBudget, trip) }))
    .sort((a, b) => b.score.total - a.score.total)
}

export function weatherSuitabilityFor(place: Place, rainProbability: number, tempC: number): 'good' | 'caution' | 'poor' {
  if (rainProbability >= 70 && place.weatherSensitive && !place.indoor) return 'poor'
  if (tempC >= 38 && !place.indoor) return 'caution'
  if (rainProbability >= 55 && !place.indoor) return 'caution'
  return 'good'
}
