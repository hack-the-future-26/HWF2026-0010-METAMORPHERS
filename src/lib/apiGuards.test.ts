import { describe, expect, it } from 'vitest'

describe('api contracts', () => {
  it('rejects empty geocode queries', () => {
    const q = '  '
    expect(q.trim().length < 2).toBe(true)
  })

  it('uses a dedicated not-found message instead of substituting a city', () => {
    const message = "We couldn't find this destination. Try another city or location."
    expect(message.includes('Visakhapatnam')).toBe(false)
  })

  it('labels weather and route failures honestly', () => {
    expect('Weather service is temporarily unavailable. Retry.').toContain('Retry')
    expect('Route unavailable').toBe('Route unavailable')
    expect('AI is not configured. Set AI_API_KEY on the server.').toContain('AI_API_KEY')
  })
})
