import { useState } from 'react'
import { ArrowLeftRight, Copy, Languages, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TRANSLATE_LANGS, translateText, type TranslateLang } from '@/services/translateService'

const PHRASES = [
  'Where is the hotel?',
  'How much does this cost?',
  'Where is the railway station?',
  'I need help.',
  'Where is the restroom?',
  'Please take me here.',
  'Is vegetarian food available?',
  'Can I have the bill?',
]

export function TranslatePage() {
  const [from, setFrom] = useState<TranslateLang>('en')
  const [to, setTo] = useState<TranslateLang>('hi')
  const [input, setInput] = useState('Where is the hotel?')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (text = input) => {
    const q = text.trim()
    if (!q) return
    setBusy(true)
    try {
      const translated = await translateText(q, from, to)
      setOutput(translated)
    } catch {
      toast.error('Translation is unavailable right now. Try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  const speak = (text: string, lang: string) => {
    if (!text || !window.speechSynthesis) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sunset-600">Travel translator</p>
      <h1 className="mt-1 font-display text-4xl">Speak the city</h1>
      <p className="mt-2 text-sm text-ink-500">Live translation for Indian languages. Tap a phrase or type your own.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {PHRASES.map((p) => (
          <button
            key={p}
            onClick={() => {
              setInput(p)
              void run(p)
            }}
            className="rounded-full bg-white px-3 py-1.5 text-xs shadow-card ring-1 ring-sand-200 hover:bg-sand-50 dark:bg-ink-800 dark:ring-white/10"
          >
            {p}
          </button>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as TranslateLang)}
            className="h-10 rounded-full bg-sand-100 px-3 text-sm dark:bg-white/8"
          >
            {TRANSLATE_LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <button
            className="grid size-10 place-items-center rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200"
            onClick={() => {
              setFrom(to)
              setTo(from)
              setInput(output || input)
              setOutput(input)
            }}
            aria-label="Swap languages"
          >
            <ArrowLeftRight className="size-4" />
          </button>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as TranslateLang)}
            className="h-10 rounded-full bg-sand-100 px-3 text-sm dark:bg-white/8"
          >
            {TRANSLATE_LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="Type a sentence…"
          className="mt-4 w-full resize-none rounded-3xl bg-sand-100 p-4 text-sm outline-none ring-1 ring-transparent focus:ring-teal-600 dark:bg-white/5"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => void run()} disabled={busy || !input.trim()}>
            <Languages className="size-4" />
            {busy ? 'Translating…' : 'Translate'}
          </Button>
          <Button variant="ghost" onClick={() => speak(input, from)} disabled={!input}>
            <Volume2 className="size-4" /> Listen
          </Button>
        </div>
      </Card>

      {output && (
        <Card className="mt-4 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-400">Translation</p>
          <p className="mt-2 text-lg leading-relaxed">{output}</p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(output)
                toast.success('Copied')
              }}
            >
              <Copy className="size-4" /> Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => speak(output, to)}>
              <Volume2 className="size-4" /> Listen
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
