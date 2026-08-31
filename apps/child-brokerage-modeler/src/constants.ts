import { DEFAULT_CPI_RATE, DEFAULT_MARKET_RATE } from '../../../shared/growth'

export const DEFAULTS = {
  startingAge: 0,
  startingBalance: 0,
  marketRate: DEFAULT_MARKET_RATE,
  cpiRate: DEFAULT_CPI_RATE,
  contributionsInReal: false,
} as const

export const ANNUAL_DEFAULTS = {
  initialInvestment: 100_000,
  annualAddition: 25_000,
  years: 20,
  expectedReturn: DEFAULT_MARKET_RATE,
  expectedInflation: DEFAULT_CPI_RATE,
} as const

export const DEFAULT_CONTRIBUTIONS: { year: number; amount: number }[] = [
  { year: 0, amount: 5000 },
]

export const TARGET_AGES = [18, 21, 25, 50, 55, 60, 65] as const

export const MAX_AGE = 65

export type ProjectionMode = 'child' | 'annual'
