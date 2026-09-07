import type { User } from '@/types'

export const DEFAULT_USER: User = {
  id: 'user_pravallika',
  name: 'Pravallika',
  email: 'pravallika@yatrasense.app',
  hometown: 'Hyderabad',
  preferences: {
    styles: ['nature', 'food', 'beaches'],
    budgetTier: 'moderate',
    defaultBudget: 5000,
    transport: ['taxi', 'walking', 'public'],
    pace: 'balanced',
    language: 'English',
    notifications: true,
  },
}
