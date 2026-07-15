import { BALANCE_AGES, DEFAULTS, END_AGE, LAST_TRUMP_AGE, MAX_AGE } from './constants'

export type CalculatorInputs = {
  startingAge: number
  cpiRate: number
  marketRate: number
  brokerageRealTarget: number
  trumpRealAnnual: number
  giftRealAnnual: number
  trumpSeed: number
}

export type MoneyPair = {
  nominal: number
  real: number
}

export type GiftInflowRow = {
  age: number
  gift: MoneyPair
  toTrump: MoneyPair
  toBrokerage: MoneyPair
  toPrefund: MoneyPair
}

export type TrumpFundingSource = 'direct' | 'prefund' | 'brokerage' | 'mixed' | 'none'

export type TrumpRow = {
  age: number
  slice: MoneyPair
  fundingSource: TrumpFundingSource
  directFromGift: MoneyPair
  fromPrefund: MoneyPair
  fromBrokerage: MoneyPair
  seedDeposit: MoneyPair
  prefundBalance: MoneyPair
  balance: MoneyPair
}

export type BrokerageRow = {
  age: number
  funding: MoneyPair
  totalFunding: MoneyPair
  balance: MoneyPair
}

export type CalculatorResult = {
  giftYears: number
  lastYearGiftMax: MoneyPair
  lastYearGiftOptimized: MoneyPair
  prefundAt17: MoneyPair
  totalCrummeyGifts: MoneyPair
  trumpPathGifts: MoneyPair
  brokeragePathGifts: MoneyPair
  lifetimeBrokerageToTrump: MoneyPair
  combinedAt18: MoneyPair
  trumpBalanceAt18: MoneyPair
  brokerageBalanceAt18: MoneyPair
  warning: string | null
  giftInflows: GiftInflowRow[]
  trumpRows: TrumpRow[]
  brokerageRows: BrokerageRow[]
}

export function roundUsd(amount: number): number {
  return Math.round(amount)
}

export function yearsFromStart(age: number, startingAge: number): number {
  return age - startingAge
}

export function inflate(real: number, years: number, cpiRate: number): number {
  if (years <= 0) return roundUsd(real)
  return roundUsd(real * (1 + cpiRate) ** years)
}

export function deflate(nominal: number, years: number, cpiRate: number): number {
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + cpiRate) ** years)
}

function pair(nominal: number, real: number): MoneyPair {
  return { nominal: roundUsd(nominal), real: roundUsd(real) }
}

function pairFromNominal(nominal: number, years: number, cpiRate: number): MoneyPair {
  return pair(nominal, deflate(nominal, years, cpiRate))
}

function emptyPair(): MoneyPair {
  return pair(0, 0)
}

function sumInflowColumn(
  rows: GiftInflowRow[],
  pick: (row: GiftInflowRow) => MoneyPair,
): MoneyPair {
  return pair(
    rows.reduce((sum, row) => sum + pick(row).nominal, 0),
    rows.reduce((sum, row) => sum + pick(row).real, 0),
  )
}

type SimulationState = {
  trump: number
  prefund: number
  brokerage: number
  brokerCumulativeNominal: number
  brokerCumulativeReal: number
  lifetimeBrokerToTrump: number
}

type InternalResult = {
  state: SimulationState
  giftInflows: GiftInflowRow[]
  trumpRows: TrumpRow[]
  brokerageRows: BrokerageRow[]
  lifetimeBrokerToTrump: number
}

type SimulateOptions = {
  lastYearGiftCap?: number
}

function isFeasible(inputs: CalculatorInputs, result: InternalResult): boolean {
  return (
    result.lifetimeBrokerToTrump === 0 &&
    result.state.brokerCumulativeReal >= inputs.brokerageRealTarget
  )
}

