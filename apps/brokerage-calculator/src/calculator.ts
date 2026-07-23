export type CalculatorInputs = {
  initialInvestment: number
  annualAddition: number
  years: number
  expectedReturn: number
  expectedInflation: number
}

export type YearRow = {
  year: number
  contribution: number
  balance: number
  totalContributions: number
  earnings: number
  realValue: number
}

export type CalculatorResult = {
  yearRows: YearRow[]
  finalBalance: number
  finalRealValue: number
  totalContributions: number
  totalEarnings: number
}

function roundUsd(amount: number): number {
  return Math.round(amount)
}

function deflateToStart(nominal: number, inflationRate: number, years: number): number {
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + inflationRate) ** years)
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const years = Math.max(0, Math.round(inputs.years))
  const initial = Math.max(0, inputs.initialInvestment)
  const annualAddition = Math.max(0, inputs.annualAddition)
  const returnRate = inputs.expectedReturn
  const inflationRate = inputs.expectedInflation

  const yearRows: YearRow[] = []
  let balance = initial
  let totalContributions = initial

  yearRows.push({
    year: 0,
    contribution: initial,
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
      balance,
      totalContributions: roundUsd(totalContributions),
      earnings,
      realValue: deflateToStart(balance, inflationRate, year),
    })
  }

  const last = yearRows[yearRows.length - 1]

  return {
    yearRows,
    finalBalance: last?.balance ?? initial,
    finalRealValue: last?.realValue ?? initial,
    totalContributions: last?.totalContributions ?? initial,
    totalEarnings: last?.earnings ?? 0,
  }
}

export function defaultInputs(): CalculatorInputs {
  return {
    initialInvestment: 100_000,
    annualAddition: 25_000,
    years: 20,
    expectedReturn: 0.07,
    expectedInflation: 0.03,
  }
}
