/** Optional sample city for Demo Mode only. Never used as a silent production fallback. */
export const SAMPLE_CITY = {
  destinationId: 'vizag',
  city: 'Visakhapatnam',
  state: 'Andhra Pradesh',
  neighbourhood: 'Visakhapatnam city',
  label: 'Visakhapatnam, Andhra Pradesh',
  shortLabel: 'Visakhapatnam',
  lat: 17.7041,
  lng: 83.2977,
} as const

/** @deprecated Demo/sample only — do not use as an unknown-destination fallback. */
export const DEFAULT_CITY = SAMPLE_CITY
/** @deprecated use SAMPLE_CITY */
export const DEMO_AREA = SAMPLE_CITY

export function isVizagDestination(id?: string | null, name?: string | null) {
  const blob = `${id ?? ''} ${name ?? ''}`.toLowerCase()
  return blob.includes('vizag') || blob.includes('visakh')
}
