export const STYLES: { id: import('@/types').TravelStyle; label: string; icon: string }[] = [
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'food', label: 'Food', icon: '🍜' },
  { id: 'beaches', label: 'Beaches', icon: '🏖️' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'culture', label: 'Culture', icon: '🎨' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧘' },
]

export const TRANSPORT: { id: import('@/types').TransportMode; label: string; icon: string }[] = [
  { id: 'walking', label: 'Walking', icon: '🚶' },
  { id: 'public', label: 'Public transport', icon: '🚌' },
  { id: 'taxi', label: 'Taxi', icon: '🚕' },
  { id: 'rental', label: 'Rental car', icon: '🚗' },
  { id: 'train', label: 'Train', icon: '🚆' },
  { id: 'flights', label: 'Flights', icon: '✈️' },
]

export const PACE: { id: import('@/types').Pace; label: string; hint: string }[] = [
  { id: 'relaxed', label: 'Relaxed', hint: '2–3 major experiences per day' },
  { id: 'balanced', label: 'Balanced', hint: '3–5 experiences per day' },
  { id: 'packed', label: 'Packed', hint: 'Maximum exploration' },
]

export const BUDGET_TIERS = [
  { id: 'budget', label: 'Budget', max: 8000 },
  { id: 'moderate', label: 'Moderate', max: 25000 },
  { id: 'premium', label: 'Premium', max: 60000 },
  { id: 'luxury', label: 'Luxury', max: 100000 },
] as const
