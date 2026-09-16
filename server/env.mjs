import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Load `.env` into process.env without overriding already-set values. Never log secrets. */
export function loadEnv() {
  const file = join(root, '.env')
  if (!existsSync(file)) return
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value
  }
}

export function corsOrigins() {
  const raw = process.env.FRONTEND_ORIGIN || process.env.CORS_ORIGIN || ''
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!list.length) return true
  return list
}
