const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function formatCurrency(amount: number): string {
  return usd.format(amount)
}

export function formatNominalReal(nominal: number, real: number): string {
  return `${formatCurrency(nominal)} (${formatCurrency(real)})`
}

export function formatPct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

export function formatSharePct(share: number): string {
  return `${share.toFixed(1)}%`
}

export function formatYears(years: number): string {
  if (Math.abs(years - Math.round(years)) < 0.01) {
    return String(Math.round(years))
  }
  return years.toFixed(2)
}

/** Convert an annual decimal rate to an equivalent monthly rate. */
export function annualToMonthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1
}

export function formatPctPerMonth(rate: number): string {
  return `${(rate * 100).toFixed(3)}%/mo`
}

export function formatMonths(months: number): string {
  return String(Math.round(months))
}
