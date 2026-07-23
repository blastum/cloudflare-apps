import {
  CONTRIBUTION_YEARS,
  DEFAULTS,
  GROWTH_END_AGE,
  IRA_TARGET_AGES,
  MAX_ANNUAL_CONTRIBUTION,
} from './constants'
import { deflateToStart, inflateByCpi, roundUsd } from './money'

export type CalculatorInputs = {
  startingAge: number
  startingBalance: number
  annualContribution: number
  contributionInflationIndexed: boolean
  enablePrefund: boolean
  cpiRate: number
  marketRate: number
}

export type BalanceYearRow = {
  age: number
  contribution: number
  fundingBalance: number | null
  accountBalance: number
  realValue: number
  principalBalance: number
}

export type IraBalanceRow = {
  age: number
  nominal: number
  real: number
}

export type CalculatorResult = {
  balanceRows: BalanceYearRow[]
  iraRows: IraBalanceRow[]
  age18Balance: number
  age18Real: number
  age18Basis: number
  requiredPrefund: number | null
}

function yearsFromStart(age: number, startingAge: number): number {
  return age - startingAge
}

function contributionForAge(
  inputs: CalculatorInputs,
  age: number,
  contributionEndAge: number,
): number {
  if (age > contributionEndAge) return 0

  const yearsElapsed = yearsFromStart(age, inputs.startingAge)
  const maxCap = inputs.contributionInflationIndexed
    ? inflateByCpi(MAX_ANNUAL_CONTRIBUTION, yearsElapsed, inputs.cpiRate)
    : MAX_ANNUAL_CONTRIBUTION
  const userAmount = inputs.contributionInflationIndexed
    ? inflateByCpi(inputs.annualContribution, yearsElapsed, inputs.cpiRate)
    : inputs.annualContribution
  return Math.min(maxCap, Math.max(0, userAmount))
}

/** Schedule of contributions for ages startingAge .. contributionEndAge. */
export function contributionSchedule(inputs: CalculatorInputs): number[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const contributionEndAge = startingAge + CONTRIBUTION_YEARS - 1
  const amounts: number[] = []
  for (let age = startingAge; age <= contributionEndAge; age++) {
    amounts.push(contributionForAge(inputs, age, contributionEndAge))
  }
  return amounts
}

/**
 * Lump sum at year 0 that funds each contribution in order and ends at ~0.
 * Timing: deposit I, then each year withdraw contribution then grow remainder.
 * I = Σ C_k / (1+r)^k for k = 0 .. n-1
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

/**
 * Year-end funding balances after withdraw-then-grow, starting from initial.
 * Returns one balance per contribution year, then a final ~0 after last year.
 */
function projectFundingBalances(
  initial: number,
  contributions: number[],
  marketRate: number,
): number[] {
  let balance = initial
  const balances: number[] = []

  for (let k = 0; k < contributions.length; k++) {
    const contribution = contributions[k]!
    balance = Math.max(0, roundUsd(balance - contribution))
    balance = roundUsd(balance * (1 + marketRate))
    balances.push(balance)
  }

  return balances
}

export function projectBalanceByYear(inputs: CalculatorInputs): {
  rows: BalanceYearRow[]
  requiredPrefund: number | null
} {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const startingBalance = Math.max(0, inputs.startingBalance)
  const contributionEndAge = startingAge + CONTRIBUTION_YEARS - 1
  const marketRate = inputs.marketRate
  const cpiRate = inputs.cpiRate
  const contributions = contributionSchedule(inputs)

  const requiredPrefund = inputs.enablePrefund
    ? requiredPrefundAmount(contributions, marketRate)
    : null
  const fundingBalances =
    requiredPrefund !== null
      ? projectFundingBalances(requiredPrefund, contributions, marketRate)
      : null

  let accountBalance = startingBalance
  let principalBalance = 0
  const rows: BalanceYearRow[] = []

  for (let age = startingAge; age <= GROWTH_END_AGE; age++) {
    const contribution = contributionForAge(inputs, age, contributionEndAge)
    if (contribution > 0) {
      accountBalance += contribution
      principalBalance += contribution
    }

    accountBalance = roundUsd(accountBalance * (1 + marketRate))

    const yearsElapsed = yearsFromStart(age, startingAge)
    const realValue = deflateToStart(accountBalance, cpiRate, yearsElapsed)

    let fundingBalance: number | null = null
    if (fundingBalances !== null) {
      if (age <= contributionEndAge) {
        const idx = age - startingAge
        fundingBalance = fundingBalances[idx] ?? 0
      } else {
        fundingBalance = 0
      }
    }

    rows.push({
      age,
      contribution,
      fundingBalance,
      accountBalance,
      realValue,
      principalBalance,
    })
  }

  return { rows, requiredPrefund }
}

export function projectIraBalances(
  inputs: CalculatorInputs,
  age18NominalBalance: number,
): IraBalanceRow[] {
  const startingAge = Math.max(0, Math.round(inputs.startingAge))
  const { marketRate, cpiRate } = inputs

  return IRA_TARGET_AGES.map((targetAge) => {
    const yearsGrowth = targetAge - GROWTH_END_AGE
    const nominal = roundUsd(
      age18NominalBalance * (1 + marketRate) ** yearsGrowth,
    )
    const real = deflateToStart(
      nominal,
      cpiRate,
      yearsFromStart(targetAge, startingAge),
    )
    return { age: targetAge, nominal, real }
  })
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const { rows: balanceRows, requiredPrefund } = projectBalanceByYear(inputs)
  const lastRow = balanceRows[balanceRows.length - 1]
  const age18Balance = lastRow?.accountBalance ?? 0
  const age18Real = lastRow?.realValue ?? 0
  const age18Basis = lastRow?.principalBalance ?? 0

  return {
    balanceRows,
    iraRows: projectIraBalances(inputs, age18Balance),
    age18Balance,
    age18Real,
    age18Basis,
    requiredPrefund,
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
