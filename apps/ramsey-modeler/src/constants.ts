export const DEFAULTS = {
  totalDebt: 30_000,
  monthlyBudget: 800,
  minPaymentPercent: 2,
  minApr: 5,
  maxApr: 29,
  trials: 100,
} as const

export const MIN_DEBT_BALANCE = 100
export const MIN_PAYMENT_FLOOR = 25
export const MIN_DEBT_COUNT = 4
export const MAX_DEBT_COUNT = 8
export const MAX_MONTHS = 600
export const MIN_TRIALS = 10
export const MAX_TRIALS = 1000
export const SAMPLE_TRIAL_COUNT = 5
