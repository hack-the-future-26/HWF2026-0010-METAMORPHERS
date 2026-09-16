import { describe, expect, it } from 'vitest'
import { foodCityId } from './cityEssentials'
import {
  catalogParentCity,
  cityHealQuery,
  destDisplayLabel,
  lodgingCityName,
  needsCityHeal,
  registerDestination,
} from './destinations'

const mokaLane = {
  name: 'Madhurai Lane',
  displayName: 'Madhurai Lane, Moka',
  city: 'Moka',
  country: 'Mauritius',
  state: '',
  lat: -20.2189,
  lng: 57.5963,
}

describe('street dest heal', () => {
  it('treats Madhurai Lane / Moka as a street dest that must heal', () => {
    expect(needsCityHeal(mokaLane, 'Madhurai Lane, Moka')).toBe(true)
    expect(cityHealQuery(mokaLane, 'Madhurai Lane, Moka')).toBe('madurai')
    expect(catalogParentCity(mokaLane, 'Madhurai Lane, Moka')?.id).toBe('madurai')
  })

  it('maps Madhurai typos to Madurai, Tamil Nadu', () => {
    expect(destDisplayLabel(mokaLane)).toBe('Madurai, Tamil Nadu')
    expect(lodgingCityName(mokaLane)).toBe('Madurai')
  })

  it('maps a persisted Photon street dest to Madurai food', () => {
    registerDestination({
      id: 'geo_-20.21890_57.59630_0',
      name: 'Madhurai Lane',
      displayName: 'Madhurai Lane, Moka',
      city: 'Moka',
      state: '',
      country: 'Mauritius',
      tagline: 'Madhurai Lane, Moka',
      image: '',
      lat: -20.2189,
      lng: 57.5963,
      timezone: 'UTC',
    })
    expect(foodCityId('geo_-20.21890_57.59630_0')).toBe('madurai')
  })

  it('leaves a real catalog city alone', () => {
    const madurai = { name: 'Madurai', city: 'Madurai', country: 'India', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 }
    expect(needsCityHeal(madurai)).toBe(false)
    expect(destDisplayLabel(madurai)).toBe('Madurai, Tamil Nadu')
  })
})
