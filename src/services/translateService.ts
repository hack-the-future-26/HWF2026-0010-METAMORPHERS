import { API } from './config'

export const TRANSLATE_LANGS = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'Hindi' },
  { id: 'te', label: 'Telugu' },
  { id: 'ta', label: 'Tamil' },
  { id: 'kn', label: 'Kannada' },
  { id: 'ml', label: 'Malayalam' },
  { id: 'mr', label: 'Marathi' },
  { id: 'bn', label: 'Bengali' },
  { id: 'gu', label: 'Gujarati' },
  { id: 'pa', label: 'Punjabi' },
  { id: 'ur', label: 'Urdu' },
] as const

export type TranslateLang = (typeof TRANSLATE_LANGS)[number]['id']

async function fromMyMemory(text: string, from: string, to: string) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${from}|${to}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('mymemory')
  const data = (await res.json()) as { responseStatus?: number; responseData?: { translatedText?: string } }
  const out = data.responseData?.translatedText?.trim()
  if (!out || data.responseStatus !== 200) throw new Error('mymemory')
  if (/MYMEMORY WARNING/i.test(out)) return out.replace(/MYMEMORY WARNING:.*/i, '').trim()
  return out
}

async function fromLingva(text: string, from: string, to: string) {
  const url = `https://lingva.ml/api/v1/${from}/${to}/${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('lingva')
  const data = (await res.json()) as { translation?: string }
  const out = data.translation?.trim()
  if (!out) throw new Error('lingva')
  return out
}

export async function translateText(text: string, from: TranslateLang, to: TranslateLang): Promise<string> {
  const q = text.trim()
  if (!q) return ''
  if (from === to) return q
  if (API.translateUrl) {
    try {
      const res = await fetch(API.translateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, source: from, target: to, format: 'text' }),
      })
      if (res.ok) {
        const data = (await res.json()) as { translatedText?: string; translation?: string }
        const out = (data.translatedText || data.translation || '').trim()
        if (out) return out
      }
    } catch {
      /* fall through */
    }
  }
  try {
    return await fromMyMemory(q, from, to)
  } catch {
    return fromLingva(q, from, to)
  }
}
