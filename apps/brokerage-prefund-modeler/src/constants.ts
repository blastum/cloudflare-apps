import { DEFAULT_CPI_RATE, DEFAULT_MARKET_RATE } from '../../../shared/growth'

export const DEFAULTS = {
  childCount: 1,
  childSpacingYears: 2,
  fundingYear: 0,
  targetRealAtAge21: 200_000,
  cpiRate: DEFAULT_CPI_RATE,
  marketRate: DEFAULT_MARKET_RATE,
} as const

export const TARGET_AGE = 21
