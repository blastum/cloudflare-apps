import {
  CONTRIBUTION_YEARS,
  DEFAULTS,
  MAX_ANNUAL_CONTRIBUTION,
} from './constants'
import { roundUsd } from './shared/money'

export type CalculatorInputs = {
  initialDeposit: number
  yearsBeforeFirstBirth: number
  marketRate: number
  cpiRate: number
  generationalGap: number
  childrenPerGeneration: number
  childSpacing: number
  maxGenerations: number
}

export type BirthEvent = {
  year: number
  generation: number
  /** Index among siblings from the same parent (0-based). */
  siblingIndex: number
  /** Order within the generation cohort (1-based), for labels. */
  indexInGeneration: number
}

export type TimelineYear = {
  year: number
  balanceStart: number
  activeBeneficiaries: number
  withdrawal: number
  balanceEnd: number
  births: BirthEvent[]
  insolvent: boolean
}

export type Milestone = {
  label: string
  year: number
  balance: number
}

export type CalculatorResult = {
  realRate: number
  iMin: number
  perpetualThreshold: number | null
  births: BirthEvent[]
  timeline: TimelineYear[]
  milestones: Milestone[]
  generationsFullyFunded: number
  totalContributionsPaid: number
  insolvencyYear: number | null
  endingBalance: number
}

export function realRate(marketRate: number, cpiRate: number): number {
  return (1 + marketRate) / (1 + cpiRate) - 1
}

/** Present value of 18 max contributions with immediate first withdrawal (annuity due). */
export function singleLifeIMin(r: number, contribution = MAX_ANNUAL_CONTRIBUTION): number {
  if (r === 0) return roundUsd(contribution * CONTRIBUTION_YEARS)
  // Σ_{k=0}^{n-1} C/(1+r)^k = C * (1+r)/r * (1 - (1+r)^{-n})
  return roundUsd(
    (contribution * (1 + r) / r) * (1 - (1 + r) ** -CONTRIBUTION_YEARS),
  )
}

/**
 * Steady-state balance at each birth for one child per generation.
 * Surplus compounds for the full birth-to-birth gap G.
 */
export function singleChildPerpetualThreshold(
  r: number,
  generationalGap: number,
  contribution = MAX_ANNUAL_CONTRIBUTION,
): number | null {
  if (r <= 0 || generationalGap <= 0) return null
  const iMin = singleLifeIMin(r, contribution)
  const growthFactor = (1 + r) ** generationalGap
  if (growthFactor <= 1) return null
  return roundUsd(iMin * growthFactor / (growthFactor - 1))
}

/** Soft cap so N^g trees cannot freeze the browser. */
export const MAX_BIRTHS = 2500

/**
 * Branching tree: gen 1 has N children (spaced), then every person has N children
 * starting at parentBirth + generationalGap.
 */
export function buildBirthSchedule(inputs: CalculatorInputs): BirthEvent[] {
  const {
    yearsBeforeFirstBirth,
    generationalGap,
    childrenPerGeneration: n,
    childSpacing,
    maxGenerations,
  } = inputs
  const births: BirthEvent[] = []

  // Generation 1 — founding cohort
  let parents: BirthEvent[] = []
  for (let sibling = 0; sibling < n; sibling++) {
    const birth: BirthEvent = {
      year: yearsBeforeFirstBirth + sibling * childSpacing,
      generation: 1,
      siblingIndex: sibling,
      indexInGeneration: sibling + 1,
    }
    births.push(birth)
    parents.push(birth)
  }

  for (let generation = 2; generation <= maxGenerations; generation++) {
    const nextCount = parents.length * n
    if (births.length + nextCount > MAX_BIRTHS) break

    const children: BirthEvent[] = []
    let indexInGeneration = 0
    for (const parent of parents) {
      for (let sibling = 0; sibling < n; sibling++) {
        indexInGeneration += 1
        const birth: BirthEvent = {
          year: parent.year + generationalGap + sibling * childSpacing,
          generation,
          siblingIndex: sibling,
          indexInGeneration,
        }
        births.push(birth)
        children.push(birth)
      }
    }
    parents = children
  }

  return births
}

