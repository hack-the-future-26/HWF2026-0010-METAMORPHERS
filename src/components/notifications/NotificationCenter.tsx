import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'

const icon: Record<string, string> = {
  weather: '🌧️',
  traffic: '🚦',
  crowd: '👥',
  closure: '🎟️',
  budget: '💰',
  info: '✨',
  late: '🕐',
  battery: '🔋',
  offline: '📡',
}

export function NotificationCenter() {
  const open = useAppStore((s) => s.notificationsOpen)
  const setOpen = useAppStore((s) => s.setNotificationsOpen)
  const notes = useAppStore((s) => s.notifications)
  const mark = useAppStore((s) => s.markNotificationsRead)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute right-3 top-16 w-[min(100%-1.5rem,380px)] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-ink-800"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-display">Notifications</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={mark}>
                  Mark read
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
              {notes.length === 0 && <p className="p-6 text-center text-sm text-ink-400">You’re all caught up.</p>}
              {notes.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-2xl px-3 py-3 text-sm ${n.read ? 'bg-sand-50 dark:bg-white/5' : 'bg-teal-50 dark:bg-teal-950'}`}
                >
                  <p className="font-medium">
                    {icon[n.kind]} {n.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">{n.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
