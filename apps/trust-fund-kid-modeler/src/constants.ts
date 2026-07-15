export const DEFAULTS = {
  startingAge: 0,
  cpiRate: 0.03,
  marketRate: 0.1,
  brokerageRealTarget: 70_000,
  trumpRealAnnual: 5_000,
  giftRealAnnual: 35_000,
  trumpSeed: 1_000,
} as const

export const END_AGE = 18
export const LAST_TRUMP_AGE = 17
export const MAX_AGE = 67

/** Ages at which trump and brokerage balances are shown after the annual detail through 18. */
export const BALANCE_AGES = [18, 21, 25, 55, 60, 65, 67] as const
