export interface Bill {
  id: string
  name: string
  category: string
  amount: number
  cadence: 'monthly'
  betterDealAvailable: boolean
  betterDealAmount?: number
}

// Mock recurring-bill catalog for the Finance Agent demo — not a real merchant integration.
export const FINANCE_CATALOG: Bill[] = [
  { id: 'netflix', name: 'Netflix',         category: 'Subscriptions', amount: 15.99, cadence: 'monthly', betterDealAvailable: false },
  { id: 'spotify', name: 'Spotify',         category: 'Subscriptions', amount: 11.99, cadence: 'monthly', betterDealAvailable: true, betterDealAmount: 9.99 },
  { id: 'aws',     name: 'AWS Hosting',     category: 'Software',      amount: 42.00, cadence: 'monthly', betterDealAvailable: false },
  { id: 'notion',  name: 'Notion',          category: 'Software',      amount: 8.00,  cadence: 'monthly', betterDealAvailable: false },
  { id: 'gym',     name: 'Gym Membership',  category: 'Personal',      amount: 29.99, cadence: 'monthly', betterDealAvailable: true, betterDealAmount: 19.99 },
  { id: 'phone',   name: 'Phone Plan',      category: 'Utilities',     amount: 45.00, cadence: 'monthly', betterDealAvailable: false },
]
