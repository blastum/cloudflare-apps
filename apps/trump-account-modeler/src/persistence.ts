import type { ChildInput } from './calculator'
import { deriveChildren, spacingsFromChildren, type FirstChild } from './children'
import { DEFAULT_CHILD_SPACING_MONTHS, DEFAULT_CPI_PCT, DEFAULT_MARKET_PCT, DEFAULTS } from './constants'

export const STORAGE_KEY = 'trump-account-modeler:assumptions'

export type SavedAssumptions = {
  fundingYear: string
  cpiRate: string
  marketRate: string
  firstChild: FirstChild
  childSpacings: number[]
}

type LegacySavedAssumptions = {
  mode?: 'one' | 'several'
  children?: ChildInput[]
}

export function defaultFirstChild(): FirstChild {
  return { birthYear: DEFAULTS.birthYear, birthMonth: DEFAULTS.birthMonth }
}

export function defaultAssumptions(): SavedAssumptions {
  return {
    fundingYear: String(DEFAULTS.fundingYear),
    cpiRate: String(DEFAULT_CPI_PCT),
    marketRate: String(DEFAULT_MARKET_PCT),
    firstChild: defaultFirstChild(),
    childSpacings: [],
  }
}

function normalizeFirstChild(child: Partial<FirstChild>): FirstChild {
  return {
    birthYear: Number(child.birthYear) || DEFAULTS.birthYear,
    birthMonth: Math.min(12, Math.max(1, Number(child.birthMonth) || DEFAULTS.birthMonth)),
  }
}

function normalizeSpacings(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.map((value) => Math.max(1, Math.round(Number(value) || DEFAULT_CHILD_SPACING_MONTHS)))
}

function migrateLegacyAssumptions(
  parsed: Partial<SavedAssumptions & LegacySavedAssumptions>,
): SavedAssumptions | null {
  if (!parsed.children?.length) return null
  const firstChild = normalizeFirstChild(parsed.children[0]!)
  const childSpacings =
    parsed.mode === 'one' ? [] : spacingsFromChildren(parsed.children)
  return {
    fundingYear: String(parsed.fundingYear ?? DEFAULTS.fundingYear),
    cpiRate: String(parsed.cpiRate ?? DEFAULT_CPI_PCT),
    marketRate: String(parsed.marketRate ?? DEFAULT_MARKET_PCT),
    firstChild,
    childSpacings,
  }
}

export function childrenFromAssumptions(assumptions: SavedAssumptions): ChildInput[] {
  return deriveChildren(assumptions.firstChild, assumptions.childSpacings)
}

export function loadAssumptions(): SavedAssumptions | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedAssumptions & LegacySavedAssumptions>

    if (parsed.firstChild) {
      const spacings =
        parsed.mode === 'one' ? [] : normalizeSpacings(parsed.childSpacings)
      return {
        fundingYear: String(parsed.fundingYear ?? DEFAULTS.fundingYear),
        cpiRate: String(parsed.cpiRate ?? DEFAULT_CPI_PCT),
        marketRate: String(parsed.marketRate ?? DEFAULT_MARKET_PCT),
        firstChild: normalizeFirstChild(parsed.firstChild),
        childSpacings: spacings,
      }
    }

    return migrateLegacyAssumptions(parsed)
  } catch {
    return null
  }
}

export function saveAssumptions(state: SavedAssumptions): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAssumptions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem('trump-account-modeler:inputs')
  } catch {
    /* ignore */
  }
}

export function readFormAssumptions(
  form: HTMLFormElement,
): Omit<SavedAssumptions, 'firstChild' | 'childSpacings'> {
  const data = new FormData(form)
  return {
    fundingYear: String(data.get('fundingYear') ?? DEFAULTS.fundingYear),
    cpiRate: String(data.get('cpiRate') ?? DEFAULT_CPI_PCT),
    marketRate: String(data.get('marketRate') ?? DEFAULT_MARKET_PCT),
  }
}

export function applyFormAssumptions(
  form: HTMLFormElement,
  saved: Omit<SavedAssumptions, 'firstChild' | 'childSpacings'>,
): void {
  const setValue = (name: string, value: string) => {
    const el = form.elements.namedItem(name)
    if (el instanceof HTMLInputElement && el.type !== 'checkbox') {
      el.value = value
    }
  }

  setValue('fundingYear', saved.fundingYear)
  setValue('cpiRate', saved.cpiRate)
  setValue('marketRate', saved.marketRate)
}
