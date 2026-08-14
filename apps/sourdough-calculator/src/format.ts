const gramsFmt = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const pctFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export function formatGrams(grams: number): string {
  if (!Number.isFinite(grams)) return '—'
  return `${gramsFmt.format(Math.round(grams))} g`
}

/** Plain gram number for recipe lists (no unit suffix). */
export function formatGramsPlain(grams: number): string {
  if (!Number.isFinite(grams)) return '—'
  return gramsFmt.format(Math.round(grams))
}

export function formatPct(fraction: number): string {
  if (!Number.isFinite(fraction)) return '—'
  return `${pctFmt.format(fraction * 100)}%`
}
