import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_USER, GUEST_USER } from '@/data/user'
import { placesForTrip } from '@/data/cityLandmarks'
import { estimateTripBudget, optimizeActivitiesForBudget } from '@/lib/budgetEstimate'
import { fetchHotels, fetchMe, savePlaceRemote, saveTripRemote } from '@/services/backend'
import { getPlace, PLACES, registerPlaces } from '@/data/places'
import { getDestination, registerDestination, DESTINATIONS, findDestination, lodgingCityName, searchDestinations, needsCityHeal, catalogParentCity, destDisplayLabel, cityHealQuery } from '@/data/destinations'
import type {
  AdaptationSuggestion,
  AppDataMode,
  AppNotification,
  ChatMessage,
  CrowdLevel,
  Expense,
  ExpenseCategory,
  GeoFix,
  LiveConditions,
  LocationState,
  NearbyKind,
  Place,
  PlannerState,
  RoutePath,
  SavedList,
  SavedPlace,
  SavedTrip,
  ThemeMode,
  Trip,
  User,
} from '@/types'
import { addDays, haversineKm, minutesToTime, todayIso, uid } from '@/lib/utils'
import { activeOrigin, areaOrigin, planningOrigin, queryMatchesDestination, tripMatchesPlanner } from '@/lib/origin'
import { isVizagDestination } from '@/lib/demoLocation'
import {
  askAssistant,
  applyOsrmHops,
  buildTrip,
  generateMessages,
  optimizeTrip,
  recalcRoute,
  seedChat,
} from '@/services/aiService'
import { weatherService } from '@/services/weatherService'
import { geocodingService } from '@/services/geocodingService'
import { placesService } from '@/services/placesService'
import { routingService } from '@/services/routingService'
import { locationService, LocationError } from '@/services/locationService'
import {
  adaptItinerary,
  applyCrowdMove,
  applyReplacement,
  closureAdaptation,
  heatAdaptation,
  lateAdaptation,
  withRouteBudgetDeltas,
} from '@/lib/adaptEngine'
import { DESTINATION_NOT_FOUND, GPS_DENIED, NO_NEARBY_ATTRACTIONS, OFF_ROUTE_MESSAGE, WEATHER_UNAVAILABLE } from '@/lib/osmCopy'
import { minKmToRoute, OFF_ROUTE_KM } from '@/lib/routeGeometry'

export const QUICK_PRESETS: Record<
  string,
  Partial<PlannerState> & { label: string; blurb: string; emoji: string }
> = {
  weekend: {
    label: 'Weekend getaway',
    blurb: 'Two days, balanced pace',
    emoji: '🌅',
    travelers: { adults: 2, children: 0, seniors: 0 },
    styles: ['beaches', 'food', 'relaxation'],
    pace: 'balanced',
    budget: 8000,
    transport: ['taxi', 'walking'],
  },
  family: {
    label: 'Family trip',
    blurb: 'Relaxed days, kid-friendly',
    emoji: '👨‍👩‍👧‍👦',
    travelers: { adults: 2, children: 2, seniors: 0 },
    styles: ['nature', 'beaches', 'culture'],
    pace: 'relaxed',
    budget: 18000,
    transport: ['rental', 'taxi'],
  },
  couple: {
    label: 'Couple trip',
    blurb: 'Sunset views and slow meals',
    emoji: '💑',
    travelers: { adults: 2, children: 0, seniors: 0 },
    styles: ['beaches', 'food', 'photography', 'relaxation'],
    pace: 'relaxed',
    budget: 15000,
    transport: ['taxi', 'walking'],
  },
  solo: {
    label: 'Solo adventure',
    blurb: 'Packed days, new ground',
    emoji: '🎒',
    travelers: { adults: 1, children: 0, seniors: 0 },
    styles: ['adventure', 'nature', 'photography'],
    pace: 'packed',
    budget: 9000,
    transport: ['public', 'walking'],
  },
  budget: {
    label: 'Budget trip',
    blurb: 'Smart spends under ₹8k',
    emoji: '🪙',
    travelers: { adults: 1, children: 0, seniors: 0 },
    styles: ['food', 'beaches', 'culture'],
    pace: 'balanced',
    budget: 5000,
    transport: ['public', 'walking'],
  },
  relax: {
    label: 'Relaxing vacation',
    blurb: 'Beaches, cafes, no rush',
    emoji: '🧘',
    travelers: { adults: 2, children: 0, seniors: 0 },
    styles: ['relaxation', 'beaches', 'food'],
    pace: 'relaxed',
    budget: 22000,
    transport: ['taxi'],
  },
}

const defaultPlanner = (): PlannerState => ({
  step: 1,
  destinationQuery: '',
  destinationId: null,
  startDate: todayIso(),
  endDate: todayIso(),
  travelers: { adults: 2, children: 0, seniors: 0 },
  styles: ['culture', 'food', 'history'],
  budget: 8000,
  pace: 'balanced',
  transport: ['taxi', 'walking'],
  generating: false,
  generateProgress: 0,
  generateMessage: '',
  generateError: null,
})

const defaultConditions = (): LiveConditions => ({
  weather: {
    tempC: 0,
    condition: 'partly-cloudy',
    rainProbability: 0,
    humidity: 0,
    windKph: 0,
    sunset: '',
    summary: WEATHER_UNAVAILABLE,
    unavailable: true,
    stale: true,
  },
  traffic: 'moderate',
  trafficFeed: { status: 'unavailable', source: 'none' },
  crowdFeed: { status: 'unavailable', source: 'none' },
  crowdOverrides: {},
  closures: [],
  runningLateMin: 0,
  lowBattery: false,
})

const defaultLocation = (): LocationState => ({
  permission: 'fallback',
  loading: false,
  error: null,
  fix: null,
  label: '',
  watching: false,
  lastNearbyAt: 0,
  lastNearbyLat: null,
  lastNearbyLng: null,
})

function draftTripFromPlace(place: Place, planner: PlannerState): Trip {
  const destId = planner.destinationId || place.destinationId
  const dest = destId ? getDestination(destId) : { id: place.destinationId, name: place.name, lat: place.lat, lng: place.lng, state: '', country: '', tagline: '', image: '', timezone: 'UTC' }
  const start = planner.startDate || todayIso()
  const activity = {
    id: uid('act'),
    dayIndex: 0,
    start: '09:00',
    end: '10:30',
    kind: 'place' as const,
    title: place.name,
    subtitle: place.styles[0] ?? place.category,
    placeId: place.id,
    cost: place.priceKnown === false ? 0 : place.entryFee,
    travelFromPrevMin: 0,
    travelFromPrevKm: 0,
    transport: planner.transport[0] ?? 'taxi',
  }
  return recalcRoute({
    id: uid('trip'),
    title: `Your 1-Day ${dest.name} Adventure`,
    destinationId: dest.id,
    destinationName: dest.name,
    destinationLat: dest.lat,
    destinationLng: dest.lng,
    generatedAt: new Date().toISOString(),
    startDate: start,
    endDate: planner.endDate || start,
    days: 1,
    travelers: planner.travelers,
    styles: planner.styles.length ? planner.styles : ['beaches', 'food', 'culture'],
    budget: planner.budget,
    budgetTier: planner.budget <= 8000 ? 'budget' : planner.budget <= 25000 ? 'moderate' : 'premium',
    pace: planner.pace,
    transport: planner.transport,
    daysPlan: [
      {
        index: 0,
        date: start,
        title: 'Day 1',
        theme: 'Draft stops',
        activities: [activity],
      },
    ],
    status: 'planned',
    matchScore: 0,
    route: { totalTravelMin: 0, totalDistanceKm: 0, optimized: false },
    createdAt: new Date().toISOString(),
    estimatedSpend: activity.cost,
    placeCount: 1,
  })
}

