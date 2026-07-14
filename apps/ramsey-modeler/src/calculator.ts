import {
  DEFAULTS,
  MAX_DEBT_COUNT,
  MAX_MONTHS,
  MIN_DEBT_BALANCE,
  MIN_DEBT_COUNT,
  MIN_PAYMENT_FLOOR,
} from './constants'

export type CalculatorInputs = {
  totalDebt: number
  monthlyBudget: number
  minPaymentPercent: number
  minApr: number
  maxApr: number
  trials: number
}

export type Debt = {
  balance: number
  apr: number
}

export type Strategy = 'snowball' | 'avalanche'

export type SimulationResult = {
  months: number
  totalInterest: number
}

export type TrialResult = {
  debtCount: number
  minRate: number
  maxRate: number
  snowballMonths: number
  avalancheMonths: number
  snowballInterest: number
  avalancheInterest: number
  winner: 'snowball' | 'avalanche' | 'tie'
  monthDiff: number
}

export type MonteCarloResult = {
  snowballWins: number
  avalancheWins: number
  ties: number
  avgSnowballMonths: number
  avgAvalancheMonths: number
  avgMonthAdvantage: number
  avgInterestSavings: number
  trialResults: TrialResult[]
}

export type CalculatorResult =
  | { ok: true; monteCarlo: MonteCarloResult }
  | { ok: false; error: string }

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function minPayment(balance: number, minPaymentPercent: number): number {
  return Math.max(MIN_PAYMENT_FLOOR, balance * (minPaymentPercent / 100))
}

function pickPriority(debts: Debt[], strategy: Strategy): number {
  let best = -1
  for (let i = 0; i < debts.length; i++) {
    if (debts[i].balance <= 0.005) continue
    if (best < 0) {
      best = i
      continue
    }
    const candidate = debts[i]
    const current = debts[best]
    if (strategy === 'snowball') {
      if (
        candidate.balance < current.balance - 0.005 ||
        (Math.abs(candidate.balance - current.balance) <= 0.005 && candidate.apr > current.apr)
      ) {
        best = i
      }
    } else if (
      candidate.apr > current.apr + 1e-9 ||
      (Math.abs(candidate.apr - current.apr) <= 1e-9 && candidate.balance < current.balance)
    ) {
      best = i
    }
  }
  return best
}

export function generateDebts(
  inputs: CalculatorInputs,
  trialIndex: number,
): Debt[] {
  const rng = mulberry32(trialIndex + 1)
  const debtCount =
    MIN_DEBT_COUNT +
    Math.floor(rng() * (MAX_DEBT_COUNT - MIN_DEBT_COUNT + 1))
  const weights = Array.from({ length: debtCount }, () => rng() + 0.05)
  const weightSum = weights.reduce((sum, w) => sum + w, 0)

  const minRate = inputs.minApr / 100
  const maxRate = inputs.maxApr / 100
  const rateSpan = maxRate - minRate

  const debts: Debt[] = []
  let allocated = 0

  for (let i = 0; i < debtCount; i++) {
    let balance: number
    if (i === debtCount - 1) {
      balance = Math.max(MIN_DEBT_BALANCE, inputs.totalDebt - allocated)
    } else {
      balance = Math.max(
        MIN_DEBT_BALANCE,
        Math.round((inputs.totalDebt * weights[i]) / weightSum),
      )
      allocated += balance
    }
    const apr = minRate + rng() * rateSpan
    debts.push({ balance, apr })
  }

  const actualTotal = debts.reduce((sum, d) => sum + d.balance, 0)
  if (actualTotal !== inputs.totalDebt) {
    const delta = inputs.totalDebt - actualTotal
    debts[debts.length - 1].balance = Math.max(
      MIN_DEBT_BALANCE,
      debts[debts.length - 1].balance + delta,
    )
  }

  return debts
}