function simulate(
  inputs: CalculatorInputs,
  giftYears: number,
  options: SimulateOptions = {},
): InternalResult {
  const { startingAge, cpiRate, marketRate } = inputs
  const state: SimulationState = {
    trump: 0,
    prefund: 0,
    brokerage: 0,
    brokerCumulativeNominal: 0,
    brokerCumulativeReal: 0,
    lifetimeBrokerToTrump: 0,
  }

  const giftInflows: GiftInflowRow[] = []
  const trumpRows: TrumpRow[] = []
  const brokerageRows: BrokerageRow[] = []

  for (let age = startingAge; age <= LAST_TRUMP_AGE; age++) {
    const years = yearsFromStart(age, startingAge)
    const giftYearIndex = age - startingAge
    const isGiftYear = giftYearIndex < giftYears

    let seedDeposit = 0
    if (age === startingAge) {
      seedDeposit = Math.max(0, inputs.trumpSeed)
      state.trump += seedDeposit
    }

    let giftToTrump = 0
    let giftToBrokerage = 0
    let giftToPrefund = 0
    let giftNominal = 0

    if (isGiftYear) {
      const fullGiftNominal = inflate(inputs.giftRealAnnual, years, cpiRate)
      const isLastGiftYear = giftYearIndex === giftYears - 1
      giftNominal =
        isLastGiftYear && options.lastYearGiftCap !== undefined
          ? Math.min(fullGiftNominal, Math.max(0, roundUsd(options.lastYearGiftCap)))
          : fullGiftNominal
      const trumpSliceNominal = inflate(inputs.trumpRealAnnual, years, cpiRate)

      giftToTrump = Math.min(trumpSliceNominal, giftNominal)
      state.trump += giftToTrump

      let remaining = giftNominal - giftToTrump
      const brokerRealDeficit = Math.max(
        0,
        inputs.brokerageRealTarget - state.brokerCumulativeReal,
      )
      const maxBrokerNominal = inflate(brokerRealDeficit, years, cpiRate)
      giftToBrokerage = Math.min(remaining, maxBrokerNominal)
      state.brokerage += giftToBrokerage
      state.brokerCumulativeNominal += giftToBrokerage
      state.brokerCumulativeReal += deflate(giftToBrokerage, years, cpiRate)

      remaining -= giftToBrokerage
      giftToPrefund = remaining
      state.prefund += giftToPrefund

      giftInflows.push({
        age,
        gift: pairFromNominal(giftNominal, years, cpiRate),
        toTrump: pairFromNominal(giftToTrump, years, cpiRate),
        toBrokerage: pairFromNominal(giftToBrokerage, years, cpiRate),
        toPrefund: pairFromNominal(giftToPrefund, years, cpiRate),
      })
    }

    const trumpSliceNominal = inflate(inputs.trumpRealAnnual, years, cpiRate)
    const trumpSliceReal = deflate(trumpSliceNominal, years, cpiRate)
    let fromPrefund = 0
    let fromBrokerage = 0

    const trumpShortfall = trumpSliceNominal - giftToTrump
    if (trumpShortfall > 0) {
      fromPrefund = Math.min(trumpShortfall, state.prefund)
      state.prefund -= fromPrefund
      state.trump += fromPrefund

      const stillShort = trumpShortfall - fromPrefund
      if (stillShort > 0) {
        fromBrokerage = Math.min(stillShort, state.brokerage)
        state.brokerage -= fromBrokerage
        state.trump += fromBrokerage
        state.lifetimeBrokerToTrump += fromBrokerage
      }
    }

    const fundingSource = trumpFundingSource(giftToTrump, fromPrefund, fromBrokerage)

    state.trump = roundUsd(state.trump * (1 + marketRate))
    state.prefund = roundUsd(state.prefund * (1 + marketRate))
    state.brokerage = roundUsd(state.brokerage * (1 + marketRate))

    trumpRows.push({
      age,
      slice: pair(trumpSliceNominal, trumpSliceReal),
      fundingSource,
      directFromGift: pairFromNominal(giftToTrump, years, cpiRate),
      fromPrefund: pairFromNominal(fromPrefund, years, cpiRate),
      fromBrokerage: pairFromNominal(fromBrokerage, years, cpiRate),
      seedDeposit: pairFromNominal(seedDeposit, years, cpiRate),
      prefundBalance: pairFromNominal(state.prefund, years, cpiRate),
      balance: pairFromNominal(state.trump, years, cpiRate),
    })

    brokerageRows.push({
      age,
      funding: pairFromNominal(giftToBrokerage, years, cpiRate),
      totalFunding: pair(state.brokerCumulativeNominal, state.brokerCumulativeReal),
      balance: pairFromNominal(state.brokerage, years, cpiRate),
    })
  }

  const years18 = yearsFromStart(END_AGE, startingAge)
  state.trump = roundUsd(state.trump * (1 + marketRate))
  state.prefund = roundUsd(state.prefund * (1 + marketRate))
  state.brokerage = roundUsd(state.brokerage * (1 + marketRate))

  const prefundBeforeSweep = state.prefund
  state.brokerage += prefundBeforeSweep
  state.prefund = 0

  trumpRows.push({
    age: END_AGE,
    slice: emptyPair(),
    fundingSource: 'none',
    directFromGift: emptyPair(),
    fromPrefund: emptyPair(),
    fromBrokerage: emptyPair(),
    seedDeposit: emptyPair(),
    prefundBalance: emptyPair(),
    balance: pairFromNominal(state.trump, years18, cpiRate),
  })

  brokerageRows.push({
    age: END_AGE,
    funding: pairFromNominal(prefundBeforeSweep, years18, cpiRate),
    totalFunding: pair(state.brokerCumulativeNominal, state.brokerCumulativeReal),
    balance: pairFromNominal(
      state.brokerage,
      yearsFromStart(END_AGE, startingAge),
      cpiRate,
    ),
  })

  const milestoneAges = new Set<number>(BALANCE_AGES.filter((age) => age > END_AGE))
  for (let age = END_AGE + 1; age <= MAX_AGE; age++) {
    state.trump = roundUsd(state.trump * (1 + marketRate))
    state.brokerage = roundUsd(state.brokerage * (1 + marketRate))

    if (!milestoneAges.has(age)) continue

    const years = yearsFromStart(age, startingAge)
    trumpRows.push({
      age,
      slice: emptyPair(),
      fundingSource: 'none',
      directFromGift: emptyPair(),
      fromPrefund: emptyPair(),
      fromBrokerage: emptyPair(),
      seedDeposit: emptyPair(),
      prefundBalance: emptyPair(),
      balance: pairFromNominal(state.trump, years, cpiRate),
    })

    brokerageRows.push({
      age,
      funding: emptyPair(),
      totalFunding: pair(state.brokerCumulativeNominal, state.brokerCumulativeReal),
      balance: pairFromNominal(state.brokerage, years, cpiRate),
    })
  }

  return {
    state,
    giftInflows,
    trumpRows,
    brokerageRows,
    lifetimeBrokerToTrump: state.lifetimeBrokerToTrump,
  }
}

