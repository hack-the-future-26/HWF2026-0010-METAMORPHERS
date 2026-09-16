import { CloudRain, Sun, Cloud, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'

export function DemoPanel() {
  const open = useAppStore((s) => s.demoOpen)
  const setOpen = useAppStore((s) => s.setDemoOpen)
  const mode = useAppStore((s) => s.appMode)
  const setMode = useAppStore((s) => s.setAppMode)
  const store = useAppStore()

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true)
          setMode('demo')
        }}
        className="fixed bottom-24 right-4 z-40 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-float dark:bg-sunset-500 lg:bottom-6"
      >
        DEMO MODE
        <span className="ml-1 font-normal text-white/50">(simulation)</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 w-[min(100%-2rem,300px)] rounded-3xl bg-ink-900 p-4 text-white shadow-float dark:bg-ink-800 lg:bottom-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em]">
          <Radio className="size-3.5 text-sunset-400" /> {mode === 'demo' ? 'DEMO MODE' : 'LIVE MODE'}
        </p>
        <button onClick={() => setOpen(false)} className="text-xs text-white/60">
          Hide
        </button>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1.5">
        <button
          onClick={() => setMode('real')}
          className={`rounded-2xl px-3 py-2 text-xs ${mode === 'real' ? 'bg-teal-700' : 'bg-white/8'}`}
        >
          LIVE MODE
          <span className="mt-0.5 block text-[10px] text-white/60">Real data</span>
        </button>
        <button
          onClick={() => setMode('demo')}
          className={`rounded-2xl px-3 py-2 text-xs ${mode === 'demo' ? 'bg-sunset-500 text-ink-900' : 'bg-white/8'}`}
        >
          DEMO MODE
          <span className="mt-0.5 block text-[10px] opacity-70">Simulation controls</span>
        </button>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-white/60">
        These buttons run the same adaptation engine as live weather — they do not invent traffic or crowd percentages.
      </p>
      <div className="grid gap-1.5">
        <button
          onClick={() => {
            store.simulateNormalWeather()
            toast.message('Normal weather restored')
          }}
          className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-left text-xs hover:bg-white/12"
        >
          <Sun className="size-3.5 text-teal-300" /> Simulate: Normal Weather
        </button>
        <button
          onClick={() => {
            store.simulateRain()
            toast.success('Heavy rain — adaptation engine running')
          }}
          className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-left text-xs hover:bg-white/12"
        >
          <CloudRain className="size-3.5 text-teal-300" /> Simulate: Heavy Rain
        </button>
        <button
          onClick={() => {
            store.simulateHeat()
            toast.success('Extreme heat — adaptation engine running')
          }}
          className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-left text-xs hover:bg-white/12"
        >
          <Cloud className="size-3.5 text-teal-300" /> Simulate: Extreme Heat
        </button>
      </div>
      <Button
        size="sm"
        className="mt-3 w-full"
        variant="secondary"
        onClick={() => {
          store.resetTrip()
          toast.message('Trip cleared — pick any destination')
        }}
      >
        Reset trip
      </Button>
    </div>
  )
}
