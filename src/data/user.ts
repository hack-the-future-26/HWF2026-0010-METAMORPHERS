import type { User } from '@/types'

export const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest',
  email: '',
  hometown: '',
  preferences: {
    styles: ['culture', 'food', 'history'],
    budgetTier: 'moderate',
    defaultBudget: 12000,
    transport: ['taxi', 'walking', 'public'],
    pace: 'balanced',
    language: 'English',
    notifications: true,
  },
}

export const DEFAULT_USER = GUEST_USER
