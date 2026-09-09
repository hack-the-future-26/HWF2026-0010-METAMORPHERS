/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEATHER_API_URL?: string
  readonly VITE_MAPS_TILE_URL?: string
  readonly VITE_GEOCODING_API_URL?: string
  readonly VITE_NOMINATIM_URL?: string
  readonly VITE_PHOTON_URL?: string
  readonly VITE_PLACES_API_URL?: string
  readonly VITE_OVERPASS_URL?: string
  readonly VITE_ROUTING_API_URL?: string
  readonly VITE_OSRM_URL?: string
  readonly VITE_EVENTS_API_URL?: string
  readonly VITE_CROWD_API_URL?: string
  readonly VITE_AI_API_URL?: string
  readonly VITE_AI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
