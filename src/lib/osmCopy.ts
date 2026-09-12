/** Honest empty-state copy — never invent OSM fields. */
export const OSM_UNAVAILABLE = 'Not available from OSM'
export const NO_NEARBY_RESTAURANT = 'No nearby restaurant found from available map data'
export const NO_NEARBY_ATTRACTIONS = 'No attractions were found nearby.'
export const LIVE_TRAFFIC_UNAVAILABLE = 'Live traffic unavailable'
export const LIVE_CROWD_UNAVAILABLE = 'Live crowd data unavailable'
export const PRICE_UNAVAILABLE = 'Price unavailable'
export const WEATHER_UNAVAILABLE = 'Live weather is temporarily unavailable.'
export const ROUTING_UNAVAILABLE = 'Route calculation is temporarily unavailable.'
export const DESTINATION_NOT_FOUND = "We couldn't find that destination. Try another city or landmark."
export const GPS_DENIED = 'GPS unavailable. Continuing with planned route.'
export const RATING_UNAVAILABLE = 'Rating unavailable'
export const HOURS_UNAVAILABLE = 'Opening hours unavailable'

export function honestRating(place: { rating: number; ratingKnown?: boolean }, liveMode: boolean) {
  if (liveMode) return place.ratingKnown === true ? `⭐ ${place.rating}` : RATING_UNAVAILABLE
  return place.rating > 0 ? `⭐ ${place.rating}` : RATING_UNAVAILABLE
}

export function honestHours(place: { openingHours?: string; hoursKnown?: boolean; bestTime?: string }) {
  if (place.hoursKnown !== true) return HOURS_UNAVAILABLE
  return place.openingHours || place.bestTime || HOURS_UNAVAILABLE
}

export function honestPrice(place: { entryFee?: number; estimatedCost?: number; priceKnown?: boolean }) {
  if (place.priceKnown !== true) return PRICE_UNAVAILABLE
  const n = place.entryFee || place.estimatedCost || 0
  return n ? `₹${n}` : PRICE_UNAVAILABLE
}
export const OFF_ROUTE_MESSAGE = 'You appear to be off route. Recalculating...'
