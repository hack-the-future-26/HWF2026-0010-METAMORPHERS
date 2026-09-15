import { DESTINATION_NOT_FOUND } from '@/lib/osmCopy'
import { geocodingService } from './live'

export { geocodingService }

export async function searchDestination(query: string) {
  const q = query.trim()
  if (q.length < 2) return { status: 'empty' as const, results: [], error: null }
  try {
    const results = await geocodingService.search(q)
    if (!results.length) return { status: 'empty' as const, results: [], error: DESTINATION_NOT_FOUND }
    return { status: 'success' as const, results, error: null }
  } catch {
    return { status: 'error' as const, results: [], error: 'Location search is temporarily unavailable. Retry.' }
  }
}
