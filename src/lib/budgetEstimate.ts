import type { BudgetEstimate, Place, Trip } from '@/types'

export function estimateTripBudget(trip: Trip, hotel?: Place | null): BudgetEstimate {
  const nights = Math.max(1, trip.days)
  const meals = trip.daysPlan.reduce((n, d) => n + d.activities.filter((a) => a.kind === 'meal').length, 0)
  const hops = trip.daysPlan.reduce((n, d) => n + d.activities.filter((a) => a.travelFromPrevMin > 0).length, 0)
  const tickets = trip.daysPlan.reduce((n, d) => n + d.activities.filter((a) => a.kind === 'place').length, 0)
  const knownTicket = trip.daysPlan
    .flatMap((d) => d.activities)
    .filter((a) => a.kind === 'place' && a.cost > 0)
    .reduce((s, a) => s + a.cost, 0)
  const hotelLow = hotel?.priceKnown && hotel.estimatedCost ? hotel.estimatedCost * nights : 2200 * nights
  const hotelHigh = hotel?.priceKnown && hotel.estimatedCost ? Math.round(hotel.estimatedCost * 1.35 * nights) : 7800 * nights
  const foodLow = meals * 180
  const foodHigh = meals * 550
  const ticketsLow = knownTicket || tickets * 40
  const ticketsHigh = knownTicket ? Math.round(knownTicket * 1.2) : tickets * 350
  const transitLow = hops * 60
  const transitHigh = hops * 280
  const miscLow = Math.round((hotelLow + foodLow + ticketsLow + transitLow) * 0.08)
  const miscHigh = Math.round((hotelHigh + foodHigh + ticketsHigh + transitHigh) * 0.12)
  const low = hotelLow + foodLow + ticketsLow + transitLow + miscLow
  const high = hotelHigh + foodHigh + ticketsHigh + transitHigh + miscHigh
  const mid = Math.round((low + high) / 2)
  const remaining = trip.budget - mid
  const knownFields = [hotel?.priceKnown, knownTicket > 0].filter(Boolean).length
  const confidence = Math.round(28 + knownFields * 22 + Math.min(30, trip.placeCount * 4))
  return {
    low,
    high,
    mid,
    remaining,
    overBy: remaining < 0 ? Math.abs(remaining) : 0,
    confidence: Math.min(92, confidence),
    nights,
    hotelLow,
    hotelHigh,
    foodLow,
    foodHigh,
    ticketsLow,
    ticketsHigh,
    transitLow,
    transitHigh,
    miscLow,
    miscHigh,
  }
}

export function scaleEstimate(base: BudgetEstimate, target: number): BudgetEstimate {
  const mid = (base.low + base.high) / 2
  if (!mid || !target) return base
  const factor = target / mid
  const scale = (n: number) => Math.max(0, Math.round(n * factor))
  return {
    ...base,
    low: scale(base.low),
    high: scale(base.high),
    hotelLow: scale(base.hotelLow),
    hotelHigh: scale(base.hotelHigh),
    foodLow: scale(base.foodLow),
    foodHigh: scale(base.foodHigh),
    ticketsLow: scale(base.ticketsLow),
    ticketsHigh: scale(base.ticketsHigh),
    transitLow: scale(base.transitLow),
    transitHigh: scale(base.transitHigh),
    miscLow: scale(base.miscLow ?? 0),
    miscHigh: scale(base.miscHigh ?? 0),
    mid: scale(base.mid ?? mid),
    remaining: target - scale(base.mid ?? mid),
    overBy: Math.max(0, scale(base.mid ?? mid) - target),
  }
}

export function isOverBudget(estimate: BudgetEstimate, budget: number) {
  const mid = estimate.mid ?? Math.round((estimate.low + estimate.high) / 2)
  return mid > budget
}

export function overBudgetBy(estimate: BudgetEstimate, budget: number) {
  const mid = estimate.mid ?? Math.round((estimate.low + estimate.high) / 2)
  return Math.max(0, mid - budget)
}

/** Drop the most expensive place stops until the mid estimate is under budget. */
export function optimizeActivitiesForBudget(trip: Trip, hotel?: Place | null): { trip: Trip; wins: string[] } {
  const wins: string[] = []
  let next: Trip = {
    ...trip,
    daysPlan: trip.daysPlan.map((d) => ({ ...d, activities: [...d.activities] })),
  }
  let estimate = estimateTripBudget(next, hotel ?? next.hotel)
  while (isOverBudget(estimate, next.budget)) {
    const places = next.daysPlan.flatMap((d) => d.activities.filter((a) => a.kind === 'place' && a.cost > 0))
    const costly = [...places].sort((a, b) => b.cost - a.cost)[0]
    if (!costly) {
      wins.push('No priced activity left to drop — remaining overage is lodging/food estimates.')
      break
    }
    next = {
      ...next,
      daysPlan: next.daysPlan.map((day) => ({
        ...day,
        activities: day.activities.filter((a) => a.id !== costly.id),
      })),
      placeCount: Math.max(0, next.placeCount - 1),
    }
    wins.push(`Removed ${costly.title} (estimated ₹${costly.cost}) to stay on budget`)
    estimate = estimateTripBudget(next, hotel ?? next.hotel)
    if (wins.length > 6) break
  }
  return { trip: { ...next, budgetEstimate: estimate, estimatedSpend: estimate.mid ?? estimate.low }, wins }
}
