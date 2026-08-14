import { DEFAULTS, STARTER_OF_LEVAIN } from './constants'

export type CalculatorInputs = {
  /** Total flour in final dough (baker's 100%), grams. */
  totalFlourG: number
  /** Water as fraction of total flour (e.g. 0.8 = 80%). */
  hydration: number
  /** Salt as fraction of total flour. */
  salt: number
  /** Preferment flour as fraction of total flour; leaven mass is 2× that. */
  levain: number
}

export type CalculatorResult = {
  totalWaterG: number
  totalLeavenG: number
  leavenFlourG: number
  leavenWaterG: number
  starterG: number
  doughFlourG: number
  doughWaterG: number
  doughSaltG: number
}

/**
 * Baker's-percentage sourdough formula matching Sourdough.xlsx:
 *
 * - total water = hydration × flour
 * - total leaven = flour × levain% × 2  (100% hydrated preferment)
 * - leaven flour/water = half the leaven each
 * - starter = 10% of total leaven (extra for the build)
 * - dough flour/water = totals minus what comes from the leaven
 * - dough salt = salt% × flour
 *
 * All gram outputs are rounded to the nearest whole gram.
 */
export function calculate(inputs: CalculatorInputs): CalculatorResult {
  const flour = Math.max(0, inputs.totalFlourG)
  const hydration = Math.max(0, inputs.hydration)
  const salt = Math.max(0, inputs.salt)
  const levain = Math.max(0, inputs.levain)

  const totalWaterG = hydration * flour
  const totalLeavenG = flour * levain * 2
  const leavenFlourG = totalLeavenG / 2
  const leavenWaterG = leavenFlourG
  const starterG = totalLeavenG * STARTER_OF_LEVAIN
  const doughWaterG = totalWaterG - leavenWaterG
  const doughSaltG = salt * flour
  const doughFlourG = flour - leavenFlourG

  // Kitchen scale: whole grams.
  return {
    totalWaterG: Math.round(totalWaterG),
    totalLeavenG: Math.round(totalLeavenG),
    leavenFlourG: Math.round(leavenFlourG),
    leavenWaterG: Math.round(leavenWaterG),
    starterG: Math.round(starterG),
    doughFlourG: Math.round(doughFlourG),
    doughWaterG: Math.round(doughWaterG),
    doughSaltG: Math.round(doughSaltG),
  }
}

export function defaultInputs(): CalculatorInputs {
  return { ...DEFAULTS }
}
