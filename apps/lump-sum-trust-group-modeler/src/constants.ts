import type { SolveMode } from './calculator'
import { DEFAULT_CPI_RATE, DEFAULT_MARKET_RATE } from '../../../shared/growth'

export const DEFAULTS = {
  /** Spacing after previous child adds (months); first child is always birth month 0. */
  spacingMonths: [0, 21, 16, 36],
  solveMode: 'initial' as SolveMode,
  lumpSum: 1_000_000,
  targetMaturityValue: 500_000,
  fundingMonth: 0,
  payoutAge: 25,
  cpiRate: DEFAULT_CPI_RATE,
  marketRate: DEFAULT_MARKET_RATE,
} as const
