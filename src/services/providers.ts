/** Pluggable live feeds. Unconnected providers must stay `unavailable`. */
export type ProviderStatus = 'live' | 'unavailable' | 'cached'

export interface WeatherProvider {
  id: 'open-meteo'
  status: ProviderStatus
}

export interface TrafficProvider {
  id: 'none'
  status: 'unavailable'
  source: 'No live traffic provider connected'
}

export interface CrowdProvider {
  id: 'none'
  status: 'unavailable'
  source: 'No live crowd provider connected'
}

export const weatherProvider: WeatherProvider = { id: 'open-meteo', status: 'live' }
export const trafficProvider: TrafficProvider = {
  id: 'none',
  status: 'unavailable',
  source: 'No live traffic provider connected',
}
export const crowdProvider: CrowdProvider = {
  id: 'none',
  status: 'unavailable',
  source: 'No live crowd provider connected',
}
