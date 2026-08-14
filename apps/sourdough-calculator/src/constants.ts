/** Defaults match the Sourdough.xlsx spreadsheet. */
export const DEFAULTS = {
  totalFlourG: 510,
  hydration: 0.8,
  salt: 0.02,
  levain: 0.12,
} as const

/** Fraction of total leaven mass added as starter when building the levain. */
export const STARTER_OF_LEVAIN = 0.1
