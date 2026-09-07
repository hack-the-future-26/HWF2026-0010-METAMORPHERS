const PREFIX = 'yatrasense-cache-v1:'

interface Envelope<T> {
  at: number
  value: T
}

export function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Envelope<T>
    if (Date.now() - parsed.at > maxAgeMs) return null
    return parsed.value
  } catch {
    return null
  }
}

export function cacheSet<T>(key: string, value: T) {
  try {
    const payload: Envelope<T> = { at: Date.now(), value }
    localStorage.setItem(PREFIX + key, JSON.stringify(payload))
  } catch {
    /* quota / private mode */
  }
}

export function cachePeek<T>(key: string): { value: T; at: number } | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Envelope<T>
    return parsed
  } catch {
    return null
  }
}
