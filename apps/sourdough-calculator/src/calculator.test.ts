import { describe, expect, it } from 'vitest'
import { calculate, defaultInputs } from './calculator'

/** Spreadsheet defaults rounded to nearest gram (510g @ 80% / 2% / 12%). */
const SPREADSHEET_ROUNDED = {
  totalWaterG: 408,
  totalLeavenG: 122,
  leavenFlourG: 61,
  leavenWaterG: 61,
  starterG: 12,
  doughWaterG: 347,
  doughSaltG: 10,
  doughFlourG: 449,
} as const

describe('sourdough calculator', () => {
  it('matches Sourdough.xlsx defaults rounded to nearest gram', () => {
    expect(calculate(defaultInputs())).toEqual(SPREADSHEET_ROUNDED)
  })

  it('scales linearly with flour weight', () => {
    const half = calculate({
      totalFlourG: 255,
      hydration: 0.8,
      salt: 0.02,
      levain: 0.12,
    })
    expect(half.totalWaterG).toBe(204)
    expect(half.doughFlourG).toBe(224)
    expect(half.doughSaltG).toBe(5)
  })

  it('uses baker hydration for total water', () => {
    const result = calculate({
      totalFlourG: 1000,
      hydration: 0.75,
      salt: 0.02,
      levain: 0.2,
    })
    expect(result.totalWaterG).toBe(750)
    expect(result.totalLeavenG).toBe(400)
    expect(result.leavenFlourG).toBe(200)
    expect(result.doughFlourG).toBe(800)
    expect(result.doughWaterG).toBe(550)
    expect(result.doughSaltG).toBe(20)
    expect(result.starterG).toBe(40)
  })
})
