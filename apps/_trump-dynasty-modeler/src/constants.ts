export const MAX_ANNUAL_CONTRIBUTION = 5000
export const CONTRIBUTION_YEARS = 18

export const DEFAULTS = {
  initialDeposit: 110_000,
  yearsBeforeFirstBirth: 0,
  marketRate: 0.103,
  cpiRate: 0.032,
  generationalGap: 25,
  childrenPerGeneration: 1,
  childSpacing: 2,
  maxGenerations: 5,
} as const

export const SLIDER_LIMITS = {
  generationalGap: { min: 18, max: 40 },
  childrenPerGeneration: { min: 1, max: 6 },
  childSpacing: { min: 1, max: 8 },
  maxGenerations: { min: 1, max: 12 },
  yearsBeforeFirstBirth: { min: 0, max: 40 },
} as const
