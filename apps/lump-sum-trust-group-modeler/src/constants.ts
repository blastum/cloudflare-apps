export const DEFAULTS = {
  /** Months after previous child; first child is always birth year 0. */
  spacingMonths: [0, 21, 16, 36],
  lumpSum: 1_000_000,
  /** Months from first birth; negative = fund before birth. */
  fundingMonthsFromFirstBirth: 0,
  cpiRate: 0.032,
  marketRate: 0.103,
} as const

export const TARGET_AGE = 21
export const TARGET_AGE_MONTHS = TARGET_AGE * 12
