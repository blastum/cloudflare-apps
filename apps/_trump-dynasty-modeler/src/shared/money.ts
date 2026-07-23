const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export function roundUsd(amount: number): number {
  return Math.round(amount)
}

export function formatCurrency(amount: number): string {
  return usd.format(amount)
}

export function formatPctRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}
