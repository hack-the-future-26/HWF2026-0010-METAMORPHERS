import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Sparkles, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const CHIPS = [
  'I just landed. What do I do first?',
  'I am lost.',
  'I am hungry.',
  'How do I get a SIM?',
  'Airport to hotel safely?',
  'Is it going to rain?',
  'Where should a first-timer stay?',
]

export function AIAssistant() {
  const open = useAppStore((s) => s.aiOpen)
  const setOpen = useAppStore((s) => s.setAiOpen)
  const chat = useAppStore((s) => s.chat)
  const send = useAppStore((s) => s.sendChat)
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, open])

  const ask = async (q: string) => {
    const next = q.trim()
    if (!next || pending) return
    setPending(true)
    try {
      await send(next)
    } finally {
      setPending(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-sand-200 bg-white shadow-2xl dark:border-white/10 dark:bg-ink-900"
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-800 to-ink-900 px-5 py-4 text-white">
            <div>
              <p className="flex items-center gap-2 font-display text-lg">
                <Sparkles className="size-4" /> YatraSense AI
              </p>
              <p className="text-xs text-white/70">Ask anything about your trip or city</p>
            </div>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 px-5 py-3">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => void ask(c)}
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
                    : 'mr-8 rounded-2xl rounded-bl-md bg-sand-100 px-3 py-2 text-sm leading-relaxed dark:bg-white/8'
                }
              >
                {m.content}
              </div>
            ))}
            {pending && <p className="text-xs text-ink-400">Thinking…</p>}
            <div ref={end} />
          </div>
          <form
            className="flex gap-2 border-t border-sand-200 p-4 dark:border-white/10"
            onSubmit={(e) => {
              e.preventDefault()
              const q = text
              setText('')
              void ask(q)
            }}
          >
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask any travel question…" />
            <Button type="submit" size="icon" disabled={pending}>
              <Send className="size-4" />
            </Button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