export function birthLabel(birth: BirthEvent): string {
  return `G${birth.generation}.${birth.indexInGeneration}`
}

function activeCountAtYear(births: BirthEvent[], year: number): number {
  let count = 0
  for (const birth of births) {
    const age = year - birth.year
    if (age >= 0 && age < CONTRIBUTION_YEARS) count += 1
  }
  return count
}

function birthsInYear(births: BirthEvent[], year: number): BirthEvent[] {
  return births.filter((birth) => birth.year === year)
}

/**
 * Withdraw-then-grow year loop in real dollars (matches Deluxe timing).
 */
export function simulate(
  inputs: CalculatorInputs,
  options?: { stopOnInsolvency?: boolean },
): {
  timeline: TimelineYear[]
  totalContributionsPaid: number
  insolvencyYear: number | null
  generationsFullyFunded: number
} {
  const stopOnInsolvency = options?.stopOnInsolvency ?? true
  const r = realRate(inputs.marketRate, inputs.cpiRate)
  const births = buildBirthSchedule(inputs)
  const lastYear =
    births.length === 0
      ? inputs.yearsBeforeFirstBirth
      : Math.max(...births.map((b) => b.year)) + CONTRIBUTION_YEARS - 1

  let balance = Math.max(0, inputs.initialDeposit)
  let totalContributionsPaid = 0
  let insolvencyYear: number | null = null
  const timeline: TimelineYear[] = []
  // Keep unrounded balances in the loop so I_min / surplus math stays exact;
  // round only when recording display rows.
  const eps = 0.01

  for (let year = 0; year <= lastYear; year++) {
    const balanceStart = balance
    const active = activeCountAtYear(births, year)
    const needed = active * MAX_ANNUAL_CONTRIBUTION
    let withdrawal = 0
    let insolvent = false

    if (needed > 0) {
      if (balance + eps < needed) {
        withdrawal = Math.max(0, balance)
        insolvent = true
        if (insolvencyYear === null) insolvencyYear = year
      } else {
        withdrawal = needed
      }
      balance = Math.max(0, balance - withdrawal)
      totalContributionsPaid += withdrawal
    }

    balance *= 1 + r

    timeline.push({
      year,
      balanceStart: roundUsd(balanceStart),
      activeBeneficiaries: active,
      withdrawal: roundUsd(withdrawal),
      balanceEnd: roundUsd(balance),
      births: birthsInYear(births, year),
      insolvent,
    })

    if (insolvent && stopOnInsolvency) break
  }

  const yearIndex = new Map(timeline.map((row) => [row.year, row]))
  let generationsFullyFunded = 0
  for (let generation = 1; generation <= inputs.maxGenerations; generation++) {
    const genBirths = births.filter((b) => b.generation === generation)
    if (genBirths.length === 0) break

    let fullyFunded = true
    for (const birth of genBirths) {
      for (let age = 0; age < CONTRIBUTION_YEARS; age++) {
        const row = yearIndex.get(birth.year + age)
        if (!row || row.insolvent) {
          fullyFunded = false
          break
        }
      }
      if (!fullyFunded) break
    }

    if (!fullyFunded) break
    generationsFullyFunded += 1
  }

  return {
    timeline,
    totalContributionsPaid: roundUsd(totalContributionsPaid),
    insolvencyYear,
    generationsFullyFunded,
  }
}

/**
 * Minimum initial deposit (at model start) for unbounded funding given family shape.
 * Single-child uses closed form; multi-child uses binary search.
 */
