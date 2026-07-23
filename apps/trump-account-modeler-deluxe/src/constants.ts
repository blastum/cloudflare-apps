export const DEFAULTS = {
  startingAge: 0,
  startingBalance: 1000,
  annualContribution: 5000,
  contributionInflationIndexed: true,
  enablePrefund: true,
  cpiRate: 0.032,
  marketRate: 0.103,
} as const

export const MAX_ANNUAL_CONTRIBUTION = 5000
export const CONTRIBUTION_YEARS = 18
export const GROWTH_END_AGE = 18

export const IRA_TARGET_AGES = [50, 55, 60, 65, 67] as const
