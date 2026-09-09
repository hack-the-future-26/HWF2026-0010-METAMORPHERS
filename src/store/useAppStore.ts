import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_USER } from '@/data/user'
import { getPlace, PLACES, registerPlaces } from '@/data/places'
import { DESTINATIONS, getDestination, registerDestination } from '@/data/destinations'
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
  Pace,
  Place,
  PlannerState,
  RoutePath,
  SavedList,
  SavedPlace,
  ThemeMode,
  TransportMode,
  TravelStyle,
  Trip,
  User,
} from '@/types'
import { addDays, haversineKm, minutesToTime, todayIso, uid } from '@/lib/utils'
import { activeOrigin, landmarkLabel, planningOrigin, queryMatchesDestination, tripMatchesPlanner } from '@/lib/origin'
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
  crowdAdaptation,
  lateAdaptation,
  rainAdaptation,
  trafficAdaptation,
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
  endDate: addDays(todayIso(), 2),
  travelers: { adults: 2, children: 0, seniors: 0 },
  styles: [],
  budget: 5000,
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
  permission: 'unset',
  loading: false,
  error: null,
  fix: null,
  label: '',
  watching: false,
  lastNearbyAt: 0,
  lastNearbyLat: null,
  lastNearbyLng: null,
})

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

interface AppStore {
  user: User
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
  crowdSuggestion: AdaptationSuggestion | null
  saved: SavedPlace[]
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
  hydrateWeather: () => Promise<void>
  setAppMode: (m: AppDataMode) => void
  requestLocation: () => Promise<void>
  refreshGpsSilent: () => Promise<void>
  useDestinationFallback: () => Promise<void>
  onGpsFix: (fix: GeoFix) => void
  goToPlace: (placeId: string) => void
  refreshNearby: (force?: boolean) => Promise<void>
  refreshLiveRoute: () => Promise<void>
  evaluateRealWeather: () => void
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
  simulateRain: () => void
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
      crowdSuggestion: null,
      saved: [],
      expenses: [],
      notifications: [
        {
          id: uid('ntf'),
          kind: 'info',
          title: 'Welcome to YatraSense',
          body: 'LIVE MODE is on. Search any city — itineraries come from OSM, Open-Meteo and OSRM. Open DEMO MODE only for jury simulations.',
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

      hydrateWeather: async () => {
        if (!get().online) return
        try {
          const live = get().liveStarted
          const origin = live
            ? activeOrigin(get().location, get().trip?.destinationId ?? get().planner.destinationId)
            : planningOrigin(get().location, get().trip?.destinationId ?? get().planner.destinationId)
          if (!origin.lat && !origin.lng && origin.source === 'fallback') return
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
          registerDestination({
            id: `geo_${fix.lat.toFixed(4)}_${fix.lng.toFixed(4)}`,
            name: label.split(',')[0] || 'Current area',
            state: label,
            country: '',
            tagline: 'Detected from GPS',
            image: DESTINATIONS[0].image,
            lat: fix.lat,
            lng: fix.lng,
            timezone: 'Asia/Kolkata',
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
        const place = getPlace(placeId)
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
        const origin = activeOrigin(get().location, get().trip?.destinationId ?? get().planner.destinationId)
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
          const destId = get().trip?.destinationId ?? get().planner.destinationId ?? 'live'
          const list = await placesService.nearby(origin, 5000, destId, { allowCatalog: get().appMode === 'demo' })
          registerPlaces(list)
          const label = landmarkLabel(origin, list, get().location.label || origin.label)
          set({
            nearbyPlaces: list,
            nearbyLoading: false,
            location: {
              ...get().location,
              label,
              lastNearbyAt: Date.now(),
              lastNearbyLat: origin.lat,
              lastNearbyLng: origin.lng,
            },
          })
        } catch {
          set({
            nearbyLoading: false,
            nearbyError: 'Nearby places unavailable.',
            nearbyPlaces: get().nearbyPlaces,
          })
        }
      },
      refreshLiveRoute: async () => {
        const trip = get().trip
        const nextAct = trip?.daysPlan[get().mapDay ?? 0]?.activities.find((a) => a.kind === 'place')
        const place = nextAct?.placeId ? getPlace(nextAct.placeId) : undefined
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
        const trip = get().trip
        if (!trip) return
        const w = get().conditions.weather
        if (w.unavailable) return
        const sug = adaptItinerary({
          itinerary: trip,
          weather: w,
          availablePlaces: get().nearbyPlaces,
          demoMode: get().appMode === 'demo',
        })
        if (!sug) return
        if (get().adaptation?.affectedActivityId === sug.affectedActivityId) return
        const next = recalcRoute(applyReplacement(trip, sug))
        set({
          trip: next,
          adaptation: sug,
          notifications: pushNote(
            get().notifications,
            'weather',
            'Itinerary updated',
            sug.reason,
          ),
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
        const destChanged =
          (patch.destinationId !== undefined && patch.destinationId !== prev.destinationId) ||
          (patch.destinationQuery !== undefined &&
            patch.destinationQuery.trim() !== prev.destinationQuery.trim() &&
            (patch.destinationId === null || patch.destinationId === undefined))
        set({
          planner: { ...prev, ...patch },
          ...(destChanged ? { trip: null, liveRoute: null, liveStarted: false, offRoute: false, nearbyPlaces: [] } : {}),
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
            step: 2,
            generating: false,
          },
        })
      },

      generateTrip: async () => {
        const demoMode = get().appMode === 'demo'
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

        stage(8, generateMessages[0])
        if (get().location.permission === 'granted') {
          await get().refreshGpsSilent()
        }

        stage(18, generateMessages[1])
        let destId = get().planner.destinationId
        const query = get().planner.destinationQuery.trim()
        if (query && !queryMatchesDestination(query, destId)) {
          destId = null
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
          const loc = get().location
          if (loc.fix && loc.permission === 'granted') {
            destId = `geo_${loc.fix.lat.toFixed(4)}_${loc.fix.lng.toFixed(4)}`
            registerDestination({
              id: destId,
              name: (loc.label || 'Current area').split(',')[0],
              state: loc.label || '',
              country: '',
              tagline: loc.label || 'Detected from GPS',
              image: DESTINATIONS[0].image,
              lat: loc.fix.lat,
              lng: loc.fix.lng,
              timezone: 'Asia/Kolkata',
            })
          }
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

        const dest = getDestination(destId)
        const planner = {
          ...get().planner,
          destinationId: destId,
          destinationQuery: query || dest.name,
          styles: get().planner.styles.length ? get().planner.styles : get().user.preferences.styles,
        }
        set({ planner: { ...planner, generating: true, generateProgress: 28, generateMessage: generateMessages[2] } })

        const origin = planningOrigin(get().location, destId)
        let extra: Place[] = []
        if (get().online) {
          try {
            extra = await placesService.nearby(origin, 8000, destId, { allowCatalog: demoMode })
            registerPlaces(extra)
          } catch {
            extra = get().nearbyPlaces.filter((p) => p.source === 'osm' || demoMode)
          }
        } else {
          extra = get().nearbyPlaces
        }

        stage(48, generateMessages[3])
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
            attractions.length ? `${trip.title} is ready to explore.` : NO_NEARBY_ATTRACTIONS,
          ),
        })
        void get().refreshLiveRoute()
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
        const place = getPlace(placeId)
        if (!trip || !place) return
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
        const place = getPlace(placeId)
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

      acceptAdaptation: () => {
        const { trip, adaptation } = get()
        if (!trip || !adaptation) return
        const next = recalcRoute(applyReplacement(trip, adaptation))
        set({
          trip: next,
          adaptation: null,
          notifications: pushNote(
            get().notifications,
            adaptation.type === 'weather' ? 'weather' : 'traffic',
            'Itinerary updated',
            adaptation.reason,
          ),
        })
        void get().refreshLiveRoute()
      },
      keepOriginal: () => set({ adaptation: null }),
      askWhy: () => get().adaptation?.reason ?? 'This change reduces travel time and avoids disruption.',
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
        const { trip: next, wins } = optimizeTrip(trip, get().conditions)
        set({
          trip: next,
          lastOptimizeWins: wins,
          lastRouteSavedMin: next.route.lastSavedMin ?? 0,
          notifications: pushNote(get().notifications, 'info', 'Optimization complete', wins.join(' · ')),
        })
      },

      simulateRain: () => {
        const trip = get().trip
        const weather = {
          ...get().conditions.weather,
          condition: 'heavy-rain' as const,
          rainProbability: 88,
          precipitationMm: 4,
          summary: 'Heavy rain (test adaptation)',
          unavailable: false,
        }
        set({ conditions: { ...get().conditions, weather } })
        if (!trip) return
        const sug = adaptItinerary({
          itinerary: trip,
          weather,
          availablePlaces: get().nearbyPlaces,
          demoMode: get().appMode === 'demo',
        }) ?? rainAdaptation(trip, get().nearbyPlaces, get().appMode === 'demo')
        if (!sug) {
          set({
            notifications: pushNote(
              get().notifications,
              'weather',
              'Rain simulated',
              'No outdoor stop to replace from current map data.',
            ),
          })
          return
        }
        const next = recalcRoute(applyReplacement(trip, sug))
        set({
          trip: next,
          adaptation: sug,
          notifications: pushNote(get().notifications, 'weather', 'Itinerary updated', sug.reason),
        })
        void get().refreshLiveRoute()
      },
      simulateTraffic: () => {
        const trip = get().trip
        set({
          conditions: {
            ...get().conditions,
            traffic: 'heavy',
            trafficFeed: { status: 'estimated', value: 'heavy', source: 'jury-demo' },
          },
          notifications: pushNote(
            get().notifications,
            'traffic',
            'Traffic increased on your route',
            'Jury demo — not a live traffic feed.',
          ),
          adaptation: trip ? trafficAdaptation(trip) : get().adaptation,
        })
      },
      simulateCrowd: () => {
        const place = getPlace('rk-beach')
        set({
          conditions: {
            ...get().conditions,
            crowdOverrides: { ...get().conditions.crowdOverrides, 'rk-beach': 'high' as CrowdLevel },
          },
          crowdSuggestion: place ? crowdAdaptation(place) : null,
          notifications: pushNote(
            get().notifications,
            'crowd',
            'Beach crowd is increasing',
            'High crowd expected between 5–7 PM at RK Beach.',
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
        const origin = activeOrigin(get().location, get().trip?.destinationId)
        const nextAct = get().trip?.daysPlan[0]?.activities.find((a) => a.kind === 'place')
        const result = await askAssistant(text, {
          trip: get().trip,
          conditions: get().conditions,
          remainingBudget: budget - spent,
          spent,
          label: origin.label,
          nextName: nextAct?.title,
          routeKm: get().liveRoute?.km,
          routeMin: get().liveRoute?.minutes,
          mode: get().appMode,
        })
        if (result.action === 'cheap' && get().trip) {
          const cheap =
            get().nearbyPlaces.find((p) => p.nearbyKind === 'cafe' || p.category === 'cafe' || p.category === 'restaurant') ??
            (get().appMode === 'demo' ? PLACES.find((p) => p.id === 'chapathi-point') : undefined)
          if (cheap) get().addPlaceToTrip(cheap.id)
        }
        if (result.action === 'adapt') {
          if (get().appMode === 'demo') get().simulateRain()
          else get().evaluateRealWeather()
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
        theme: s.theme,
        saved: s.saved,
        expenses: s.expenses,
        trip: s.trip,
        planner: { ...s.planner, generating: false },
        appMode: s.appMode,
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
        const planner = p?.planner
          ? { ...current.planner, ...p.planner, generating: false, generateError: p.planner.generateError ?? null }
          : current.planner
        const trip = tripMatchesPlanner(p?.trip, planner) ? p!.trip! : null
        return {
          ...current,
          ...p,
          trip,
          planner,
          liveStarted: false,
          offRoute: false,
          rerouting: false,
          demoOpen: (p?.appMode ?? 'real') === 'demo' ? Boolean(p?.demoOpen) : false,
          conditions: {
            ...current.conditions,
            ...p?.conditions,
            trafficFeed: p?.conditions?.trafficFeed ?? current.conditions.trafficFeed,
            crowdFeed: p?.conditions?.crowdFeed ?? current.conditions.crowdFeed,
          },
          location: {
            ...defaultLocation(),
            ...p?.location,
            loading: false,
            watching: false,
            lastNearbyAt: 0,
          },
        }
      },
      version: 2,
      migrate: (persisted) => persisted as AppStore,
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
            image: DESTINATIONS[0].image,
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
