export function formatPctRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

/** Total return as compact percent, e.g. 932, 4.0k, 73k */
export function formatReturnPct(factor: number): string {
  const pct = (factor - 1) * 100
  if (Math.abs(pct) < 0.5) return '0'
  if (pct < 1000) return `${Math.round(pct)}`
  if (pct < 10_000) return `${(pct / 1000).toFixed(1)}k`
  return `${Math.round(pct / 1000)}k`
}

export function formatMultiple(factor: number): string {
  if (factor < 10) return `×${factor.toFixed(1)}`
  if (factor < 100) return `×${factor.toFixed(0)}`
  if (factor < 1000) return `×${Math.round(factor)}`
  return `×${(factor / 1000).toFixed(1)}k`
}

export function formatReturnLong(factor: number): string {
  const pct = (factor - 1) * 100
  return `${pct.toLocaleString(undefined, { maximumFractionDigits: 0 })}%`
}

export function formatMultipleLong(factor: number): string {
  return `${factor.toLocaleString(undefined, { maximumFractionDigits: 1 })}×`
}
