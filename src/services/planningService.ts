import { buildTrip, applyOsrmHops } from './aiService'
import { weatherService } from './weatherService'
import { placesService } from './placesService'
import type { LatLng, PlannerState, WeatherSnapshot } from '@/types'

export const planningService = {
  async gather(origin: LatLng, destId: string) {
    const [weather, places] = await Promise.all([
      weatherService.getCurrentWeather(origin),
      placesService.nearby(origin, 18000, destId),
    ])
    return { weather, places }
  },
  build(planner: PlannerState, places: Parameters<typeof buildTrip>[1], origin: LatLng, weather?: WeatherSnapshot) {
    return buildTrip(planner, places, origin, weather, false)
  },
  applyRoutes: applyOsrmHops,
}
