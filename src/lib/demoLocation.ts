/** Default destination when the traveler has not picked a city yet. City-center Visakhapatnam. */
export const DEFAULT_CITY = {
  destinationId: 'vizag',
  city: 'Visakhapatnam',
  state: 'Andhra Pradesh',
  neighbourhood: 'Visakhapatnam city',
  label: 'Visakhapatnam, Andhra Pradesh',
  shortLabel: 'Visakhapatnam',
  lat: 17.7041,
  lng: 83.2977,
} as const

/** @deprecated use DEFAULT_CITY */
export const DEMO_AREA = DEFAULT_CITY

export function isVizagDestination(id?: string | null, name?: string | null) {
  const blob = `${id ?? ''} ${name ?? ''}`.toLowerCase()
  return blob.includes('vizag') || blob.includes('visakh')
}