function pushNote(
  list: AppNotification[],
  kind: AppNotification['kind'],
  title: string,
  body: string,
): AppNotification[] {
  return [
    { id: uid('ntf'), kind, title, body, time: new Date().toISOString(), read: false },
    ...list,
  ].slice(0, 24)
}

function applyCatalogCityHeal(planner: PlannerState, trip: Trip | null): { planner: PlannerState; trip: Trip | null } {
  const hint = [planner.destinationQuery, trip?.destinationName].filter(Boolean).join(', ')
  const dest = planner.destinationId ? findDestination(planner.destinationId) : undefined
  const probe = {
    name: dest?.name && dest.name !== 'Selected location' ? dest.name : hint || dest?.name || trip?.destinationName || '',
    city: dest?.city,
    country: dest?.country,
    displayName: dest?.displayName || hint,
    state: dest?.state,
    lat: dest?.lat ?? trip?.destinationLat,
    lng: dest?.lng ?? trip?.destinationLng,
  }
  const tripProbe = trip
    ? {
        name: trip.destinationName || probe.name,
        displayName: trip.destinationName || probe.displayName,
        lat: trip.destinationLat,
        lng: trip.destinationLng,
      }
    : null
  if (!needsCityHeal(probe, hint) && !needsCityHeal(tripProbe, hint)) return { planner, trip }
  const parent = catalogParentCity(probe, hint) || catalogParentCity(tripProbe, hint)
  if (!parent) return { planner, trip }
  return {
    planner: {
      ...planner,
      destinationId: parent.id,
      destinationQuery: parent.displayName || destDisplayLabel(parent),
    },
    trip: trip
      ? {
          ...trip,
          destinationId: parent.id,
          destinationName: parent.name,
          destinationLat: parent.lat,
          destinationLng: parent.lng,
        }
      : trip,
  }
}

interface AppStore {
  user: User
  signedIn: boolean
  personalMatch: number | null
  theme: ThemeMode
  online: boolean
  demoOpen: boolean
  aiOpen: boolean
  sosOpen: boolean
  shareOpen: boolean
  notificationsOpen: boolean
  selectedPlaceId: string | null
  mapDay: number
  mapFilters: Place['category'][]
  nearbyFilter: NearbyKind | 'all'
  nearbySort: 'distance' | 'rating' | 'price'
  planner: PlannerState
  trip: Trip | null
  liveStarted: boolean
  conditions: LiveConditions
  adaptation: AdaptationSuggestion | null
  previousTrip: Trip | null
  crowdSuggestion: AdaptationSuggestion | null
  saved: SavedPlace[]
  savedTrips: SavedTrip[]
  expenses: Expense[]
  notifications: AppNotification[]
  chat: ChatMessage[]
  lastOptimizeWins: string[]
  lastRouteSavedMin: number
  appMode: AppDataMode
  location: LocationState
  nearbyPlaces: Place[]
  nearbyLoading: boolean
  nearbyError: string | null
  liveRoute: RoutePath | null
  followUser: boolean
  offRoute: boolean
  rerouting: boolean
  lastRerouteAt: number
  destinationExplicit: boolean
  hydrateWeather: () => Promise<void>
  hydrateSession: () => Promise<void>
  healStreetDestination: () => Promise<boolean>
  applyAuth: (user: { id: string; name: string; email: string }) => void
  ensureDemoDefaults: () => void
  resetTrip: () => void
  simulateGps: () => void
  setAppMode: (m: AppDataMode) => void
  requestLocation: () => Promise<void>
  refreshGpsSilent: () => Promise<void>
  useDestinationFallback: () => Promise<void>
  onGpsFix: (fix: GeoFix) => void
  goToPlace: (placeId: string) => void
  refreshNearby: (force?: boolean) => Promise<void>
  refreshLiveRoute: () => Promise<void>
  evaluateRealWeather: () => void
  runAdaptation: (demoMode: boolean) => Promise<void>
  endTrip: () => void
  setTheme: (t: ThemeMode) => void
  toggleTheme: () => void
  setOnline: (v: boolean) => void
  setDemoOpen: (v: boolean) => void
  setAiOpen: (v: boolean) => void
  setSosOpen: (v: boolean) => void
  setShareOpen: (v: boolean) => void
  setNotificationsOpen: (v: boolean) => void
  setSelectedPlace: (id: string | null) => void
  setMapDay: (d: number) => void
  toggleMapFilter: (c: Place['category']) => void
  setNearby: (k: NearbyKind | 'all') => void
  setNearbySort: (s: 'distance' | 'rating' | 'price') => void
  updateUser: (patch: Partial<User>) => void
  updatePreferences: (patch: Partial<User['preferences']>) => void
  setPlanner: (patch: Partial<PlannerState>) => void
  applyPreset: (key: string) => void
  generateTrip: () => Promise<void>
  regenerateTrip: () => Promise<void>
  startTrip: () => void
  reorderDay: (dayIndex: number, from: number, to: number) => void
  addPlaceToTrip: (placeId: string, dayIndex?: number) => void
  removeActivity: (id: string) => void
  replaceActivity: (activityId: string, placeId: string) => void
  savePlace: (placeId: string, list?: SavedList) => void
  unsavePlace: (placeId: string) => void
  moveSaved: (placeId: string, list: SavedList) => void
  addExpense: (category: ExpenseCategory, amount: number, description: string) => void
  acceptAdaptation: () => void
  keepOriginal: () => void
  askWhy: () => string
  acceptCrowdMove: () => void
  optimize: () => void
  saveCurrentTrip: () => void
  loadSavedTrip: (id: string) => void
  deleteSavedTrip: (id: string) => void
  duplicateSavedTrip: (id: string) => void
  simulateRain: () => void
  simulateHeat: () => void
  simulateNormalWeather: () => void
  simulateTraffic: () => void
  simulateCrowd: () => void
  simulateClosure: () => void
  simulateLate: () => void
  simulateBattery: () => void
  simulateOffline: () => void
  sendChat: (text: string) => Promise<void>
  markNotificationsRead: () => void
  shareUrl: () => string
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      signedIn: false,
      personalMatch: null,
      theme: 'light',
      online: true,
      demoOpen: false,
      aiOpen: false,
      sosOpen: false,
      shareOpen: false,
      notificationsOpen: false,
      selectedPlaceId: null,
      mapDay: 0,
      mapFilters: ['attraction', 'restaurant', 'hotel', 'shopping', 'emergency'],
      nearbyFilter: 'all',
      nearbySort: 'distance',
      planner: defaultPlanner(),
      trip: null,
      liveStarted: false,
      conditions: defaultConditions(),
      adaptation: null,
      previousTrip: null,
      crowdSuggestion: null,
      saved: [],
      savedTrips: [],
      expenses: [],
      notifications: [
        {
          id: uid('ntf'),
          kind: 'info',
          title: 'Welcome to YatraSense',
          body: 'Search a famous city or use GPS. Itineraries use OpenStreetMap, Open-Meteo and OSRM.',
          time: new Date().toISOString(),
          read: false,
        },
      ],
      chat: seedChat(),
      lastOptimizeWins: [],
      lastRouteSavedMin: 0,
      appMode: 'real',
      location: defaultLocation(),
      nearbyPlaces: [],
      nearbyLoading: false,
      nearbyError: null,
      liveRoute: null,
      followUser: true,
      offRoute: false,
      rerouting: false,
      lastRerouteAt: 0,
      destinationExplicit: false,

