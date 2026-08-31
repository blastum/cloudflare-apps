export {
  formatCurrency,
  formatNominalReal,
  formatPct,
  formatSharePct,
} from '../../../../shared/money'

export function formatYears(years: number): string {
  if (Math.abs(years - Math.round(years)) < 0.01) {
    return String(Math.round(years))
  }
  return years.toFixed(2)
}

export function annualToMonthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1
}

export function formatPctPerMonth(rate: number): string {
  return `${(rate * 100).toFixed(3)}%/mo`
}

export function formatMonths(months: number): string {
  return String(Math.round(months))
}
