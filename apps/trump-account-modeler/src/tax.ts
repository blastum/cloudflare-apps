import {
  SINGLE_BRACKETS_2026,
  STANDARD_DEDUCTION_SINGLE_2026,
  type TaxBracket,
} from './constants'

export function roundUsd(amount: number): number {
  return Math.round(amount)
}

export function inflateByCpi(
  baseAmount: number,
  years: number,
  cpiRate: number,
): number {
  if (years <= 0 || cpiRate === 0) return roundUsd(baseAmount)
  return roundUsd(baseAmount * (1 + cpiRate) ** years)
}

export function inflatedSingleBrackets(
  years: number,
  cpiRate: number,
): TaxBracket[] {
  return SINGLE_BRACKETS_2026.map((bracket) => ({
    rate: bracket.rate,
    upTo:
      bracket.upTo === null
        ? null
        : inflateByCpi(bracket.upTo, years, cpiRate),
  }))
}

export function progressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  let prevLimit = 0

  for (const bracket of brackets) {
    const limit = bracket.upTo ?? Infinity
    const width = Math.min(taxableIncome, limit) - prevLimit
    if (width <= 0) break
    tax += width * bracket.rate
    prevLimit = limit
    if (taxableIncome <= limit) break
  }

  return roundUsd(tax)
}

export function taxableIncomeFromGross(
  grossIncome: number,
  yearsFromStart: number,
  cpiRate: number,
): number {
  const standardDeduction = inflateByCpi(
    STANDARD_DEDUCTION_SINGLE_2026,
    yearsFromStart,
    cpiRate,
  )
  return Math.max(0, grossIncome - standardDeduction)
}

/** Marginal rate on the last dollar of taxable income. */
export function marginalRateOnTaxable(
  taxableIncome: number,
  brackets: TaxBracket[],
): number {
  if (taxableIncome <= 0) return 0

  for (const bracket of brackets) {
    const limit = bracket.upTo ?? Infinity
    if (taxableIncome <= limit) return bracket.rate
  }

  return brackets[brackets.length - 1]?.rate ?? 0
}

/** Highest marginal bracket reached by conversion gross income (indexed brackets). */
export function maxMarginalRateForGross(
  grossIncome: number,
  yearsFromStart: number,
  cpiRate: number,
): number {
  const taxable = taxableIncomeFromGross(grossIncome, yearsFromStart, cpiRate)
  return marginalRateOnTaxable(
    taxable,
    inflatedSingleBrackets(yearsFromStart, cpiRate),
  )
}

/**
 * Federal income tax for single filer with only conversion income.
 * 2026 brackets and standard deduction, indexed by CPI from projection start.
 */
export function federalTaxSingle(
  grossIncome: number,
  yearsFromStart: number,
  cpiRate: number,
): number {
  const standardDeduction = inflateByCpi(
    STANDARD_DEDUCTION_SINGLE_2026,
    yearsFromStart,
    cpiRate,
  )
  const taxable = Math.max(0, grossIncome - standardDeduction)
  return progressiveTax(taxable, inflatedSingleBrackets(yearsFromStart, cpiRate))
}
