import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import { Toaster } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'

export function PublicShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const signedIn = useAppStore((s) => s.signedIn)
  const theme = useAppStore((s) => s.theme)
  const isLanding = pathname === '/'

  useEffect(() => {
    void useAppStore.getState().hydrateSession()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="min-h-svh bg-sand-100 text-ink-900 app-canvas dark:bg-[#0b1113] dark:text-sand-100">
      <header
        className={
          isLanding
            ? 'absolute inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-ink-900/55 to-transparent px-5 py-4 text-white sm:px-8'
            : 'sticky top-0 z-30 mx-auto flex max-w-6xl items-center justify-between bg-sand-100/80 px-5 py-4 backdrop-blur-xl dark:bg-[#0b1113]/80'
        }
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-sunset-500 via-teal-600 to-teal-900 text-white shadow-float">
            <MapPinned className="size-5" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none">YatraSense</span>
            <span className={isLanding ? 'text-[11px] text-white/70' : 'text-[11px] text-ink-400'}>
              The plan that adapts
            </span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button onClick={() => navigate('/arrive')}>Open app</Button>
          ) : (
            <>
              <Button
                variant="ghost"
                className={
                  isLanding
                    ? 'hidden text-white hover:bg-white/10 sm:inline-flex'
                    : 'hidden sm:inline-flex'
                }
                onClick={() => navigate('/plan')}
              >
                Plan a trip
              </Button>
              <Button
                variant="ghost"
                className={isLanding ? 'text-white hover:bg-white/10' : undefined}
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button
                className={isLanding ? 'bg-white text-ink-900 hover:bg-sand-100' : undefined}
                onClick={() => navigate('/login?mode=signup')}
              >
                Save trips
              </Button>
            </>
          )}
        </div>
      </header>
      <Outlet />
      <Toaster richColors position="top-center" />
    </div>
  )
}
