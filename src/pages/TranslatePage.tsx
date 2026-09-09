import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'te', label: 'Telugu' },
  { id: 'hi', label: 'Hindi' },
] as const

const PHRASES: { en: string; te: string; hi: string }[] = [
  { en: 'Where is the hotel?', te: '\u0C39\u0C4B\u0C1F\u0C32\u0C4D \u0C0E\u0C15\u0C4D\u0C15\u0C21 \u0C09\u0C02\u0C26\u0C3F?', hi: '\u0939\u094B\u091F\u0932 \u0915\u0939\u093E\u0901 \u0939\u0948?' },
  { en: 'How much does this cost?', te: '\u0C07\u0C26\u0C3F \u0C0E\u0C02\u0C24?', hi: '\u0907\u0938\u0915\u0940 \u0915\u0940\u092E\u0924 \u0915\u094D\u092F\u093E \u0939\u0948?' },
  { en: 'Where is the railway station?', te: '\u0C30\u0C48\u0C32\u0C4D\u0C35\u0C47 \u0C38\u0C4D\u0C1F\u0C47\u0C37\u0C28\u0C4D \u0C0E\u0C15\u0C4D\u0C15\u0C21 \u0C09\u0C02\u0C26\u0C3F?', hi: '\u0930\u0947\u0932\u0935\u0947 \u0938\u094D\u091F\u0947\u0936\u0928 \u0915\u0939\u093E\u0901 \u0939\u0948?' },
  { en: 'I need help.', te: '\u0C28\u0C3E\u0C15\u0C41 \u0C38\u0C39\u0C3E\u0C2F\u0C02 \u0C15\u0C3E\u0C35\u0C3E\u0C32\u0C3F.', hi: '\u092E\u0941\u091D\u0947 \u092E\u0926\u0926 \u091A\u093E\u0939\u093F\u090F\u0964' },
  { en: 'Where is the restroom?', te: '\u0C35\u0C3F\u0C36\u0C4D\u0C30\u0C3E\u0C02\u0C24\u0C3F \u0C17\u0C26\u0C3F \u0C0E\u0C15\u0C4D\u0C15\u0C21 \u0C09\u0C02\u0C26\u0C3F?', hi: '\u0936\u094C\u091A\u093E\u0932\u092F \u0915\u0939\u093E\u0901 \u0939\u0948?' },
  { en: 'Please take me here.', te: '\u0C26\u0C2F\u0C1A\u0C47\u0C38\u0C3F \u0C28\u0C28\u0C4D\u0C28\u0C41 \u0C07\u0C15\u0C4D\u0C15\u0C21\u0C3F\u0C15\u0C3F \u0C24\u0C40\u0C38\u0C41\u0C15\u0C46\u0C33\u0C4D\u0C33\u0C02\u0C21\u0C3F.', hi: '\u0915\u0943\u092A\u092F\u093E \u092E\u0941\u091D\u0947 \u092F\u0939\u093E\u0901 \u0932\u0947 \u091A\u0932\u093F\u090F\u0964' },
]

export function TranslatePage() {
  const [lang, setLang] = useState<(typeof LANGS)[number]['id']>('te')

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Travel phrases</h1>
      <p className="mt-2 text-sm text-ink-500">Need help communicating?</p>
      <div className="mt-5 flex gap-2">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            className={`rounded-full px-4 py-2 text-sm ${lang === l.id ? 'bg-teal-800 text-white' : 'bg-white dark:bg-ink-800'}`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {PHRASES.map((p) => {
          const text = p[lang]
          return (
            <div
              key={p.en}
              className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4 shadow-card dark:bg-ink-800"
            >
              <div>
                <p className="text-xs text-ink-400">{p.en}</p>
                <p className="mt-1 font-medium">{text}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(text)
                  toast.success('Copied')
                }}
              >
                Copy
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
