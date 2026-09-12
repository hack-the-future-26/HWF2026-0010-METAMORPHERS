export type TravelStyle =
  | 'nature'
  | 'history'
  | 'food'
  | 'beaches'
  | 'adventure'
  | 'shopping'
  | 'culture'
  | 'nightlife'
  | 'photography'
  | 'relaxation'

export type TransportMode =
  | 'walking'
  | 'public'
  | 'taxi'
  | 'rental'
  | 'train'
  | 'flights'

export type Pace = 'relaxed' | 'balanced' | 'packed'
export type BudgetTier = 'budget' | 'moderate' | 'premium' | 'luxury'
export type CrowdLevel = 'low' | 'moderate' | 'high'
export type TrafficLevel = 'clear' | 'moderate' | 'heavy'
export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy-rain'
  | 'storm'
export type PlaceCategory =
  | 'attraction'
  | 'restaurant'
  | 'cafe'
  | 'hotel'
  | 'shopping'
  | 'emergency'
  | 'transport'
  | 'hidden'
export type NearbyKind =
  | 'restaurant'
  | 'cafe'
  | 'hospital'
  | 'pharmacy'
  | 'restroom'
  | 'fuel'
  | 'atm'
  | 'shopping'
export type SavedList = 'want' | 'visited' | 'favorites'
export type ExpenseCategory =
  | 'stay'
  | 'food'
  | 'transport'
  | 'tickets'
  | 'shopping'
  | 'other'
export type ActivityKind =
  | 'meal'
  | 'place'
  | 'transit'
  | 'free'
  | 'sunset'
  | 'hotel'
export type NotificationKind =
  | 'weather'
  | 'traffic'
  | 'crowd'
  | 'closure'
  | 'budget'
  | 'info'
  | 'late'
  | 'battery'
  | 'offline'
export type TripStatus = 'draft' | 'planned' | 'live' | 'completed'
export type ThemeMode = 'light' | 'dark'

export interface LatLng {
  lat: number
  lng: number
}

export interface UserPreferences {
  styles: TravelStyle[]
  budgetTier: BudgetTier
  defaultBudget: number
  transport: TransportMode[]
  pace: Pace
  language: string
  notifications: boolean
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  hometown: string
  preferences: UserPreferences
}

export interface Destination {
  id: string
  name: string
  state: string
  country: string
  tagline: string
  image: string
  lat: number
  lng: number
  timezone: string
  famousFor?: string
  highlights?: string[]
}

export interface Place {
  id: string
  destinationId: string
  name: string
  category: PlaceCategory
  nearbyKind?: NearbyKind
  styles: TravelStyle[]
  description: string
  rating: number
  reviewCount: number
  image: string
  images: string[]
  lat: number
  lng: number
  address: string
  openingHours: string
  opensAt: number
  closesAt: number
  entryFee: number
  bestTime: string
  crowd: CrowdLevel
  crowdNote: string
  durationMin: number
  estimatedCost: number
  indoor: boolean
  weatherSensitive: boolean
  tags: string[]
  source?: 'catalog' | 'osm' | 'nominatim'
  website?: string
  phone?: string
  ratingKnown?: boolean
  hoursKnown?: boolean
  priceKnown?: boolean
  crowdKnown?: boolean
  imageKnown?: boolean
}

export interface Activity {
  id: string
  dayIndex: number
  start: string
  end: string
  kind: ActivityKind
  title: string
  subtitle?: string
  placeId?: string
  cost: number
  travelFromPrevMin: number
  travelFromPrevKm: number
  transport: TransportMode
  notes?: string
}

export interface ItineraryDay {
  index: number
  date: string
  title: string
  theme: string
  activities: Activity[]
}

export interface RouteSummary {
  totalTravelMin: number
  totalDistanceKm: number
  optimized: boolean
  lastSavedMin?: number
}

export interface Trip {
  id: string
  title: string
  destinationId: string
  destinationName?: string
  destinationLat?: number
  destinationLng?: number
  generatedAt?: string
  startDate: string
  endDate: string
  days: number
  travelers: Travelers
  styles: TravelStyle[]
  budget: number
  budgetTier: BudgetTier
  pace: Pace
  transport: TransportMode[]
  hotel?: Place
  daysPlan: ItineraryDay[]
  status: TripStatus
  matchScore: number
  route: RouteSummary
  createdAt: string
  estimatedSpend: number
  placeCount: number
}

export interface Travelers {
  adults: number
  children: number
  seniors: number
}

export interface PlannerState {
  step: number
  destinationQuery: string
  destinationId: string | null
  startDate: string
  endDate: string
  travelers: Travelers
  styles: TravelStyle[]
  budget: number
  pace: Pace
  transport: TransportMode[]
  generating: boolean
  generateProgress: number
  generateMessage: string
  generateError?: string | null
}

export type FeedStatus = 'unavailable' | 'live' | 'estimated'

export interface WeatherSnapshot {
  tempC: number
  apparentTempC?: number
  condition: WeatherCondition
  rainProbability: number
  precipitationMm?: number
  humidity: number
  windKph: number
  sunset: string
  summary: string
  fetchedAt?: string
  stale?: boolean
  unavailable?: boolean
  weatherCode?: number
  hourly?: { time: string; tempC: number; rainProbability: number }[]
}

export interface ConditionFeed {
  status: FeedStatus
  value?: string
  source?: string
}

export interface LiveConditions {
  weather: WeatherSnapshot
  traffic: TrafficLevel
  trafficFeed: ConditionFeed
  crowdFeed: ConditionFeed
  crowdOverrides: Record<string, CrowdLevel>
  closures: string[]
  runningLateMin: number
  lowBattery: boolean
}

export interface AdaptationSuggestion {
  id: string
  type: 'weather' | 'traffic' | 'crowd' | 'closure' | 'late' | 'optimize'
  title: string
  message: string
  reason: string
  original: { time: string; title: string; placeId?: string }
  recommended: { time: string; title: string; placeId?: string }[]
  timeSavedMin?: number
  replacementPlaceId?: string
  affectedActivityId?: string
}

export interface Expense {
  id: string
  category: ExpenseCategory
  amount: number
  description: string
  createdAt: string
}

export interface SavedPlace {
  placeId: string
  list: SavedList
  savedAt: string
  snapshot?: Place
}

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  time: string
  read: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

export interface BestNextMove {
  placeId: string
  title: string
  reasons: string[]
  etaMin: number
  cta: string
}

export interface ShareCard {
  url: string
  title: string
  days: { title: string; highlights: string[] }[]
}

export type LocationPermission = 'unset' | 'prompting' | 'granted' | 'denied' | 'unsupported' | 'fallback' | 'timeout'
export type AppDataMode = 'real' | 'demo'

export interface GeoFix {
  lat: number
  lng: number
  accuracy: number
  altitude: number | null
  heading: number | null
  speed: number | null
  timestamp: number
}

export interface LocationState {
  permission: LocationPermission
  loading: boolean
  error: string | null
  fix: GeoFix | null
  label: string
  watching: boolean
  lastNearbyAt: number
  lastNearbyLat: number | null
  lastNearbyLng: number | null
}

export interface RoutePath {
  km: number
  minutes: number
  geometry: [number, number][]
  steps: { instruction: string; km: number }[]
  source: 'osrm' | 'haversine'
  mode: string
}

export interface RecommendationScore {
  placeId: string
  total: number
  reasons: string[]
  breakdown: {
    interest: number
    distance: number
    weather: number
    time: number
    budget: number
    itinerary: number
  }
}
