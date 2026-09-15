import { describe, expect, it } from 'vitest'
import { estimateTripBudget, isOverBudget, optimizeActivitiesForBudget, overBudgetBy } from './budgetEstimate'
import type { Trip } from '@/types'

function trip(budget: number, costs: number[]): Trip {
  return {
    id: 't',
    title: 'Budget test',
    destinationId: 'hyderabad',
    startDate: '2026-09-14',
    endDate: '2026-09-15',
    days: 2,
    travelers: { adults: 1, children: 0, seniors: 0 },
    styles: ['culture'],
    budget,
    budgetTier: 'budget',
    pace: 'balanced',
    transport: ['taxi'],
    daysPlan: [
      {
        index: 0,
        date: '2026-09-14',
        title: 'Day 1',
        theme: 'City',
        activities: [
          ...costs.map((cost, i) => ({
            id: `p${i}`,
            dayIndex: 0,
            start: '10:00 AM',
            end: '11:00 AM',
            kind: 'place' as const,
            title: `Stop ${i}`,
            cost,
            travelFromPrevMin: 10,
            travelFromPrevKm: 2,
            transport: 'taxi' as const,
          })),
          {
            id: 'm1',
            dayIndex: 0,
            start: '1:00 PM',
            end: '2:00 PM',
            kind: 'meal' as const,
            title: 'Lunch',
            cost: 0,
            travelFromPrevMin: 8,
            travelFromPrevKm: 1,
            transport: 'taxi' as const,
          },
        ],
      },
    ],
    status: 'planned',
    matchScore: 0,
    route: { totalTravelMin: 18, totalDistanceKm: 3, optimized: false },
    createdAt: '',
    estimatedSpend: costs.reduce((s, n) => s + n, 0),
    placeCount: costs.length,
  }
}

describe('budget', () => {
  it('is under budget when the mid estimate is below the cap', () => {
    const t = trip(80_000, [0, 0])
    const est = estimateTripBudget(t)
    expect(isOverBudget(est, t.budget)).toBe(false)
    expect(est.mid).toBeGreaterThan(0)
  })

  it('flags over-budget plans', () => {
    const t = trip(500, [2000, 1500])
    const est = estimateTripBudget(t)
    expect(isOverBudget(est, t.budget)).toBe(true)
    expect(overBudgetBy(est, t.budget)).toBeGreaterThan(0)
  })

  it('optimizer drops expensive activities', () => {
    const t = trip(3000, [2500, 40])
    const { trip: next, wins } = optimizeActivitiesForBudget(t)
    expect(wins.length).toBeGreaterThan(0)
    expect(next.daysPlan[0].activities.some((a) => a.title === 'Stop 0')).toBe(false)
  })
})
