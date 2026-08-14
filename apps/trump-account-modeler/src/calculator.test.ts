import { describe, expect, it } from 'vitest'
import {
  calculate,
  calculateSeveral,
  childPrivateFlows,
  defaultInputs,
  presentValueAtFund,
  privateContributionAmount,
  projectBalanceAtAge,
  projectBalanceByYear,
  projectConversionScenarios,
  type CalculatorInputs,
} from './calculator'
import { conversionYear, privateCap } from './statute'

function inputs(partial: Partial<CalculatorInputs> = {}): CalculatorInputs {
  return { ...defaultInputs(), ...partial }
}

describe('one child projection', () => {
  it('2026 birth with seed and max contrib shows seed + $5k in 2026', () => {
    const { rows } = projectBalanceByYear(
      inputs({
        children: [{ birthYear: 2026, birthMonth: 1 }],
      }),
    )
    const row2026 = rows.find((r) => r.calendarYear === 2026)
    expect(row2026?.seed).toBe(1000)
    expect(row2026?.contribution).toBe(5000)
  })

  it('2024 birth has no seed and contribs 2026 through 2041', () => {
    const { rows } = projectBalanceByYear(
      inputs({
        children: [{ birthYear: 2024, birthMonth: 6 }],
      }),
    )
    const contribRows = rows.filter((r) => r.contribution > 0)
    expect(contribRows[0]?.calendarYear).toBe(2026)
    expect(contribRows.at(-1)?.calendarYear).toBe(2041)
    expect(rows.every((r) => r.seed === 0)).toBe(true)
  })

  it('2029 birth has no seed and first contrib in 2029', () => {
    const { rows } = projectBalanceByYear(
      inputs({
        children: [{ birthYear: 2029, birthMonth: 3 }],
      }),
    )
    const contribRows = rows.filter((r) => r.contribution > 0)
    expect(contribRows[0]?.calendarYear).toBe(2029)
    expect(rows.every((r) => r.seed === 0)).toBe(true)
  })

  it('lump-sum PV matches discounted private contribs from funding year', () => {
    const base = inputs({
      children: [{ birthYear: 2026, birthMonth: 1 }],
      fundingYear: 2026,
      marketRate: 0.1,
    })
    const flows = childPrivateFlows(base, base.children[0]!, 2026)
    const expected = presentValueAtFund(2026, flows, 0.1)
    const result = calculate(base)
    expect(result.requiredLumpSum).toBe(expected)
    expect(result.children).toHaveLength(1)
  })
})

describe('Roth conversion calendar years', () => {
  it('born 2026 converts in 2044 with 18 inflation years', () => {
    expect(conversionYear(2026)).toBe(2044)
    const base = inputs({ children: [{ birthYear: 2026, birthMonth: 1 }] })
    const { rows } = projectBalanceByYear(base)
    const convertYear = conversionYear(2026)
    const age18Row = rows.find((r) => r.calendarYear === convertYear)
    const scenarios = projectConversionScenarios(
      base,
      2026,
      age18Row?.accountBalance ?? 0,
      age18Row?.principalBalance ?? 0,
    )
    expect(scenarios).toHaveLength(4)
  })

  it('born 2016 converts in 2034', () => {
    expect(conversionYear(2016)).toBe(2034)
  })
})

describe('several children pot', () => {
  it('two kids born 2026 and 2027 use statutory caps by calendar year', () => {
    const base = inputs({
      children: [
        { birthYear: 2026, birthMonth: 1 },
        { birthYear: 2027, birthMonth: 7 },
      ],
      fundingYear: 2026,
      cpiRate: 0.1,
    })
    const child1Flows = childPrivateFlows(base, base.children[1]!, 2026)
    expect(child1Flows[0]!.year).toBe(2027)
    expect(child1Flows[0]!.amount).toBe(privateCap(2027, 0.1))
    expect(child1Flows[0]!.amount).toBe(5000)
  })

  it('required lump sum matches sum of per-child deposits', () => {
    const result = calculateSeveral(
      inputs({
        children: [
          { birthYear: 2026, birthMonth: 1 },
          { birthYear: 2028, birthMonth: 6 },
          { birthYear: 2030, birthMonth: 3 },
        ],
        fundingYear: 2026,
      }),
    )
    const sum = result.children.reduce((s, c) => s + c.requiredDeposit, 0)
    expect(result.requiredLumpSum).toBe(sum)
  })

  it('single child pot empties after last contribution year', () => {
    const result = calculateSeveral(
      inputs({
        children: [{ birthYear: 2026, birthMonth: 1 }],
        fundingYear: 2026,
      }),
    )
    const last = result.potRows.at(-1)!
    expect(last.calendarYear).toBe(2043)
    expect(Math.abs(last.potNominal)).toBeLessThanOrEqual(5)
  })

  it('calculate always uses the pot projection', () => {
    const result = calculate(inputs())
    expect(result.children).toHaveLength(1)
    expect(result.potRows.length).toBeGreaterThan(0)
  })

  it('includes age-18 Trump balance per child', () => {
    const result = calculateSeveral(
      inputs({
        children: [
          { birthYear: 2026, birthMonth: 1 },
          { birthYear: 2028, birthMonth: 6 },
        ],
        fundingYear: 2026,
      }),
    )
    expect(result.children[0]!.age18CalendarYear).toBe(2044)
    expect(result.children[0]!.age18Balance).toBeGreaterThan(0)
    expect(result.children[1]!.age18CalendarYear).toBe(2046)
    expect(result.children[1]!.age18Balance).toBeGreaterThan(0)
    expect(result.children[0]!.age67CalendarYear).toBe(2093)
    expect(result.children[0]!.age67Balance).toBeGreaterThan(
      result.children[0]!.age18Balance!,
    )
  })
})

describe('projectBalanceAtAge', () => {
  it('grows age-18 balance to age 67 at market rate', () => {
    const at67 = projectBalanceAtAge(2026, 100_000, 67, 0.1, 0.032)
    expect(at67.calendarYear).toBe(2093)
    expect(at67.nominal).toBe(Math.round(100_000 * 1.1 ** 49))
  })
})

describe('privateContributionAmount', () => {
  it('returns statutory cap for the calendar year', () => {
    expect(privateContributionAmount({ cpiRate: 0.032 }, 2027)).toBe(5000)
    expect(privateContributionAmount({ cpiRate: 0.1 }, 2028)).toBe(5500)
  })
})
