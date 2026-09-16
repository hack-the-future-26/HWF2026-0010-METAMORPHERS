import { describe, expect, it } from 'vitest'
import { adaptItinerary, applyReplacement, RAIN_THRESHOLD, HEAT_THRESHOLD_C } from './adaptEngine'
import type { Place, Trip, WeatherSnapshot } from '@/types'

const outdoor: Place = {
  id: 'golconda',
  destinationId: 'hyderabad',
  name: 'Golconda Fort',
  category: 'attraction',
  styles: ['history'],
  description: '',
  rating: 0,
  reviewCount: 0,
  image: '',
  images: [],
  lat: 17.3833,
  lng: 78.4011,
  address: 'Not available from OSM',
  openingHours: 'Not available from OSM',
  opensAt: 9,
  closesAt: 17,
  entryFee: 0,
  bestTime: '',
  crowd: 'moderate',
  crowdNote: '',
  durationMin: 120,
  estimatedCost: 0,
  indoor: false,
  weatherSensitive: true,
  tags: ['fort'],
}

const indoor: Place = {
  ...outdoor,
  id: 'birla',
  name: 'Birla Science Museum',
  indoor: true,
  weatherSensitive: false,
  tags: ['museum'],
}

function trip(): Trip {
  return {
    id: 't1',
    title: 'Test',
    destinationId: 'hyderabad',
    destinationName: 'Hyderabad',
    startDate: '2026-09-14',
    endDate: '2026-09-15',
    days: 2,
    travelers: { adults: 2, children: 0, seniors: 0 },
    styles: ['history', 'food', 'culture'],
    budget: 8000,
    budgetTier: 'budget',
    pace: 'balanced',
    transport: ['taxi'],
    daysPlan: [
      {
        index: 0,
        date: '2026-09-14',
        title: 'Day 1',
        theme: 'Heritage',
        activities: [
          {
            id: 'act1',
            dayIndex: 0,
            start: '10:00 AM',
            end: '12:00 PM',
            kind: 'place',
            title: 'Golconda Fort',
            placeId: 'golconda',
            cost: 0,
            travelFromPrevMin: 20,
            travelFromPrevKm: 5,
            transport: 'taxi',
          },
        ],
      },
    ],
    status: 'planned',
    matchScore: 0,
    route: { totalTravelMin: 20, totalDistanceKm: 5, optimized: false },
    createdAt: '',
    estimatedSpend: 0,
    placeCount: 1,
  }
}

function wx(partial: Partial<WeatherSnapshot>): WeatherSnapshot {
  return {
    tempC: 28,
    condition: 'clear',
    rainProbability: 12,
    humidity: 40,
    windKph: 8,
    sunset: '18:30',
    summary: 'Clear',
    ...partial,
  }
}

describe('adaptation', () => {
  it('replaces outdoor stops when rain probability is high', () => {
    const sug = adaptItinerary({
      itinerary: trip(),
      weather: wx({ rainProbability: 82, condition: 'heavy-rain' }),
      availablePlaces: [outdoor, indoor],
    })
    expect(sug?.changed).toBe(true)
    expect(sug?.replacementPlaceId).toBe('birla')
    expect(sug?.trigger?.value).toBeGreaterThanOrEqual(RAIN_THRESHOLD)
    const next = applyReplacement(trip(), sug!)
    expect(next.daysPlan[0].activities[0].placeId).toBe('birla')
  })

  it('reduces outdoor exposure in extreme heat', () => {
    const sug = adaptItinerary({
      itinerary: trip(),
      weather: wx({ tempC: 39, apparentTempC: 41 }),
      availablePlaces: [outdoor, indoor],
    })
    expect(sug?.changed).toBe(true)
    expect(sug?.trigger?.type).toBe('heat')
    expect(sug?.trigger?.value).toBeGreaterThanOrEqual(HEAT_THRESHOLD_C)
  })

  it('does not adapt when weather is fine', () => {
    const sug = adaptItinerary({
      itinerary: trip(),
      weather: wx({ rainProbability: 12, tempC: 28 }),
      availablePlaces: [outdoor, indoor],
    })
    expect(sug).toBeNull()
  })
})
