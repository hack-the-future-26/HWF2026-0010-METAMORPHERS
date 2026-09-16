/** Honest empty-state copy — never invent OSM fields. */
export const OSM_UNAVAILABLE = 'Not available from OSM'
export const NO_NEARBY_RESTAURANT = 'No named restaurants returned for this area yet'
export const NO_NEARBY_ATTRACTIONS = 'No attractions were found nearby.'
export const LIVE_TRAFFIC_UNAVAILABLE = 'Live traffic unavailable'
export const LIVE_CROWD_UNAVAILABLE = 'Live crowd data unavailable'
export const PRICE_UNAVAILABLE = 'Price unavailable'
export const WEATHER_UNAVAILABLE = 'Live weather is temporarily unavailable.'
export const ROUTING_UNAVAILABLE = 'Route calculation is temporarily unavailable.'
export const DESTINATION_NOT_FOUND = "We couldn't find this destination. Try another city or location."
export const GPS_DENIED = 'GPS unavailable. Continuing with planned route.'
export const RATING_UNAVAILABLE = 'Rating unavailable'
export const HOURS_UNAVAILABLE = 'Opening hours unavailable'

export function honestRating(place: { rating: number; ratingKnown?: boolean; reviewCount?: number }) {
  if (place.ratingKnown === true && place.rating > 0) {
    const reviews = place.reviewCount ? ` · ${place.reviewCount} reviews` : ''
    return `⭐ ${place.rating}${reviews}`
  }
  return `${place.reviewCount ?? 0} reviews`
}

export function honestHours(place: { openingHours?: string; hoursKnown?: boolean; bestTime?: string }) {
  if (place.hoursKnown === true) return place.openingHours || place.bestTime || ''
  return ''
}

export function honestPrice(place: { entryFee?: number; estimatedCost?: number; priceKnown?: boolean }) {
  if (place.priceKnown !== true) return ''
  const n = place.entryFee || place.estimatedCost || 0
  return n ? `₹${n}` : 'Free / no ticket listed'
}
export const OFF_ROUTE_MESSAGE = 'You appear to be off route. Recalculating...'
