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

export function formatMonthYear(birthYear: number, birthMonth: number): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[birthMonth - 1] ?? birthMonth} ${birthYear}`
}