function trumpFundingSource(
  direct: number,
  prefund: number,
  brokerage: number,
): TrumpFundingSource {
  const sources = [
    direct > 0 ? 'direct' : null,
    prefund > 0 ? 'prefund' : null,
    brokerage > 0 ? 'brokerage' : null,
  ].filter(Boolean)

  if (sources.length === 0) return 'direct'
  if (sources.length === 1) return sources[0] as TrumpFundingSource
  return 'mixed'
}

function findMinimumGiftYears(inputs: CalculatorInputs): {
  giftYears: number
  simulation: InternalResult
  warning: string | null
} {
  const maxGiftYears = Math.max(0, END_AGE - inputs.startingAge)
  let lastSimulation = simulate(inputs, maxGiftYears)

  for (let giftYears = 1; giftYears <= maxGiftYears; giftYears++) {
    const simulation = simulate(inputs, giftYears)
    const brokerFunded =
      simulation.state.brokerCumulativeReal >= inputs.brokerageRealTarget
    const noBrokerToTrump = simulation.lifetimeBrokerToTrump === 0

    if (brokerFunded && noBrokerToTrump) {
      return { giftYears, simulation, warning: null }
    }
    lastSimulation = simulation
  }

  const brokerFunded =
    lastSimulation.state.brokerCumulativeReal >= inputs.brokerageRealTarget
  const warning =
    brokerFunded && lastSimulation.lifetimeBrokerToTrump > 0
      ? `Even with ${maxGiftYears} gift years, brokerage must fund trump by ${formatUsd(lastSimulation.lifetimeBrokerToTrump)}.`
      : !brokerFunded
        ? `Brokerage real target not reached after ${maxGiftYears} gift years.`
        : null

  return { giftYears: maxGiftYears, simulation: lastSimulation, warning }
}

