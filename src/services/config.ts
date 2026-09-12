export const API = {
  weatherUrl: import.meta.env.VITE_WEATHER_API_URL ?? 'https://api.open-meteo.com/v1/forecast',
  mapsTileUrl: import.meta.env.VITE_MAPS_TILE_URL,
  geocodingUrl: import.meta.env.VITE_GEOCODING_API_URL ?? import.meta.env.VITE_NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org',
  nominatimUrl: import.meta.env.VITE_NOMINATIM_URL ?? import.meta.env.VITE_GEOCODING_API_URL ?? 'https://nominatim.openstreetmap.org',
  photonUrl: import.meta.env.VITE_PHOTON_URL ?? 'https://photon.komoot.io/api/',
  placesUrl: import.meta.env.VITE_PLACES_API_URL ?? import.meta.env.VITE_OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter',
  overpassUrl: import.meta.env.VITE_OVERPASS_URL ?? import.meta.env.VITE_PLACES_API_URL ?? 'https://overpass-api.de/api/interpreter',
  routingUrl: import.meta.env.VITE_ROUTING_API_URL ?? import.meta.env.VITE_OSRM_URL ?? 'https://router.project-osrm.org',
  osrmUrl: import.meta.env.VITE_OSRM_URL ?? import.meta.env.VITE_ROUTING_API_URL ?? 'https://router.project-osrm.org',
  eventsUrl: import.meta.env.VITE_EVENTS_API_URL,
  crowdUrl: import.meta.env.VITE_CROWD_API_URL,
  translateUrl: import.meta.env.VITE_TRANSLATE_API_URL || '/api/translate',
  /** Local companion API by default — override with a hosted LLM later. */
  aiUrl: import.meta.env.VITE_AI_API_URL || '/api/ask',
  aiModel: import.meta.env.VITE_AI_MODEL,
}

export function hasLive(key?: string, url?: string) {
  return Boolean(key || url)
}
