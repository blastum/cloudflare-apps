export const DEFAULT_CPI_PCT = 3.2
export const DEFAULT_MARKET_PCT = 10.3
export const DEFAULT_CPI_RATE = DEFAULT_CPI_PCT / 100
export const DEFAULT_MARKET_RATE = DEFAULT_MARKET_PCT / 100

export function roundUsd(amount: number): number {
  return Math.round(amount)
}

export function inflate(real: number, years: number, cpiRate: number): number {
  if (years <= 0 || cpiRate === 0) return roundUsd(real)
  return roundUsd(real * (1 + cpiRate) ** years)
}

export function deflate(nominal: number, years: number, cpiRate: number): number {
  if (years <= 0) return roundUsd(nominal)
  return roundUsd(nominal / (1 + cpiRate) ** years)
}

export function growYears(principal: number, years: number, marketRate: number): number {
  if (years <= 0) return roundUsd(principal)
  return roundUsd(principal * (1 + marketRate) ** years)
}

export function realFactor(marketRate: number, cpiRate: number): number {
  return (1 + marketRate) / (1 + cpiRate)
}

export const inflateByCpi = inflate
export const deflateToStart = deflate
