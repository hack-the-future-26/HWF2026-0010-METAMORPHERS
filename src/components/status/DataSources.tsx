import { useEffect, useState } from 'react'
import { backendHealth } from '@/services/backend'
import { useAppStore } from '@/store/useAppStore'
import { trafficProvider, crowdProvider } from '@/services/providers'

function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block size-2 rounded-full ${on ? 'bg-emerald-500' : 'bg-ink-300'}`} />
}

export function DataSources() {
  const [api, setApi] = useState<boolean | null>(null)
  const [ai, setAi] = useState<'connected' | 'unconfigured' | 'down'>('down')
  const weather = useAppStore((s) => s.conditions.weather)
  const liveRoute = useAppStore((s) => s.liveRoute)
  const gps = useAppStore((s) => s.location.permission === 'granted')
  const dest = useAppStore((s) => s.planner.destinationId || s.trip?.destinationId)

  useEffect(() => {
    void backendHealth()
      .then((h) => {
        setApi(true)
        setAi((h as { ai?: string }).ai === 'connected' ? 'connected' : 'unconfigured')
      })
      .catch(() => {
        setApi(false)
        setAi('down')
      })
  }, [])

  return (
    <section className="rounded-3xl bg-white p-5 shadow-card dark:bg-ink-800">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">Data sources</p>
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={gps} /> Location</span>
          <span className="text-ink-500">{gps ? 'GPS' : 'Not granted'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={Boolean(dest) && !weather.unavailable} /> Weather</span>
          <span className="text-ink-500">{weather.unavailable ? 'Unavailable' : 'Open-Meteo'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={Boolean(dest)} /> Places</span>
          <span className="text-ink-500">OpenStreetMap</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={liveRoute?.source === 'osrm'} /> Routing</span>
          <span className="text-ink-500">{liveRoute?.source === 'osrm' ? 'OSRM' : 'Unavailable'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={ai === 'connected'} /> AI</span>
          <span className="text-ink-500">{ai === 'connected' ? 'Connected' : ai === 'unconfigured' ? 'Not configured' : api === false ? 'Backend down' : 'Checking…'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={false} /> Traffic</span>
          <span className="text-ink-500">Unavailable</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><Dot on={false} /> Crowd</span>
          <span className="text-ink-500">Unavailable</span>
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-ink-400">
        Traffic: {trafficProvider.source}. Crowd: {crowdProvider.source}.
      </p>
    </section>
  )
}
