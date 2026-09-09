import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Bookmark,
  Compass,
  LayoutDashboard,
  MapPinned,
  Radio,
  Route,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const items = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/plan', label: 'Plan', icon: Sparkles },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/trip', label: 'My Trip', icon: Route },
  { to: '/live', label: 'Live', icon: Radio },
]

const extra = [
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:w-[248px] lg:shrink-0 lg:flex-col lg:gap-6 lg:border-r lg:border-sand-200 lg:bg-white/80 lg:px-4 lg:py-5 lg:dark:border-white/8 lg:dark:bg-ink-900/80">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid size-10 place-items-center rounded-2xl bg-teal-800 text-white shadow-float">
          <MapPinned className="size-5" />
        </div>
        <div>
          <p className="font-display text-lg leading-none">YatraSense</p>
          <p className="mt-1 text-[11px] text-ink-400">Travel intelligence</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <SideLink key={item.to} {...item} />
        ))}
        <p className="mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">More</p>
        {extra.map((item) => (
          <SideLink key={item.to} {...item} />
        ))}
      </nav>
      <div className="rounded-2xl bg-teal-50 p-3 text-xs text-teal-900 dark:bg-teal-950 dark:text-teal-200">
        Understand → Plan → Explore → Monitor → Adapt
      </div>
    </aside>
  )
}

function SideLink({ to, label, icon: Icon }: (typeof items)[number]) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition',
          isActive
            ? 'bg-teal-800 text-white shadow-card dark:bg-teal-600'
            : 'text-ink-700 hover:bg-sand-100 dark:text-sand-200 dark:hover:bg-white/5',
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  )
}

export function BottomNav() {
  const location = useLocation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px]',
                active ? 'text-teal-800 dark:text-teal-300' : 'text-ink-400',
              )}
            >
              <Icon className={cn('size-5', active && 'scale-110')} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function TopBar() {
  const navigate = useNavigate()
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length)
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const setNotificationsOpen = useAppStore((s) => s.setNotificationsOpen)
  const user = useAppStore((s) => s.user)
  const appMode = useAppStore((s) => s.appMode)
  const setAppMode = useAppStore((s) => s.setAppMode)
  const loc = useAppStore((s) => s.location)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-sand-200/80 bg-sand-100/80 px-4 py-3 backdrop-blur-xl dark:border-white/8 dark:bg-[#0b1113]/80 lg:px-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 lg:hidden">
        <span className="grid size-8 place-items-center rounded-xl bg-teal-800 text-white">
          <MapPinned className="size-4" />
        </span>
        <span className="font-display">YatraSense</span>
      </button>
      <div className="min-w-0 flex-1 truncate text-[11px] text-ink-500 lg:text-sm">
        {loc.loading
          ? 'Getting your location...'
          : loc.permission === 'granted' && loc.label
            ? `📍 You’re near ${loc.label}`
            : 'Your trip. Your preferences. One intelligent plan.'}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setAppMode(appMode === 'real' ? 'demo' : 'real')}
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide ${appMode === 'real' ? 'bg-teal-800 text-white' : 'bg-ink-900 text-sunset-400'}`}
        >
          {appMode === 'real' ? 'LIVE MODE' : 'DEMO MODE'}
        </button>
        <button
          onClick={toggleTheme}
          className="grid size-10 place-items-center rounded-full bg-white shadow-card dark:bg-ink-800"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setNotificationsOpen(true)}
          className="relative grid size-10 place-items-center rounded-full bg-white shadow-card dark:bg-ink-800"
          aria-label="Notifications"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10 19a2 2 0 0 0 4 0" />
          </svg>
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-sunset-500" />}
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="grid size-10 place-items-center rounded-full bg-teal-800 text-sm font-semibold text-white"
        >
          {user.name.slice(0, 1)}
        </button>
      </div>
    </header>
  )
}
