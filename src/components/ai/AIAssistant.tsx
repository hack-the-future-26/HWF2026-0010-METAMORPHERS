import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Sparkles, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { API } from '@/services/config'

const CHIPS = [
  'What should I do now?',
  'Find cheap food nearby.',
  'Can I fit another place today?',
  'Is it going to rain?',
  'How do I reach the hotel?',
  'Suggest something less crowded.',
  'Reduce my budget.',
  "I don't want to spend more than ₹500 today.",
]

export function AIAssistant() {
  const open = useAppStore((s) => s.aiOpen)
  const setOpen = useAppStore((s) => s.setAiOpen)
  const chat = useAppStore((s) => s.chat)
  const send = useAppStore((s) => s.sendChat)
  const online = useAppStore((s) => s.online)
  const [text, setText] = useState('')

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-sand-200 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-900"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="flex items-center gap-2 font-display text-lg">
                <Sparkles className="size-4 text-teal-700" /> YatraSense AI
              </p>
              <p className="text-xs text-ink-400">
                {API.aiUrl ? 'AI Planner (configured backend)' : 'Rule-based fallback — no AI API configured'}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {CHIPS.slice(0, 5).map((c) => (
              <button
                key={c}
                onClick={() => void send(c)}
                className="rounded-full bg-sand-100 px-3 py-1.5 text-[11px] dark:bg-white/8"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-2">
            {chat.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === 'user'
                    ? 'ml-8 rounded-2xl rounded-br-md bg-teal-800 px-3 py-2 text-sm text-white'
                    : 'mr-8 rounded-2xl rounded-bl-md bg-sand-100 px-3 py-2 text-sm dark:bg-white/8'
                }
              >
                {m.content}
              </div>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-sand-200 p-4 dark:border-white/10"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim() || !online) return
              void send(text.trim())
              setText('')
            }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={online ? 'Ask about your trip…' : 'Offline — AI paused'}
              disabled={!online}
            />
            <Button type="submit" size="icon" disabled={!online}>
              <Send className="size-4" />
            </Button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
