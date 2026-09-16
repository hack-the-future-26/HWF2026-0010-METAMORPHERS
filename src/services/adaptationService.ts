import { adaptItinerary, evaluateTripConditions, applyReplacement, withRouteBudgetDeltas } from '@/lib/adaptEngine'
import { estimateTripBudget } from '@/lib/budgetEstimate'
import { applyOsrmHops, recalcRoute } from './aiService'
import type { Place, Trip, WeatherSnapshot } from '@/types'

export const adaptationService = {
  evaluate: evaluateTripConditions,
  adapt: adaptItinerary,
  async apply(trip: Trip, weather: WeatherSnapshot, places: Place[], demoMode = false) {
    const suggestion = adaptItinerary({ itinerary: trip, weather, availablePlaces: places, demoMode })
    if (!suggestion) return { changed: false as const, trip, suggestion: null }
    const before = {
      km: trip.route.totalDistanceKm,
      min: trip.route.totalTravelMin,
      spend: trip.budgetEstimate?.mid ?? trip.estimatedSpend,
    }
    let next = recalcRoute(applyReplacement(trip, suggestion))
    try {
      next = await applyOsrmHops(next)
    } catch {
      /* keep estimated hops */
    }
    next = { ...next, budgetEstimate: estimateTripBudget(next, next.hotel) }
    const explained = withRouteBudgetDeltas(suggestion, before, {
      km: next.route.totalDistanceKm,
      min: next.route.totalTravelMin,
      spend: next.budgetEstimate?.mid ?? next.estimatedSpend,
    })
    return { changed: true as const, trip: next, suggestion: explained }
  },
}
