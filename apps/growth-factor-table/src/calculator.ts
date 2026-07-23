import {
  CONTRIBUTION_END_YEAR,
  DEFAULTS,
  MAX_YEARS,
  TARGET_AGES,
} from './constants'

export type CalculatorInputs = {
  marketRate: number
  cpiRate: number
}

export type YearFactor = {
  years: number
  nominalFactor: number
  realFactor: number
}

export type MilestoneFactor = {
  age: number
  nominalFactor: number
  realFactor: number
}

export type ContributionGrowthRow = {
  year: number
  remainingYears: number
  realFactor: number
}

export type CalculatorResult = {
  yearSeries: YearFactor[]
  milestones: MilestoneFactor[]
  contributionGrowth: ContributionGrowthRow[]
  realAnnualFactor: number
}

export function nominalFactor(years: number, marketRate: number): number {
  if (years <= 0) return 1
  return (1 + marketRate) ** years
}

export function realFactor(
  years: number,
  marketRate: number,
  cpiRate: number,
): number {
  if (years <= 0) return 1
  return nominalFactor(years, marketRate) / nominalFactor(years, cpiRate)
}

export function realAnnualFactor(marketRate: number, cpiRate: number): number {
  return (1 + marketRate) / (1 + cpiRate)
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const yearSeries: YearFactor[] = []
  for (let years = 0; years <= MAX_YEARS; years++) {
    yearSeries.push({
      years,
      nominalFactor: nominalFactor(years, inputs.marketRate),
      realFactor: realFactor(years, inputs.marketRate, inputs.cpiRate),
    })
  }

  const milestones = TARGET_AGES.map((age) => ({
    age,
    nominalFactor: nominalFactor(age, inputs.marketRate),
    realFactor: realFactor(age, inputs.marketRate, inputs.cpiRate),
  }))

  const contributionGrowth = Array.from(
    { length: CONTRIBUTION_END_YEAR + 1 },
    (_, year) => {
      const remainingYears = MAX_YEARS - year
      return {
        year,
        remainingYears,
        realFactor: realFactor(
          remainingYears,
          inputs.marketRate,
          inputs.cpiRate,
        ),
      }
    },
  )

  return {
    yearSeries,
    milestones,
    contributionGrowth,
    realAnnualFactor: realAnnualFactor(inputs.marketRate, inputs.cpiRate),
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
