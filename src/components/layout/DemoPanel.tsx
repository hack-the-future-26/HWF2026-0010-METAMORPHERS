import { CloudRain, Gauge, Radio, WifiOff, BatteryLow, Clock, Users, DoorClosed } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'

const actions = [
  { id: 'rain', label: 'Simulate Rain · Test Adaptation', icon: CloudRain, run: 'simulateRain' as const },
  { id: 'traffic', label: 'Traffic spike', icon: Gauge, run: 'simulateTraffic' as const },
  { id: 'crowd', label: 'Crowd increase', icon: Users, run: 'simulateCrowd' as const },
  { id: 'close', label: 'Place closure', icon: DoorClosed, run: 'simulateClosure' as const },
  { id: 'late', label: 'Running late', icon: Clock, run: 'simulateLate' as const },
  { id: 'battery', label: 'Low battery', icon: BatteryLow, run: 'simulateBattery' as const },
  { id: 'offline', label: 'Go offline', icon: WifiOff, run: 'simulateOffline' as const },
]

export function DemoPanel() {
  const open = useAppStore((s) => s.demoOpen)
  const setOpen = useAppStore((s) => s.setDemoOpen)
  const store = useAppStore()
  const online = useAppStore((s) => s.online)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-float dark:bg-sunset-500 lg:bottom-6"
      >
        JURY DEMO
        <span className="ml-1 font-normal text-white/50">(test only)</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 w-[min(100%-2rem,280px)] rounded-3xl bg-ink-900 p-4 text-white shadow-float dark:bg-ink-800 lg:bottom-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em]">
          <Radio className="size-3.5 text-sunset-400" /> JURY DEMO
        </p>
        <button onClick={() => setOpen(false)} className="text-xs text-white/60">
          Hide
        </button>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-white/60">
        Jury / test controls. Simulate Rain uses the same adaptation engine as live weather. Other actions are simulated — not live traffic or crowd APIs.
      </p>
      <div className="grid gap-1.5">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.id}
              onClick={() => store[a.run]()}
              className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-left text-xs hover:bg-white/12"
            >
              <Icon className="size-3.5 text-teal-300" />
              {a.label}
            </button>
          )
        })}
      </div>
      {!online && (
        <Button size="sm" className="mt-3 w-full" onClick={() => store.setOnline(true)}>
          Restore connection
        </Button>
      )}
    </div>
  )
}
