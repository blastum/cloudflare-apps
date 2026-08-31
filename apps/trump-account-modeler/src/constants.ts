export type TaxBracket = {
  rate: number
  upTo: number | null
}

export const DEFAULTS = {
  birthYear: 2026,
  birthMonth: 1,
  fundingYear: 2026,
  cpiRate: 0.032,
  marketRate: 0.103,
} as const

export { DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT } from '../../../shared/growth'
export { MONTH_NAMES } from '../../../shared/money'

export const DEFAULT_CHILD_SPACING_MONTHS = 20

export const STANDARD_DEDUCTION_SINGLE_2026 = 16_100

/** 2026 single filer brackets (Rev. Proc. 2025-32); indexed by CPI from 2026. */
export const SINGLE_BRACKETS_2026: TaxBracket[] = [
  { rate: 0.1, upTo: 12_400 },
  { rate: 0.12, upTo: 50_400 },
  { rate: 0.22, upTo: 105_700 },
  { rate: 0.24, upTo: 201_775 },
  { rate: 0.32, upTo: 256_225 },
  { rate: 0.35, upTo: 640_600 },
  { rate: 0.37, upTo: null },
]

export const IRA_TARGET_AGES = [50, 55, 60, 65, 67] as const
export const PROJECTION_AGE_67 = 67
