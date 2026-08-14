export const CONTRIBUTION_START_YEAR = 2026
export const CAP_INDEX_START_YEAR = 2028
export const SEED_BIRTH_YEARS = { min: 2025, max: 2028 } as const
export const SEED_AMOUNT = 1000
export const BASE_CAP = 5000
export const REAL_DOLLAR_BASE_YEAR = 2026
export const TAX_BASE_YEAR = 2026

export function floorTo100(amount: number): number {
  return Math.floor(amount / 100) * 100
}

/** Statutory private contribution cap for calendar year Y (§530A). */
export function privateCap(year: number, cpiRate: number): number {
  if (year < CONTRIBUTION_START_YEAR) return 0
  if (year <= 2027) return BASE_CAP
  return floorTo100(BASE_CAP * (1 + cpiRate) ** (year - 2027))
}

export function seedEligible(birthYear: number): boolean {
  return birthYear >= SEED_BIRTH_YEARS.min && birthYear <= SEED_BIRTH_YEARS.max
}

export function firstContributionYear(birthYear: number): number {
  return Math.max(CONTRIBUTION_START_YEAR, birthYear)
}

export function lastContributionYear(birthYear: number): number {
  return birthYear + 17
}

export function seedYear(birthYear: number): number {
  return firstContributionYear(birthYear)
}

export function conversionYear(birthYear: number): number {
  return birthYear + 18
}

export function ageAtYearEnd(birthYear: number, calendarYear: number): number {
  return calendarYear - birthYear
}
