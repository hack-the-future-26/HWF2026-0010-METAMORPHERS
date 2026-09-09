/** Fixed hackathon demo area. GPS may update the user marker, but this is the default destination. */
export const DEMO_AREA = {
  destinationId: 'vizag',
  city: 'Visakhapatnam',
  state: 'Andhra Pradesh',
  neighbourhood: 'Sagar Nagar, Endada',
  label: 'Sagar Nagar, Endada, Andhra Pradesh',
  shortLabel: 'Near Sagar Nagar, Endada',
  lat: 17.7673,
  lng: 83.36,
} as const

export function isVizagDestination(id?: string | null, name?: string | null) {
  const blob = `${id ?? ''} ${name ?? ''}`.toLowerCase()
  return blob.includes('vizag') || blob.includes('visakh')
}