      ensureDemoDefaults: () => {
        set({ appMode: 'real', demoOpen: false })
      },
      applyAuth: (user) => {
        set({
          signedIn: true,
          user: {
            ...get().user,
            id: user.id,
            name: user.name,
            email: user.email,
          },
        })
      },
      hydrateSession: async () => {
        const me = await fetchMe()
        if (!me) {
          const current = get().user
          if (current.id === 'user_pravallika' || current.id === 'guest' || !current.email) {
            set({ user: GUEST_USER, signedIn: false, personalMatch: null })
          } else {
            set({ signedIn: false })
          }
          await get().healStreetDestination()
          return
        }
        const latest = me.trips?.[me.trips.length - 1]?.trip as Trip | undefined
        set({
          signedIn: true,
          personalMatch: me.match,
          user: {
            ...get().user,
            id: me.user.id,
            name: me.user.name,
            email: me.user.email,
          },
          trip: get().trip ?? latest ?? null,
        })
        await get().healStreetDestination()
      },
      healStreetDestination: async () => {
        const destId = get().trip?.destinationId ?? get().planner.destinationId
        if (!destId) return false
        const dest = getDestination(destId)
        const query = get().planner.destinationQuery || get().trip?.destinationName || dest.displayName || dest.name
        const catalog = applyCatalogCityHeal(get().planner, get().trip)
        if (catalog.planner.destinationId && catalog.planner.destinationId !== destId) {
          registerDestination(getDestination(catalog.planner.destinationId))
          set({
            planner: catalog.planner,
            trip: catalog.trip,
            nearbyPlaces: [],
            location: {
              ...get().location,
              label:
                get().liveStarted && get().location.permission === 'granted' && get().location.label
                  ? get().location.label
                  : destDisplayLabel(getDestination(catalog.planner.destinationId)),
            },
          })
          return true
        }
        if (!needsCityHeal(dest, query)) return false
        if (!get().online) return false
        const q = cityHealQuery(dest, query)
        if (q.trim().length < 2) return false
        try {
          const hits = await geocodingService.search(q)
          const parent =
            hits.find((h) => /india/i.test(h.country) && !needsCityHeal(h)) ??
            hits.find((h) => !needsCityHeal(h) && /india/i.test(h.country))
          if (!parent || parent.id === destId) return false
          registerDestination(parent)
          const trip = get().trip
          set({
            planner: {
              ...get().planner,
              destinationId: parent.id,
              destinationQuery: parent.displayName || destDisplayLabel(parent),
            },
            trip: trip
              ? {
                  ...trip,
                  destinationId: parent.id,
                  destinationName: parent.name,
                  destinationLat: parent.lat,
                  destinationLng: parent.lng,
                }
              : trip,
            nearbyPlaces: [],
            location: {
              ...get().location,
              label:
                get().liveStarted && get().location.permission === 'granted' && get().location.label
                  ? get().location.label
                  : destDisplayLabel(parent),
            },
          })
          return true
        } catch {
          return false
        }
      },
      resetTrip: () => {
        locationService.stopWatchingLocation()
        set({
          trip: null,
          liveStarted: false,
          liveRoute: null,
          adaptation: null,
          crowdSuggestion: null,
          offRoute: false,
          rerouting: false,
          destinationExplicit: false,
          planner: defaultPlanner(),
          followUser: false,
          location: { ...get().location, watching: false },
        })
      },
      simulateGps: () => {
        const dest = findDestination(get().trip?.destinationId ?? get().planner.destinationId)
        if (!dest) return
        set({
          location: {
            ...get().location,
            permission: 'granted',
            loading: false,
            error: null,
            watching: get().liveStarted,
            label: dest.displayName || dest.name,
            fix: {
              lat: dest.lat,
              lng: dest.lng,
              accuracy: 14,
              altitude: null,
              heading: null,
              speed: null,
              timestamp: Date.now(),
            },
          },
        })
        void get().refreshLiveRoute()
      },

