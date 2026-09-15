import { describe, expect, it } from 'vitest'
import { scorePlace, weatherSuitabilityFor } from './recommend'
import type { LiveConditions, Place, TravelStyle } from '@/types'

const origin = { lat: 17.385, lng: 78.4867 }

function place(partial: Partial<Place> & { id: string; name: string }): Place {
  return {
    destinationId: 'hyderabad',
    category: 'attraction',
    styles: ['history'],
    description: '',
    rating: 0,
    reviewCount: 0,
    image: '',
    images: [],
    lat: 17.383,
    lng: 78.401,
    address: 'Not available from OSM',
    openingHours: '09:00-17:00',
    opensAt: 9,
    closesAt: 17,
    entryFee: 0,
    bestTime: '',
    crowd: 'moderate',
    crowdNote: '',
    durationMin: 90,
    estimatedCost: 0,
    indoor: false,
    weatherSensitive: true,
    tags: [],
    hoursKnown: true,
    priceKnown: false,
    ...partial,
  }
}

function conditions(rain = 10, temp = 28): LiveConditions {
  return {
    weather: {
      tempC: temp,
      condition: rain >= 70 ? 'heavy-rain' : 'clear',
      rainProbability: rain,
      humidity: 40,
      windKph: 8,
      sunset: '18:30',
      summary: 'test',
      source: 'Open-Meteo',
    },
    traffic: 'moderate',
    trafficFeed: { status: 'unavailable', source: 'none' },
    crowdFeed: { status: 'unavailable', source: 'none' },
    crowdOverrides: {},
    closures: [],
    runningLateMin: 0,
    lowBattery: false,
  }
}

describe('planner scoring', () => {
  it('boosts interest matches', () => {
    const fort = place({ id: 'golconda', name: 'Golconda Fort', styles: ['history'] })
    const mall = place({ id: 'mall', name: 'Mall', styles: ['shopping'], category: 'shopping', indoor: true, weatherSensitive: false })
    const styles: TravelStyle[] = ['history', 'culture']
    const a = scorePlace(fort, origin, styles, conditions(), 8000, null)
    const b = scorePlace(mall, origin, styles, conditions(), 8000, null)
    expect(a.breakdown.interest).toBeGreaterThan(b.breakdown.interest)
  })

  it('penalizes weather-sensitive outdoor stops in rain', () => {
    const fort = place({ id: 'golconda', name: 'Golconda Fort' })
    const museum = place({
      id: 'birla',
      name: 'Birla Science Museum',
      indoor: true,
      weatherSensitive: false,
      styles: ['history', 'culture'],
    })
    const wet = conditions(82)
    expect(scorePlace(fort, origin, ['history'], wet, 8000, null).breakdown.weather).toBeLessThan(
      scorePlace(museum, origin, ['history'], wet, 8000, null).breakdown.weather,
    )
    expect(weatherSuitabilityFor(fort, 82, 28)).toBe('poor')
    expect(weatherSuitabilityFor(museum, 82, 28)).toBe('good')
  })

  it('scores closer places higher on distance', () => {
    const near = place({ id: 'near', name: 'Near', lat: origin.lat + 0.01, lng: origin.lng })
    const far = place({ id: 'far', name: 'Far', lat: origin.lat + 0.2, lng: origin.lng })
    expect(scorePlace(near, origin, ['history'], conditions(), 8000, null).breakdown.distance).toBeGreaterThan(
      scorePlace(far, origin, ['history'], conditions(), 8000, null).breakdown.distance,
    )
  })

  it('penalizes known costs above remaining budget', () => {
    const cheap = place({ id: 'c', name: 'Cheap', estimatedCost: 100, priceKnown: true })
    const dear = place({ id: 'd', name: 'Dear', estimatedCost: 9000, priceKnown: true })
    expect(scorePlace(cheap, origin, ['history'], conditions(), 500, null).breakdown.budget).toBeGreaterThan(
      scorePlace(dear, origin, ['history'], conditions(), 500, null).breakdown.budget,
    )
  })
})