export function perpetualThresholdDeposit(inputs: CalculatorInputs): number | null {
  const r = realRate(inputs.marketRate, inputs.cpiRate)
  if (r <= 0) return null

  if (inputs.childrenPerGeneration === 1) {
    const atBirth = singleChildPerpetualThreshold(r, inputs.generationalGap)
    if (atBirth === null) return null
    const discounted = atBirth / (1 + r) ** inputs.yearsBeforeFirstBirth
    return roundUsd(discounted)
  }

  // Keep the probe tree modest; branching N^g grows fast.
  const n = inputs.childrenPerGeneration
  const probeGens = Math.min(inputs.maxGenerations, n >= 4 ? 4 : n >= 3 ? 5 : 8)
  const people =
    n === 1 ? probeGens : Math.min(MAX_BIRTHS, (n * (n ** probeGens - 1)) / (n - 1))
  let lo = 0
  let hi = MAX_ANNUAL_CONTRIBUTION * CONTRIBUTION_YEARS * people

  const firstBirthOfGeneration = (
    births: BirthEvent[],
    generation: number,
  ): BirthEvent | undefined => {
    let best: BirthEvent | undefined
    for (const birth of births) {
      if (birth.generation !== generation) continue
      if (!best || birth.year < best.year || (birth.year === best.year && birth.indexInGeneration < best.indexInGeneration)) {
        best = birth
      }
    }
    return best
  }

  const survives = (deposit: number): boolean => {
    const result = simulate(
      { ...inputs, initialDeposit: deposit, maxGenerations: probeGens },
      { stopOnInsolvency: true },
    )
    if (result.insolvencyYear !== null) return false
    if (result.generationsFullyFunded < probeGens) return false

    const births = buildBirthSchedule({
      ...inputs,
      maxGenerations: probeGens,
    })
    const gensPresent = new Set(births.map((b) => b.generation)).size
    if (gensPresent < probeGens) return false

    let prev: number | null = null
    for (let generation = 1; generation <= probeGens; generation++) {
      const first = firstBirthOfGeneration(births, generation)
      if (!first) return false
      const row = result.timeline.find((t) => t.year === first.year)
      if (!row) return false
      if (prev !== null && row.balanceStart + 1 < prev) return false
      prev = row.balanceStart
    }
    return true
  }

  while (!survives(hi) && hi < 50_000_000) {
    hi *= 2
  }
  if (!survives(hi)) return null

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (survives(mid)) hi = mid
    else lo = mid
  }

  return roundUsd(hi)
}

function buildMilestones(
  inputs: CalculatorInputs,
  births: BirthEvent[],
  timeline: TimelineYear[],
): Milestone[] {
  const milestones: Milestone[] = []
  const byYear = new Map(timeline.map((row) => [row.year, row]))

  milestones.push({
    label: 'Model start',
    year: 0,
    balance: inputs.initialDeposit,
  })

  const gens = [...new Set(births.map((b) => b.generation))].sort((a, b) => a - b)
  for (const generation of gens) {
    const cohort = births.filter((b) => b.generation === generation)
    const first = cohort.reduce((a, b) =>
      b.year < a.year || (b.year === a.year && b.indexInGeneration < a.indexInGeneration)
        ? b
        : a,
    )
    const row = byYear.get(first.year)
    if (!row) continue
    milestones.push({
      label: `Gen ${generation} first birth (${cohort.length})`,
      year: first.year,
      balance: row.balanceStart,
    })
  }

  return milestones
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const r = realRate(inputs.marketRate, inputs.cpiRate)
  const iMin = singleLifeIMin(r)
  const births = buildBirthSchedule(inputs)
  const sim = simulate(inputs)
  const perpetualThreshold = perpetualThresholdDeposit(inputs)
  const last = sim.timeline[sim.timeline.length - 1]

  return {
    realRate: r,
    iMin,
    perpetualThreshold,
    births,
    timeline: sim.timeline,
    milestones: buildMilestones(inputs, births, sim.timeline),
    generationsFullyFunded: sim.generationsFullyFunded,
    totalContributionsPaid: sim.totalContributionsPaid,
    insolvencyYear: sim.insolvencyYear,
    endingBalance: last?.balanceEnd ?? roundUsd(inputs.initialDeposit),
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
