export function roundUsd(amount: number): number {
  return Math.round(amount)
}

export function inflateByCpi(
  baseAmount: number,
  years: number,
  cpiRate: number,
): number {
  if (years <= 0 || cpiRate === 0) return roundUsd(baseAmount)
  return roundUsd(baseAmount * (1 + cpiRate) ** years)
}

export function deflateToStart(
  nominal: number,
  cpiRate: number,
  years: number,
): number {
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + cpiRate) ** years)
}
