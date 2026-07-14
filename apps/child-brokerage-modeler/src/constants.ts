export const DEFAULTS = {
  startingAge: 0,
  startingBalance: 0,
  marketRate: 0.103,
  cpiRate: 0.032,
} as const

export const DEFAULT_CONTRIBUTIONS: { year: number; amount: number }[] = [
  { year: 0, amount: 5000 },
]

export const TARGET_AGES = [18, 21, 25, 50, 55, 60, 65] as const

export const MAX_AGE = 65