      hydrateWeather: async () => {
        if (!get().online) return
        if (get().appMode === 'demo') return
        try {
          const destId = get().trip?.destinationId ?? get().planner.destinationId
          const origin = get().liveStarted
            ? activeOrigin(get().location, destId)
            : areaOrigin(destId)
          if (origin.unresolved || (!origin.lat && !origin.lng)) return
          const weather = await weatherService.getCurrent(origin)
          set({ conditions: { ...get().conditions, weather } })
          if (get().appMode === 'real' && !weather.unavailable) get().evaluateRealWeather()
        } catch {
          set({
            notifications: pushNote(
              get().notifications,
              'weather',
              'Live weather unavailable',
              WEATHER_UNAVAILABLE,
            ),
          })
        }
      },

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },
      toggleTheme: () => {
        const theme = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(theme)
      },
      setAppMode: (appMode) => {
        set({ appMode, demoOpen: appMode === 'demo' })
      },
      requestLocation: async () => {
        if (get().location.permission === 'granted') {
          await get().refreshGpsSilent()
          return
        }
        if (!locationService.isSupported()) {
          set({ location: { ...get().location, permission: 'unsupported', error: 'Location is not supported in this browser.' } })
          return
        }
        set({ location: { ...get().location, loading: true, permission: 'prompting', error: null } })
        try {
          const fix = await locationService.getCurrentLocation()
          let label = `${fix.lat.toFixed(4)}, ${fix.lng.toFixed(4)}`
          if (get().online) {
            try {
              label = await geocodingService.reverse(fix)
            } catch {
              /* keep coords */
            }
          }
          set({
            appMode: 'real',
            location: {
              ...get().location,
              permission: 'granted',
              loading: false,
              error: null,
              fix,
              label,
            },
            notifications: pushNote(get().notifications, 'info', 'Location enabled', `You're near ${label}.`),
          })
          await get().refreshNearby(true)
          await get().hydrateWeather()
          await get().refreshLiveRoute()
        } catch (err) {
          const le = err instanceof LocationError ? err : null
          const permission =
            le?.code === 'denied'
              ? 'denied'
              : le?.code === 'unsupported'
                ? 'unsupported'
                : le?.code === 'timeout'
                  ? 'timeout'
                  : 'denied'
          set({
            location: {
              ...get().location,
              loading: false,
              permission,
              error: le?.message ?? 'Could not read your location.',
            },
          })
        }
      },
      refreshGpsSilent: async () => {
        if (get().location.permission !== 'granted') return
        if (!locationService.isSupported()) return
        try {
          const fix = await locationService.getCurrentLocation()
          let label = get().location.label
          if (get().online) {
            try {
              label = await geocodingService.reverse(fix)
            } catch {
              /* keep previous label */
            }
          }
          set({
            location: {
              ...get().location,
              fix,
              label,
              loading: false,
              error: null,
            },
          })
          if (get().online) {
            await get().refreshNearby()
            await get().hydrateWeather()
            await get().refreshLiveRoute()
          }
        } catch {
          /* keep last known fix */
        }
      },
      goToPlace: (placeId) => {
        const trip = get().trip
        const place = getPlace(placeId) ?? get().nearbyPlaces.find((p) => p.id === placeId)
        if (place) registerPlaces([place])
        if (!place) {
          set({ selectedPlaceId: placeId })
          return
        }
        set({ selectedPlaceId: placeId, followUser: true })
        if (!trip) return
        const daysPlan = trip.daysPlan.map((d, i) => {
          if (i !== 0) return d
          const idx = d.activities.findIndex((a) => a.kind === 'place')
          const now = new Date()
          const startMin = now.getHours() * 60 + now.getMinutes()
          const nextAct = {
            id: uid('act'),
            dayIndex: d.index,
            start: minutesToTime(startMin),
            end: minutesToTime(startMin + 60),
            kind: 'place' as const,
            title: place.name,
            subtitle: 'Navigating now',
            placeId: place.id,
            cost: place.priceKnown === false ? 0 : place.entryFee,
            travelFromPrevMin: get().liveRoute?.minutes ?? 12,
            travelFromPrevKm: get().liveRoute?.km ?? 2,
            transport: trip.transport[0] ?? 'taxi',
            notes: 'Set as next stop',
          }
          if (idx < 0) return { ...d, activities: [nextAct, ...d.activities] }
          const acts = [...d.activities]
          acts[idx] = { ...acts[idx], title: place.name, placeId: place.id, cost: nextAct.cost, notes: 'Set as next stop' }
          return { ...d, activities: acts }
        })
        set({ trip: recalcRoute({ ...trip, daysPlan }), liveRoute: null })
        void get().refreshLiveRoute()
      },
      useDestinationFallback: async () => {
        const destId = get().planner.destinationId ?? get().trip?.destinationId
        const dest = destId ? getDestination(destId) : null
        set({
          location: {
            ...get().location,
            permission: dest ? 'fallback' : 'denied',
            loading: false,
            error: dest
              ? `${GPS_DENIED} Routing can still work from ${dest.name}.`
              : GPS_DENIED,
          },
          notifications: dest
            ? pushNote(
                get().notifications,
                'info',
                'Using destination instead',
                `Nearby places and weather will use ${dest.name}. Live tracking needs GPS.`,
              )
            : get().notifications,
        })
        if (dest) {
          await get().refreshNearby(true)
          await get().hydrateWeather()
        }
      },
      onGpsFix: (fix) => {
        const prev = get().location
        const moved = prev.fix ? haversineKm(prev.fix, fix) : 99
        set({
          location: { ...prev, fix, permission: 'granted', loading: false },
        })
        const sinceNearby = Date.now() - prev.lastNearbyAt
        const nearbyMoved =
          prev.lastNearbyLat == null ||
          haversineKm({ lat: prev.lastNearbyLat, lng: prev.lastNearbyLng ?? fix.lng }, fix) >= 0.18
        if (get().online && (nearbyMoved || sinceNearby > 3 * 60 * 1000)) {
          void get().refreshNearby()
        }
        const route = get().liveRoute
        if (get().liveStarted && route?.source === 'osrm' && route.geometry.length > 1) {
          const deviation = minKmToRoute(fix, route.geometry)
          if (deviation > OFF_ROUTE_KM && Date.now() - get().lastRerouteAt > 20000) {
            set({
              offRoute: true,
              rerouting: true,
              lastRerouteAt: Date.now(),
              notifications: pushNote(get().notifications, 'info', 'Off route', OFF_ROUTE_MESSAGE),
            })
            void get().refreshLiveRoute().finally(() => set({ rerouting: false }))
          } else if (deviation <= 0.2 && get().offRoute) {
            set({ offRoute: false })
          }
        }
        if (moved >= 0.08 && !(get().offRoute && get().rerouting)) void get().refreshLiveRoute()
        if (get().appMode === 'real' && moved >= 0.05) get().evaluateRealWeather()
      },
      refreshNearby: async (force = false) => {
        if (!get().online) return
        const destId = get().trip?.destinationId ?? get().planner.destinationId
        if (!destId) return
        const origin = get().liveStarted ? activeOrigin(get().location, destId) : areaOrigin(destId)
        if (origin.unresolved) return
        const loc = get().location
        if (
          !force &&
          loc.lastNearbyLat != null &&
          haversineKm({ lat: loc.lastNearbyLat, lng: loc.lastNearbyLng ?? origin.lng }, origin) < 0.15 &&
          Date.now() - loc.lastNearbyAt < 2 * 60 * 1000
        ) {
          return
        }
        set({ nearbyLoading: true, nearbyError: null })
        try {
          const allowCatalog = get().appMode === 'demo' && destId === 'vizag'
          const radiusM = 8000
          const list = await placesService.nearby(origin, radiusM, destId, { allowCatalog })
          const merged = placesForTrip(destId, origin, list, radiusM / 1000 + 2)
          set({
            nearbyPlaces: merged,
            nearbyLoading: false,
            nearbyError: null,
            location: {
              ...get().location,
              lastNearbyAt: Date.now(),
              lastNearbyLat: origin.lat,
              lastNearbyLng: origin.lng,
            },
          })
        } catch {
          const destIdNow = get().trip?.destinationId ?? get().planner.destinationId
          const originNow = destIdNow
            ? get().liveStarted
              ? activeOrigin(get().location, destIdNow)
              : areaOrigin(destIdNow)
            : null
          const catalog =
            destIdNow && get().appMode === 'demo' && destIdNow === 'vizag' && originNow
              ? placesForTrip(
                  destIdNow,
                  originNow,
                  PLACES.filter((p) => p.destinationId === destIdNow),
                  20,
                )
              : get().nearbyPlaces
          set({
            nearbyLoading: false,
            nearbyError: catalog.length ? 'OSM places unavailable. Showing previously loaded places.' : 'Unable to load places right now.',
            nearbyPlaces: catalog,
          })
        }
      },
      refreshLiveRoute: async () => {
        const trip = get().trip
        const nextAct = trip?.daysPlan[get().mapDay ?? 0]?.activities.find((a) => a.kind === 'place')
        const place = nextAct?.placeId
          ? (getPlace(nextAct.placeId) ?? get().nearbyPlaces.find((p) => p.id === nextAct.placeId))
          : undefined
        if (!place) return
        const origin = activeOrigin(get().location, trip?.destinationId)
        const mode = trip?.transport[0] ?? 'taxi'
        if (haversineKm(origin, place) < 0.08) {
          set({
            liveRoute: {
              km: 0,
              minutes: 1,
              geometry: [[origin.lat, origin.lng]],
              steps: [],
              source: 'osrm',
              mode: 'walking',
            },
          })
          return
        }
        try {
          const route = await routingService.between(origin, place, mode)
          set({ liveRoute: route })
        } catch {
          /* keep previous */
        }
      },
      evaluateRealWeather: () => {
        void get().runAdaptation(false)
      },
      runAdaptation: async (demoMode: boolean) => {
        const trip = get().trip
        if (!trip) return
        const w = get().conditions.weather
        if (w.unavailable) return
        const sug = adaptItinerary({
          itinerary: trip,
          weather: w,
          availablePlaces: get().nearbyPlaces,
          demoMode,
        })
        if (!sug) return
        if (!demoMode && get().adaptation?.affectedActivityId === sug.affectedActivityId) return
        const before = {
          km: trip.route.totalDistanceKm,
          min: trip.route.totalTravelMin,
          spend: trip.budgetEstimate?.mid ?? trip.estimatedSpend,
        }
        let next = recalcRoute(applyReplacement(trip, sug))
        if (get().online) {
          try {
            next = await applyOsrmHops(next)
          } catch {
            /* keep haversine hops */
          }
        }
        next = { ...next, budgetEstimate: estimateTripBudget(next, next.hotel) }
        const after = {
          km: next.route.totalDistanceKm,
          min: next.route.totalTravelMin,
          spend: next.budgetEstimate?.mid ?? next.estimatedSpend,
        }
        const explained = withRouteBudgetDeltas(sug, before, after)
        set({
          previousTrip: trip,
          trip: next,
          adaptation: explained,
          notifications: pushNote(get().notifications, 'weather', 'PLAN UPDATED', explained.message),
        })
        void get().refreshLiveRoute()
      },
      endTrip: () => {
        locationService.stopWatchingLocation()
        const trip = get().trip
        set({
          liveStarted: false,
          followUser: false,
          location: { ...get().location, watching: false },
          trip: trip ? { ...trip, status: 'planned' } : null,
        })
      },
      setOnline: (online) => {
        set({ online })
        if (online) {
          void get().hydrateWeather()
          void get().refreshNearby(true)
          void get().refreshLiveRoute()
        }
      },
      setDemoOpen: (demoOpen) => set({ demoOpen }),
      setAiOpen: (aiOpen) => set({ aiOpen }),
      setSosOpen: (sosOpen) => set({ sosOpen }),
      setShareOpen: (shareOpen) => set({ shareOpen }),
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      setSelectedPlace: (selectedPlaceId) => set({ selectedPlaceId }),
      setMapDay: (mapDay) => set({ mapDay }),
      toggleMapFilter: (c) => {
        const cur = get().mapFilters
        set({
          mapFilters: cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c],
        })
      },
      setNearby: (nearbyFilter) => set({ nearbyFilter }),
      setNearbySort: (nearbySort) => set({ nearbySort }),
      updateUser: (patch) => set({ user: { ...get().user, ...patch } }),
      updatePreferences: (patch) =>
        set({ user: { ...get().user, preferences: { ...get().user.preferences, ...patch } } }),

      setPlanner: (patch) => {
        const prev = get().planner
        const nextDest = patch.destinationId !== undefined ? patch.destinationId : prev.destinationId
        const destChanged = patch.destinationId !== undefined && patch.destinationId !== prev.destinationId
        const destinationExplicit =
          nextDest && !isVizagDestination(nextDest, patch.destinationQuery ?? prev.destinationQuery)
            ? true
            : destChanged && isVizagDestination(nextDest, patch.destinationQuery)
              ? false
              : get().destinationExplicit
        set({
          planner: { ...prev, ...patch },
          destinationExplicit,
          ...(destChanged && nextDest
            ? { trip: null, liveRoute: null, liveStarted: false, offRoute: false, nearbyPlaces: [] }
            : {}),
        })
      },

      applyPreset: (key) => {
        const preset = QUICK_PRESETS[key]
        if (!preset) return
        const start = todayIso()
        const span = key === 'weekend' ? 1 : key === 'solo' ? 3 : 2
        set({
          planner: {
            ...get().planner,
            ...preset,
            startDate: start,
            endDate: addDays(start, span),
            destinationId: get().planner.destinationId,
            destinationQuery: get().planner.destinationQuery,
            step: get().planner.destinationId ? 2 : 1,
            generating: false,
          },
        })
      },

      generateTrip: async () => {
        const demoMode = false
        const stage = (progress: number, message: string, extra?: Partial<PlannerState>) => {
          set({
            planner: {
              ...get().planner,
              generating: true,
              generateProgress: progress,
              generateMessage: message,
              generateError: null,
              ...extra,
            },
          })
        }

        try {
        stage(8, generateMessages[0])
        if (get().location.permission === 'granted' && get().destinationExplicit) {
          void get().refreshGpsSilent()
        }

        stage(18, generateMessages[1])
        let destId = get().planner.destinationId
        const query = get().planner.destinationQuery.trim()
        if (query && !queryMatchesDestination(query, destId)) {
          destId = null
        }
        if (!destId && query) {
          const qn = query.toLowerCase()
          const catalogHit = searchDestinations(query).find(
            (d) =>
              DESTINATIONS.some((c) => c.id === d.id) &&
              (d.name.toLowerCase() === qn || d.id === qn || (d.city ?? '').toLowerCase() === qn),
          )
          if (catalogHit) destId = catalogHit.id
        }
        if (!destId && query && get().online) {
          try {
            const hits = await geocodingService.search(query)
            if (hits[0]) {
              registerDestination(hits[0])
              destId = hits[0].id
            }
          } catch {
            destId = null
          }
        }
        if (!destId && !query) {
          set({
            planner: {
              ...get().planner,
              generating: false,
              generateProgress: 0,
              generateError: DESTINATION_NOT_FOUND,
            },
          })
          return
        }
        if (!destId) {
          set({
            planner: {
              ...get().planner,
              generating: false,
              generateProgress: 0,
              generateError: DESTINATION_NOT_FOUND,
            },
          })
          return
        }
        {
          const probe = getDestination(destId)
          if (needsCityHeal(probe, query)) {
            const parent = catalogParentCity(probe, query)
            if (parent) destId = parent.id
          }
        }

        const dest = getDestination(destId)
        const planner = {
          ...get().planner,
          destinationId: destId,
          destinationQuery: query || dest.name,
          styles: get().planner.styles.length ? get().planner.styles : get().user.preferences.styles,
        }
        set({
          planner: { ...planner, generating: true, generateProgress: 28, generateMessage: generateMessages[2] },
          destinationExplicit: !isVizagDestination(destId, planner.destinationQuery),
        })

        const origin = planningOrigin(get().location, destId)
        if (origin.unresolved || (origin.lat === 0 && origin.lng === 0)) {
          set({
            planner: {
              ...get().planner,
              generating: false,
              generateProgress: 0,
              generateError: DESTINATION_NOT_FOUND,
            },
          })
          return
        }
        const radiusM = 8000
        stage(32, 'Loading live hotels…')
        let liveHotels: Place[] = []
        if (get().online) {
          try {
            const pack = await Promise.race([
              fetchHotels(destId, 0, 30, {
                lat: dest.lat,
                lng: dest.lng,
                name: lodgingCityName(dest),
                city: dest.city || lodgingCityName(dest),
              }),
              new Promise<never>((_, reject) => globalThis.setTimeout(() => reject(new Error('hotels-timeout')), 14000)),
            ])
            liveHotels = pack.hotels.map((h) => ({
              id: h.id,
              destinationId: destId,
              name: h.name,
              category: 'hotel' as const,
              styles: ['relaxation' as const],
              description: h.area,
              rating: h.rating ?? 0,
              reviewCount: h.reviewCount,
              image: h.photo || '',
              images: h.photo ? [h.photo] : [],
              lat: h.lat,
              lng: h.lng,
              address: h.address || h.area,
              openingHours: '',
              opensAt: 0,
              closesAt: 24,
              entryFee: 0,
              bestTime: '',
              crowd: 'moderate' as const,
              crowdNote: '',
              durationMin: 45,
              estimatedCost: Math.round((h.price.low + h.price.high) / 2),
              indoor: true,
              weatherSensitive: false,
              tags: ['hotel', destId],
              source: h.source === 'google' ? 'nominatim' : 'osm',
              phone: h.phone || undefined,
              website: h.website || undefined,
              ratingKnown: h.rating != null,
              hoursKnown: false,
              priceKnown: false,
              crowdKnown: false,
              imageKnown: Boolean(h.photo),
            }))
            stage(42, `${pack.total} hotels on the map`)
          } catch {
            stage(42, 'Hotel feed timed out — continuing with map lodging')
          }
        }
        let osm: Place[] = []
        stage(48, generateMessages[2])
        if (get().online) {
          try {
            osm = await Promise.race([
              placesService.nearby(origin, radiusM, destId, {
                allowCatalog: get().appMode === 'demo' && destId === 'vizag',
              }),
              new Promise<Place[]>((_, reject) =>
                globalThis.setTimeout(() => reject(new Error('places-timeout')), 24000),
              ),
            ])
          } catch {
            osm = get().appMode === 'demo' && destId === 'vizag' ? PLACES.filter((p) => p.destinationId === 'vizag') : []
          }
        } else if (get().appMode === 'demo' && destId === 'vizag') {
          osm = PLACES.filter((p) => p.destinationId === 'vizag')
        }
        const extra = placesForTrip(destId, origin, [...osm, ...liveHotels], radiusM / 1000 + 6)

        stage(62, generateMessages[3])
        let weather = get().conditions.weather
        if (get().online) {
          try {
            weather = await weatherService.getCurrent(origin)
            set({ conditions: { ...get().conditions, weather } })
          } catch {
            /* keep cached / unavailable */
          }
        }

        stage(68, generateMessages[4])
        let trip = buildTrip({ ...planner, destinationId: destId }, extra, origin, weather, demoMode)

        stage(84, generateMessages[5])
        if (get().online) {
          try {
            trip = await applyOsrmHops(trip)
          } catch {
            /* hops stay estimated */
          }
        }

        stage(100, generateMessages[6])
        const personal = get().personalMatch
        trip = {
          ...trip,
          budgetEstimate: trip.budgetEstimate ?? estimateTripBudget(trip, trip.hotel),
          matchScore: personal ?? trip.matchScore,
        }
        const attractions = extra.filter((p) => p.category === 'attraction' || p.category === 'hidden')
        set({
          trip,
          nearbyPlaces: extra,
          liveStarted: false,
          liveRoute: null,
          offRoute: false,
          planner: {
            ...get().planner,
            destinationId: destId,
            destinationQuery: planner.destinationQuery,
            generating: false,
            generateProgress: 100,
            generateError: null,
          },
          lastOptimizeWins: [],
          notifications: pushNote(
            get().notifications,
            'info',
            attractions.length ? 'Itinerary ready' : 'Trip ready — few map places',
            trip.shortageNote || (attractions.length ? `${trip.title} is ready to explore.` : NO_NEARBY_ATTRACTIONS),
          ),
        })
        void get().refreshLiveRoute()
        void saveTripRemote(trip)
        } catch (err) {
          set({
            planner: {
              ...get().planner,
              generating: false,
              generateProgress: 0,
              generateError: err instanceof Error ? err.message : 'Trip planning failed. Try again.',
            },
          })
        }
      },

      regenerateTrip: async () => {
        await get().generateTrip()
      },

      startTrip: () => {
        const trip = get().trip
        if (!trip) return
        set({
          liveStarted: true,
          followUser: true,
          location: { ...get().location, watching: true },
          trip: { ...trip, status: 'live' },
          notifications: pushNote(
            get().notifications,
            'info',
            'Live trip started',
            get().location.permission === 'granted'
              ? 'GPS tracking is on. The map will follow you.'
              : `${GPS_DENIED} Routing can still use your selected destination.`,
          ),
        })
        void get().refreshLiveRoute()
        void get().hydrateWeather()
        void get().refreshNearby(true)
      },

      reorderDay: (dayIndex, from, to) => {
        const trip = get().trip
        if (!trip) return
        const daysPlan = trip.daysPlan.map((d, i) => {
          if (i !== dayIndex) return d
          const acts = [...d.activities]
          const [moved] = acts.splice(from, 1)
          acts.splice(to, 0, moved)
          return { ...d, activities: acts }
        })
        const next = recalcRoute({ ...trip, daysPlan })
        const saved = Math.max(8, trip.route.totalTravelMin - next.route.totalTravelMin + 14)
        next.route.lastSavedMin = saved
        set({ trip: next, lastRouteSavedMin: saved })
      },

      addPlaceToTrip: (placeId, dayIndex = 0) => {
        const trip = get().trip
        const place = getPlace(placeId) ?? get().nearbyPlaces.find((p) => p.id === placeId)
        if (!place) return
        if (place) registerPlaces([place])
        if (!trip) {
          set({ trip: draftTripFromPlace(place, get().planner) })
          void get().refreshLiveRoute()
          return
        }
        const day = trip.daysPlan[dayIndex] ?? trip.daysPlan[0]
        const activity = {
          id: uid('act'),
          dayIndex: day.index,
          start: '4:30 PM',
          end: '6:00 PM',
          kind: 'place' as const,
          title: place.name,
          subtitle: 'Added',
          placeId: place.id,
          cost: place.entryFee,
          travelFromPrevMin: 18,
          travelFromPrevKm: 6,
          transport: trip.transport[0] ?? 'taxi',
        }
        const daysPlan = trip.daysPlan.map((d) =>
          d.index === day.index ? { ...d, activities: [...d.activities, activity] } : d,
        )
        set({
          trip: recalcRoute({
            ...trip,
            daysPlan,
            placeCount: trip.placeCount + 1,
          }),
        })
      },

      removeActivity: (id) => {
        const trip = get().trip
        if (!trip) return
        const daysPlan = trip.daysPlan.map((d) => ({
          ...d,
          activities: d.activities.filter((a) => a.id !== id),
        }))
        set({ trip: recalcRoute({ ...trip, daysPlan }) })
      },

      replaceActivity: (activityId, placeId) => {
        const trip = get().trip
        const place = getPlace(placeId) ?? get().nearbyPlaces.find((p) => p.id === placeId)
        if (place) registerPlaces([place])
        if (!trip || !place) return
        const daysPlan = trip.daysPlan.map((d) => ({
          ...d,
          activities: d.activities.map((a) =>
            a.id === activityId
              ? { ...a, title: place.name, placeId: place.id, cost: place.entryFee, notes: 'Replaced' }
              : a,
          ),
        }))
        set({ trip: recalcRoute({ ...trip, daysPlan }) })
      },

      savePlace: (placeId, list = 'want') => {
        const place = getPlace(placeId) ?? get().nearbyPlaces.find((p) => p.id === placeId)
        if (place) registerPlaces([place])
        const exists = get().saved.find((s) => s.placeId === placeId)
        if (exists) {
          set({
            saved: get().saved.map((s) =>
              s.placeId === placeId ? { ...s, list, snapshot: place ?? s.snapshot } : s,
            ),
          })
          return
        }
        set({
          saved: [{ placeId, list, savedAt: new Date().toISOString(), snapshot: place }, ...get().saved],
        })
        if (place) void savePlaceRemote(place)
      },
      unsavePlace: (placeId) => set({ saved: get().saved.filter((s) => s.placeId !== placeId) }),
      moveSaved: (placeId, list) =>
        set({ saved: get().saved.map((s) => (s.placeId === placeId ? { ...s, list } : s)) }),

      addExpense: (category, amount, description) => {
        const expenses = [
          { id: uid('exp'), category, amount, description, createdAt: new Date().toISOString() },
          ...get().expenses,
        ]
        const spent = expenses.reduce((s, e) => s + e.amount, 0)
        const budget = get().trip?.budget ?? get().user.preferences.defaultBudget
        const remaining = budget - spent
        set({
          expenses,
          notifications:
            remaining < 400
              ? pushNote(get().notifications, 'budget', 'Budget running low', `Only ₹${remaining} left.`)
              : remaining > 300
                ? pushNote(
                    get().notifications,
                    'budget',
                    `You’re ₹${Math.max(0, remaining - (get().trip?.estimatedSpend ?? 0))} under today’s plan`,
                    'Nice pacing — you can still add a cafe stop.',
                  )
                : get().notifications,
        })
      },

      acceptAdaptation: () => set({ adaptation: null }),
      keepOriginal: () => {
        const prev = get().previousTrip
        set({ trip: prev ?? get().trip, adaptation: null, previousTrip: null })
      },
      askWhy: () => get().adaptation?.explanation || get().adaptation?.reason || 'Conditions changed, so an outdoor stop was swapped for an indoor alternative.',
      acceptCrowdMove: () => {
        const trip = get().trip
        const suggestion = get().crowdSuggestion
        if (!trip || !suggestion?.original.placeId) return
        set({
          trip: recalcRoute(applyCrowdMove(trip, suggestion.original.placeId)),
          crowdSuggestion: null,
        })
      },

      optimize: () => {
        const trip = get().trip
        if (!trip) return
        const budgeted = optimizeActivitiesForBudget(trip, trip.hotel)
        const { trip: next, wins } = optimizeTrip(budgeted.trip, get().conditions)
        set({
          trip: { ...next, budgetEstimate: estimateTripBudget(next, next.hotel) },
          lastOptimizeWins: [...budgeted.wins, ...wins],
          lastRouteSavedMin: next.route.lastSavedMin ?? 0,
          notifications: pushNote(get().notifications, 'info', 'Optimization complete', [...budgeted.wins, ...wins].join(' · ') || 'Plan tightened'),
        })
      },

      saveCurrentTrip: () => {
        const trip = get().trip
        if (!trip) return
        const dest = findDestination(trip.destinationId)
        const row: SavedTrip = {
          id: uid('saved'),
          title: trip.title,
          destination: dest ?? {
            name: trip.destinationName || trip.destinationId,
            lat: trip.destinationLat ?? 0,
            lng: trip.destinationLng ?? 0,
          },
          dates: { start: trip.startDate, end: trip.endDate },
          budget: trip.budget,
          preferences: { styles: trip.styles, pace: trip.pace },
          itinerary: trip,
          weatherSnapshot: get().conditions.weather,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ savedTrips: [row, ...get().savedTrips].slice(0, 20) })
      },
      loadSavedTrip: (id) => {
        const row = get().savedTrips.find((t) => t.id === id)
        if (!row) return
        set({
          trip: row.itinerary,
          planner: {
            ...get().planner,
            destinationId: row.itinerary.destinationId,
            destinationQuery: row.itinerary.destinationName || row.destination.name,
            budget: row.budget,
            styles: row.preferences.styles,
            pace: row.preferences.pace,
            startDate: row.dates.start,
            endDate: row.dates.end,
          },
          destinationExplicit: true,
          conditions: row.weatherSnapshot
            ? { ...get().conditions, weather: { ...row.weatherSnapshot, stale: true } }
            : get().conditions,
        })
        void get().healStreetDestination()
      },
      deleteSavedTrip: (id) => set({ savedTrips: get().savedTrips.filter((t) => t.id !== id) }),
      duplicateSavedTrip: (id) => {
        const row = get().savedTrips.find((t) => t.id === id)
        if (!row) return
        const copy: SavedTrip = {
          ...row,
          id: uid('saved'),
          title: `${row.title} (copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ savedTrips: [copy, ...get().savedTrips] })
      },

      simulateRain: () => {
        const weather = {
          ...get().conditions.weather,
          condition: 'heavy-rain' as const,
          rainProbability: 82,
          precipitationMm: 4,
          summary: 'Heavy rain (demo)',
          unavailable: false,
          source: 'Open-Meteo',
        }
        set({ conditions: { ...get().conditions, weather }, appMode: 'demo' })
        void get().runAdaptation(true)
      },
      simulateHeat: () => {
        const weather = {
          ...get().conditions.weather,
          condition: 'clear' as const,
          tempC: 39,
          apparentTempC: 41,
          rainProbability: 5,
          summary: 'Extreme heat (demo)',
          unavailable: false,
          source: 'Open-Meteo',
        }
        set({ conditions: { ...get().conditions, weather }, appMode: 'demo' })
        const trip = get().trip
        if (!trip) return
        const sug = heatAdaptation(trip, get().nearbyPlaces, get().planner.destinationId === 'vizag')
        if (!sug) {
          void get().runAdaptation(true)
          return
        }
        set({ conditions: { ...get().conditions, weather } })
        void get().runAdaptation(true)
      },
      simulateNormalWeather: () => {
        set({
          conditions: {
            ...get().conditions,
            weather: {
              ...get().conditions.weather,
              condition: 'clear',
              rainProbability: 12,
              tempC: Math.min(get().conditions.weather.tempC || 28, 32),
              summary: 'Normal weather (demo)',
              unavailable: false,
            },
          },
          adaptation: null,
          appMode: 'demo',
        })
        void get().hydrateWeather()
      },
      simulateTraffic: () => {
        set({
          conditions: {
            ...get().conditions,
            trafficFeed: { status: 'unavailable', source: 'No live traffic provider connected' },
          },
          notifications: pushNote(
            get().notifications,
            'traffic',
            'Traffic unavailable',
            'No live traffic provider connected. Demo does not invent congestion percentages.',
          ),
        })
      },
      simulateCrowd: () => {
        set({
          conditions: {
            ...get().conditions,
            crowdFeed: { status: 'unavailable', source: 'No live crowd provider connected' },
          },
          notifications: pushNote(
            get().notifications,
            'crowd',
            'Crowd unavailable',
            'No live crowd provider connected. Demo does not invent crowd percentages.',
          ),
        })
      },
      simulateClosure: () => {
        const trip = get().trip
        set({
          conditions: { ...get().conditions, closures: [...get().conditions.closures, 'kailasagiri'] },
          notifications: pushNote(
            get().notifications,
            'closure',
            'Kailasagiri ropeway paused',
            'Hill viewpoint access is limited for the next two hours.',
          ),
          adaptation: trip ? closureAdaptation(trip, trip.daysPlan[0]?.activities.find((a) => a.kind === 'place')?.placeId ?? '', get().nearbyPlaces, true) : get().adaptation,
        })
      },
      simulateLate: () => {
        const trip = get().trip
        set({
          conditions: { ...get().conditions, runningLateMin: 25 },
          notifications: pushNote(
            get().notifications,
            'late',
            'You’re running 25 minutes behind',
            'We can protect sunset by dropping one stop.',
          ),
          adaptation: trip ? lateAdaptation(trip) : get().adaptation,
        })
      },
      simulateBattery: () => {
        set({
          conditions: { ...get().conditions, lowBattery: true },
          notifications: pushNote(
            get().notifications,
            'battery',
            'Low battery',
            'Offline pack is ready: itinerary, saved places, emergency contacts.',
          ),
        })
      },
      simulateOffline: () => {
        set({
          online: false,
          notifications: pushNote(
            get().notifications,
            'offline',
            'You’re offline',
            'Saved itinerary, saved places and emergency info remain available.',
          ),
        })
      },

      sendChat: async (text) => {
        const userMsg = { id: uid('msg'), role: 'user' as const, content: text, time: new Date().toISOString() }
        set({ chat: [...get().chat, userMsg] })
        const spent = get().expenses.reduce((s, e) => s + e.amount, 0)
        const budget = get().trip?.budget ?? get().user.preferences.defaultBudget
        const origin = activeOrigin(get().location, get().trip?.destinationId ?? get().planner.destinationId)
        const dest = get().trip?.destinationName ?? get().planner.destinationQuery ?? 'your destination'
        const destId = get().trip?.destinationId ?? get().planner.destinationId
        const nextAct = get().trip?.daysPlan[0]?.activities.find((a) => a.kind === 'place')
        const result = await askAssistant(text, {
          trip: get().trip,
          conditions: get().conditions,
          remainingBudget: budget - spent,
          spent,
          label: origin.label,
          destination: dest,
          destinationId: destId,
          nextName: nextAct?.title,
          routeKm: get().liveRoute?.km,
          routeMin: get().liveRoute?.minutes,
          mode: 'real',
          live: get().liveStarted,
          adapted: Boolean(get().adaptation),
          adaptationReason: get().adaptation?.reason,
          adaptationExplanation: get().adaptation?.explanation,
          nearbyNames: get().nearbyPlaces.slice(0, 6).map((p) => p.name),
        })
        if (result.action === 'cheap' && get().trip) {
          const cheap = get().nearbyPlaces.find(
            (p) => p.nearbyKind === 'cafe' || p.category === 'cafe' || p.category === 'restaurant',
          )
          if (cheap) get().addPlaceToTrip(cheap.id)
        }
        if (result.action === 'adapt') {
          get().evaluateRealWeather()
        }
        if (result.action === 'go') {
          const target = nextAct?.placeId ?? get().nearbyPlaces[0]?.id
          if (target) get().goToPlace(target)
        }
        set({
          chat: [
            ...get().chat,
            { id: uid('msg'), role: 'assistant', content: result.reply, time: new Date().toISOString() },
          ],
        })
      },

      markNotificationsRead: () =>
        set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),

      shareUrl: () => {
        const trip = get().trip
        const slug = `${get().user.name.toLowerCase()}-${trip?.destinationId ?? 'trip'}-${(trip?.id ?? 'demo').slice(-6)}`
        return `https://yatrasense.app/share/${slug}`
      },
    }),
    {
      name: 'yatrasense-store',
      partialize: (s) => ({
        user: s.user,
        signedIn: s.signedIn,
        personalMatch: s.personalMatch,
        theme: s.theme,
        saved: s.saved,
        savedTrips: s.savedTrips,
        expenses: s.expenses,
        trip: s.trip,
        planner: { ...s.planner, generating: false },
        appMode: s.appMode,
        destinationExplicit: s.destinationExplicit,
        nearbyPlaces: s.nearbyPlaces,
        location: {
          ...s.location,
          loading: false,
          watching: false,
          error: s.location.permission === 'granted' ? null : s.location.error,
        },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppStore> | undefined
        const explicit = Boolean(p?.destinationExplicit) || Boolean(p?.planner?.destinationId)
        const rawPlanner = p?.planner
          ? { ...current.planner, ...p.planner, generating: false, generateError: p.planner.generateError ?? null }
          : current.planner
        const destKnown =
          !rawPlanner.destinationId ||
          Boolean(findDestination(rawPlanner.destinationId)) ||
          DESTINATIONS.some((d) => d.id === rawPlanner.destinationId) ||
          rawPlanner.destinationId.startsWith('geo_')
        const plannerBase = { ...rawPlanner } as PlannerState & { flyingFrom?: unknown }
        delete plannerBase.flyingFrom
        const plannerRaw = destKnown ? plannerBase : { ...plannerBase, destinationId: null }
        const rawUser = { ...(p?.user ?? current.user) } as User & { arrivalOrigin?: unknown }
        delete rawUser.arrivalOrigin
        const user = rawUser
        const rawTrip = tripMatchesPlanner(p?.trip, plannerRaw) ? p!.trip! : null
        const healed = applyCatalogCityHeal(plannerRaw, rawTrip)
        const planner = healed.planner
        const trip = healed.trip
        const destCenter = planner.destinationId ? findDestination(planner.destinationId) : undefined
        const nearby = (p?.nearbyPlaces ?? current.nearbyPlaces).filter((place) => {
          if (!planner.destinationId) return false
          if (place.destinationId === planner.destinationId) return true
          if (!destCenter) return false
          return haversineKm(destCenter, place) < 45
        })
        return {
          ...current,
          ...p,
          user,
          trip,
          planner,
          nearbyPlaces: nearby,
          savedTrips: p?.savedTrips ?? current.savedTrips,
          destinationExplicit: explicit,
          appMode: 'real',
          liveStarted: false,
          offRoute: false,
          rerouting: false,
          demoOpen: false,
          conditions: current.conditions,
          location: {
            ...defaultLocation(),
            ...p?.location,
            permission: p?.location?.permission === 'granted' ? 'granted' : 'fallback',
            loading: false,
            watching: false,
            lastNearbyAt: 0,
            label:
              p?.location?.permission === 'granted' && p.location.label
                ? p.location.label
                : destCenter
                  ? destDisplayLabel(destCenter)
                  : p?.location?.label || '',
          },
        }
      },
      version: 9,
      migrate: (persisted, version) => {
        const p = persisted as Partial<AppStore>
        if (version < 9) {
          const planner = { ...(p.planner ?? defaultPlanner()), generating: false } as PlannerState & {
            flyingFrom?: unknown
          }
          delete planner.flyingFrom
          const user = { ...(p.user ?? GUEST_USER) } as User & { arrivalOrigin?: unknown }
          delete user.arrivalOrigin
          return { ...p, planner, user } as AppStore
        }
        if (version < 7) {
          const seeded = p.user?.id === 'user_pravallika' || p.user?.email === 'pravallika@yatrasense.app'
          return {
            ...p,
            user: seeded ? GUEST_USER : p.user,
            signedIn: false,
            personalMatch: p.personalMatch ?? null,
            planner: { ...(p.planner ?? defaultPlanner()), generating: false, generateError: null },
            nearbyPlaces: version < 5 ? [] : p.nearbyPlaces,
            trip: version < 5 ? null : p.trip,
            appMode: 'real',
            demoOpen: false,
          } as AppStore
        }
        if (version < 6) {
          return {
            ...p,
            planner: { ...(p.planner ?? defaultPlanner()), generating: false },
            nearbyPlaces: version < 5 ? [] : p.nearbyPlaces,
            trip: version < 5 ? null : p.trip,
            appMode: 'real',
            demoOpen: false,
          } as AppStore
        }
        if (version < 5) {
          return {
            ...p,
            nearbyPlaces: [],
            trip: null,
            appMode: 'real',
            demoOpen: false,
          } as AppStore
        }
        if (version >= 4) return { ...p, appMode: 'real', demoOpen: false } as AppStore
        return {
          ...p,
          appMode: 'real',
          demoOpen: false,
          destinationExplicit: Boolean(p.planner?.destinationId),
          planner: {
            ...(p.planner ?? defaultPlanner()),
            generating: false,
          },
        } as AppStore
      },
      onRehydrateStorage: () => (state) => {
        if (state?.nearbyPlaces?.length) registerPlaces(state.nearbyPlaces)
        const snaps = state?.saved?.map((s) => s.snapshot).filter(Boolean) as Place[] | undefined
        if (snaps?.length) registerPlaces(snaps)
        if (state?.trip?.destinationId) {
          registerDestination({
            id: state.trip.destinationId,
            name: state.trip.destinationName || getDestination(state.trip.destinationId).name,
            state: '',
            country: '',
            tagline: state.trip.destinationName || '',
            image: getDestination(state.trip.destinationId).image,
            lat: state.trip.destinationLat ?? getDestination(state.trip.destinationId).lat,
            lng: state.trip.destinationLng ?? getDestination(state.trip.destinationId).lng,
            timezone: 'UTC',
          })
        }
      },
    },
  ),
)

export function spentTotal(expenses: Expense[]) {
  return expenses.reduce((s, e) => s + e.amount, 0)
}

export function crowdOf(place: Place, overrides: Record<string, CrowdLevel>) {
  return overrides[place.id] ?? place.crowd
}

export { CURRENT_LOCATION } from '@/data/places'
