import { MAX_AGE, TARGET_AGES, DEFAULTS, DEFAULT_CONTRIBUTIONS } from './constants'

export type YearContribution = {
  year: number
  amount: number
}

export type CalculatorInputs = {
  startingAge: number
  startingBalance: number
  contributions: YearContribution[]
  marketRate: number
  cpiRate: number
}

export type YearRow = {
  year: number
  age: number
  contribution: number
  accountBalance: number
  principalBalance: number
  earningsBalance: number
  realValue: number
}

export type MilestoneRow = {
  age: number
  year: number
  nominal: number
  real: number
  totalContributions: number
}

export type CalculatorResult = {
  yearRows: YearRow[]
  milestones: MilestoneRow[]
  totalContributions: number
}

function roundUsd(amount: number): number {
  return Math.round(amount)
}

function deflateToStart(nominal: number, cpiRate: number, years: number): number {
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + cpiRate) ** years)
}

function contributionMap(contributions: YearContribution[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const entry of contributions) {
    const year = Math.max(0, Math.round(entry.year))
    const amount = Math.max(0, entry.amount)
    map.set(year, (map.get(year) ?? 0) + amount)
  }
  return map
}

export function projectByYear(inputs: CalculatorInputs): YearRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const startingBalance = Math.max(0, inputs.startingBalance)
  const contributions = contributionMap(inputs.contributions)
  const marketRate = inputs.marketRate
  const cpiRate = inputs.cpiRate
  const endYear = MAX_AGE - startingAge

  let accountBalance = startingBalance
  let principalBalance = 0
  const rows: YearRow[] = []

  for (let year = 0; year <= endYear; year++) {
    const age = startingAge + year
    const contribution = contributions.get(year) ?? 0

    accountBalance += contribution
    principalBalance += contribution

    accountBalance = roundUsd(accountBalance * (1 + marketRate))

    const earningsBalance = roundUsd(
      accountBalance - principalBalance - startingBalance,
    )
    const realValue = deflateToStart(accountBalance, cpiRate, year)

    rows.push({
      year,
      age,
      contribution,
      accountBalance,
      principalBalance,
      earningsBalance,
      realValue,
    })
  }

  return rows
}

export function projectMilestones(
  inputs: CalculatorInputs,
  yearRows: YearRow[],
): MilestoneRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))

  return TARGET_AGES.filter((age) => age >= startingAge).map((targetAge) => {
    const year = targetAge - startingAge
    const row = yearRows.find((r) => r.age === targetAge)
    const totalContributions = yearRows
      .filter((r) => r.year <= year)
      .reduce((sum, r) => sum + r.contribution, 0)

    return {
      age: targetAge,
      year,
      nominal: row?.accountBalance ?? 0,
      real: row?.realValue ?? 0,
      totalContributions,
    }
  })
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const yearRows = projectByYear(inputs)
  const totalContributions = inputs.contributions.reduce(
    (sum, c) => sum + Math.max(0, c.amount),
    0,
  )

  return {
    yearRows,
    milestones: projectMilestones(inputs, yearRows),
    totalContributions,
  }
}

export function defaultInputs(): CalculatorInputs {
  return {
    ...DEFAULTS,
    contributions: [...DEFAULT_CONTRIBUTIONS],
  }
}
