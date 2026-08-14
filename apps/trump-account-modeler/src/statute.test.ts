import { describe, expect, it } from 'vitest'
import {
  ageAtYearEnd,
  firstContributionYear,
  lastContributionYear,
  privateCap,
  seedEligible,
  seedYear,
} from './statute'

describe('privateCap', () => {
  it('is zero before 2026', () => {
    expect(privateCap(2025, 0.1)).toBe(0)
  })

  it('is $5,000 for 2026 and 2027 regardless of CPI', () => {
    expect(privateCap(2026, 0.5)).toBe(5000)
    expect(privateCap(2027, 0.5)).toBe(5000)
  })

  it('indexes from 2028 and rounds down to $100', () => {
    expect(privateCap(2028, 0.1)).toBe(5500)
    expect(privateCap(2028, 0.032)).toBe(5100)
  })
})

describe('seedEligible', () => {
  it('is true for 2025 through 2028', () => {
    expect(seedEligible(2025)).toBe(true)
    expect(seedEligible(2028)).toBe(true)
  })

  it('is false outside pilot birth years', () => {
    expect(seedEligible(2024)).toBe(false)
    expect(seedEligible(2029)).toBe(false)
  })
})

describe('contribution years', () => {
  it('first year is max(2026, birthYear)', () => {
    expect(firstContributionYear(2024)).toBe(2026)
    expect(firstContributionYear(2027)).toBe(2027)
  })

  it('last year is birthYear + 17', () => {
    expect(lastContributionYear(2009)).toBe(2026)
  })

  it('seed year matches first contribution year', () => {
    expect(seedYear(2026)).toBe(2026)
  })

  it('computes age at year-end', () => {
    expect(ageAtYearEnd(2026, 2044)).toBe(18)
  })
})