function optimizeLastYearGift(inputs: CalculatorInputs, giftYears: number): number {
  if (giftYears <= 0) return 0

  const lastAge = inputs.startingAge + giftYears - 1
  const years = yearsFromStart(lastAge, inputs.startingAge)
  const fullGift = inflate(inputs.giftRealAnnual, years, inputs.cpiRate)
  const trumpSlice = inflate(inputs.trumpRealAnnual, years, inputs.cpiRate)

  let lo = trumpSlice
  let hi = fullGift
  let best = fullGift

  while (lo <= hi) {
    const mid = roundUsd((lo + hi) / 2)
    const simulation = simulate(inputs, giftYears, { lastYearGiftCap: mid })
    if (isFeasible(inputs, simulation)) {
      best = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }

  return best
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const { giftYears, warning } = findMinimumGiftYears(inputs)

  const lastAge = inputs.startingAge + giftYears - 1
  const lastYears = yearsFromStart(lastAge, inputs.startingAge)
  const lastYearGiftMaxNominal = inflate(inputs.giftRealAnnual, lastYears, inputs.cpiRate)
  const lastYearGiftOptimizedNominal =
    giftYears > 0 ? optimizeLastYearGift(inputs, giftYears) : 0

  const simulation = simulate(inputs, giftYears, {
    lastYearGiftCap: lastYearGiftOptimizedNominal,
  })
  const { state, giftInflows, trumpRows, brokerageRows } = simulation

  const prefund17Row = trumpRows.find((r) => r.age === LAST_TRUMP_AGE)
  const prefundAt17 = prefund17Row?.prefundBalance ?? emptyPair()

  const totalCrummeyGifts = sumInflowColumn(giftInflows, (row) => row.gift)
  const trumpPathGifts = sumInflowColumn(giftInflows, (row) =>
    pair(row.toTrump.nominal + row.toPrefund.nominal, row.toTrump.real + row.toPrefund.real),
  )
  const brokeragePathGifts = sumInflowColumn(giftInflows, (row) => row.toBrokerage)

  const trumpAt18Row = trumpRows.find((r) => r.age === END_AGE)
  const brokerageAt18Row = brokerageRows.find((r) => r.age === END_AGE)

  const trumpAt18 = trumpAt18Row?.balance ?? emptyPair()
  const brokerageAt18 = brokerageAt18Row?.balance ?? emptyPair()

  return {
    giftYears,
    lastYearGiftMax: pairFromNominal(lastYearGiftMaxNominal, lastYears, inputs.cpiRate),
    lastYearGiftOptimized: pairFromNominal(
      lastYearGiftOptimizedNominal,
      lastYears,
      inputs.cpiRate,
    ),
    prefundAt17,
    totalCrummeyGifts,
    trumpPathGifts,
    brokeragePathGifts,
    lifetimeBrokerageToTrump: pairFromNominal(
      state.lifetimeBrokerToTrump,
      yearsFromStart(LAST_TRUMP_AGE, inputs.startingAge),
      inputs.cpiRate,
    ),
    combinedAt18: pair(
      trumpAt18.nominal + brokerageAt18.nominal,
      trumpAt18.real + brokerageAt18.real,
    ),
    trumpBalanceAt18: trumpAt18,
    brokerageBalanceAt18: brokerageAt18,
    warning,
    giftInflows,
    trumpRows,
    brokerageRows,
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
