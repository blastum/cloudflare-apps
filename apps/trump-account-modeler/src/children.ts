import type { ChildInput } from './calculator'

export type FirstChild = {
  birthYear: number
  birthMonth: number
}

export function addMonths(
  birthYear: number,
  birthMonth: number,
  deltaMonths: number,
): FirstChild {
  const total = birthYear * 12 + (birthMonth - 1) + deltaMonths
  return {
    birthYear: Math.floor(total / 12),
    birthMonth: (total % 12) + 1,
  }
}

export function monthsAfterPrevious(prev: FirstChild, next: FirstChild): number {
  return (next.birthYear - prev.birthYear) * 12 + (next.birthMonth - prev.birthMonth)
}

export function deriveChildren(first: FirstChild, spacings: number[]): ChildInput[] {
  const children: ChildInput[] = [{ ...first }]
  let current = first
  for (const spacing of spacings) {
    current = addMonths(current.birthYear, current.birthMonth, spacing)
    children.push({ ...current })
  }
  return children
}

export function spacingsFromChildren(children: ChildInput[]): number[] {
  const spacings: number[] = []
  for (let i = 1; i < children.length; i++) {
    spacings.push(monthsAfterPrevious(children[i - 1]!, children[i]!))
  }
  return spacings
}
