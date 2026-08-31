import { deflate, inflate, roundUsd } from '../../../shared/growth'
import {
  MAX_AGE,
  TARGET_AGES,
  DEFAULTS,
  DEFAULT_CONTRIBUTIONS,
  ANNUAL_DEFAULTS,
  type ProjectionMode,
} from './constants'

export type { ProjectionMode }

export type YearContribution = {
  year: number
  amount: number
}

export type ChildInputs = {
  mode: 'child'
  startingAge: number
  startingBalance: number
  contributions: YearContribution[]
  contributionsInReal: boolean
  marketRate: number
  cpiRate: number
}

export type AnnualInputs = {
  mode: 'annual'
  initialInvestment: number
  annualAddition: number
  years: number
  expectedReturn: number
  expectedInflation: number
}

export type CalculatorInputs = ChildInputs | AnnualInputs

export type ChildYearRow = {
  year: number
  age: number
  contribution: number
  contributionReal: number
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
  totalContributionsNominal: number
  totalContributionsReal: number
}

export type ChildResult = {
  mode: 'child'
  yearRows: ChildYearRow[]
  milestones: MilestoneRow[]
  totalContributions: number
}

export type AnnualYearRow = {
  year: number
  contribution: number
  contributionReal: number
  balance: number
  totalContributions: number
  earnings: number
  realValue: number
}

export type AnnualResult = {
  mode: 'annual'
  yearRows: AnnualYearRow[]
  finalBalance: number
  finalRealValue: number
  totalContributions: number
  totalEarnings: number
}

export type CalculatorResult = ChildResult | AnnualResult

function contributionMap(contributions: YearContribution[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const entry of contributions) {
    const year = Math.max(0, Math.round(entry.year))
    const amount = Math.max(0, entry.amount)
    map.set(year, (map.get(year) ?? 0) + amount)
  }
  return map
}

export function projectByYear(inputs: ChildInputs): ChildYearRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const startingBalance = Math.max(0, inputs.startingBalance)
  const contributions = contributionMap(inputs.contributions)
  const marketRate = inputs.marketRate
  const cpiRate = inputs.cpiRate
  const endYear = MAX_AGE - startingAge

  let accountBalance = startingBalance
  let principalBalance = 0
  const rows: ChildYearRow[] = []

  for (let year = 0; year <= endYear; year++) {
    const age = startingAge + year
    const entered = contributions.get(year) ?? 0
    const contribution = inputs.contributionsInReal
      ? inflate(entered, year, cpiRate)
      : entered
    const contributionReal = inputs.contributionsInReal
      ? entered
      : deflate(entered, year, cpiRate)

    accountBalance += contribution
    principalBalance += contribution

    accountBalance = roundUsd(accountBalance * (1 + marketRate))

    const earningsBalance = roundUsd(
      accountBalance - principalBalance - startingBalance,
    )
    const realValue = deflate(accountBalance, year, cpiRate)

    rows.push({
      year,
      age,
      contribution,
      contributionReal,
      accountBalance,
      principalBalance,
      earningsBalance,
      realValue,
    })
  }

  return rows
}

export function projectMilestones(
  inputs: ChildInputs,
  yearRows: ChildYearRow[],
): MilestoneRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))

  return TARGET_AGES.filter((age) => age >= startingAge).map((targetAge) => {
    const year = targetAge - startingAge
    const row = yearRows.find((r) => r.age === targetAge)
    const totalContributionsNominal = yearRows
      .filter((r) => r.year <= year)
      .reduce((sum, r) => sum + r.contribution, 0)
    const totalContributionsReal = yearRows
      .filter((r) => r.year <= year)
      .reduce((sum, r) => sum + r.contributionReal, 0)

    return {
      age: targetAge,
      year,
      nominal: row?.accountBalance ?? 0,
      real: row?.realValue ?? 0,
      totalContributionsNominal,
      totalContributionsReal,
    }
  })
}

export function calculateChild(inputs: ChildInputs): ChildResult {
  const yearRows = projectByYear(inputs)
  const totalContributions = yearRows.reduce((sum, r) => sum + r.contribution, 0)

  return {
    mode: 'child',
    yearRows,
    milestones: projectMilestones(inputs, yearRows),
    totalContributions,
  }
}

export function calculateAnnual(inputs: AnnualInputs): AnnualResult {
  const years = Math.max(0, Math.round(inputs.years))
  const initial = Math.max(0, inputs.initialInvestment)
  const annualAddition = Math.max(0, inputs.annualAddition)
  const returnRate = inputs.expectedReturn
  const inflationRate = inputs.expectedInflation

  const yearRows: AnnualYearRow[] = []
  let balance = initial
  let totalContributions = initial

  yearRows.push({
    year: 0,
    contribution: initial,
    contributionReal: initial,
    balance: roundUsd(balance),
    totalContributions: roundUsd(totalContributions),
    earnings: 0,
    realValue: roundUsd(balance),
  })

  for (let year = 1; year <= years; year++) {
    balance += annualAddition
    totalContributions += annualAddition
    balance = roundUsd(balance * (1 + returnRate))

    const earnings = roundUsd(balance - totalContributions)
    yearRows.push({
      year,
      contribution: annualAddition,
      contributionReal: deflate(annualAddition, year, inflationRate),
      balance,
      totalContributions: roundUsd(totalContributions),
      earnings,
      realValue: deflate(balance, year, inflationRate),
    })
  }

  const last = yearRows[yearRows.length - 1]

  return {
    mode: 'annual',
    yearRows,
    finalBalance: last?.balance ?? initial,
    finalRealValue: last?.realValue ?? initial,
    totalContributions: last?.totalContributions ?? initial,
    totalEarnings: last?.earnings ?? 0,
  }
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  return inputs.mode === 'annual' ? calculateAnnual(inputs) : calculateChild(inputs)
}

export function defaultChildInputs(): ChildInputs {
  return {
    mode: 'child',
    ...DEFAULTS,
    contributions: [...DEFAULT_CONTRIBUTIONS],
  }
}

export function defaultAnnualInputs(): AnnualInputs {
  return {
    mode: 'annual',
    ...ANNUAL_DEFAULTS,
  }
}

export function defaultInputs(): CalculatorInputs {
  return defaultChildInputs()
}
