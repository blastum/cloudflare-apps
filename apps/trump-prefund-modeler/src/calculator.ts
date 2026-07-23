import {
  CONTRIBUTION_YEARS,
  DEFAULTS,
  MAX_ANNUAL_CONTRIBUTION,
} from './constants'
import { deflateToStart, inflateByCpi, roundUsd } from './money'

export type CalculatorInputs = {
  childCount: number
  childSpacingYears: number
  yearsBeforeFirstBirth: number
  contributionInflationIndexed: boolean
  cpiRate: number
  marketRate: number
}

export type ChildSummary = {
  childNumber: number
  birthYear: number
  standalonePrefundAtBirth: number
  prefundPresentValue: number
  totalContributions: number
}

export type FundingYearRow = {
  modelYear: number
  withdrawal: number
  withdrawalReal: number
  fundingBalance: number
  fundingBalanceReal: number
  activeChildren: string
}

export type CalculatorResult = {
  requiredPrefund: number
  requiredPrefundReal: number
  standaloneSingleChildPrefund: number
  children: ChildSummary[]
  fundingRows: FundingYearRow[]
  lastModelYear: number
  totalContributionsAllChildren: number
}

/** 18-year contribution schedule indexed from a child's birth (age 0 .. 17). */
export function childContributionSchedule(
  inputs: CalculatorInputs,
): number[] {
  const amounts: number[] = []
  for (let age = 0; age < CONTRIBUTION_YEARS; age++) {
    const base = inputs.contributionInflationIndexed
      ? inflateByCpi(MAX_ANNUAL_CONTRIBUTION, age, inputs.cpiRate)
      : MAX_ANNUAL_CONTRIBUTION
    amounts.push(Math.max(0, base))
  }
  return amounts
}

/**
 * Lump sum at schedule start that funds each contribution in order and ends at ~0.
 * Timing: deposit I, then each year withdraw contribution then grow remainder.
 */
export function requiredPrefundAmount(
  contributions: number[],
  marketRate: number,
): number {
  let pv = 0
  for (let k = 0; k < contributions.length; k++) {
    pv += contributions[k]! / (1 + marketRate) ** k
  }
  return roundUsd(pv)
}

function birthYearForChild(inputs: CalculatorInputs, childIndex: number): number {
  return (
    inputs.yearsBeforeFirstBirth + childIndex * inputs.childSpacingYears
  )
}

/** Map model year → total withdrawal that year across all children. */
export function withdrawalSchedule(inputs: CalculatorInputs): Map<number, number> {
  const schedule = childContributionSchedule(inputs)
  const withdrawals = new Map<number, number>()

  for (let childIndex = 0; childIndex < inputs.childCount; childIndex++) {
    const birthYear = birthYearForChild(inputs, childIndex)
    for (let age = 0; age < CONTRIBUTION_YEARS; age++) {
      const modelYear = birthYear + age
      const amount = schedule[age]!
      withdrawals.set(modelYear, (withdrawals.get(modelYear) ?? 0) + amount)
    }
  }

  return withdrawals
}

function activeChildrenLabel(
  inputs: CalculatorInputs,
  modelYear: number,
): string {
  const labels: string[] = []
  for (let childIndex = 0; childIndex < inputs.childCount; childIndex++) {
    const birthYear = birthYearForChild(inputs, childIndex)
    const age = modelYear - birthYear
    if (age >= 0 && age < CONTRIBUTION_YEARS) {
      labels.push(`#${childIndex + 1} (age ${age})`)
    }
  }
  return labels.length > 0 ? labels.join(', ') : '—'
}

function projectFundingRows(
  inputs: CalculatorInputs,
  initial: number,
): FundingYearRow[] {
  const withdrawals = withdrawalSchedule(inputs)
  const lastModelYear = Math.max(...withdrawals.keys())
  const { marketRate, cpiRate } = inputs
  const rows: FundingYearRow[] = []
  let balance = initial

  for (let modelYear = 0; modelYear <= lastModelYear; modelYear++) {
    const withdrawal = withdrawals.get(modelYear) ?? 0
    balance = Math.max(0, roundUsd(balance - withdrawal))
    balance = roundUsd(balance * (1 + marketRate))

    rows.push({
      modelYear,
      withdrawal,
      withdrawalReal: deflateToStart(withdrawal, cpiRate, modelYear),
      fundingBalance: balance,
      fundingBalanceReal: deflateToStart(balance, cpiRate, modelYear),
      activeChildren: activeChildrenLabel(inputs, modelYear),
    })
  }

  return rows
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const childSchedule = childContributionSchedule(inputs)
  const standaloneSingleChildPrefund = requiredPrefundAmount(
    childSchedule,
    inputs.marketRate,
  )

  const children: ChildSummary[] = []
  let requiredPrefund = 0
  let totalContributionsAllChildren = 0

  for (let childIndex = 0; childIndex < inputs.childCount; childIndex++) {
    const birthYear = birthYearForChild(inputs, childIndex)
    const totalContributions = childSchedule.reduce((sum, c) => sum + c, 0)
    const prefundPresentValue = roundUsd(
      standaloneSingleChildPrefund / (1 + inputs.marketRate) ** birthYear,
    )

    requiredPrefund += prefundPresentValue
    totalContributionsAllChildren += totalContributions

    children.push({
      childNumber: childIndex + 1,
      birthYear,
      standalonePrefundAtBirth: standaloneSingleChildPrefund,
      prefundPresentValue,
      totalContributions,
    })
  }

  requiredPrefund = roundUsd(requiredPrefund)
  const fundingRows = projectFundingRows(inputs, requiredPrefund)
  const lastModelYear = fundingRows[fundingRows.length - 1]?.modelYear ?? 0

  return {
    requiredPrefund,
    requiredPrefundReal: deflateToStart(requiredPrefund, inputs.cpiRate, 0),
    standaloneSingleChildPrefund,
    children,
    fundingRows,
    lastModelYear,
    totalContributionsAllChildren,
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
