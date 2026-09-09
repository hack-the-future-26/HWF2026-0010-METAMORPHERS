import { Sparkles, WifiOff } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { useEffect } from 'react'
import { BottomNav, Sidebar, TopBar } from './Nav'
import { DemoPanel } from './DemoPanel'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { ActivityModal } from '@/components/trip/ActivityModal'
import { ShareTripModal } from '@/components/trip/ShareTripModal'
import { SOSModal } from '@/components/safety/SOSModal'
import { LocationPrompt } from '@/components/location/LocationPrompt'
import { locationService } from '@/services/locationService'
import { registerPlaces } from '@/data/places'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { GPS_DENIED } from '@/lib/osmCopy'

export function AppShell() {
  const online = useAppStore((s) => s.online)
  const setOnline = useAppStore((s) => s.setOnline)
  const setAiOpen = useAppStore((s) => s.setAiOpen)
  const theme = useAppStore((s) => s.theme)
  const hydrateWeather = useAppStore((s) => s.hydrateWeather)
  const liveStarted = useAppStore((s) => s.liveStarted)
  const permission = useAppStore((s) => s.location.permission)
  const locError = useAppStore((s) => s.location.error)
  const onGpsFix = useAppStore((s) => s.onGpsFix)
  const refreshGpsSilent = useAppStore((s) => s.refreshGpsSilent)
  const requestLocation = useAppStore((s) => s.requestLocation)
  const fallback = useAppStore((s) => s.useDestinationFallback)
  const nearbyPlaces = useAppStore((s) => s.nearbyPlaces)
  const navigate = useNavigate()

  useEffect(() => {
    if (nearbyPlaces.length) registerPlaces(nearbyPlaces)
  }, [nearbyPlaces])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    void hydrateWeather()
    const id = window.setInterval(() => void hydrateWeather(), 12 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [hydrateWeather])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    if (!navigator.onLine) setOnline(false)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [setOnline])

  useEffect(() => {
    if (permission === 'granted') void refreshGpsSilent()
  }, [permission, refreshGpsSilent])

  useEffect(() => {
    if (!liveStarted || permission !== 'granted') {
      locationService.stopWatchingLocation()
      return
    }
    const stop = locationService.watchLocation(onGpsFix)
    return () => {
      stop()
    }
  }, [liveStarted, permission, onGpsFix])

  const showLocBanner = permission === 'denied' || permission === 'unsupported' || permission === 'timeout'

  return (
    <div className="flex min-h-svh bg-sand-100 text-ink-900 dark:bg-[#0b1113] dark:text-sand-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {!online && (
          <div className="flex items-center justify-between gap-3 bg-ink-900 px-4 py-2.5 text-sm text-white">
            <span className="flex items-center gap-2">
              <WifiOff className="size-4" /> Offline — showing saved information
            </span>
            <span className="hidden text-xs text-white/70 sm:inline">
              ✓ Saved itinerary · ✓ Saved places · ✓ Last location · ✓ Emergency
            </span>
            <Button size="sm" variant="secondary" onClick={() => navigate('/trip')}>
              Open itinerary
            </Button>
          </div>
        )}
        {showLocBanner && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-sunset-500/15 px-4 py-2.5 text-sm">
            <span>{locError || GPS_DENIED}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => void fallback()}>
                Use destination instead
              </Button>
              {permission === 'denied' && (
                <Button size="sm" onClick={() => void requestLocation()}>
                  Try again
                </Button>
              )}
            </div>
          </div>
        )}
        <main className="flex-1 px-4 pb-28 pt-5 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <button
        onClick={() => {
          if (!online) {
            toast.error('Assistant needs a connection. Offline pack is still available.')
            return
          }
          setAiOpen(true)
        }}
        className="fixed bottom-24 left-4 z-40 grid size-14 place-items-center rounded-full bg-teal-800 text-white shadow-float pulse-live lg:bottom-6 lg:left-auto lg:right-56"
        aria-label="Open YatraSense AI"
      >
        <Sparkles className="size-6" />
      </button>
      <LocationPrompt />
      <DemoPanel />
      <AIAssistant />
      <NotificationCenter />
      <ActivityModal />
      <ShareTripModal />
      <SOSModal />
      <Toaster richColors position="top-center" />
    </div>
  )
}