export function simulatePayoff(
  initialDebts: Debt[],
  monthlyBudget: number,
  minPaymentPercent: number,
  strategy: Strategy,
): SimulationResult {
  const debts = initialDebts.map((d) => ({ ...d }))
  let months = 0
  let totalInterest = 0

  while (debts.some((d) => d.balance > 0.005) && months < MAX_MONTHS) {
    months++

    for (const debt of debts) {
      if (debt.balance <= 0.005) continue
      const interest = debt.balance * (debt.apr / 12)
      debt.balance += interest
      totalInterest += interest
    }

    let remaining = monthlyBudget
    for (const debt of debts) {
      if (debt.balance <= 0.005) continue
      const due = Math.min(debt.balance, minPayment(debt.balance, minPaymentPercent))
      debt.balance -= due
      remaining -= due
    }

    while (remaining > 0.005) {
      const targetIndex = pickPriority(debts, strategy)
      if (targetIndex < 0) break
      const target = debts[targetIndex]
      const payment = Math.min(target.balance, remaining)
      target.balance -= payment
      remaining -= payment
      if (target.balance <= 0.005) target.balance = 0
    }

    for (const debt of debts) {
      if (debt.balance <= 0.005) debt.balance = 0
    }
  }

  return { months, totalInterest }
}

function summarizeTrial(debts: Debt[], inputs: CalculatorInputs): TrialResult {
  const snowball = simulatePayoff(
    debts,
    inputs.monthlyBudget,
    inputs.minPaymentPercent,
    'snowball',
  )
  const avalanche = simulatePayoff(
    debts,
    inputs.monthlyBudget,
    inputs.minPaymentPercent,
    'avalanche',
  )

  const rates = debts.map((d) => d.apr)
  let winner: TrialResult['winner']
  if (snowball.months < avalanche.months) winner = 'snowball'
  else if (avalanche.months < snowball.months) winner = 'avalanche'
  else winner = 'tie'

  return {
    debtCount: debts.length,
    minRate: Math.min(...rates),
    maxRate: Math.max(...rates),
    snowballMonths: snowball.months,
    avalancheMonths: avalanche.months,
    snowballInterest: snowball.totalInterest,
    avalancheInterest: avalanche.totalInterest,
    winner,
    monthDiff: avalanche.months - snowball.months,
  }
}

export function validateInputs(inputs: CalculatorInputs): string | null {
  if (inputs.minApr > inputs.maxApr) {
    return 'Min APR must be less than or equal to max APR.'
  }
  if (inputs.totalDebt < MIN_DEBT_BALANCE * MIN_DEBT_COUNT) {
    return `Total debt must be at least $${MIN_DEBT_BALANCE * MIN_DEBT_COUNT} to split across ${MIN_DEBT_COUNT} debts.`
  }
  if (inputs.monthlyBudget <= 0) {
    return 'Monthly budget must be greater than zero.'
  }

  const sampleDebts = generateDebts(inputs, 0)
  const minTotal = sampleDebts.reduce(
    (sum, d) => sum + minPayment(d.balance, inputs.minPaymentPercent),
    0,
  )
  if (inputs.monthlyBudget <= minTotal) {
    return `Monthly budget must exceed total minimum payments (about $${Math.ceil(minTotal)} for a sample portfolio).`
  }

  return null
}

export function runMonteCarlo(inputs: CalculatorInputs): CalculatorResult {
  const error = validateInputs(inputs)
  if (error) return { ok: false, error }

  const trialResults: TrialResult[] = []
  let snowballWins = 0
  let avalancheWins = 0
  let ties = 0
  let snowballMonthSum = 0
  let avalancheMonthSum = 0
  let monthDiffSum = 0
  let interestDiffSum = 0

  for (let i = 0; i < inputs.trials; i++) {
    const debts = generateDebts(inputs, i)
    const trial = summarizeTrial(debts, inputs)
    trialResults.push(trial)

    if (trial.winner === 'snowball') snowballWins++
    else if (trial.winner === 'avalanche') avalancheWins++
    else ties++

    snowballMonthSum += trial.snowballMonths
    avalancheMonthSum += trial.avalancheMonths
    monthDiffSum += trial.monthDiff
    interestDiffSum += trial.avalancheInterest - trial.snowballInterest
  }

  return {
    ok: true,
    monteCarlo: {
      snowballWins,
      avalancheWins,
      ties,
      avgSnowballMonths: snowballMonthSum / inputs.trials,
      avgAvalancheMonths: avalancheMonthSum / inputs.trials,
      avgMonthAdvantage: monthDiffSum / inputs.trials,
      avgInterestSavings: interestDiffSum / inputs.trials,
      trialResults,
    },
  }
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  return runMonteCarlo({
    ...inputs,
    trials: inputs.trials || DEFAULTS.trials,
  })
}
