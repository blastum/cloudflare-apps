import { deflate, inflate, roundUsd } from '../../../shared/growth'

export { roundUsd }

export function inflateByCpi(
  baseAmount: number,
  years: number,
  cpiRate: number,
): number {
  return inflate(baseAmount, years, cpiRate)
}

export function deflateToStart(
  nominal: number,
  cpiRate: number,
  years: number,
): number {
  return deflate(nominal, years, cpiRate)
}
