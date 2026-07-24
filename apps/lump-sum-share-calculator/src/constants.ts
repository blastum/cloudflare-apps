export const DEFAULTS = {
  /** Months after previous child; first child is always birth year 0. */
  spacingMonths: [0, 21, 16, 36],
  targetRealAtAge21: 200_000,
  cpiRate: 0.032,
  marketRate: 0.103,
} as const

export const TARGET_AGE = 21
