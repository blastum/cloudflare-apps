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
